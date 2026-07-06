"""
Background blur (bokeh): DSLR-style depth-of-field effect.
Segments subject, then applies depth-aware Gaussian blur to the background
for a natural-looking bokeh. CPU-based, ~1–3 seconds.
"""

import cv2
import numpy as np
from PIL import Image, ImageFilter

from pipeline.segment import segment_product, feather_mask
from pipeline.depth_edges import get_depth_map


def blur_background(
    image: Image.Image,
    blur_amount: float = 0.6,     # 0–1 (controls kernel size)
    use_depth: bool = True,        # depth-based vs flat blur
    subject_type: str = "general", # "general" or "person"
    edge_feather: int = 5,         # mask edge softness (px)
) -> Image.Image:
    """
    DSLR-style background blur:
      1. Segment subject out of the image
      2. Obtain depth map (MiDaS) for depth-based blur falloff
      3. Apply progressively stronger blur to areas farther from camera
      4. Composite sharp subject on blurred background

    blur_amount: 0 = minimal, 0.5 = moderate bokeh, 1.0 = very strong blur
    """
    image = image.convert("RGB")
    img_arr = np.array(image)

    # 1. Segment subject
    _, mask = segment_product(image, subject_type=subject_type)
    soft_mask = feather_mask(mask, blur_radius=edge_feather)
    mask_arr = np.array(soft_mask).astype(np.float32) / 255.0  # 0=bg, 1=subject

    # 2. Build background layer (blurred)
    max_kernel = max(3, int(blur_amount * 80))
    max_kernel = max_kernel if max_kernel % 2 == 1 else max_kernel + 1

    if use_depth:
        # Get depth map: bright = close, dark = far
        depth_pil = get_depth_map(image)
        depth_arr = np.array(depth_pil.convert("L")).astype(np.float32) / 255.0
        # Invert: we want blur weight to be 1 for far (dark depth) areas
        blur_weight = 1.0 - depth_arr  # 1 = far, 0 = close
        # Don't blur subject regardless of depth
        blur_weight = blur_weight * (1.0 - mask_arr)

        # Multi-pass blur with different kernel sizes for depth falloff
        background = np.zeros_like(img_arr, dtype=np.float32)
        n_passes = 6
        for i in range(n_passes):
            fraction = (i + 1) / n_passes
            k = max(3, int(max_kernel * fraction))
            k = k if k % 2 == 1 else k + 1
            blurred = cv2.GaussianBlur(img_arr, (k, k), 0)
            w = np.clip(blur_weight - (1 - fraction) * 0.5, 0, 1)[..., np.newaxis]
            background += blurred.astype(np.float32) * w

        # Normalize: where blur_weight > 0,  background / sum_of_weights
        total_w = np.zeros_like(blur_weight)[..., np.newaxis]
        for i in range(n_passes):
            fraction = (i + 1) / n_passes
            w = np.clip(blur_weight - (1 - fraction) * 0.5, 0, 1)[..., np.newaxis]
            total_w += w
        total_w = np.where(total_w > 0, total_w, 1.0)
        background = np.clip(background / total_w, 0, 255).astype(np.uint8)

        # For foreground regions (mask_arr ~ 1), use original
        bg_flat = cv2.GaussianBlur(img_arr, (max_kernel, max_kernel), 0)
        subject_mask_3ch = mask_arr[..., np.newaxis]
        background = np.where(subject_mask_3ch > 0.5, img_arr, background)

    else:
        # Simple flat blur (all background equally blurred)
        background = cv2.GaussianBlur(img_arr, (max_kernel, max_kernel), 0)

    # 3. Composite: sharp subject on blurred background
    subject_mask_3ch = mask_arr[..., np.newaxis]
    result = (
        img_arr.astype(np.float32) * subject_mask_3ch +
        background.astype(np.float32) * (1 - subject_mask_3ch)
    )

    return Image.fromarray(np.clip(result, 0, 255).astype(np.uint8))
