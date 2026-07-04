---
title: SnapStudio AI
emoji: 📸
colorFrom: purple
colorTo: blue
sdk: gradio
sdk_version: 4.44.0
app_file: app.py
pinned: false
---

# SnapStudio AI

Upload one raw product photo, get studio-quality shots back — same product,
new background, generated automatically.

## How it works

1. The product is segmented out of your photo (background removed).
2. A depth map is extracted so the new scene matches the original perspective.
3. A new background is generated (Stable Diffusion + ControlNet).
4. Your original, untouched product is composited back on top — so logos,
   colors, and shape never change.
5. A soft shadow is added so the result looks real, not pasted.

Runs entirely on free/open-source models and Hugging Face's free ZeroGPU tier.

## Local development

```bash
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Then open the local URL Gradio prints in your terminal.
