"""
AI Super-Resolution: upscale images 4x using Swin2SR.
Model: caidas/swin2SR-realworld-sr-x4-64-bsrgan-psnr (HuggingFace)

Works on GPU (T4: ~5-15s) or CPU (~2-5 min for small images).
Handles large inputs via tiled processing to avoid OOM.
"""

import numpy as np
import torch
from PIL import Image
# AutoImageProcessor is the forward-compatible way to load Swin2SR processor
# in transformers>=4.46 (Swin2SRImageProcessor still works but may warn)
from transformers import AutoImageProcessor, Swin2SRForImageSuperResolution
from pipeline.device_helper import get_device_for_pipeline

_MODEL_4X = "caidas/swin2SR-realworld-sr-x4-64-bsrgan-psnr"
_MODEL_2X = "caidas/swin2SR-classical-sr-x2-64"

_model = None
_processor = None
_loaded_scale = None


def _load_model(scale: int = 4):
    global _model, _processor, _loaded_scale
    model_id = _MODEL_4X if scale == 4 else _MODEL_2X
    if _model is not None and _loaded_scale == scale:
        return _model, _processor

    _processor = AutoImageProcessor.from_pretrained(model_id)
    device_type = get_device_for_pipeline("upscale")
    is_cuda = "cuda" in device_type
    _model = Swin2SRForImageSuperResolution.from_pretrained(
        model_id,
        torch_dtype=torch.float16 if is_cuda else torch.float32,
    ).to(device_type)
    _model.eval()
    _loaded_scale = scale
    return _model, _processor


def _upscale_tile(model, processor, tile: Image.Image, scale: int, device: str) -> Image.Image:
    """Process a single tile through the model and crop to exact expected size."""
    expected_w = tile.width * scale
    expected_h = tile.height * scale

    inputs = processor(tile, return_tensors="pt")
    pixel_values = inputs.pixel_values.to(device)
    if device == "cuda":
        pixel_values = pixel_values.to(torch.float16)

    with torch.no_grad():
        outputs = model(pixel_values=pixel_values)

    out = outputs.reconstruction.squeeze().float().cpu()
    out = torch.clamp(out.permute(1, 2, 0) * 255, 0, 255).numpy().astype(np.uint8)
    tile_out = Image.fromarray(out)

    # The processor may pad the input to a multiple of window_size before inference.
    # Crop the reconstruction back to the exact expected size to avoid shape mismatches
    # when blending tiles into the accumulation buffer.
    if tile_out.width != expected_w or tile_out.height != expected_h:
        tile_out = tile_out.crop((0, 0, expected_w, expected_h))

    return tile_out


def upscale_image(
    image: Image.Image,
    scale: int = 4,
    max_tile_size: int = 384,   # max input dimension per tile
    tile_overlap: int = 32,      # overlap between tiles for seamless blend
) -> Image.Image:
    """
    Args:
        image: PIL Image (RGB)
        scale: 2 or 4
        max_tile_size: maximum pixel size per tile (reduce if OOM)
        tile_overlap: pixel overlap between tiles (for seam-free output)

    Returns:
        PIL Image upscaled by 2x or 4x.
    """
    model, processor = _load_model(scale)
    device = next(model.parameters()).device.type

    image = image.convert("RGB")
    w, h = image.size

    # For small images, process in one shot
    if w <= max_tile_size and h <= max_tile_size:
        return _upscale_tile(model, processor, image, scale, device)

    # Tiled processing for large images
    stride = max_tile_size - tile_overlap
    out_w, out_h = w * scale, h * scale
    weight_map = np.zeros((out_h, out_w), dtype=np.float32)
    accum = np.zeros((out_h, out_w, 3), dtype=np.float32)

    x_starts = list(range(0, w, stride))
    y_starts = list(range(0, h, stride))

    for y0 in y_starts:
        for x0 in x_starts:
            x1 = min(x0 + max_tile_size, w)
            y1 = min(y0 + max_tile_size, h)
            tile = image.crop((x0, y0, x1, y1))
            tile_up = _upscale_tile(model, processor, tile, scale, device)
            tile_arr = np.array(tile_up).astype(np.float32)

            # Use actual output tile dimensions (not assumed scale*(x1-x0)) to avoid
            # indexing mismatches caused by processor padding differences.
            actual_h, actual_w = tile_arr.shape[:2]
            ox0, oy0 = x0 * scale, y0 * scale
            ox1 = min(ox0 + actual_w, out_w)
            oy1 = min(oy0 + actual_h, out_h)

            # Crop tile_arr to fit the buffer exactly
            tile_arr = tile_arr[:oy1 - oy0, :ox1 - ox0]
            tw, th = tile_arr.shape[1], tile_arr.shape[0]

            # Apply Hanning (cosine) blend weights for seamless tile edges
            wx = np.hanning(tw) if tw > 1 else np.ones(tw)
            wy = np.hanning(th) if th > 1 else np.ones(th)
            weight = np.outer(wy, wx).astype(np.float32)

            accum[oy0:oy1, ox0:ox1] += tile_arr * weight[..., np.newaxis]
            weight_map[oy0:oy1, ox0:ox1] += weight

    # Normalize and return
    weight_map = np.where(weight_map > 0, weight_map, 1.0)
    result = np.clip(accum / weight_map[..., np.newaxis], 0, 255).astype(np.uint8)
    return Image.fromarray(result)
