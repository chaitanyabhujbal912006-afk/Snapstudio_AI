"""
Image denoising (CPU-only, no AI model required):
  - light:    OpenCV median + bilateral filter         (~0.2s)
  - balanced: Non-Local Means on L channel (LAB space) (~0.5–2s)
  - strong:   Multi-pass: median → NLM → bilateral     (~1–3s)

All modes optionally work in LAB space to denoise only luminance,
preventing color channel bleed that often makes denoised images look "painted".
"""

import cv2
import numpy as np
from PIL import Image


def denoise(
    image: Image.Image,
    strength: float = 0.5,   # 0–1
    mode: str = "balanced",   # "light", "balanced", "strong"
    preserve_color: bool = True,
) -> Image.Image:
    """
    Args:
        strength: 0 = very gentle, 1 = aggressive (good for very noisy photos)
        mode: "light" (<0.2s), "balanced" (~0.5s), "strong" (~2s)
        preserve_color: preserves natural colors while removing luminance noise

    Returns:
        PIL Image (RGB), denoised.
    """
    img = np.array(image.convert("RGB"))

    h = max(1, int(strength * 20) + 3)   # filter strength for luminance
    hColor = max(1, int(strength * 10) + 2)  # filter strength for color

    if mode == "light":
        # Gentle median + light bilateral
        img = cv2.medianBlur(img, 3)
        img = cv2.bilateralFilter(img, d=5, sigmaColor=15, sigmaSpace=15)

    elif mode == "balanced":
        if preserve_color:
            # Work in LAB: denoise only L channel for no color bleed
            lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
            l, a, b = cv2.split(lab)
            l_denoised = cv2.fastNlMeansDenoising(l, None, h=h, templateWindowSize=7, searchWindowSize=21)
            lab_denoised = cv2.merge([l_denoised, a, b])
            img = cv2.cvtColor(lab_denoised, cv2.COLOR_LAB2RGB)
        else:
            img = cv2.fastNlMeansDenoisingColored(img, None, h=h, hColor=hColor, templateWindowSize=7, searchWindowSize=21)

    elif mode == "strong":
        # Multi-pass: median → NLM → light bilateral
        img = cv2.medianBlur(img, 3)
        if preserve_color:
            lab = cv2.cvtColor(img, cv2.COLOR_RGB2LAB)
            l, a, b = cv2.split(lab)
            # Clamp h to valid int range expected by fastNlMeansDenoising
            h_strong = int(np.clip(h * 1.5, 1, 40))
            l = cv2.fastNlMeansDenoising(l, None, h=h_strong, templateWindowSize=7, searchWindowSize=21)
            # Also lightly smooth color channels
            a = cv2.bilateralFilter(a, d=5, sigmaColor=20, sigmaSpace=20)
            b_ch = cv2.bilateralFilter(b, d=5, sigmaColor=20, sigmaSpace=20)
            img = cv2.cvtColor(cv2.merge([l, a, b_ch]), cv2.COLOR_LAB2RGB)
        else:
            img = cv2.fastNlMeansDenoisingColored(img, None, h=min(h * 1.5, 40), hColor=hColor, templateWindowSize=7, searchWindowSize=21)
        img = cv2.bilateralFilter(img, d=5, sigmaColor=20, sigmaSpace=20)

    return Image.fromarray(img)
