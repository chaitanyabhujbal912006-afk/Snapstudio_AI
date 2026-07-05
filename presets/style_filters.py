"""
Prompt templates for Style Filter mode (whole-image transformation).
Different from styles.py, which describes backgrounds/scenes for
Background Swap mode -- these describe an overall artistic look applied
to the entire photo.
"""

STYLE_FILTERS = {
    "Anime": {
        "prompt": (
            "anime style illustration, vibrant colors, clean line art, "
            "cel shading, detailed anime portrait, studio quality"
        ),
        "negative_prompt": "photorealistic, blurry, distorted, extra limbs, text, watermark",
    },
    "Cartoon": {
        "prompt": (
            "cartoon style illustration, bold outlines, flat colors, "
            "playful and expressive, high quality cartoon art"
        ),
        "negative_prompt": "photorealistic, blurry, distorted, extra limbs, text, watermark",
    },
    "Oil painting": {
        "prompt": (
            "oil painting, visible brush strokes, rich textured colors, "
            "classical fine art portrait style, high detail"
        ),
        "negative_prompt": "photorealistic, blurry, distorted, extra limbs, text, watermark",
    },
    "Watercolor": {
        "prompt": (
            "watercolor painting, soft flowing colors, delicate paper texture, "
            "artistic and dreamy, hand-painted style"
        ),
        "negative_prompt": "photorealistic, blurry, distorted, extra limbs, text, watermark",
    },
    "Cyberpunk": {
        "prompt": (
            "cyberpunk style, neon lighting, futuristic aesthetic, "
            "vibrant purple and blue tones, high contrast, digital art"
        ),
        "negative_prompt": "photorealistic, blurry, distorted, extra limbs, text, watermark, dull colors",
    },
}
