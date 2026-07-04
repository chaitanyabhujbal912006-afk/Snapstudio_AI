"""
Generates the new background/scene, conditioned on the depth map extracted
from the original photo so perspective and spatial layout stay plausible.

Uses Stable Diffusion 1.5 (not SDXL) deliberately -- it fits comfortably
inside free shared GPU quota (ZeroGPU) where SDXL might not.
"""

import torch
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel, UniPCMultistepScheduler
from PIL import Image

_pipe = None


def _load_pipeline():
    global _pipe
    if _pipe is not None:
        return _pipe

    device = "cuda" if torch.cuda.is_available() else "cpu"
    torch_dtype = torch.float16 if device == "cuda" else torch.float32

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
    if device == "cuda":
        pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config)
        pipe.enable_model_cpu_offload()
    else:
        pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config)

    _pipe = pipe
    return _pipe


def generate_background(depth_map: Image.Image, prompt: str, negative_prompt: str,
                         steps: int = 25, guidance_scale: float = 7.5, seed: int = None) -> Image.Image:
    pipe = _load_pipeline()

    device = "cuda" if torch.cuda.is_available() else "cpu"
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
