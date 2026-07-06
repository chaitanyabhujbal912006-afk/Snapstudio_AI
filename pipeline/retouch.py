"""
Portrait retouching: professional skin smoothing, clarity, sharpening,
vibrance, and eye/detail enhancement.
Pure OpenCV — no AI model, runs in ~0.2s.
"""

import cv2
import numpy as np
from PIL import Image


def _bilateral_smooth(img: np.ndarray, strength: float) -> np.ndarray:
    """Frequency-separation skin smoothing using bilateral filter.
    Preserves skin texture at low strength, produces buttery smooth at high."""
    d = max(1, int(strength * 15)) | 1  # must be odd, 1–15
    sigma = strength * 60 + 10
    smooth = cv2.bilateralFilter(img, d=d, sigmaColor=sigma, sigmaSpace=sigma)
    # Blend to avoid over-smoothing
    alpha = strength * 0.85
    return np.clip(img.astype(np.float32) * (1 - alpha) + smooth.astype(np.float32) * alpha, 0, 255).astype(np.uint8)


def _add_clarity(img: np.ndarray, strength: float) -> np.ndarray:
    """Clarity: local contrast enhancement (mid-frequency detail boost)."""
    blurred = cv2.GaussianBlur(img, (0, 0), sigmaX=5)
    detail = img.astype(np.float32) - blurred.astype(np.float32)
    enhanced = img.astype(np.float32) + detail * (strength * 1.5)
    return np.clip(enhanced, 0, 255).astype(np.uint8)


def _smart_sharpen(img: np.ndarray, strength: float) -> np.ndarray:
    """Edge-aware sharpening — sharpens detail without amplifying noise."""
    blurred = cv2.GaussianBlur(img, (0, 0), sigmaX=1.5)
    unsharp = cv2.addWeighted(img, 1 + strength, blurred, -strength, 0)
    # Protect low-gradient (smooth) areas from over-sharpening
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY).astype(np.float32)
    edges = cv2.Laplacian(gray, cv2.CV_32F)
    edge_mask = np.clip(np.abs(edges) / 30.0, 0, 1)[..., np.newaxis]
    return np.clip(
        img.astype(np.float32) * (1 - edge_mask * strength) +
        unsharp.astype(np.float32) * (edge_mask * strength) +
        img.astype(np.float32) * (1 - edge_mask * strength),
        0, 255
    ).astype(np.uint8)


def _adjust_vibrance(img: np.ndarray, vibrance: float) -> np.ndarray:
    """Smart saturation: boosts dull colors more, protects already-saturated ones."""
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV).astype(np.float32)
    sat = hsv[..., 1] / 255.0
    boost = (1 - sat) * vibrance * 255
    hsv[..., 1] = np.clip(hsv[..., 1] + boost, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)


def _brighten_shadows(img: np.ndarray, lift: float) -> np.ndarray:
    """Lift shadows gently — useful for under-eye circles."""
    lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB).astype(np.float32)
    shadow_mask = np.clip(1 - lab[..., 0] / 127.0, 0, 1)
    lab[..., 0] = np.clip(lab[..., 0] + shadow_mask * lift * 30, 0, 255)
    return cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2RGB)


def _teeth_brighten(img: np.ndarray, amount: float) -> np.ndarray:
    """Selectively brighten yellow/beige tones (teeth) while protecting skin."""
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV).astype(np.float32)
    # Target: low-saturation yellow tones (H: 15-35, S: 10-80)
    hue_mask = ((hsv[..., 0] >= 15) & (hsv[..., 0] <= 40)).astype(np.float32)
    sat_mask = ((hsv[..., 1] >= 10) & (hsv[..., 1] <= 100)).astype(np.float32)
    mask = hue_mask * sat_mask
    hsv[..., 1] = np.clip(hsv[..., 1] - mask * amount * 30, 0, 255)   # reduce saturation
    hsv[..., 2] = np.clip(hsv[..., 2] + mask * amount * 20, 0, 255)   # increase value
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)


def retouch_portrait(
    image: Image.Image,
    skin_smooth: float = 0.5,    # 0–1
    clarity: float = 0.3,        # 0–1
    sharpen: float = 0.4,        # 0–1
    vibrance: float = 0.3,       # 0–1
    shadow_lift: float = 0.2,    # 0–1 (under-eye / shadow brightening)
    teeth_whiten: float = 0.0,   # 0–1
) -> Image.Image:
    """
    Args:
        skin_smooth: bilateral smoothing strength (0=off, 1=maximum)
        clarity: mid-frequency contrast detail (0=off, 1=strong)
        sharpen: edge sharpening (0=off, 1=strong)
        vibrance: smart saturation (0=off, 1=vivid)
        shadow_lift: lift dark shadows (good for under-eye circles)
        teeth_whiten: selectively whiten teeth (0=off, 1=strong)
    """
    img = np.array(image.convert("RGB"))

    if skin_smooth > 0:
        img = _bilateral_smooth(img, skin_smooth)

    if clarity > 0:
        img = _add_clarity(img, clarity)

    if sharpen > 0:
        img = _smart_sharpen(img, sharpen)

    if vibrance > 0:
        img = _adjust_vibrance(img, vibrance)

    if shadow_lift > 0:
        img = _brighten_shadows(img, shadow_lift)

    if teeth_whiten > 0:
        img = _teeth_brighten(img, teeth_whiten)

    return Image.fromarray(img)
