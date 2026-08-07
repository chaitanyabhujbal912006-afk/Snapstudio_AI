"""
Auto-Enhance: fixes lighting, color, contrast, sharpness, and exposure automatically.
Pure classical computer vision pipeline optimized to produce clean, natural, and
professional results instead of harsh, over-processed filters.

Pipeline (in order):
  1. Soft White balance (gray-world blended at 20% to preserve natural sunset/foliage casts)
  2. Gentle Exposure correction (gamma estimation restricted to 0.85–1.25 clamp)
  3. Highlight recovery (clips blown-out highlights softly)
  4. Smooth Adaptive contrast (CLAHE on L channel with safe clipLimit=1.25)
  5. Subtle Saturation boost (factor=1.08)
  6. High-Frequency unsharp mask (sigma=1.0, amount=0.25 to prevent halo artifacts)
"""

import cv2
import numpy as np
from PIL import Image


def _auto_white_balance(img: np.ndarray) -> np.ndarray:
    """Removes harsh color casts using a soft gray-world blend.
    Prevents ruining photos with dominant natural colors (like forests or sunsets)."""
    result = img.astype(np.float32)
    avg_b, avg_g, avg_r = result[..., 0].mean(), result[..., 1].mean(), result[..., 2].mean()
    avg_gray = (avg_b + avg_g + avg_r) / 3
    
    # Calculate corrected channels
    corrected = result.copy()
    corrected[..., 0] *= (avg_gray / (avg_b + 1e-6))
    corrected[..., 1] *= (avg_gray / (avg_g + 1e-6))
    corrected[..., 2] *= (avg_gray / (avg_r + 1e-6))
    
    # Blend corrected version at 20% to only correct severe casts gently
    blended = cv2.addWeighted(result, 0.8, corrected, 0.2, 0)
    return np.clip(blended, 0, 255).astype(np.uint8)


def _correct_exposure(img: np.ndarray) -> np.ndarray:
    """Gentle auto-exposure correction via clamped gamma.
    Avoids extreme contrast washing or darkening in high-contrast portraits."""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(np.float32)
    mean_l = lab[..., 0].mean() / 255.0   # normalized 0–1
    if mean_l < 0.01:
        return img  # skip pitch black
        
    target = 0.46
    gamma = np.log(target) / np.log(mean_l + 1e-6)
    # Strict safety clamp to keep correction subtle
    gamma = float(np.clip(gamma, 0.85, 1.22))
    
    lut = np.array([min(255, int((i / 255.0) ** (1.0 / gamma) * 255)) for i in range(256)], dtype=np.uint8)
    return cv2.LUT(img, lut)


def _recover_highlights(img: np.ndarray, threshold: int = 242) -> np.ndarray:
    """Gently compress pixel values above threshold to recover blown skies/reflections."""
    out = img.astype(np.float32)
    excess = np.clip(out - threshold, 0, None)
    compression = excess * 0.40   # pull back blown highlights by 60%
    out = np.clip(out - compression, 0, 255)
    return out.astype(np.uint8)


def _auto_contrast(img: np.ndarray) -> np.ndarray:
    """Stretches contrast smoothly on the L channel to avoid color distortion.
    Uses a conservative clip limit to avoid shadow noise."""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    # Reduced clipLimit from 2.0 to 1.25 for professional film contrast
    clahe = cv2.createCLAHE(clipLimit=1.25, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge((l, a, b))
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


def _boost_saturation(img: np.ndarray, factor: float = 1.08) -> np.ndarray:
    """Subtle saturation boost for fresh color rendering."""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * factor, 0, 255)
    return cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)


def _sharpen(img: np.ndarray, amount: float = 0.25) -> np.ndarray:
    """Unsharp mask with small radius (1.0) to highlight micro-details without halos."""
    blurred = cv2.GaussianBlur(img, (0, 0), sigmaX=1.0)
    sharpened = cv2.addWeighted(img, 1 + amount, blurred, -amount, 0)
    return np.clip(sharpened, 0, 255).astype(np.uint8)


def auto_enhance(
    image: Image.Image,
    saturation_factor: float = 1.08,
    sharpen_amount: float = 0.25,
    recover_highlights: bool = True,
    correct_exposure: bool = True,
) -> Image.Image:
    """
    Auto-Enhance pipeline.
    Args:
        image: PIL Image (RGB), raw input.
        saturation_factor: saturation boost multiplier (1.0 = neutral).
        sharpen_amount: unsharp mask sharpening (0 = off, 1 = max).
        recover_highlights: compression of blown highlights (>242).
        correct_exposure: automatic brightness gamma correction.
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

