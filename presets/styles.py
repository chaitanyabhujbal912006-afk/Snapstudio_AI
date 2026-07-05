"""
Prompt templates for each background style.
Add more styles here later -- this is the easiest place to expand variety
without touching any pipeline code.
"""

STYLES = {
    "Studio - white sweep": {
        "prompt": (
            "professional product photography, seamless white studio background, "
            "soft even studio lighting, subtle shadow, high detail, commercial photo"
        ),
        "negative_prompt": "cluttered, busy background, text, watermark, blurry, distorted",
    },
    "Studio - marble surface": {
        "prompt": (
            "product photography on a clean white marble surface, soft natural light, "
            "minimal shadow, high-end commercial product shot, high detail"
        ),
        "negative_prompt": "cluttered, busy background, text, watermark, blurry, distorted",
    },
    "Lifestyle - kitchen counter": {
        "prompt": (
            "product placed on a modern kitchen counter, warm natural daylight, "
            "soft blurred background, lifestyle product photography, high detail"
        ),
        "negative_prompt": "cluttered, busy background, text, watermark, blurry, distorted, extra objects",
    },
    "Lifestyle - outdoor table": {
        "prompt": (
            "product on a wooden outdoor table, soft golden hour sunlight, "
            "blurred natural background, lifestyle product photography"
        ),
        "negative_prompt": "cluttered, busy background, text, watermark, blurry, distorted, extra objects",
    },
    "Portrait - city bokeh": {
        "prompt": (
            "blurred city street background at dusk, warm bokeh lights, "
            "professional portrait photography backdrop, soft depth of field, high detail"
        ),
        "negative_prompt": "cluttered, extra people, text, watermark, blurry face, distorted, extra limbs",
    },
    "Portrait - clean studio": {
        "prompt": (
            "seamless soft gray studio backdrop, professional portrait lighting, "
            "soft shadow, high-end headshot photography background"
        ),
        "negative_prompt": "cluttered, extra people, text, watermark, blurry face, distorted, extra limbs",
    },
    "Portrait - golden hour outdoor": {
        "prompt": (
            "outdoor golden hour background, warm sunlight, soft blurred natural scenery, "
            "professional portrait photography backdrop, soft depth of field"
        ),
        "negative_prompt": "cluttered, extra people, text, watermark, blurry face, distorted, extra limbs",
    },
}
