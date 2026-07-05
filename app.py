"""
Main entrypoint. This is the file Hugging Face Spaces runs.
Multi-mode AI photo editor:
  Tab 1 — Auto-Enhance (fast, pure image processing)
  Tab 2 — Background Swap (Stable Diffusion + ControlNet, portrait or product)
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

import gradio as gr
from PIL import Image

from pipeline.segment import segment_product, feather_mask
from pipeline.depth_edges import get_depth_map
from pipeline.generate_bg import generate_background
from pipeline.composite import composite
from pipeline.harmonize import add_shadow
from pipeline.enhance import auto_enhance
from presets.styles import STYLES


try:
    import spaces
    has_spaces = True
except ImportError:
    has_spaces = False


def process_enhance(image: Image.Image):
    if image is None:
        raise gr.Error("Please upload a photo first.")
    return auto_enhance(image)


def _run_bg_swap(image: Image.Image, subject_type: str, style_name: str, num_variants: int = 1):
    if image is None:
        raise gr.Error("Please upload a photo first.")

    image = image.convert("RGB")

    # Step 1: segment the subject -- person model for portraits, general for products
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
            seed=42 + i,
        )

        # Step 4: composite the untouched subject back on top (CPU)
        composited = composite(cutout, soft_mask, background)

        # Step 5: add a soft shadow so it doesn't look pasted (CPU)
        final = add_shadow(composited, mask)

        results.append(final)

    return results


if has_spaces:
    @spaces.GPU(duration=120)
    def process_bg_swap(image: Image.Image, subject_type: str, style_name: str, num_variants: int = 1):
        return _run_bg_swap(image, subject_type, style_name, num_variants)
else:
    def process_bg_swap(image: Image.Image, subject_type: str, style_name: str, num_variants: int = 1):
        return _run_bg_swap(image, subject_type, style_name, num_variants)


with gr.Blocks(title="SnapStudio AI") as demo:
    gr.Markdown(
        "# SnapStudio AI\n"
        "Pick a mode below, upload a photo, and get an AI-enhanced result back."
    )

    with gr.Tabs():
        with gr.Tab("✨ Auto-Enhance"):
            gr.Markdown("_Fast (1-2 seconds) — fixes lighting, color, and sharpness automatically._")
            with gr.Row():
                enhance_input = gr.Image(type="pil", label="Upload photo")
                enhance_output = gr.Image(type="pil", label="Enhanced result")
            enhance_btn = gr.Button("Enhance", variant="primary")
            enhance_btn.click(fn=process_enhance, inputs=[enhance_input], outputs=[enhance_output])

        with gr.Tab("🖼️ Background Swap"):
            gr.Markdown(
                "_Runs on free CPU hosting — each variant takes roughly 1-2 minutes. "
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
