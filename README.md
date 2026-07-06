# SnapStudio AI 🎨

**AI-powered photo editing — custom frontend on Vercel, GPU backend on Kaggle.**

Upload a photo and get studio-quality results instantly: auto-enhance, swap backgrounds, apply art styles, or remove objects — all powered by free GPU on Kaggle.

---

## ✨ Features

| Mode | What it does | Speed |
|---|---|---|
| ✨ Auto-Enhance | Fixes lighting, color, contrast & sharpness | ~1–2 sec |
| 🖼️ Background Swap | Replaces background with AI-generated scene | ~1–2 min |
| 🎨 Style Filter | Transforms photo into anime, painting, etc. | ~30–60 sec |
| 🧹 Object Removal | Paint over anything to erase it | ~2–4 min |

---

## 🏗️ Architecture

```
[User Browser]
     ↓  visits
[Vercel Frontend] ─── HTML/CSS/JS, always-on, free
     ↓  API calls to
[Kaggle GPU Backend] ─── Python + Gradio, free GPU T4
     ↓  runs
[AI Pipeline] ─── Stable Diffusion, ControlNet, LCM-LoRA
```

- **Frontend** (`/frontend/`): Pure HTML + CSS + JS. Deployed to Vercel for free. Always online.
- **Backend** (`kaggle_notebook.ipynb`): Python + Gradio app with the full AI pipeline. Run on Kaggle's free GPU. Exposes a public `*.gradio.live` URL.
- You connect them by pasting the backend URL into the frontend's input box.

---

## 🚀 Quick Start

### 1. Start the Backend (Kaggle GPU)
1. Go to [kaggle.com](https://kaggle.com) → **Create → New Notebook**
2. Upload `kaggle_notebook.ipynb` via **File → Import Notebook**
3. Sidebar: **Accelerator → GPU T4 x2**, **Internet → ON**
4. **Run All** → wait for output like:
   ```
   Running on public URL: https://xxxxxxxx.gradio.live
   ```
5. Copy that URL

### 2. Open the Frontend (Vercel)
1. Visit your Vercel deployment URL
2. Paste the `*.gradio.live` URL into the **Backend URL** box at the top
3. Click **Connect** → upload a photo → pick a tab → go!

### 3. (One-time) Deploy Frontend to Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New Project → Import Git Repository**
2. Select `chaitanyabhujbal912006-afk/Snapstudio_AI`
3. Set **Root Directory** to `frontend`
4. Click **Deploy** — done!

---

## 📁 Project Structure

```
Snapstudio_AI/
├── frontend/                  # 🖥️ Vercel static frontend
│   ├── index.html             # Main app UI
│   ├── style.css              # Styles
│   └── app.js                 # API calls & UI logic
│
├── pipeline/                  # ⚙️ AI pipeline modules (used by backend)
│   ├── enhance.py             # Auto-enhance (OpenCV, no AI model)
│   ├── segment.py             # Subject segmentation (rembg)
│   ├── depth_edges.py         # Depth map extraction
│   ├── generate_bg.py         # Background generation (SD + ControlNet)
│   ├── composite.py           # Compositing subject onto background
│   ├── harmonize.py           # Shadow & tone harmonization
│   ├── style_filter.py        # Style transfer (SD img2img + LCM-LoRA)
│   └── inpaint.py             # Object removal (SD inpainting)
│
├── presets/
│   ├── styles.py              # Background style prompt templates
│   └── style_filters.py       # Art style prompt templates
│
├── kaggle_notebook.ipynb      # 🏃 Run this on Kaggle for the GPU backend
├── app.py                     # (Legacy) Gradio-only app for HF Spaces
└── requirements.txt           # Python dependencies
```

---

## ⚠️ Limitations

- **Kaggle sessions last ~9–12 hours max** — you'll need to restart the notebook and paste a new backend URL when it expires.
- The `*.gradio.live` link changes every time you restart — this is expected.
- This setup is ideal for **demos and testing**, not for an always-on production app.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript (vanilla) |
| Hosting | Vercel (free tier) |
| Backend | Python, Gradio, FastAPI |
| GPU Compute | Kaggle (free T4 GPU) |
| AI Models | Stable Diffusion 1.5, ControlNet Depth, LCM-LoRA, SD Inpainting |
| Image Processing | OpenCV, PIL, rembg |

---

## 📄 License

MIT