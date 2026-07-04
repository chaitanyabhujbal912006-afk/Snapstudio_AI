"""
Makes the composite look real instead of "pasted":
  1. Synthetic drop shadow based on the product's mask shape.
  2. Basic color/tone matching so the product's lighting matches the new scene.
This is the step sellers will judge you hardest on -- keep iterating here
even after the MVP ships.
"""

import numpy as np
from PIL import Image, ImageFilter


def add_shadow(composited: Image.Image, mask: Image.Image,
                offset=(0, 25), blur_radius: int = 20, opacity: int = 90) -> Image.Image:
    """Adds a soft drop shadow beneath the product, using its silhouette."""
    shadow_layer = Image.new("RGBA", composited.size, (0, 0, 0, 0))

    shadow_shape = Image.new("L", mask.size, 0)
    shadow_shape.paste(mask, offset)

    shadow_rgba = Image.merge(
        "RGBA",
        (
            Image.new("L", mask.size, 0),
            Image.new("L", mask.size, 0),
            Image.new("L", mask.size, 0),
            shadow_shape.point(lambda p: int(p * opacity / 255)),
        ),
    )

    shadow_rgba = shadow_rgba.filter(ImageFilter.GaussianBlur(blur_radius))
    shadow_layer.alpha_composite(shadow_rgba)

    base = composited.convert("RGBA")
    result = Image.alpha_composite(base, shadow_layer)
    result.paste(composited.convert("RGB"), (0, 0), mask)

    return result.convert("RGB")


def match_tone(product_region: np.ndarray, background: np.ndarray) -> np.ndarray:
    """
    Simple per-channel mean/std matching so the product's tone doesn't clash
    with the new background's color temperature. Operates on numpy RGB arrays.
    """
    result = product_region.copy().astype(np.float32)
    for c in range(3):
        p_mean, p_std = result[..., c].mean(), result[..., c].std() + 1e-6
        b_mean, b_std = background[..., c].mean(), background[..., c].std() + 1e-6
        result[..., c] = (result[..., c] - p_mean) * (b_std / p_std) * 0.3 + p_mean
    return np.clip(result, 0, 255).astype(np.uint8)
