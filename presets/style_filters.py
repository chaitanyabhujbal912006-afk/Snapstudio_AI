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
            "vibrant purple and cyan tones, high contrast, digital art, highly detailed"
        ),
        "negative_prompt": "photorealistic, blurry, distorted, extra limbs, text, watermark, dull colors",
    },
    "Pixar 3D": {
        "prompt": (
            "3D animated movie character style, Pixar render, sub-surface scattering, "
            "cute expressive features, soft studio lighting, octane render, 8k resolution"
        ),
        "negative_prompt": "ugly, deformed, photorealistic photo, noise, grain, low quality",
    },
    "Studio Ghibli": {
        "prompt": (
            "Studio Ghibli anime style, hand-drawn anime aesthetic, beautiful painted background, "
            "Hayao Miyazaki artwork, whimsical colors, soft natural lighting"
        ),
        "negative_prompt": "3d render, photorealistic, harsh shadows, noise, grainy, low quality",
    },
    "Comic Pop-Art": {
        "prompt": (
            "vintage comic book art style, Roy Lichtenstein pop art, half-tone dots, "
            "bold black outlines, vibrant primary colors, graphic novel style"
        ),
        "negative_prompt": "blurry, photorealistic, smooth gradients, 3d render, watermark",
    },
    "Retro 80s Film": {
        "prompt": (
            "80s retro synthwave style, golden hour film grain, nostalgic warm hues, "
            "vintage polaroid film aesthetic, dramatic backlight, analog photo"
        ),
        "negative_prompt": "oversaturated digital, modern 3d, video game, anime",
    },
    "Pencil Sketch": {
        "prompt": (
            "fine graphite pencil sketch, cross-hatching detail, hand-drawn artwork, "
            "monochrome portrait drawing on textured paper"
        ),
        "negative_prompt": "color, digital render, photorealistic photo, saturated, 3d",
    },
}

