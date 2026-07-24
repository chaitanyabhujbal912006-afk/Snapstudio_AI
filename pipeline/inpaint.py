"""
Object Removal: user paints over something they want gone, and that
region gets filled in convincingly.

Uses a dedicated inpainting checkpoint (not the same base model as the
other modes) -- inpainting models are trained with a modified input
that understands "this region is missing, fill it in using the
surrounding context." This is NOT compatible with the LCM-LoRA speed
trick we used elsewhere (different model architecture), so this mode
runs slower on CPU (roughly 2-4 minutes) -- flagged clearly in the UI.
"""

import torch
from diffusers import StableDiffusionInpaintPipeline
from PIL import Image
from pipeline.device_helper import get_device_for_pipeline

_pipe = None


def _load_pipeline():
    global _pipe
    if _pipe is not None:
        return _pipe

    from pipeline.device_helper import set_active_cuda_device
    set_active_cuda_device("inpaint")
    
    device = get_device_for_pipeline("inpaint")
    is_cuda = "cuda" in device
    dtype = torch.float16 if is_cuda else torch.float32

    pipe = StableDiffusionInpaintPipeline.from_pretrained(
        "runwayml/stable-diffusion-inpainting",
        torch_dtype=dtype,
        safety_checker=None,
    ).to(device)

    if is_cuda:
        pipe.enable_xformers_memory_efficient_attention()
    else:
        pipe.enable_attention_slicing()

    _pipe = pipe
    return _pipe


def remove_object(
    image: Image.Image,
    mask: Image.Image,
    prompt: str = "",
    negative_prompt: str = "",
    steps: int = 20,
    guidance_scale: float = 7.5,
    seed: int = 42
) -> Image.Image:
    """
    Args:
        image: PIL Image (RGB), the original photo.
        mask: PIL Image (L), white = area to remove/fill in, black = keep as-is.
        prompt: custom prompt for object replacement, or empty string for seamless erase.
        negative_prompt: custom negative prompt.
        steps: denoising steps (no LCM shortcut available for this mode).
        seed: for reproducibility.

    Returns:
        PIL Image (RGB), with the masked region filled in.
    """
    pipe = _load_pipeline()
    device = next(pipe.unet.parameters()).device.type
    generator = torch.Generator(device=device).manual_seed(seed)

    # SD inpainting works best at 512x512 -- resize, process, then resize back
    original_size = image.size
    image_resized = image.convert("RGB").resize((512, 512))
    mask_resized = mask.convert("L").resize((512, 512))

    if not prompt or not prompt.strip():
        final_prompt = "seamless background, natural continuation of surroundings, photorealistic, high quality"
    else:
        final_prompt = f"{prompt.strip()}, highly detailed, photorealistic, high quality"

    if not negative_prompt or not negative_prompt.strip():
        final_neg_prompt = "artifact, blurry, distorted, extra objects, text, watermark, low quality"
    else:
        final_neg_prompt = negative_prompt.strip()

    result = pipe(
        prompt=final_prompt,
        negative_prompt=final_neg_prompt,
        image=image_resized,
        mask_image=mask_resized,
        num_inference_steps=steps,
        guidance_scale=guidance_scale,
        generator=generator,
    )

    return result.images[0].resize(original_size)

