"""
Auto-Enhance: fixes lighting, color, contrast, sharpness, and exposure automatically.
No AI/diffusion model needed -- pure image processing, so this is fast
(1-2 seconds) even on free CPU hosting.

Pipeline (in order):
  1. White balance (gray-world)
  2. Exposure correction (gamma estimation)
  3. Highlight recovery (clips blown-out pixels softly)
  4. Adaptive contrast (CLAHE on L channel)
  5. Saturation boost
  6. Unsharp mask sharpening
"""

import cv2
import numpy as np
from PIL import Image
from typing import Optional


def _auto_white_balance(img: np.ndarray) -> np.ndarray:
    """Removes color cast (e.g. too-blue or too-yellow photos) using
    the 'gray world' assumption: average color in a well-exposed photo
    should be roughly neutral gray."""
    result = img.astype(np.float32)
    avg_b, avg_g, avg_r = result[..., 0].mean(), result[..., 1].mean(), result[..., 2].mean()
    avg_gray = (avg_b + avg_g + avg_r) / 3
    result[..., 0] *= (avg_gray / (avg_b + 1e-6))
    result[..., 1] *= (avg_gray / (avg_g + 1e-6))
    result[..., 2] *= (avg_gray / (avg_r + 1e-6))
    return np.clip(result, 0, 255).astype(np.uint8)


def _correct_exposure(img: np.ndarray) -> np.ndarray:
    """Auto-exposure correction via estimated gamma.
    Computes the mean luminance and adjusts gamma so it lands near 0.45
    (perceptual midpoint), countering both underexposure and overexposure."""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    mean_l = lab[..., 0].mean() / 255.0   # normalized 0–1
    if mean_l < 0.01:
        return img  # pitch-black, skip
    target = 0.45
    gamma = np.log(target) / np.log(mean_l + 1e-6)
    gamma = float(np.clip(gamma, 0.5, 2.5))   # safety clamp
    lut = np.array([min(255, int((i / 255.0) ** (1.0 / gamma) * 255)) for i in range(256)], dtype=np.uint8)
    return cv2.LUT(img, lut)


def _recover_highlights(img: np.ndarray, threshold: int = 245) -> np.ndarray:
    """Gently compress pixel values above `threshold` to recover blown highlights.
    Uses a smooth roll-off so the transition is not visible."""
    out = img.astype(np.float32)
    excess = np.clip(out - threshold, 0, None)
    compression = excess * 0.35   # pull blown areas back by 65%
    out = np.clip(out - compression, 0, 255)
    return out.astype(np.uint8)


def _auto_contrast(img: np.ndarray) -> np.ndarray:
    """Stretches contrast using CLAHE (adaptive histogram equalization)
    on the lightness channel only, so colors don't get distorted."""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge((l, a, b))
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


def _boost_saturation(img: np.ndarray, factor: float = 1.15) -> np.ndarray:
    """Slight saturation boost for more 'punchy' colors, like a phone filter."""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * factor, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)


def _sharpen(img: np.ndarray, amount: float = 0.5) -> np.ndarray:
    """Unsharp mask -- subtle sharpening so details look crisper."""
    blurred = cv2.GaussianBlur(img, (0, 0), sigmaX=3)
    return cv2.addWeighted(img, 1 + amount, blurred, -amount, 0)


def auto_enhance(
    image: Image.Image,
    saturation_factor: float = 1.15,
    sharpen_amount: float = 0.5,
    recover_highlights: bool = True,
    correct_exposure: bool = True,
) -> Image.Image:
    """
    Args:
        image: PIL Image (RGB), the raw uploaded photo.
        saturation_factor: multiplier for color saturation (1.0 = unchanged).
        sharpen_amount: unsharp mask strength (0 = off, 1 = strong).
        recover_highlights: if True, rolls off blown-out (>245) pixel values.
        correct_exposure: if True, applies auto-gamma to fix over/underexposure.

    Returns:
        PIL Image (RGB), enhanced version.
    """
    img = cv2.cvtColor(np.array(image.convert("RGB")), cv2.COLOR_RGB2BGR)

    img = _auto_white_balance(img)
    if correct_exposure:
        img = _correct_exposure(img)
    if recover_highlights:
        img = _recover_highlights(img)
    img = _auto_contrast(img)
    img = _boost_saturation(img, factor=saturation_factor)
    img = _sharpen(img, amount=sharpen_amount)

    return Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
