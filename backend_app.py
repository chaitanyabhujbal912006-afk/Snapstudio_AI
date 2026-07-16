"""
SnapStudio AI — Comprehensive Kaggle GPU Backend
Exposes 14 AI-powered editing features as Gradio API endpoints.

Run on Kaggle GPU (T4): Settings → Accelerator → GPU T4 x2, Internet ON
The public *.gradio.live URL is your backend for the Vercel frontend.
"""

import os
import gc
import io
import base64
import torch

# ── Thread limits (important on shared GPU instances) ──────────────────────────
os.environ["OMP_NUM_THREADS"] = "4"
os.environ["MKL_NUM_THREADS"] = "4"
if torch.cuda.is_available():
    torch.backends.cuda.matmul.allow_tf32 = True

import gradio as gr
from PIL import Image

# ── Pipeline imports ───────────────────────────────────────────────────────────
from pipeline.enhance import auto_enhance
from pipeline.color_grade import apply_color_grade
from pipeline.retouch import retouch_portrait
from pipeline.denoise import denoise
from pipeline.effects import (
    apply_hdr, apply_vignette, apply_film_grain,
    apply_chromatic_aberration, apply_bloom,
    apply_cross_process, apply_color_splash, apply_orton_glow,
)
from pipeline.bg_blur import blur_background
from pipeline.upscale import upscale_image
from pipeline.face_enhance import enhance_faces
from pipeline.segment import segment_product, feather_mask
from pipeline.depth_edges import get_depth_map
from pipeline.generate_bg import generate_background
from pipeline.composite import composite
from pipeline.harmonize import add_shadow, harmonize_tone
from pipeline.style_filter import apply_style
from pipeline.inpaint import remove_object
from pipeline.text2img import generate_from_text, STYLE_PRESETS
from pipeline.outpaint import outpaint, DIRECTIONS

from presets.styles import STYLES
from presets.style_filters import STYLE_FILTERS
from presets.color_grades import COLOR_GRADES

import pipeline.inpaint as inpaint_mod
import pipeline.style_filter as style_filter_mod
import pipeline.generate_bg as bg_mod
import pipeline.upscale as upscale_mod
import pipeline.text2img as t2i_mod


# ── Model memory management ────────────────────────────────────────────────────

GPU_MODELS = {
    "inpaint": lambda: inpaint_mod._pipe,
    "style": lambda: style_filter_mod._pipe,
    "bg_swap": lambda: bg_mod._pipe,
    "upscale": lambda: upscale_mod._model,
    "t2i": lambda: t2i_mod._t2i_pipe,
}


def free_gpu_models(keep: str = None):
    """Unload GPU models dynamically to prevent OOM based on available GPUs."""
    # Ensure PyTorch default GPU device index aligns with the target pipeline's device
    if keep and keep != "clear_all":
        from pipeline.device_helper import set_active_cuda_device
        set_active_cuda_device(keep)

    # If 2 or more GPUs are available (Kaggle GPU T4 x2), we have 2 x 15.6 GB = 31.2 GB of VRAM.
    # We distribute models across devices using pipeline/device_helper.py and can safely 
    # keep ALL models warm in VRAM for instant switching latency!
    if torch.cuda.is_available() and torch.cuda.device_count() >= 2:
        return

    cleared = False

    def clear(mod, attr):
        nonlocal cleared
        obj = getattr(mod, attr, None)
        if obj is not None:
            setattr(mod, attr, None)
            cleared = True

    if keep != "inpaint":    clear(inpaint_mod, "_pipe")
    if keep != "style":      clear(style_filter_mod, "_pipe")
    if keep != "bg_swap":    clear(bg_mod, "_pipe")
    
    # Swin2SR (upscale) is extremely lightweight (~800MB VRAM). Keep it loaded
    # even when switching to prevent slow model init on face restoration requests,
    # unless explicitly doing a clear all.
    if keep == "clear_all":
        clear(inpaint_mod, "_pipe")
        clear(style_filter_mod, "_pipe")
        clear(bg_mod, "_pipe")
        clear(upscale_mod, "_model")
        clear(upscale_mod, "_processor")
        clear(t2i_mod, "_t2i_pipe")
    elif keep != "t2i":
        clear(t2i_mod, "_t2i_pipe")

    if cleared:
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()


# ── Image helpers ──────────────────────────────────────────────────────────────

def _b64_to_pil(data_uri: str) -> Image.Image:
    if "," in data_uri:
        _, data = data_uri.split(",", 1)
    else:
        data = data_uri
    return Image.open(io.BytesIO(base64.b64decode(data)))


def _pil_to_b64(img: Image.Image, fmt: str = "PNG") -> str:
    buf = io.BytesIO()
    img.save(buf, format=fmt, optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


# ═══════════════════════════════════════════════════════════════════════════════
# QUICK EDIT — Pure CPU, instant results
# ═══════════════════════════════════════════════════════════════════════════════

def api_enhance(image_b64: str) -> dict:
    """Auto-enhance: fix lighting, color, contrast, sharpness. ~1–2s."""
    try:
        img = _b64_to_pil(image_b64).convert("RGB")
        result = auto_enhance(img)
        return {"success": True, "image": _pil_to_b64(result)}
    except Exception as e:
        return {"success": False, "error": str(e)}


def api_color_grade(
    image_b64: str,
    grade_name: str,
    intensity: float,
    exposure: float,
    contrast: float,
    highlights: float,
    shadows: float,
    temperature: float,
    saturation: float,
    vibrance: float,
    vignette: float,
    grain: float,
) -> dict:
    """Apply color grade + manual tonal adjustments. ~0.2s."""
    try:
        img = _b64_to_pil(image_b64).convert("RGB")
        result = apply_color_grade(
            img,
            grade_name=grade_name,
            intensity=intensity,
            exposure=exposure,
            contrast=contrast if contrast != -999 else None,
            highlights=highlights if highlights != -999 else None,
            shadows=shadows if shadows != -999 else None,
            temperature=temperature if temperature != -999 else None,
            saturation=saturation if saturation != -999 else None,
            vibrance=vibrance,
            vignette=vignette if vignette != -999 else None,
            grain=grain if grain != -999 else None,
        )
        return {"success": True, "image": _pil_to_b64(result)}
    except Exception as e:
        return {"success": False, "error": str(e)}


def api_retouch(
    image_b64: str,
    skin_smooth: float,
    clarity: float,
    sharpen: float,
    vibrance: float,
    shadow_lift: float,
    teeth_whiten: float,
) -> dict:
    """Portrait retouching. ~0.2–0.5s."""
    try:
        img = _b64_to_pil(image_b64).convert("RGB")
        result = retouch_portrait(
            img,
            skin_smooth=skin_smooth,
            clarity=clarity,
            sharpen=sharpen,
            vibrance=vibrance,
            shadow_lift=shadow_lift,
            teeth_whiten=teeth_whiten,
        )
        return {"success": True, "image": _pil_to_b64(result)}
    except Exception as e:
        return {"success": False, "error": str(e)}


def api_denoise(image_b64: str, strength: float, mode: str, preserve_color: bool) -> dict:
    """Image denoising. ~0.5–2s."""
    try:
        img = _b64_to_pil(image_b64).convert("RGB")
        result = denoise(img, strength=strength, mode=mode, preserve_color=preserve_color)
        return {"success": True, "image": _pil_to_b64(result)}
    except Exception as e:
        return {"success": False, "error": str(e)}


def api_effect(image_b64: str, effect: str, params: dict) -> dict:
    """Apply a creative effect (HDR, bloom, grain, vignette, etc.). <0.5s."""
    try:
        img = _b64_to_pil(image_b64).convert("RGB")

        if effect == "hdr":
            result = apply_hdr(img, strength=params.get("strength", 0.7),
                                algorithm=params.get("algorithm", "reinhard"))
        elif effect == "vignette":
            result = apply_vignette(img, strength=params.get("strength", 0.5),
                                    feather=params.get("feather", 0.7),
                                    color=params.get("color", "black"))
        elif effect == "grain":
            result = apply_film_grain(img, amount=params.get("amount", 0.4),
                                      size=params.get("size", 0.5),
                                      monochrome=params.get("monochrome", False))
        elif effect == "chromatic":
            result = apply_chromatic_aberration(img, strength=params.get("strength", 0.3))
        elif effect == "bloom":
            result = apply_bloom(img, threshold=params.get("threshold", 0.75),
                                 strength=params.get("strength", 0.5),
                                 radius=params.get("radius", 40))
        elif effect == "cross_process":
            result = apply_cross_process(img, strength=params.get("strength", 0.7))
        elif effect == "color_splash":
            result = apply_color_splash(img, hue_target=params.get("hue", 0),
                                        hue_range=params.get("range", 20))
        elif effect == "orton":
            result = apply_orton_glow(img, strength=params.get("strength", 0.4))
        else:
            return {"success": False, "error": f"Unknown effect: {effect}"}

        return {"success": True, "image": _pil_to_b64(result)}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ═══════════════════════════════════════════════════════════════════════════════
# AI ENHANCE — GPU models, 5–30s
# ═══════════════════════════════════════════════════════════════════════════════

def api_upscale(image_b64: str, scale: int) -> dict:
    """4x or 2x AI super-resolution using Swin2SR. ~5–15s on T4."""
    try:
        free_gpu_models(keep="upscale")
        img = _b64_to_pil(image_b64).convert("RGB")
        result = upscale_image(img, scale=scale)
        return {"success": True, "image": _pil_to_b64(result)}
    except Exception as e:
        return {"success": False, "error": str(e)}


def api_face_enhance(
    image_b64: str,
    upscale_strength: float,
    retouch_strength: float,
) -> dict:
    """AI face detection + restoration + retouching. ~10–25s on T4."""
    try:
        free_gpu_models(keep="upscale")
        img = _b64_to_pil(image_b64).convert("RGB")
        result = enhance_faces(img, upscale_strength=upscale_strength,
                                retouch_strength=retouch_strength)
        return {"success": True, "image": _pil_to_b64(result)}
    except Exception as e:
        return {"success": False, "error": str(e)}


def api_bg_blur(
    image_b64: str,
    blur_amount: float,
    use_depth: bool,
    subject_type: str,
) -> dict:
    """DSLR background blur (bokeh). ~3–8s on CPU."""
    try:
        img = _b64_to_pil(image_b64).convert("RGB")
        result = blur_background(img, blur_amount=blur_amount,
                                 use_depth=use_depth, subject_type=subject_type)
        return {"success": True, "image": _pil_to_b64(result)}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ═══════════════════════════════════════════════════════════════════════════════
# AI TRANSFORM — GPU models, 1–5 min
# ═══════════════════════════════════════════════════════════════════════════════

def api_bg_swap(
    image_b64: str,
    subject_type: str,
    style_name: str,
    num_variants: int,
) -> dict:
    """Replace background with AI-generated scene. ~1–2 min per variant."""
    try:
        free_gpu_models(keep="bg_swap")
        img = _b64_to_pil(image_b64).convert("RGB")

        # ── Step 1: Segment subject (done once, shared across all variants) ──────
        session_type = "person" if subject_type == "Portrait / selfie" else "general"
        cutout, mask = segment_product(img, subject_type=session_type)
        # Wider feather for natural, non-razor edges
        soft_mask = feather_mask(mask, blur_radius=8)

        # ── Step 2: Depth map — use the FULL image (not masked) ─────────────────
        # Masking before depth extraction destroys scene structure context that
        # ControlNet needs to generate a plausible background perspective.
        depth_map = get_depth_map(img)

        style = STYLES.get(style_name)
        if not style:
            return {"success": False, "error": f"Unknown style: {style_name}"}

        # ── Step 3: Generate variants ────────────────────────────────────────────
        results = []
        n = max(1, min(int(num_variants), 4))
        for i in range(n):
            bg = generate_background(
                depth_map=depth_map,
                prompt=style["prompt"],
                negative_prompt=style["negative_prompt"],
                seed=42 + i,
            )
            tone_matched = harmonize_tone(cutout, mask, bg)
            composited = composite(tone_matched, soft_mask, bg)
            final = add_shadow(composited, mask)
            results.append(_pil_to_b64(final))

        return {"success": True, "images": results}
    except Exception as e:
        return {"success": False, "error": str(e)}



def api_style_filter(
    image_b64: str,
    style_name: str,
    strength: float,
) -> dict:
    """Style transfer (anime, oil painting, etc). ~30–60s."""
    try:
        free_gpu_models(keep="style")
        img = _b64_to_pil(image_b64).convert("RGB")
        style = STYLE_FILTERS.get(style_name)
        if not style:
            return {"success": False, "error": f"Unknown style: {style_name}"}
        result = apply_style(img, prompt=style["prompt"],
                             negative_prompt=style["negative_prompt"], strength=strength)
        return {"success": True, "image": _pil_to_b64(result)}
    except Exception as e:
        return {"success": False, "error": str(e)}


def api_remove_object(image_b64: str, mask_b64: str) -> dict:
    """AI object removal via inpainting. ~2–4 min."""
    try:
        free_gpu_models(keep="inpaint")
        img = _b64_to_pil(image_b64).convert("RGB")
        mask = _b64_to_pil(mask_b64).convert("L")
        result = remove_object(img, mask)
        return {"success": True, "image": _pil_to_b64(result)}
    except Exception as e:
        return {"success": False, "error": str(e)}


def api_outpaint(
    image_b64: str,
    direction: str,
    amount: int,
    prompt: str,
) -> dict:
    """Extend the canvas with AI-generated content. ~1–3 min."""
    try:
        free_gpu_models(keep="inpaint")
        img = _b64_to_pil(image_b64).convert("RGB")
        result = outpaint(img, direction=direction, amount=amount, prompt=prompt)
        return {"success": True, "image": _pil_to_b64(result)}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ═══════════════════════════════════════════════════════════════════════════════
# GENERATE — Text to Image
# ═══════════════════════════════════════════════════════════════════════════════

def api_text2img(
    prompt: str,
    negative_prompt: str,
    style: str,
    width: int,
    height: int,
    steps: int,
    seed: int,
    num_images: int,
) -> dict:
    """Text-to-image via SDXL-Turbo. ~8–12s per image on T4."""
    try:
        free_gpu_models(keep="t2i")
        images = generate_from_text(
            prompt=prompt, negative_prompt=negative_prompt, style=style,
            width=width, height=height, steps=steps,
            seed=seed if seed >= 0 else None,
            num_images=min(num_images, 4),
        )
        return {"success": True, "images": [_pil_to_b64(img) for img in images]}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ═══════════════════════════════════════════════════════════════════════════════
# METADATA — Return all presets to frontend
# ═══════════════════════════════════════════════════════════════════════════════

def api_get_presets() -> dict:
    return {
        "bg_styles": list(STYLES.keys()),
        "style_filters": list(STYLE_FILTERS.keys()),
        "color_grades": list(COLOR_GRADES.keys()),
        "t2i_styles": list(STYLE_PRESETS.keys()),
        "outpaint_directions": DIRECTIONS,
        "effect_types": [
            "hdr", "vignette", "grain", "chromatic",
            "bloom", "cross_process", "color_splash", "orton"
        ],
        "has_gpu": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU",
    }


# ═══════════════════════════════════════════════════════════════════════════════
# GRADIO APP — Each tab is an API endpoint
# ═══════════════════════════════════════════════════════════════════════════════

with gr.Blocks(title="SnapStudio AI — GPU Backend") as demo:
    gr.Markdown(
        "# 🎨 SnapStudio AI — Kaggle GPU Backend\n"
        "This is the API backend. Connect your Vercel frontend by pasting this page's URL.\n"
        "**Do not use this UI directly** — use the beautiful Vercel frontend instead."
    )

    with gr.Accordion("📡 API Endpoints", open=True):
        gr.Markdown(
            "All functions below are callable via the Gradio SSE API.\n"
            "The frontend uses `/call/<function_name>` POST + GET pattern."
        )

    # ── Metadata ──────────────────────────────────────────────────────────────
    with gr.Tab("Presets/Info"):
        p_out = gr.JSON(label="presets")
        gr.Button("Get Presets").click(api_get_presets, inputs=[], outputs=[p_out], api_name="api_get_presets")

    # ── Quick Edit ────────────────────────────────────────────────────────────
    with gr.Tab("Auto-Enhance"):
        ae_in = gr.Textbox(label="image_b64")
        ae_out = gr.JSON(label="result")
        gr.Button("Run").click(api_enhance, inputs=[ae_in], outputs=[ae_out], api_name="api_enhance")

    with gr.Tab("Color Grade"):
        cg_img = gr.Textbox(label="image_b64")
        cg_grade = gr.Textbox(label="grade_name", value="Cinematic — Teal & Orange")
        cg_intensity = gr.Number(label="intensity", value=1.0)
        cg_exposure = gr.Number(label="exposure", value=0.0)
        cg_contrast = gr.Number(label="contrast (-999=preset)", value=-999)
        cg_highlights = gr.Number(label="highlights (-999=preset)", value=-999)
        cg_shadows = gr.Number(label="shadows (-999=preset)", value=-999)
        cg_temperature = gr.Number(label="temperature (-999=preset)", value=-999)
        cg_saturation = gr.Number(label="saturation (-999=preset)", value=-999)
        cg_vibrance = gr.Number(label="vibrance", value=0.0)
        cg_vignette = gr.Number(label="vignette (-999=preset)", value=-999)
        cg_grain = gr.Number(label="grain (-999=preset)", value=-999)
        cg_out = gr.JSON(label="result")
        gr.Button("Run").click(api_color_grade,
            inputs=[cg_img, cg_grade, cg_intensity, cg_exposure, cg_contrast,
                    cg_highlights, cg_shadows, cg_temperature, cg_saturation,
                    cg_vibrance, cg_vignette, cg_grain],
            outputs=[cg_out], api_name="api_color_grade")

    with gr.Tab("Portrait Retouch"):
        rt_img = gr.Textbox(label="image_b64")
        rt_smooth = gr.Number(label="skin_smooth", value=0.5)
        rt_clarity = gr.Number(label="clarity", value=0.3)
        rt_sharpen = gr.Number(label="sharpen", value=0.4)
        rt_vibrance = gr.Number(label="vibrance", value=0.3)
        rt_shadow = gr.Number(label="shadow_lift", value=0.2)
        rt_teeth = gr.Number(label="teeth_whiten", value=0.0)
        rt_out = gr.JSON(label="result")
        gr.Button("Run").click(api_retouch,
            inputs=[rt_img, rt_smooth, rt_clarity, rt_sharpen, rt_vibrance, rt_shadow, rt_teeth],
            outputs=[rt_out], api_name="api_retouch")

    with gr.Tab("Denoise"):
        dn_img = gr.Textbox(label="image_b64")
        dn_strength = gr.Number(label="strength", value=0.5)
        dn_mode = gr.Textbox(label="mode (light/balanced/strong)", value="balanced")
        dn_color = gr.Checkbox(label="preserve_color", value=True)
        dn_out = gr.JSON(label="result")
        gr.Button("Run").click(api_denoise, inputs=[dn_img, dn_strength, dn_mode, dn_color], outputs=[dn_out], api_name="api_denoise")

    with gr.Tab("Effects"):
        ef_img = gr.Textbox(label="image_b64")
        ef_type = gr.Textbox(label="effect (hdr/vignette/grain/bloom/chromatic/cross_process/color_splash/orton)")
        ef_params = gr.JSON(label="params (JSON object)", value={"strength": 0.6})
        ef_out = gr.JSON(label="result")
        gr.Button("Run").click(api_effect, inputs=[ef_img, ef_type, ef_params], outputs=[ef_out], api_name="api_effect")

    # ── AI Enhance ────────────────────────────────────────────────────────────
    with gr.Tab("Upscale 4x"):
        up_img = gr.Textbox(label="image_b64")
        up_scale = gr.Number(label="scale (2 or 4)", value=4)
        up_out = gr.JSON(label="result")
        gr.Button("Run").click(api_upscale, inputs=[up_img, up_scale], outputs=[up_out], api_name="api_upscale")

    with gr.Tab("Face Enhance"):
        fe_img = gr.Textbox(label="image_b64")
        fe_sr = gr.Number(label="upscale_strength (0–1)", value=1.0)
        fe_rt = gr.Number(label="retouch_strength (0–1)", value=0.4)
        fe_out = gr.JSON(label="result")
        gr.Button("Run").click(api_face_enhance, inputs=[fe_img, fe_sr, fe_rt], outputs=[fe_out], api_name="api_face_enhance")

    with gr.Tab("Background Blur"):
        bb_img = gr.Textbox(label="image_b64")
        bb_amount = gr.Number(label="blur_amount (0–1)", value=0.6)
        bb_depth = gr.Checkbox(label="use_depth (better quality)", value=True)
        bb_subj = gr.Textbox(label="subject_type (general/person)", value="general")
        bb_out = gr.JSON(label="result")
        gr.Button("Run").click(api_bg_blur, inputs=[bb_img, bb_amount, bb_depth, bb_subj], outputs=[bb_out], api_name="api_bg_blur")

    # ── AI Transform ──────────────────────────────────────────────────────────
    with gr.Tab("Background Swap"):
        bs_img = gr.Textbox(label="image_b64")
        bs_subj = gr.Textbox(label="subject_type", value="Portrait / selfie")
        bs_style = gr.Textbox(label="style_name", value="Portrait - clean studio")
        bs_var = gr.Number(label="num_variants", value=1)
        bs_out = gr.JSON(label="result")
        gr.Button("Run").click(api_bg_swap, inputs=[bs_img, bs_subj, bs_style, bs_var], outputs=[bs_out], api_name="api_bg_swap")

    with gr.Tab("Style Filter"):
        sf_img = gr.Textbox(label="image_b64")
        sf_style = gr.Textbox(label="style_name", value="Anime")
        sf_str = gr.Number(label="strength", value=0.6)
        sf_out = gr.JSON(label="result")
        gr.Button("Run").click(api_style_filter, inputs=[sf_img, sf_style, sf_str], outputs=[sf_out], api_name="api_style_filter")

    with gr.Tab("Remove Object"):
        rm_img = gr.Textbox(label="image_b64")
        rm_mask = gr.Textbox(label="mask_b64")
        rm_out = gr.JSON(label="result")
        gr.Button("Run").click(api_remove_object, inputs=[rm_img, rm_mask], outputs=[rm_out], api_name="api_remove_object")

    with gr.Tab("Outpaint"):
        op_img = gr.Textbox(label="image_b64")
        op_dir = gr.Textbox(label="direction (right/left/top/bottom/all sides)", value="right")
        op_amt = gr.Number(label="amount (pixels)", value=256)
        op_prompt = gr.Textbox(label="prompt hint (optional)", value="")
        op_out = gr.JSON(label="result")
        gr.Button("Run").click(api_outpaint, inputs=[op_img, op_dir, op_amt, op_prompt], outputs=[op_out], api_name="api_outpaint")

    # ── Generate ──────────────────────────────────────────────────────────────
    with gr.Tab("Text → Image"):
        t2i_prompt = gr.Textbox(label="prompt")
        t2i_neg = gr.Textbox(label="negative_prompt", value="")
        t2i_style = gr.Textbox(label="style", value="Photorealistic")
        t2i_w = gr.Number(label="width", value=512)
        t2i_h = gr.Number(label="height", value=512)
        t2i_steps = gr.Number(label="steps", value=4)
        t2i_seed = gr.Number(label="seed (-1 = random)", value=-1)
        t2i_n = gr.Number(label="num_images (1–4)", value=1)
        t2i_out = gr.JSON(label="result")
        gr.Button("Generate").click(api_text2img,
            inputs=[t2i_prompt, t2i_neg, t2i_style, t2i_w, t2i_h, t2i_steps, t2i_seed, t2i_n],
            outputs=[t2i_out], api_name="api_text2img")


if __name__ == "__main__":
    demo.queue(max_size=20)  # enable job queue so concurrent requests don't fail
    demo.launch(
        server_name="0.0.0.0",   # bind to all interfaces — required on Kaggle
        server_port=7860,
        share=True,              # generates *.gradio.live public URL
        show_error=True,
        debug=False,
        show_api=True,           # expose /docs API reference page
        allowed_paths=[],
    )
