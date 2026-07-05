"""
Main entrypoint. This is the file Hugging Face Spaces runs.
Wraps the full pipeline: segment -> depth/edge -> generate background ->
composite -> harmonize -> return gallery of results.
"""

import os
# Limit threads to match Hugging Face CPU Space allocation and avoid host CPU context-switching deadlocks.
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
from presets.styles import STYLES


try:
    import spaces
    has_spaces = True
except ImportError:
    has_spaces = False


def run_pipeline(image: Image.Image, style_name: str, num_variants: int = 3):
    if image is None:
        raise gr.Error("Please upload a product photo first.")

    image = image.convert("RGB")

    # Step 1: segment the product (CPU)
    cutout, mask = segment_product(image)
    soft_mask = feather_mask(mask, blur_radius=3)

    # Step 2: extract depth map for structure-consistent generation (CPU)
    depth_map = get_depth_map(image)

    style = STYLES[style_name]

    results = []
    for i in range(num_variants):
        # Step 3: generate the new background (GPU)
        background = generate_background(
            depth_map=depth_map,
            prompt=style["prompt"],
            negative_prompt=style["negative_prompt"],
            seed=42 + i,  # different seed per variant for variety
        )

        # Step 4: composite the untouched product back on top (CPU)
        composited = composite(cutout, soft_mask, background)

        # Step 5: harmonize -- add a soft shadow so it doesn't look pasted (CPU)
        final = add_shadow(composited, mask)

        results.append(final)

    return results


if has_spaces:
    @spaces.GPU(duration=60)
    def process(image: Image.Image, style_name: str, num_variants: int = 3):
        return run_pipeline(image, style_name, num_variants)
else:
    def process(image: Image.Image, style_name: str, num_variants: int = 3):
        return run_pipeline(image, style_name, num_variants)


with gr.Blocks(title="SnapStudio AI") as demo:
    gr.Markdown(
        "# SnapStudio AI\n"
        "Upload one raw product photo. Get studio-quality shots back — "
        "same product, new background, automatically."
    )

    with gr.Row():
        with gr.Column():
            input_image = gr.Image(type="pil", label="Upload product photo")
            style_dropdown = gr.Dropdown(
                choices=list(STYLES.keys()),
                value="Studio - white sweep",
                label="Style",
            )
            num_variants = gr.Slider(1, 4, value=1, step=1, label="Number of variants")
            generate_btn = gr.Button("Generate", variant="primary")
            gr.Markdown(
                "_Runs on free CPU hosting -- each variant takes roughly 1-2 minutes to generate. "
                "Please be patient on the first run while the models download._"
            )

        with gr.Column():
            output_gallery = gr.Gallery(label="Results", columns=2)

    generate_btn.click(
        fn=process,
        inputs=[input_image, style_dropdown, num_variants],
        outputs=output_gallery,
    )

if __name__ == "__main__":
    demo.launch()
