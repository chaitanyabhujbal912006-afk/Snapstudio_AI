"""
Main entrypoint. This is the file Hugging Face Spaces runs.
Wraps the full pipeline: segment -> depth/edge -> generate background ->
composite -> harmonize -> return gallery of results.
"""

import os
# Limit threads to match Hugging Face CPU Space allocation (2 vCPU)
# and avoid host CPU context-switching deadlocks during inference.
os.environ["OMP_NUM_THREADS"] = "2"
os.environ["MKL_NUM_THREADS"] = "2"
os.environ["OPENBLAS_NUM_THREADS"] = "2"
os.environ["VECLIB_MAXIMUM_THREADS"] = "2"
os.environ["NUMEXPR_NUM_THREADS"] = "2"

import torch
torch.set_num_threads(2)

import gc
import gradio as gr
from PIL import Image

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

try:
    import spaces
    has_spaces = True
except ImportError:
    has_spaces = False


def free_unused_models(active_mode: str):
    """
    Frees memory for models that aren't the currently active mode.
    This prevents OOM crashes on the free CPU-Basic tier by ensuring
    only one large diffusion model is in memory at a time.
    """
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


# ── Auto-Enhance ──────────────────────────────────────────────────────────────

def process_enhance(image: Image.Image):
    if image is None:
        raise gr.Error("Please upload a photo first.")
    return auto_enhance(image)


# ── Remove Object ─────────────────────────────────────────────────────────────

def _run_remove_object(editor_value: dict, progress=gr.Progress(track_tqdm=True)):
    if editor_value is None or editor_value.get("background") is None:
        raise gr.Error("Please upload a photo first.")
        
    free_unused_models("inpaint")

    background = editor_value["background"]
    layers = editor_value.get("layers", [])

    if not layers:
        raise gr.Error("Please paint over the object you want to remove.")

    # The user's brush strokes live in the layer's alpha channel -- combine
    # all layers into one mask (white = painted = "remove this").
    mask = Image.new("L", background.size, 0)
    for layer in layers:
        layer_alpha = layer.split()[-1]  # alpha channel of this brush layer
        mask = Image.composite(Image.new("L", background.size, 255), mask, layer_alpha)

    return remove_object(background, mask)


if has_spaces:
    @spaces.GPU(duration=240)
    def process_remove_object(editor_value: dict, progress=gr.Progress(track_tqdm=True)):
        return _run_remove_object(editor_value, progress)
else:
    def process_remove_object(editor_value: dict, progress=gr.Progress(track_tqdm=True)):
        return _run_remove_object(editor_value, progress)


# ── Style Filter ──────────────────────────────────────────────────────────────

def _run_style_filter(image: Image.Image, style_name: str, strength: float, progress=gr.Progress(track_tqdm=True)):
    if image is None:
        raise gr.Error("Please upload a photo first.")
        
    free_unused_models("style")
        
    style = STYLE_FILTERS[style_name]
    return apply_style(
        image=image,
        prompt=style["prompt"],
        negative_prompt=style["negative_prompt"],
        strength=strength,
    )


if has_spaces:
    @spaces.GPU(duration=120)
    def process_style_filter(image: Image.Image, style_name: str, strength: float, progress=gr.Progress(track_tqdm=True)):
        return _run_style_filter(image, style_name, strength, progress)
else:
    def process_style_filter(image: Image.Image, style_name: str, strength: float, progress=gr.Progress(track_tqdm=True)):
        return _run_style_filter(image, style_name, strength, progress)


# ── Background Swap ───────────────────────────────────────────────────────────

def _run_bg_swap(image: Image.Image, subject_type: str, style_name: str, num_variants: int = 1, progress=gr.Progress(track_tqdm=True)):
    if image is None:
        raise gr.Error("Please upload a product photo first.")
        
    free_unused_models("bg_swap")

    image = image.convert("RGB")

    # Step 1: segment the subject (CPU) -- "person" model for portraits, "general" for products
    session_type = "person" if subject_type == "Portrait / selfie" else "general"
    cutout, mask = segment_product(image, subject_type=session_type)
    soft_mask = feather_mask(mask, blur_radius=3)

    # Step 2: extract depth map for structure-consistent generation (CPU)
    depth_map = get_depth_map(image)
    # Mask depth map with soft mask so old background shapes don't bleed into generation
    depth_map = Image.composite(depth_map, Image.new("L", depth_map.size, 0), soft_mask)

    style = STYLES[style_name]

    results = []
    for i in range(num_variants):
        # Step 3: generate the new background
        background = generate_background(
            depth_map=depth_map,
            prompt=style["prompt"],
            negative_prompt=style["negative_prompt"],
            seed=42 + i,  # different seed per variant for variety
        )

        # Step 3.5: color-match the product to the new background's tone,
        # before compositing -- this is what stops it looking "pasted on"
        tone_matched_cutout = harmonize_tone(cutout, mask, background)

        # Step 4: composite the tone-matched product back on top (CPU)
        composited = composite(tone_matched_cutout, soft_mask, background)

        # Step 5: harmonize -- add a soft shadow so it doesn't look pasted (CPU)
        final = add_shadow(composited, mask)

        results.append(final)

    return results


if has_spaces:
    @spaces.GPU(duration=180)
    def process_bg_swap(image: Image.Image, subject_type: str, style_name: str, num_variants: int = 1, progress=gr.Progress(track_tqdm=True)):
        return _run_bg_swap(image, subject_type, style_name, num_variants, progress)
else:
    def process_bg_swap(image: Image.Image, subject_type: str, style_name: str, num_variants: int = 1, progress=gr.Progress(track_tqdm=True)):
        return _run_bg_swap(image, subject_type, style_name, num_variants, progress)


# ── UI ────────────────────────────────────────────────────────────────────────

with gr.Blocks(title="SnapStudio AI") as demo:
    gr.Markdown(
        "# SnapStudio AI\n"
        "Pick a mode below, upload a photo, and get an AI-enhanced result back."
    )

    with gr.Tabs():
        with gr.Tab("✨ Auto-Enhance"):
            gr.Markdown("_Fast (1-2 seconds) -- fixes lighting, color, and sharpness automatically._")
            with gr.Row():
                enhance_input = gr.Image(type="pil", label="Upload photo")
                enhance_output = gr.Image(type="pil", label="Enhanced result")
            enhance_btn = gr.Button("Enhance", variant="primary")
            enhance_btn.click(fn=process_enhance, inputs=[enhance_input], outputs=[enhance_output])

        with gr.Tab("🧹 Remove Object"):
            gr.Markdown(
                "_Paint over what you want removed with the brush tool. "
                "**Slower than other modes** -- roughly 2-4 minutes, since object "
                "removal needs a different model that isn't compatible with our speed trick._"
            )
            with gr.Row():
                with gr.Column():
                    remove_editor = gr.ImageEditor(
                        type="pil",
                        label="Upload photo, then paint over the object to remove",
                        brush=gr.Brush(colors=["#ffffff"], default_size=25),
                    )
                    remove_btn = gr.Button("Remove", variant="primary")
                with gr.Column():
                    remove_output = gr.Image(type="pil", label="Result")
            remove_btn.click(
                fn=process_remove_object,
                inputs=[remove_editor],
                outputs=remove_output,
            )

        with gr.Tab("🎨 Style Filter"):
            gr.Markdown(
                "_Turn your photo into anime, cartoon, painting, and more. "
                "Runs on free CPU -- roughly 30-60s per result._"
            )
            with gr.Row():
                with gr.Column():
                    style_filter_input = gr.Image(type="pil", label="Upload photo")
                    style_filter_dropdown = gr.Dropdown(
                        choices=list(STYLE_FILTERS.keys()),
                        value="Anime",
                        label="Style",
                    )
                    strength_slider = gr.Slider(
                        0.3, 0.9, value=0.6, step=0.05,
                        label="Transformation strength",
                        info="Low = subtle, keeps original photo recognizable. High = dramatic restyle.",
                    )
                    style_filter_btn = gr.Button("Transform", variant="primary")
                with gr.Column():
                    style_filter_output = gr.Image(type="pil", label="Result")
            style_filter_btn.click(
                fn=process_style_filter,
                inputs=[style_filter_input, style_filter_dropdown, strength_slider],
                outputs=style_filter_output,
            )

        with gr.Tab("🖼️ Background Swap"):
            gr.Markdown(
                "_Runs on free CPU hosting -- each variant takes roughly 1-2 minutes. "
                "Please be patient, especially on the first run while models download._"
            )
            with gr.Row():
                with gr.Column():
                    bg_input = gr.Image(type="pil", label="Upload photo")
                    subject_type = gr.Radio(
                        choices=["Portrait / selfie", "Product / object"],
                        value="Portrait / selfie",
                        label="What's in the photo?",
                    )
                    style_dropdown = gr.Dropdown(
                        choices=[k for k in STYLES if k.startswith("Portrait")],
                        value="Portrait - clean studio",
                        label="Style",
                    )
                    num_variants = gr.Slider(1, 4, value=1, step=1, label="Number of variants")
                    bg_btn = gr.Button("Generate", variant="primary")

                    def _update_style_choices(subject):
                        if subject == "Portrait / selfie":
                            choices = [k for k in STYLES if k.startswith("Portrait")]
                        else:
                            choices = [k for k in STYLES if not k.startswith("Portrait")]
                        return gr.update(choices=choices, value=choices[0])

                    subject_type.change(
                        fn=_update_style_choices,
                        inputs=[subject_type],
                        outputs=[style_dropdown],
                    )
                with gr.Column():
                    bg_output = gr.Gallery(label="Results", columns=2)
            bg_btn.click(
                fn=process_bg_swap,
                inputs=[bg_input, subject_type, style_dropdown, num_variants],
                outputs=bg_output,
            )

if __name__ == "__main__":
    demo.launch()
