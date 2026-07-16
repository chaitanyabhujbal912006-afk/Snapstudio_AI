import torch

def get_device_for_pipeline(pipeline_name: str) -> str:
    """
    Decides target device type (cpu, cuda:0, or cuda:1) based on GPU availability.
    If dual GPUs are active (Kaggle GPU T4 x2), models are distributed across GPUs:
      - cuda:0: bg_swap, t2i (Heavy SD pipelines)
      - cuda:1: inpaint, style, upscale (Image processing and enhancement)
    This prevents OOM errors while keeping models warm in different GPU caches.
    """
    if not torch.cuda.is_available():
        return "cpu"
    
    num_gpus = torch.cuda.device_count()
    if num_gpus < 2:
        return "cuda"
        
    # Dual GPU distribution mapping
    if pipeline_name in ["bg_swap", "t2i"]:
        return "cuda:0"
    else:
        return "cuda:1"


def set_active_cuda_device(pipeline_name: str) -> None:
    """
    Sets PyTorch's default CUDA device index key to prevent internal libraries
    (like HuggingFace diffusers, xformers, and CUDA kernels) from instantiating 
    tensors on cuda:0 when the pipeline should run on cuda:1.
    """
    if not torch.cuda.is_available():
        return
    
    device = get_device_for_pipeline(pipeline_name)
    if "cuda" in device:
        parts = device.split(":")
        idx = int(parts[1]) if len(parts) > 1 else 0
        torch.cuda.set_device(idx)
