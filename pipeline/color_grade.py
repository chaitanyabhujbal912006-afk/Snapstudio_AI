"""
Professional color grading engine.
Applies 15 cinematic presets + manual adjustments (exposure, contrast,
highlights/shadows, temperature, tint, saturation, vignette, grain).
Pure OpenCV/NumPy — no AI model, so this runs in ~0.1–0.3s.
"""

import cv2
import numpy as np
from PIL import Image
from typing import Optional

from presets.color_grades import COLOR_GRADES


# ── Curve application ──────────────────────────────────────────────────────────

def _build_lut(points: list) -> np.ndarray:
    """
    Build a 256-entry LUT from a list of (input, output) control points
    using monotone cubic (Pchip) interpolation.
    """
    try:
        from scipy.interpolate import PchipInterpolator
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        cs = PchipInterpolator(xs, ys)
        lut = np.clip(cs(np.arange(256)), 0, 255).astype(np.uint8)
    except ImportError:
        # Fallback: linear interpolation
        xs = np.array([p[0] for p in points], dtype=float)
        ys = np.array([p[1] for p in points], dtype=float)
        lut = np.clip(np.interp(np.arange(256), xs, ys), 0, 255).astype(np.uint8)
    return lut


def _apply_lut(img: np.ndarray, lut: np.ndarray, channel: Optional[int] = None) -> np.ndarray:
    if channel is None:
        return lut[img]
    out = img.copy()
    out[..., channel] = lut[img[..., channel]]
    return out


# ── Individual adjustments ─────────────────────────────────────────────────────

def _adjust_temperature(img: np.ndarray, temperature: float) -> np.ndarray:
    """temperature: -100 (cold blue) to +100 (warm yellow)."""
    out = img.astype(np.float32)
    t = temperature / 100.0
    if t > 0:
        out[..., 2] = np.clip(out[..., 2] * (1 + t * 0.3), 0, 255)   # boost R
        out[..., 1] = np.clip(out[..., 1] * (1 + t * 0.1), 0, 255)   # slight G
        out[..., 0] = np.clip(out[..., 0] * (1 - t * 0.2), 0, 255)   # reduce B
    else:
        out[..., 0] = np.clip(out[..., 0] * (1 - t * 0.3), 0, 255)   # boost B
        out[..., 2] = np.clip(out[..., 2] * (1 + t * 0.2), 0, 255)   # reduce R
    return np.clip(out, 0, 255).astype(np.uint8)


def _adjust_contrast(img: np.ndarray, contrast: float) -> np.ndarray:
    """contrast: -100 to +100. Applied in LAB space for perceptual accuracy."""
    alpha = 1.0 + contrast / 100.0 * 0.8
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB).astype(np.float32)
    lab[..., 0] = np.clip((lab[..., 0] - 127.5) * alpha + 127.5, 0, 255)
    return cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2RGB)


def _adjust_exposure(img: np.ndarray, exposure: float) -> np.ndarray:
    """exposure: -3 to +3 EV stops."""
    multiplier = 2.0 ** exposure
    return np.clip(img.astype(np.float32) * multiplier, 0, 255).astype(np.uint8)


def _adjust_highlights_shadows(img: np.ndarray, highlights: float, shadows: float) -> np.ndarray:
    """highlights/shadows: -100 to +100. Adjusts only bright or dark pixel regions."""
    out = img.astype(np.float32)
    gray = 0.299 * out[..., 0] + 0.587 * out[..., 1] + 0.114 * out[..., 2]

    if highlights != 0:
        h = highlights / 100.0 * 0.5
        mask_hi = np.clip((gray - 128) / 127.0, 0, 1)[..., np.newaxis]
        out = out + mask_hi * out * h
    if shadows != 0:
        s = shadows / 100.0 * 0.5
        mask_sh = np.clip((128 - gray) / 128.0, 0, 1)[..., np.newaxis]
        out = out + mask_sh * (255 - out) * s if s > 0 else out + mask_sh * out * s
    return np.clip(out, 0, 255).astype(np.uint8)


def _adjust_saturation(img: np.ndarray, saturation: float) -> np.ndarray:
    """saturation: 0.0 (B&W) to 2.0 (vivid). 1.0 = no change."""
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * saturation, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)


def _adjust_vibrance(img: np.ndarray, vibrance: float) -> np.ndarray:
    """Vibrance boosts under-saturated colors more than already-saturated ones."""
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV).astype(np.float32)
    sat = hsv[..., 1] / 255.0
    boost = (1 - sat) * vibrance  # more boost for less-saturated pixels
    hsv[..., 1] = np.clip(hsv[..., 1] + boost * 255, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)


def _add_vignette(img: np.ndarray, strength: float) -> np.ndarray:
    """Adds a radial darkening vignette. strength: 0.0–1.0."""
    if strength <= 0:
        return img
    h, w = img.shape[:2]
    Y = np.linspace(-1, 1, h)[:, np.newaxis]
    X = np.linspace(-1, 1, w)[np.newaxis, :]
    dist = np.sqrt(X**2 + Y**2)
    # Smooth sigmoid vignette
    vignette = 1 - np.clip((dist - 0.5) / 0.7, 0, 1) * strength * 1.5
    vignette = np.clip(vignette, 0, 1)[..., np.newaxis]
    return np.clip(img.astype(np.float32) * vignette, 0, 255).astype(np.uint8)


def _add_grain(img: np.ndarray, amount: float) -> np.ndarray:
    """Adds authentic photographic film grain. amount: 0.0–1.0."""
    if amount <= 0:
        return img
    h, w = img.shape[:2]
    noise = np.random.normal(0, amount * 50, (h, w, 1)).astype(np.float32)
    return np.clip(img.astype(np.float32) + noise, 0, 255).astype(np.uint8)


# ── Main grade function ────────────────────────────────────────────────────────

def apply_color_grade(
    image: Image.Image,
    grade_name: str = "None (Reset)",
    intensity: float = 1.0,
    # Manual override sliders (None = use preset value)
    exposure: float = 0.0,
    contrast: Optional[float] = None,
    highlights: Optional[float] = None,
    shadows: Optional[float] = None,
    temperature: Optional[float] = None,
    saturation: Optional[float] = None,
    vibrance: float = 0.0,
    vignette: Optional[float] = None,
    grain: Optional[float] = None,
) -> Image.Image:
    """
    Apply a color grade preset + optional manual adjustments.

    intensity (0–1): how much of the preset to blend with the original.
    All manual params override the preset's value for that adjustment.
    """
    preset = COLOR_GRADES.get(grade_name, COLOR_GRADES["None (Reset)"])

    # Resolve values (manual param overrides preset)
    p_contrast    = contrast    if contrast    is not None else preset["contrast"]
    p_highlights  = highlights  if highlights  is not None else preset["highlights"]
    p_shadows     = shadows     if shadows     is not None else preset["shadows"]
    p_temperature = temperature if temperature is not None else preset["temperature"]
    p_saturation  = saturation  if saturation  is not None else preset["saturation"]
    p_vignette    = vignette    if vignette    is not None else preset["vignette"]
    p_grain       = grain       if grain       is not None else preset["grain"]

    img = np.array(image.convert("RGB"))
    original = img.copy()

    # 1. Apply tone curves per channel
    for ci, ch in enumerate(["R", "G", "B"]):
        pts = preset["curves"][ch]
        if len(pts) > 1:
            lut = _build_lut(pts)
            img = _apply_lut(img, lut, channel=ci)

    # 2. Temperature
    if p_temperature != 0:
        img = _adjust_temperature(img, p_temperature)

    # 3. Exposure
    if exposure != 0:
        img = _adjust_exposure(img, exposure)

    # 4. Contrast
    if p_contrast != 0:
        img = _adjust_contrast(img, p_contrast)

    # 5. Highlights + Shadows
    if p_highlights != 0 or p_shadows != 0:
        img = _adjust_highlights_shadows(img, p_highlights, p_shadows)

    # 6. Saturation
    if p_saturation != 1.0:
        img = _adjust_saturation(img, p_saturation)

    # 7. Vibrance
    if vibrance != 0:
        img = _adjust_vibrance(img, vibrance)

    # 8. Blend with original based on intensity
    if intensity < 1.0:
        img = np.clip(
            original.astype(np.float32) * (1 - intensity) + img.astype(np.float32) * intensity,
            0, 255
        ).astype(np.uint8)

    # 9. Vignette (applied after blend so it's always full strength)
    img = _add_vignette(img, p_vignette)

    # 10. Film grain
    img = _add_grain(img, p_grain)

    return Image.fromarray(img)
