"""
Pastes the original (untouched) product cutout onto the newly generated
background, using the feathered mask so the edge doesn't look razor-sharp.
"""

from PIL import Image


def composite(product_cutout: Image.Image, mask: Image.Image, background: Image.Image) -> Image.Image:
    """
    Args:
        product_cutout: RGBA PIL Image, product on transparent background (original pixels, untouched).
        mask: L-mode PIL Image, feathered alpha mask.
        background: RGB PIL Image, the newly generated scene, same size as product_cutout.

    Returns:
        RGB PIL Image -- final composited result.
    """
    background = background.resize(product_cutout.size).convert("RGB")
    product_rgb = product_cutout.convert("RGB")

    result = Image.composite(product_rgb, background, mask)
    return result
