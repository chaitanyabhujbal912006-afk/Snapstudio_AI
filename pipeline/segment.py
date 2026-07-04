"""
Segmentation: cuts the product out of the raw photo cleanly.
Uses rembg (U2-Net based) -- free, runs on CPU, no GPU needed.
"""

from rembg import remove, new_session
from PIL import Image

# "isnet-general-use" gives cleaner edges than the default model for product photos.
# It downloads once (free, from the rembg model hub) and is cached after first run.
_session = new_session("isnet-general-use")


def segment_product(image: Image.Image):
    """
    Args:
        image: PIL Image (RGB) -- the raw seller photo.

    Returns:
        cutout: PIL Image (RGBA) -- product on transparent background.
        mask: PIL Image (L) -- single-channel mask, white = product.
    """
    image = image.convert("RGB")
    cutout = remove(image, session=_session)  # returns RGBA PIL Image

    # Extract the alpha channel as our mask
    mask = cutout.split()[-1]

    return cutout, mask


def feather_mask(mask: Image.Image, blur_radius: int = 3) -> Image.Image:
    """Softens the mask edge slightly so the composite doesn't look razor-cut."""
    from PIL import ImageFilter
    return mask.filter(ImageFilter.GaussianBlur(blur_radius))
