# Backend Guide — SnapStudio AI

## Entry Points

| File | Purpose |
|---|---|
| `kaggle_notebook.ipynb` | 2-cell Kaggle notebook (clone repo → run startup) |
| `kaggle_startup.py` | Installs deps, runs backend_app.py |
| `backend_app.py` | All 14 Gradio endpoints + model management |

## How to Add a New Backend Feature

### Step 1 — Create `pipeline/my_feature.py`

```python
"""
pipeline/my_feature.py
- Keep imports at module level (lazy-loaded models only)
- Use device_helper.py for GPU allocation
- Accept/return PIL Images internally; backend_app.py handles base64 conversion
"""
from PIL import Image

def my_operation(image: Image.Image, param1: float, param2: str) -> Image.Image:
    # ... processing ...
    return result_image
```

### Step 2 — Expose endpoint in `backend_app.py`

Follow this exact pattern (all 14 endpoints use it):

```python
# --- Import at top ---
from pipeline.my_feature import my_operation

# --- Add endpoint function (≈ lines 300+) ---
def api_my_feature(image_b64: str, param1: float, param2: str):
    try:
        free_gpu_models(keep="my_feature")  # or None for CPU-only ops
        image = b64_to_pil(image_b64)
        result = my_operation(image, param1, param2)
        return [{"success": True, "image": pil_to_b64(result)}]
    except Exception as e:
        return [{"success": False, "error": str(e)}]

# --- Register in Gradio interface (bottom of backend_app.py) ---
gr.Interface(fn=api_my_feature, inputs=[...], outputs=[...], api_name="api_my_feature")
# OR use the gr.Blocks approach if the file uses that pattern
```

> **Important:** The Gradio function name (e.g. `api_my_feature`) becomes the SSE endpoint path: `/call/api_my_feature`.

## b64 Helpers (already in backend_app.py)

```python
def b64_to_pil(b64: str) -> Image.Image:
    data = b64.split(",", 1)[1] if "," in b64 else b64
    return Image.open(io.BytesIO(base64.b64decode(data))).convert("RGB")

def pil_to_b64(img: Image.Image, fmt: str = "PNG") -> str:
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return f"data:image/{fmt.lower()};base64," + base64.b64encode(buf.getvalue()).decode()
```

## Pipeline Module Patterns

### CPU-only module (fast, ~0.1–1s)

```python
# pipeline/enhance.py pattern
import cv2, numpy as np
from PIL import Image

def auto_enhance(image: Image.Image) -> Image.Image:
    img = np.array(image)
    # ... cv2 processing ...
    return Image.fromarray(result)
```

### GPU module with lazy loading (slow, 10s–4min)

```python
# pipeline/style_filter.py pattern
from pipeline.device_helper import get_device
_pipe = None  # module-level, lazy-loaded

def _load_pipe():
    global _pipe
    if _pipe is None:
        from diffusers import StableDiffusionImg2ImgPipeline
        _pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
            "runwayml/stable-diffusion-v1-5",
            torch_dtype=torch.float16,
        ).to(get_device("style"))
    return _pipe

def apply_style(image: Image.Image, style_name: str, strength: float) -> Image.Image:
    pipe = _load_pipe()
    # ...
```

## Dual-GPU Allocation (device_helper.py)

```python
# device_helper.py (simplified)
DEVICE_MAP = {
    "bg_swap":   "cuda:0",
    "t2i":       "cuda:0",
    "inpaint":   "cuda:1",
    "style":     "cuda:1",
    "upscale":   "cuda:1",
}

def get_device(model_key: str) -> str:
    if torch.cuda.device_count() >= 2:
        return DEVICE_MAP.get(model_key, "cuda:0")
    return "cuda:0" if torch.cuda.is_available() else "cpu"
```

## All 14 Backend Endpoints

| Gradio fn name | Pipeline module | GPU? | Approx time |
|---|---|---|---|
| `api_get_presets` | — | No | <0.1s |
| `api_enhance` | enhance.py | No | ~0.5s |
| `api_color_grade` | color_grade.py | No | ~0.5s |
| `api_retouch` | retouch.py | No | ~0.2s |
| `api_denoise` | denoise.py | No | ~1s |
| `api_effect` | effects.py | No | ~0.5s |
| `api_relight` | relight.py | No | ~1s |
| `api_bg_blur` | bg_blur.py | Yes (MiDaS) | ~5–15s |
| `api_upscale` | upscale.py | Yes (Swin2SR) | ~15–60s |
| `api_face_enhance` | face_enhance.py | Yes (Swin2SR) | ~10–30s |
| `api_bg_swap` | generate_bg.py + composite | Yes (SD1.5) | ~1–2min |
| `api_style_filter` | style_filter.py | Yes (SD img2img) | ~30–60s |
| `api_remove_object` | inpaint.py | Yes (SD inpaint) | ~2–4min |
| `api_outpaint` | outpaint.py | Yes (SD inpaint) | ~2–4min |
| `api_text2img` | text2img.py | Yes (SDXL-Turbo) | ~10–20s |

## Presets System

### Adding a new background style — `presets/styles.py`
```python
STYLES = {
    "My New Style": "a {subject} in a lush rainforest, dappled sunlight, ...",
    ...
}
```

### Adding a new art style — `presets/style_filters.py`
```python
STYLE_FILTERS = {
    "My Art Style": "((my art style)), style prompt..., masterpiece, ...",
    ...
}
```
Current styles: Anime, Oil Painting, Watercolor, Sketch, Ghibli, Pixar 3D, Comic Pop-Art, Retro 80s Film, Pencil Sketch, Cyberpunk 2077, + more.

### Adding a color grade — `presets/color_grades.py`
Add a dict entry with keys: `name`, `contrast`, `highlights`, `shadows`, `temperature`, `saturation`, `split_tone`.

## Requirements & Dependencies

Key packages (`requirements.txt`):
- `gradio` — API server
- `diffusers`, `transformers`, `accelerate` — SD pipelines
- `torch`, `torchvision` — GPU compute
- `opencv-python`, `Pillow`, `numpy` — image processing
- `rembg` — subject segmentation (background removal)
- `timm` — MiDaS depth model
