"""
Text-to-Image generation using SDXL-Turbo.
Model: stabilityai/sdxl-turbo (4 denoising steps, ~8–12s on T4 GPU)

10x faster than standard SDXL, with quality matching SD2.1.
Produces 512x512 natively (can upscale with pipeline/upscale.py afterwards).
"""

import torch
from diffusers import AutoPipelineForText2Image
from PIL import Image

_t2i_pipe = None

# ── Style prompt expansions ────────────────────────────────────────────────────

STYLE_PRESETS = {
    "Photorealistic": {
        "suffix": ", photorealistic, 8k resolution, professional photography, sharp details, natural lighting, RAW photo quality",
        "negative": "cartoon, anime, illustration, painting, sketch, low quality, blurry, watermark, text",
    },
    "Cinematic": {
        "suffix": ", cinematic photography, 35mm film, anamorphic lens bokeh, golden hour, dramatic lighting, movie still, color graded",
        "negative": "anime, cartoon, low quality, flat lighting, overexposed, underexposed",
    },
    "Studio Portrait": {
        "suffix": ", professional studio portrait, high-key lighting, clean background, sharp skin detail, commercial photography",
        "negative": "outdoor, busy background, low quality, blurry, bad anatomy",
    },
    "Concept Art": {
        "suffix": ", digital concept art, highly detailed, artstation, by Greg Rutkowski, trending on ArtStation, matte painting",
        "negative": "photorealistic, low quality, sketch, rough",
    },
    "Product Photography": {
        "suffix": ", professional product photography, studio lighting, clean white background, sharp details, commercial, advertising quality",
        "negative": "person, cartoon, cluttered, low quality, shadows",
    },
    "Anime Illustration": {
        "suffix": ", high quality anime illustration, beautiful detailed, vibrant colors, by Makoto Shinkai, Studio Ghibli quality",
        "negative": "photorealistic, low quality, western cartoon, rough sketch",
    },
    "Oil Painting": {
        "suffix": ", classical oil painting, rich detailed brushwork, museum quality, by John Singer Sargent, dramatic lighting",
        "negative": "photorealistic, anime, low quality, digital art, flat",
    },
    "Watercolor": {
        "suffix": ", beautiful watercolor painting, flowing soft colors, delicate paper texture, highly detailed, professional artist",
        "negative": "oil painting, photorealistic, low quality, harsh lines",
    },
    "Sci-Fi": {
        "suffix": ", science fiction, futuristic, detailed environment, cinematic lighting, unreal engine render quality",
        "negative": "medieval, cartoon, low quality, blurry",
    },
    "Fantasy": {
        "suffix": ", high fantasy, detailed magical world, by Alan Lee and John Howe, dramatic atmospheric lighting",
        "negative": "modern, sci-fi, low quality, photorealistic, cartoon",
    },
    "None (Custom)": {
        "suffix": "",
        "negative": "low quality, blurry, watermark, text, bad anatomy",
    },
}


from pipeline.device_helper import get_device_for_pipeline

def _load_t2i():
    global _t2i_pipe
    if _t2i_pipe is not None:
        return _t2i_pipe

    from pipeline.device_helper import set_active_cuda_device
    set_active_cuda_device("t2i")
    
    device = get_device_for_pipeline("t2i")
    is_cuda = "cuda" in device
    dtype = torch.float16 if is_cuda else torch.float32

    _t2i_pipe = AutoPipelineForText2Image.from_pretrained(
        "stabilityai/sdxl-turbo",
        torch_dtype=dtype,
        variant="fp16" if is_cuda else None,
    ).to(device)

    if is_cuda:
        _t2i_pipe.enable_xformers_memory_efficient_attention()

    return _t2i_pipe


def generate_from_text(
    prompt: str,
    negative_prompt: str = "",
    style: str = "Photorealistic",
    width: int = 512,
    height: int = 512,
    steps: int = 4,
    seed: int = None,
    num_images: int = 1,
) -> list:
    """
    Args:
        prompt: text description of the image
        negative_prompt: what to avoid (added to style's negative)
        style: one of STYLE_PRESETS keys
        width/height: output dimensions (multiple of 8, max 1024 on T4)
        steps: 4 = SDXL-Turbo fast (recommended), 8 = slightly better quality
        seed: for reproducibility; None = random
        num_images: 1–4

    Returns:
        List of PIL Images (RGB)
    """
    pipe = _load_t2i()
    device = next(pipe.unet.parameters()).device.type

    preset = STYLE_PRESETS.get(style, STYLE_PRESETS["None (Custom)"])
    full_prompt = prompt + preset["suffix"]
    full_negative = (negative_prompt + ", " if negative_prompt else "") + preset["negative"]

    generator = None
    if seed is not None:
        generator = torch.Generator(device=device).manual_seed(seed)

    # SDXL-Turbo: guidance_scale MUST be 0.0
    result = pipe(
        prompt=full_prompt,
        negative_prompt=full_negative,
        num_inference_steps=steps,
        guidance_scale=0.0,
        width=width,
        height=height,
        num_images_per_prompt=num_images,
        generator=generator,
    )

    return result.images
