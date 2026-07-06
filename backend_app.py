from pipeline.segment import segment_product, feather_mask
from pipeline.depth_edges import get_depth_map
from pipeline.generate_bg import generate_background
from pipeline.composite import composite
from pipeline.harmonize import add_shadow, harmonize_tone
from pipeline.enhance import auto_enhance
from pipeline.style_filter import apply_style
from pipeline.inpaint import remove_object
from presets.styles import STYLES
from presets.style_filters import STYLE_FILTERS

import pipeline.inpaint as inpaint_mod
import pipeline.style_filter as style_filter_mod
import pipeline.generate_bg as bg_mod

import gc
import io
import base64
import gradio as gr
from PIL import Image


def free_unused_models(active_mode: str):
    cleared = False
    if active_mode != "bg_swap" and bg_mod._pipe is not None:
        bg_mod._pipe = None
        cleared = True
    if active_mode != "inpaint" and inpaint_mod._pipe is not None:
        inpaint_mod._pipe = None
        cleared = True
    if active_mode != "style" and style_filter_mod._pipe is not None:
        style_filter_mod._pipe = None
        cleared = True
    if cleared:
        gc.collect()


# ── Helper: PIL Image → base64 data URI ────────────────────────────────────────

def pil_to_b64(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def b64_to_pil(data_uri: str) -> Image.Image:
    header, data = data_uri.split(",", 1)
    return Image.open(io.BytesIO(base64.b64decode(data)))


# ── Endpoint functions ─────────────────────────────────────────────────────────

def api_enhance(image_b64: str) -> dict:
    try:
        img = b64_to_pil(image_b64).convert("RGB")
        result = auto_enhance(img)
        return {"success": True, "image": pil_to_b64(result)}
    except Exception as e:
        return {"success": False, "error": str(e)}


def api_style_filter(image_b64: str, style_name: str, strength: float) -> dict:
    try:
        img = b64_to_pil(image_b64).convert("RGB")
        free_unused_models("style")
        style = STYLE_FILTERS.get(style_name)
        if style is None:
            return {"success": False, "error": f"Unknown style: {style_name}"}
        result = apply_style(
            image=img,
            prompt=style["prompt"],
            negative_prompt=style["negative_prompt"],
            strength=float(strength),
        )
        return {"success": True, "image": pil_to_b64(result)}
    except Exception as e:
        return {"success": False, "error": str(e)}


def api_bg_swap(image_b64: str, subject_type: str, style_name: str, num_variants: int) -> dict:
    try:
        img = b64_to_pil(image_b64).convert("RGB")
        free_unused_models("bg_swap")

        session_type = "person" if subject_type == "Portrait / selfie" else "general"
        cutout, mask = segment_product(img, subject_type=session_type)
        soft_mask = feather_mask(mask, blur_radius=3)
        depth_map = get_depth_map(img)
        depth_map = Image.composite(depth_map, Image.new("L", depth_map.size, 0), soft_mask)

        style = STYLES.get(style_name)
        if style is None:
            return {"success": False, "error": f"Unknown style: {style_name}"}

        results = []
        for i in range(max(1, min(int(num_variants), 4))):
            background = generate_background(
                depth_map=depth_map,
                prompt=style["prompt"],
                negative_prompt=style["negative_prompt"],
                seed=42 + i,
            )
            tone_matched_cutout = harmonize_tone(cutout, mask, background)
            composited = composite(tone_matched_cutout, soft_mask, background)
            final = add_shadow(composited, mask)
            results.append(pil_to_b64(final))

        return {"success": True, "images": results}
    except Exception as e:
        return {"success": False, "error": str(e)}


def api_remove_object(image_b64: str, mask_b64: str) -> dict:
    try:
        img = b64_to_pil(image_b64).convert("RGB")
        mask = b64_to_pil(mask_b64).convert("L")
        free_unused_models("inpaint")
        result = remove_object(img, mask)
        return {"success": True, "image": pil_to_b64(result)}
    except Exception as e:
        return {"success": False, "error": str(e)}


def api_get_presets() -> dict:
    return {
        "styles": list(STYLES.keys()),
        "style_filters": list(STYLE_FILTERS.keys()),
    }


# ── Gradio API App ─────────────────────────────────────────────────────────────

with gr.Blocks() as demo:
    gr.Markdown("# SnapStudio AI — Kaggle GPU Backend\n"
                "This is the API backend. Use the Vercel frontend to interact with it.")

    # Expose endpoints as Gradio API routes so the frontend can call them
    with gr.Tab("Auto-Enhance"):
        enhance_in = gr.Textbox(label="image_b64")
        enhance_out = gr.JSON(label="result")
        gr.Button("Run").click(api_enhance, inputs=[enhance_in], outputs=[enhance_out])

    with gr.Tab("Style Filter"):
        sf_img = gr.Textbox(label="image_b64")
        sf_style = gr.Textbox(label="style_name", value="Anime")
        sf_strength = gr.Number(label="strength", value=0.6)
        sf_out = gr.JSON(label="result")
        gr.Button("Run").click(api_style_filter, inputs=[sf_img, sf_style, sf_strength], outputs=[sf_out])

    with gr.Tab("Background Swap"):
        bg_img = gr.Textbox(label="image_b64")
        bg_subj = gr.Textbox(label="subject_type", value="Portrait / selfie")
        bg_style = gr.Textbox(label="style_name", value="Portrait - clean studio")
        bg_variants = gr.Number(label="num_variants", value=1)
        bg_out = gr.JSON(label="result")
        gr.Button("Run").click(api_bg_swap, inputs=[bg_img, bg_subj, bg_style, bg_variants], outputs=[bg_out])

    with gr.Tab("Remove Object"):
        rm_img = gr.Textbox(label="image_b64")
        rm_mask = gr.Textbox(label="mask_b64")
        rm_out = gr.JSON(label="result")
        gr.Button("Run").click(api_remove_object, inputs=[rm_img, rm_mask], outputs=[rm_out])

    with gr.Tab("Presets"):
        presets_out = gr.JSON(label="presets")
        gr.Button("Get Presets").click(api_get_presets, inputs=[], outputs=[presets_out])


if __name__ == "__main__":
    demo.launch(share=True)
