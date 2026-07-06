"""
Generates the new background/scene, conditioned on the depth map extracted
from the original photo so perspective and spatial layout stay plausible.

Runs on CPU (free HF Spaces CPU-Basic tier). LCM-LoRA is used so we only
need ~6-8 denoising steps instead of ~25 -- this is what makes CPU
inference actually usable in the 30-60s range instead of several minutes.
"""

import torch
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel, LCMScheduler
from PIL import Image

_pipe = None


def _load_pipeline():
    global _pipe
    if _pipe is not None:
        return _pipe

    controlnet = ControlNetModel.from_pretrained(
        "lllyasviel/sd-controlnet-depth",
        torch_dtype=torch.float32,  # float32 on CPU -- float16 is not reliably supported off-GPU
    )

    pipe = StableDiffusionControlNetPipeline.from_pretrained(
        "runwayml/stable-diffusion-v1-5",
        controlnet=controlnet,
        torch_dtype=torch.float32,
        safety_checker=None,
    )

    # LCM-LoRA: lets us generate in ~6-8 steps instead of ~25, which is what
    # makes this workable on free CPU hosting.
    pipe.load_lora_weights("latent-consistency/lcm-lora-sdv1-5")
    pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)
    pipe.enable_attention_slicing()

    _pipe = pipe
    return _pipe


def generate_background(depth_map: Image.Image, prompt: str, negative_prompt: str,
                         steps: int = 6, guidance_scale: float = 1.5, seed: int = None) -> Image.Image:
    pipe = _load_pipeline()

    orig_size = depth_map.size
    w, h = orig_size

    # Scale so that the maximum dimension is 512, rounded to the nearest multiple of 8
    max_dim = 512
    scale = min(max_dim / w, max_dim / h)
    new_w = int(round((w * scale) / 8) * 8)
    new_h = int(round((h * scale) / 8) * 8)
    new_w = max(new_w, 8)
    new_h = max(new_h, 8)

    # Downscale for fast inference
    depth_map_resized = depth_map.resize((new_w, new_h), resample=Image.Resampling.LANCZOS)

    generator = None
    if seed is not None:
        generator = torch.Generator(device="cpu").manual_seed(seed)

    result = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        image=depth_map_resized,
        num_inference_steps=steps,
        guidance_scale=guidance_scale,  # LCM works best with low guidance (1.0-2.0)
        generator=generator,
    )
    
    # Scale back to original size
    rescaled_result = result.images[0].resize(orig_size, resample=Image.Resampling.LANCZOS)
    return rescaled_result