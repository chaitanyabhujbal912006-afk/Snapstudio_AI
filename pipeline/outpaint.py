"""
Outpainting: extend the canvas of an image in any direction using
stable diffusion inpainting to fill the new area seamlessly.

Reuses the existing SD inpainting pipeline from pipeline/inpaint.py.
GPU: ~1–3 min per extend operation.
"""

import numpy as np
import torch
from PIL import Image
from diffusers import StableDiffusionInpaintPipeline

import pipeline.inpaint as inpaint_mod

# ── Outpaint directions ───────────────────────────────────────────────────────

DIRECTIONS = ["right", "left", "bottom", "top", "all sides"]


def _build_canvas_and_mask(
    image: Image.Image,
    direction: str,
    amount: int,
) -> tuple:
    """
    Extend the canvas and create an outpaint mask.

    Returns:
        canvas: extended PIL Image (RGB) with gray fill in new area
        mask: PIL Image (L), white = fill this area, black = keep
        (paste_x, paste_y): where original image was pasted on canvas
    """
    w, h = image.size

    if direction == "right":
        nw, nh = w + amount, h
        paste_x, paste_y = 0, 0
        fill_boxes = [(w, 0, nw, nh)]
    elif direction == "left":
        nw, nh = w + amount, h
        paste_x, paste_y = amount, 0
        fill_boxes = [(0, 0, amount, nh)]
    elif direction == "bottom":
        nw, nh = w, h + amount
        paste_x, paste_y = 0, 0
        fill_boxes = [(0, h, nw, nh)]
    elif direction == "top":
        nw, nh = w, h + amount
        paste_x, paste_y = 0, amount
        fill_boxes = [(0, 0, nw, amount)]
    elif direction == "all sides":
        nw, nh = w + amount * 2, h + amount * 2
        paste_x, paste_y = amount, amount
        fill_boxes = [
            (0, 0, nw, amount),          # top
            (0, nh - amount, nw, nh),    # bottom
            (0, 0, amount, nh),          # left
            (nw - amount, 0, nw, nh),    # right
        ]
    else:
        raise ValueError(f"Unknown direction: {direction}")

    # Create canvas with neutral gray fill (gives inpainting good context)
    canvas = Image.new("RGB", (nw, nh), (128, 128, 128))
    canvas.paste(image.convert("RGB"), (paste_x, paste_y))

    # Create mask (white = fill, black = keep)
    mask = Image.new("L", (nw, nh), 0)
    for box in fill_boxes:
        mask.paste(255, box)

    return canvas, mask, paste_x, paste_y


def outpaint(
    image: Image.Image,
    direction: str = "right",
    amount: int = 256,            # pixels to add in the chosen direction
    prompt: str = "",             # hint for what to generate in the new area
    steps: int = 25,
    guidance_scale: float = 7.5,
    seed: int = 42,
    blend_overlap: int = 32,      # pixels of overlap to smooth the seam
) -> Image.Image:
    """
    Extend the canvas and fill new area with AI-generated content.

    Args:
        direction: "right", "left", "bottom", "top", or "all sides"
        amount: pixels to add (capped at 512 for quality)
        prompt: text hint for the generated area ("forest", "sky", etc.)
        blend_overlap: soften the seam between original and generated area
    """
    amount = min(amount, 512)

    # Load inpainting pipeline (reuses existing singleton)
    pipe = inpaint_mod._load_pipeline()

    canvas, mask, paste_x, paste_y = _build_canvas_and_mask(image, direction, amount)

    cw, ch = canvas.size
    max_dim = 768

    # Scale canvas to fit SD inpainting sweet spot
    scale = min(max_dim / cw, max_dim / ch, 1.0)
    new_w = int(round(cw * scale / 8) * 8)
    new_h = int(round(ch * scale / 8) * 8)
    new_w = max(new_w, 8)
    new_h = max(new_h, 8)

    canvas_resized = canvas.resize((new_w, new_h), Image.LANCZOS)
    mask_resized = mask.resize((new_w, new_h), Image.NEAREST)

    base_prompt = (
        "seamless natural continuation, same scene, same lighting, "
        "photorealistic, high quality, professional photograph"
    )
    if prompt.strip():
        base_prompt = prompt + ", " + base_prompt

    neg_prompt = "artifacts, seam, blurry, distorted, watermark, text, low quality, extra objects"

    device = next(pipe.unet.parameters()).device.type
    generator = torch.Generator(device=device).manual_seed(seed)

    result = pipe(
        prompt=base_prompt,
        negative_prompt=neg_prompt,
        image=canvas_resized,
        mask_image=mask_resized,
        num_inference_steps=steps,
        guidance_scale=guidance_scale,
        generator=generator,
    )

    generated = result.images[0].resize((cw, ch), Image.LANCZOS)

    # Blend seam: use gradient blend where original meets generated
    if blend_overlap > 0:
        orig_arr = np.array(canvas).astype(np.float32)
        gen_arr = np.array(generated).astype(np.float32)
        mask_arr = np.array(mask).astype(np.float32) / 255.0

        # Erode mask by blend_overlap so the seam is smooth
        import cv2
        kernel = np.ones((blend_overlap, blend_overlap), np.uint8)
        mask_eroded = cv2.erode((mask_arr * 255).astype(np.uint8), kernel)
        mask_blurred = cv2.GaussianBlur(mask_eroded.astype(np.float32), (0, 0), sigmaX=blend_overlap // 2) / 255.0
        mask_final = mask_blurred[..., np.newaxis]

        result_arr = orig_arr * (1 - mask_final) + gen_arr * mask_final
        return Image.fromarray(np.clip(result_arr, 0, 255).astype(np.uint8))

    return generated
