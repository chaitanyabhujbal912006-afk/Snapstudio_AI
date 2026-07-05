"""
Segmentation: cuts the subject out of the raw photo cleanly.
Uses rembg (U2-Net based) -- free, runs on CPU, no GPU needed.

Two models are supported:
  - "general": best for products/objects (isnet-general-use)
  - "person":  best for portraits/selfies (u2net_human_seg) -- handles hair,
               skin tones, and clothing edges much better than the general model
"""

from rembg import remove, new_session
from PIL import Image

_sessions = {}


def _get_session(subject_type: str):
    if subject_type not in _sessions:
        model_name = "u2net_human_seg" if subject_type == "person" else "isnet-general-use"
        _sessions[subject_type] = new_session(model_name)
    return _sessions[subject_type]


def segment_product(image: Image.Image, subject_type: str = "general"):
    """
    Args:
        image: PIL Image (RGB) -- the raw photo.
        subject_type: "general" (products/objects) or "person" (portraits/selfies).

    Returns:
        cutout: PIL Image (RGBA) -- subject on transparent background.
        mask: PIL Image (L) -- single-channel mask, white = subject.
    """
    image = image.convert("RGB")
    session = _get_session(subject_type)
    cutout = remove(image, session=session)  # returns RGBA PIL Image

    # Extract the alpha channel as our mask
    mask = cutout.split()[-1]

    return cutout, mask


def feather_mask(mask: Image.Image, blur_radius: int = 3) -> Image.Image:
    """Softens the mask edge slightly so the composite doesn't look razor-cut."""
    from PIL import ImageFilter
    return mask.filter(ImageFilter.GaussianBlur(blur_radius))
