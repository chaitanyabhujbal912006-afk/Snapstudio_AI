"""
Generates the new background/scene, conditioned on the depth map extracted
from the original photo so perspective and spatial layout stay plausible.

Runs on CPU (free HF Spaces CPU-Basic tier). LCM-LoRA is used so we only
need ~6-8 denoising steps instead of ~25 -- this is what makes CPU
inference actually usable in the 30-60s range instead of several minutes.

On GPU (Kaggle T4), CUDA model CPU offloading is enabled automatically to
reduce peak VRAM usage by ~30%, preventing OOM on large images.
"""

import torch
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel, LCMScheduler
from PIL import Image

_pipe = None


def _load_pipeline():
    global _pipe
    if _pipe is not None:
        return _pipe

    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32

    controlnet = ControlNetModel.from_pretrained(
        "lllyasviel/sd-controlnet-depth",
        torch_dtype=dtype,
    )

    pipe = StableDiffusionControlNetPipeline.from_pretrained(
        "runwayml/stable-diffusion-v1-5",
        controlnet=controlnet,
        torch_dtype=dtype,
        safety_checker=None,
    ).to(device)

    # LCM-LoRA: lets us generate in ~6-8 steps instead of ~25
    pipe.load_lora_weights("latent-consistency/lcm-lora-sdv1-5")
    pipe.scheduler = LCMScheduler.from_config(pipe.scheduler.config)

    if device == "cuda":
        # CPU offloading keeps only the active sub-model on GPU at any time,
        # reducing peak VRAM by ~30% — crucial for large image inputs.
        pipe.enable_model_cpu_offload()
        pipe.enable_xformers_memory_efficient_attention()
    else:
        pipe.enable_attention_slicing()

    _pipe = pipe
    return _pipe


def release_pipeline() -> None:
    """Explicitly release the cached pipeline to free GPU/CPU memory.
    Call this between long-running jobs in a Kaggle session to avoid OOM."""
    global _pipe
    if _pipe is not None:
        del _pipe
        _pipe = None
        import gc
        import torch as _torch
        gc.collect()
        if _torch.cuda.is_available():
            _torch.cuda.empty_cache()


def generate_background(depth_map: Image.Image, prompt: str, negative_prompt: str,
                         steps: int = 8, guidance_scale: float = 2.0, seed: int = None) -> Image.Image:
    pipe = _load_pipeline()
    device = next(pipe.unet.parameters()).device.type

    orig_size = depth_map.size
    w, h = orig_size

    # Work at 768 for large images (better quality), 512 for small — always multiple of 8
    max_dim = 768 if max(w, h) > 640 else 512
    scale = min(max_dim / w, max_dim / h)
    new_w = int(round((w * scale) / 8) * 8)
    new_h = int(round((h * scale) / 8) * 8)
    new_w = max(new_w, 8)
    new_h = max(new_h, 8)

    # ControlNet requires RGB depth map
    depth_resized = depth_map.resize((new_w, new_h), resample=Image.Resampling.LANCZOS).convert("RGB")

    generator = None
    if seed is not None:
        generator = torch.Generator(device=device).manual_seed(seed)

    try:
        result = pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            image=depth_resized,
            num_inference_steps=steps,   # 8 steps = LCM quality sweet spot
            guidance_scale=guidance_scale,
            generator=generator,
            controlnet_conditioning_scale=0.75,  # relax depth adherence slightly for more natural BG
        )
    except torch.cuda.OutOfMemoryError:
        # Fallback: drop to 512, enable attention slicing
        pipe.enable_attention_slicing()
        torch.cuda.empty_cache()
        depth_sm = depth_map.resize((512, 512), resample=Image.Resampling.LANCZOS).convert("RGB")
        result = pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            image=depth_sm,
            num_inference_steps=steps,
            guidance_scale=guidance_scale,
            generator=generator,
            controlnet_conditioning_scale=0.75,
        )

    # Scale back to original size with high-quality resampling
    rescaled_result = result.images[0].resize(orig_size, resample=Image.Resampling.LANCZOS)
    return rescaled_result