"""
Creative photo effects: HDR tone mapping, vignette, film grain,
chromatic aberration, bloom, cross-process, and color splash.
Pure OpenCV/NumPy — no AI model, all effects run in <0.5s.
"""

import cv2
import numpy as np
from PIL import Image
from typing import Optional


# ── HDR Tone Mapping ───────────────────────────────────────────────────────────

def apply_hdr(
    image: Image.Image,
    strength: float = 0.7,
    algorithm: str = "reinhard",  # "reinhard", "drago", "mantiuk"
) -> Image.Image:
    """
    HDR tone mapping for a dramatic, high-detail look.
    Expands local contrast to reveal detail in both shadows and highlights.
    """
    img = np.array(image.convert("RGB")).astype(np.float32) / 255.0
    img_bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

    hdr = img_bgr.copy()

    if algorithm == "reinhard":
        tonemap = cv2.createTonemapReinhard(gamma=1.0, intensity=strength * 1.5,
                                             light_adapt=0.8, color_adapt=0.0)
        hdr = tonemap.process(img_bgr)
    elif algorithm == "drago":
        tonemap = cv2.createTonemapDrago(gamma=1.0, saturation=0.8 + strength * 0.4, bias=0.85)
        hdr = tonemap.process(img_bgr)
    elif algorithm == "mantiuk":
        tonemap = cv2.createTonemapMantiuk(gamma=1.0, scale=0.7 + strength * 0.5, saturation=1.0)
        hdr = tonemap.process(img_bgr)

    hdr = np.clip(hdr * 255, 0, 255).astype(np.uint8)
    hdr_rgb = cv2.cvtColor(hdr, cv2.COLOR_BGR2RGB)

    # Blend with original based on strength
    original = np.array(image.convert("RGB"))
    result = np.clip(
        original.astype(np.float32) * (1 - strength * 0.5) + hdr_rgb.astype(np.float32) * (strength * 0.5 + 0.5),
        0, 255
    ).astype(np.uint8)

    return Image.fromarray(result)


# ── Vignette ───────────────────────────────────────────────────────────────────

def apply_vignette(
    image: Image.Image,
    strength: float = 0.5,
    feather: float = 0.7,
    color: str = "black",  # "black" or "white"
) -> Image.Image:
    """Radial vignette. feather controls falloff smoothness."""
    img = np.array(image.convert("RGB")).astype(np.float32)
    h, w = img.shape[:2]
    Y = np.linspace(-1, 1, h)[:, np.newaxis]
    X = np.linspace(-1, 1, w)[np.newaxis, :]
    dist = np.sqrt(X ** 2 + Y ** 2)
    mask = np.clip((dist - (1 - feather)) / feather, 0, 1)
    mask = mask * strength
    mask = mask[..., np.newaxis]
    if color == "white":
        out = np.clip(img + (255 - img) * mask, 0, 255)
    else:
        out = np.clip(img * (1 - mask), 0, 255)
    return Image.fromarray(out.astype(np.uint8))


# ── Film Grain ─────────────────────────────────────────────────────────────────

def apply_film_grain(
    image: Image.Image,
    amount: float = 0.4,
    size: float = 0.5,   # 0=fine, 1=coarse
    monochrome: bool = False,
) -> Image.Image:
    """Realistic film grain simulation with adjustable coarseness."""
    img = np.array(image.convert("RGB")).astype(np.float32)
    h, w = img.shape[:2]

    sigma = amount * 35

    if monochrome:
        grain = np.random.normal(0, sigma, (h, w, 1)).astype(np.float32)
        grain = np.repeat(grain, 3, axis=2)
    else:
        grain = np.random.normal(0, sigma, (h, w, 3)).astype(np.float32)

    # Scale grain by pixel brightness (grain is more visible in shadows/midtones)
    luminance = (0.299 * img[..., 0] + 0.587 * img[..., 1] + 0.114 * img[..., 2]) / 255.0
    grain_mask = (1 - luminance * 0.6)[..., np.newaxis]
    grain = grain * grain_mask

    # Coarseness: blur the grain
    if size > 0.1:
        k = max(3, int(size * 5)) | 1
        grain = cv2.GaussianBlur(grain, (k, k), 0)

    return Image.fromarray(np.clip(img + grain, 0, 255).astype(np.uint8))


# ── Chromatic Aberration ───────────────────────────────────────────────────────

def apply_chromatic_aberration(
    image: Image.Image,
    strength: float = 0.3,
) -> Image.Image:
    """Fringe effect: slight RGB channel offset towards image edges (lens simulation)."""
    img = np.array(image.convert("RGB"))
    h, w = img.shape[:2]
    offset = max(1, int(strength * min(w, h) * 0.02))
    r = np.roll(img[..., 0], offset, axis=1)
    b = np.roll(img[..., 2], -offset, axis=1)
    result = np.stack([r, img[..., 1], b], axis=2)
    return Image.fromarray(result.astype(np.uint8))


# ── Bloom ─────────────────────────────────────────────────────────────────────

def apply_bloom(
    image: Image.Image,
    threshold: float = 0.75,  # brightness threshold for bloom (0–1)
    strength: float = 0.5,
    radius: int = 40,
) -> Image.Image:
    """Bloom: makes bright areas glow softly (cinematic lighting effect)."""
    img = np.array(image.convert("RGB")).astype(np.float32)

    # Extract bright mask
    gray = (0.299 * img[..., 0] + 0.587 * img[..., 1] + 0.114 * img[..., 2]) / 255.0
    bright_mask = np.clip((gray - threshold) / (1 - threshold + 1e-6), 0, 1)[..., np.newaxis]

    bloom_src = img * bright_mask
    k = radius * 2 + 1
    bloom = cv2.GaussianBlur(bloom_src, (k, k), sigmaX=radius * 0.4)

    result = np.clip(img + bloom * strength * 1.5, 0, 255)
    return Image.fromarray(result.astype(np.uint8))


# ── Cross Process ─────────────────────────────────────────────────────────────

def apply_cross_process(image: Image.Image, strength: float = 0.7) -> Image.Image:
    """
    Cross-process: pushes shadows to cyan-green, highlights to yellow-red.
    Classic film darkroom look.
    """
    img = np.array(image.convert("RGB")).astype(np.float32)

    r = img[..., 0]
    g = img[..., 1]
    b = img[..., 2]

    # S-curves per channel
    def scurve(ch, a, b_):
        norm = ch / 255.0
        curved = norm ** a
        return np.clip(curved * 255, 0, 255)

    r_out = scurve(r, 0.8, None) * strength + r * (1 - strength)
    g_out = scurve(g, 1.1, None) * strength + g * (1 - strength)
    b_out = scurve(b, 1.3, None) * strength + b * (1 - strength)

    result = np.stack([r_out, g_out, b_out], axis=2)
    return Image.fromarray(np.clip(result, 0, 255).astype(np.uint8))


# ── Color Splash ──────────────────────────────────────────────────────────────

def apply_color_splash(
    image: Image.Image,
    hue_target: int = 0,   # 0–179 in OpenCV HSV (0=red, 60=green, 120=blue)
    hue_range: int = 20,
) -> Image.Image:
    """
    Color splash: desaturate everything except the target hue range.
    Creates stunning selective color photography effect.
    """
    img = np.array(image.convert("RGB"))
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)

    lo = (hue_target - hue_range) % 180
    hi = (hue_target + hue_range) % 180

    if lo < hi:
        mask = ((hsv[..., 0] >= lo) & (hsv[..., 0] <= hi)).astype(np.uint8) * 255
    else:
        mask = ((hsv[..., 0] >= lo) | (hsv[..., 0] <= hi)).astype(np.uint8) * 255

    # Feather the mask
    from PIL import ImageFilter
    mask_pil = Image.fromarray(mask).filter(ImageFilter.GaussianBlur(4))
    mask_arr = np.array(mask_pil).astype(np.float32)[..., np.newaxis] / 255.0

    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    gray_rgb = np.stack([gray, gray, gray], axis=2).astype(np.float32)

    result = gray_rgb * (1 - mask_arr) + img.astype(np.float32) * mask_arr
    return Image.fromarray(np.clip(result, 0, 255).astype(np.uint8))


# ── Orton Glow ────────────────────────────────────────────────────────────────

def apply_orton_glow(image: Image.Image, strength: float = 0.4) -> Image.Image:
    """
    Orton Effect: dreamy, soft-focus glow often used in landscape/portrait photography.
    Blends a sharp version with a blurred overexposed copy.
    """
    img = np.array(image.convert("RGB")).astype(np.float32)
    overexposed = np.clip(img * 1.4, 0, 255)
    blurred = cv2.GaussianBlur(overexposed, (0, 0), sigmaX=8)
    orton = img * blurred / 255.0
    result = img * (1 - strength) + orton * strength
    return Image.fromarray(np.clip(result, 0, 255).astype(np.uint8))
