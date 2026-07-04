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
}
