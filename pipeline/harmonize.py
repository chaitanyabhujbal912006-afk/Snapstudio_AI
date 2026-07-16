"""
Makes the composite look real instead of "pasted":
  1. Synthetic drop shadow based on the product's mask shape.
  2. Basic color/tone matching so the product's lighting matches the new scene.
This is the step sellers will judge you hardest on -- keep iterating here
even after the MVP ships.
"""

import numpy as np
from PIL import Image, ImageFilter, ImageDraw


def add_shadow(composited: Image.Image, mask: Image.Image,
                offset=(0, 20), blur_radius: int = 25, opacity: int = 100) -> Image.Image:
    """Adds a soft drop shadow beneath the product, using its silhouette."""
    shadow_layer = Image.new("RGBA", composited.size, (0, 0, 0, 0))

    # Build a dark silhouette from the mask, shifted down slightly (fake light-from-above)
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
    # Shadow goes UNDER the product: composite shadow onto background first,
    # then re-paste the product on top using the original (unblurred) mask.
    result = Image.alpha_composite(base, shadow_layer)
    result.paste(composited.convert("RGB"), (0, 0), mask)

    return result.convert("RGB")


def match_tone(product_region: np.ndarray, background: np.ndarray) -> np.ndarray:
    """
    Performs per-channel color transfer by aligning the mean (color temperature/brightness)
    and standard deviation (contrast) of the product cutout to the background statistics,
    with a blend strength factor (0.45) to retain original product identity.
    """
    result = product_region.copy().astype(np.float32)
    strength = 0.45  # Blends original product appearance with background lighting
    for c in range(3):
        p_mean, p_std = result[..., c].mean(), result[..., c].std() + 1e-6
        b_mean, b_std = background[..., c].mean(), background[..., c].std() + 1e-6
        
        # Shift and scale product pixels relative to background metrics
        target = (result[..., c] - p_mean) * (b_std / p_std) + b_mean
        
        # Interpolate between original and matched color
        result[..., c] = (1.0 - strength) * result[..., c] + strength * target
    return np.clip(result, 0, 255).astype(np.uint8)


def harmonize_tone(cutout: Image.Image, mask: Image.Image, background: Image.Image) -> Image.Image:
    """
    Applies match_tone to just the masked (product) region of the cutout,
    using the generated background's color statistics as the target.
    This is the piece that was previously defined but never actually called
    in the pipeline -- wiring it in noticeably reduces the "pasted-on" look.
    """
    cutout_rgb = np.array(cutout.convert("RGB"))
    mask_arr = np.array(mask.convert("L")) > 10  # boolean mask of product pixels
    bg_arr = np.array(background.convert("RGB").resize(cutout.size))

    if mask_arr.sum() == 0:
        return cutout  # nothing to adjust

    matched = cutout_rgb.copy()
    product_pixels = cutout_rgb[mask_arr]
    bg_pixels = bg_arr[mask_arr] if bg_arr[mask_arr].size else bg_arr.reshape(-1, 3)
    matched[mask_arr] = match_tone(product_pixels, bg_pixels)

    result = Image.fromarray(matched).convert("RGBA")
    result.putalpha(cutout.convert("RGBA").split()[-1])
    return result
