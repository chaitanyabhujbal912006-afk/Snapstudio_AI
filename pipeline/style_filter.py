"""
Style Filter: transforms the whole photo into a stylized version
(anime, cartoon, oil painting, etc.) using img2img -- the original photo's
composition guides the output, but the whole image gets restyled, unlike
Background Swap which only touches the background.

Reuses the same SD1.5 + LCM-LoRA combo as generate_bg.py for CPU speed.
"""

import torch
from diffusers import StableDiffusionImg2ImgPipeline, LCMScheduler
from PIL import Image
from pipeline.device_helper import get_device_for_pipeline

_pipe = None


def _load_pipeline():
    global _pipe
    if _pipe is not None:
        return _pipe

    device = get_device_for_pipeline("style")
    is_cuda = "cuda" in device
    dtype = torch.float16 if is_cuda else torch.float32

    pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
        "runwayml/stable-diffusion-v1-5",
        torch_dtype=dtype,
        safety_checker=None,
    ).to(device)

    pipe.load_lora_weights("latent-consistency/lcm-lora-sdv1-5")
    pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)

    if is_cuda:
        pipe.enable_xformers_memory_efficient_attention()
    else:
        pipe.enable_attention_slicing()

    _pipe = pipe
    return _pipe


def apply_style(image: Image.Image, prompt: str, negative_prompt: str,
                 strength: float = 0.6, steps: int = 8, guidance_scale: float = 1.5,
                 seed: int = 42) -> Image.Image:
    """
    Args:
        image: PIL Image (RGB), the original photo.
        prompt / negative_prompt: describes the target style.
        strength: 0.0-1.0. Higher = more transformation, less resemblance
                  to the original photo. 0.5-0.7 is a good starting range.
        steps: denoising steps (LCM needs far fewer than normal SD).
        seed: for reproducibility; change it to get variety.

    Returns:
        PIL Image (RGB), stylized result.
    """
    pipe = _load_pipeline()
    device = next(pipe.unet.parameters()).device.type
    generator = torch.Generator(device=device).manual_seed(seed)

    orig_size = image.size

    # Resize to max 512px (SD sweet spot for CPU) rounded to multiple of 8
    w, h = image.size
    scale = min(512 / w, 512 / h)
    w = max(int(round((w * scale) / 8) * 8), 8)
    h = max(int(round((h * scale) / 8) * 8), 8)
    image_resized = image.convert("RGB").resize((w, h))

    result = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        image=image_resized,
        strength=strength,
        num_inference_steps=steps,
        guidance_scale=guidance_scale,
        generator=generator,
    )

    # Scale back to original size
    return result.images[0].resize(orig_size, resample=Image.Resampling.LANCZOS)
