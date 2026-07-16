"""
Extracts depth and edge maps from the original photo.
These condition the background generation so perspective/lighting stay consistent
with how the product was actually photographed.
Runs on CPU -- doesn't touch your GPU quota.
"""

from controlnet_aux import MidasDetector, CannyDetector
from PIL import Image

_midas = None
_canny = CannyDetector()


def _get_midas():
    global _midas
    if _midas is None:
        # Downloads once from Hugging Face Hub (free), cached after.
        _midas = MidasDetector.from_pretrained("lllyasviel/Annotators")
    return _midas


def get_depth_map(image: Image.Image) -> Image.Image:
    # Always run depth preprocessing on the bg_swap device (cuda:0)
    # to prevent cross-device conflicts if triggered from a different GPU context (e.g. bg_blur on cuda:1)
    from pipeline.device_helper import set_active_cuda_device
    set_active_cuda_device("bg_swap")
    
    midas = _get_midas()
    depth = midas(image)
    return depth.resize(image.size)


def get_edge_map(image: Image.Image) -> Image.Image:
    edges = _canny(image)
    return edges.resize(image.size)
