"""
Auto-Enhance: fixes lighting, color, contrast, and sharpness automatically.
No AI/diffusion model needed -- pure image processing, so this is fast
(1-2 seconds) even on free CPU hosting.
"""

import cv2
import numpy as np
from PIL import Image


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


def auto_enhance(image: Image.Image) -> Image.Image:
    """
    Args:
        image: PIL Image (RGB), the raw uploaded photo.

    Returns:
        PIL Image (RGB), enhanced version.
    """
    img = cv2.cvtColor(np.array(image.convert("RGB")), cv2.COLOR_RGB2BGR)

    img = _auto_white_balance(img)
    img = _auto_contrast(img)
    img = _boost_saturation(img)
    img = _sharpen(img)

    return Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))
