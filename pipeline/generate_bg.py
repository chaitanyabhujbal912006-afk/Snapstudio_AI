"""
Generates the new background/scene, conditioned on the depth map extracted
from the original photo so perspective and spatial layout stay plausible.

Uses Stable Diffusion 1.5 with LCM-LoRA for ultra-fast CPU inference.
"""

import torch
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel, LCMScheduler
from PIL import Image

_pipe = None


def _load_pipeline():
    global _pipe
    if _pipe is not None:
        return _pipe

    device = "cpu"
    torch_dtype = torch.float32

    controlnet = ControlNetModel.from_pretrained(
        "lllyasviel/sd-controlnet-depth",
        torch_dtype=torch_dtype,
    )

    pipe = StableDiffusionControlNetPipeline.from_pretrained(
        "runwayml/stable-diffusion-v1-5",
        controlnet=controlnet,
        torch_dtype=torch_dtype,
        safety_checker=None,
    )

    # Load LCM-LoRA weights for fast CPU inference (typically 6-8 steps)
    pipe.load_lora_weights("latent-consistency/lcm-lora-sdv1-5")
    pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)

    _pipe = pipe
    return _pipe


def generate_background(depth_map: Image.Image, prompt: str, negative_prompt: str,
                         steps: int = 8, guidance_scale: float = 1.5, seed: int = None) -> Image.Image:
    pipe = _load_pipeline()

    device = "cpu"
    generator = None
    if seed is not None:
        generator = torch.Generator(device=device).manual_seed(seed)

    result = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        image=depth_map,
        num_inference_steps=steps,
        guidance_scale=guidance_scale,
        generator=generator,
    )
    return result.images[0]
