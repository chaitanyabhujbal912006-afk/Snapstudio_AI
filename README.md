# SnapStudio AI 🎨

**AI-powered photo editing — Next.js frontend on Vercel, GPU backend on Kaggle.**

Upload a photo and get studio-quality results instantly: auto-enhance, swap backgrounds, apply art styles, remove objects, or generate from text — all powered by free GPU on Kaggle.

---

## ✨ Features

| Mode | What it does | Speed |
|---|---|---|
| 🎛️ Canvas Studio | Real-time brightness, contrast, crop, rotate, vignette (0ms) | Instant |
| ✨ Auto-Enhance | Fixes lighting, color, contrast, exposure & sharpness | ~0.5s |
| 🎨 Color Grade | LUT curves, split-tone, professional color presets | ~0.5s |
| 🎭 Portrait Retouch | Skin smoothing, clarity, vibrance, shadow lift | ~0.2s |
| 🌪️ Denoise | NLM / bilateral noise reduction | ~1s |
| 🌟 Creative Effects | HDR, vignette, film grain, bloom, tilt-shift, etc. | ~0.5s |
| 💡 Studio Relight | AI relighting with 8 presets & 360° light direction | ~1s |
| 🖼️ Background Swap | Replaces background with AI-generated scene or custom prompt | ~1–2 min |
| 🎨 Style Filter | Anime, Ghibli, Pixar 3D, Cyberpunk 2077, Oil Painting + more | ~30–60s |
| 🧹 Object Eraser | Paint over anything to erase or replace with AI | ~2–4 min |
| 🔍 Upscale | 2× or 4× AI super-resolution (Swin2SR) | ~15–60s |
| 👤 Face Enhance | Face detection + super-resolution + retouching | ~10–30s |
| 📸 Bokeh Blur | Depth-guided background blur (MiDaS) | ~5–15s |
| 🖌️ Outpaint | Extend the canvas in any direction with AI | ~2–4 min |
| 🖼️ Text-to-Image | Generate images from a text prompt (SDXL-Turbo) | ~10–20s |

---

## 🏗️ Architecture

```
[User Browser]
     ↓  visits
[Vercel Frontend] ─── Next.js App Router, always-on, free
     ↓  API calls via server-side proxy (/api/proxy)
[Kaggle GPU Backend] ─── Python + Gradio, free GPU T4
     ↓  runs
[AI Pipeline] ─── Stable Diffusion, ControlNet, LCM-LoRA, Swin2SR
```

- **Frontend** (`/frontend/`): Next.js (App Router). Deployed to Vercel for free. All backend calls go through a server-side proxy route to avoid CORS.
- **Backend** (`kaggle_notebook.ipynb`): Python + Gradio app with the full AI pipeline. Run on Kaggle's free GPU. Exposes a public `*.gradio.live` URL.
- You connect them by pasting the backend URL into the frontend's input box.

---

## 🚀 Quick Start

### 1. Start the Backend (Kaggle GPU)

> 📄 See the full guide: [KAGGLER_INSTRUCTIONS.md](./KAGGLER_INSTRUCTIONS.md)

**Step 1 — Create & configure a Kaggle Notebook**
1. Go to [kaggle.com](https://kaggle.com) → **Create → New Notebook**
2. In the right sidebar, expand **Notebook options** → set **Accelerator** to **GPU T4 x2**
3. Toggle **Internet → ON** (required to download models and sync the repo)

**Step 2 — Add Cell 1: Clone / Sync the repo**

Paste the following into the first notebook cell and run it:

```python
import os, subprocess, sys
REPO_URL = 'https://github.com/chaitanyabhujbal912006-afk/Snapstudio_AI.git'
REPO_DIR = '/kaggle/working/snapstudio'

if not os.path.exists(REPO_DIR):
    subprocess.check_call(['git', 'clone', REPO_URL, REPO_DIR, '--depth=1'])
    print('✅ Repository cloned successfully!')
else:
    try:
        subprocess.check_call(['git', '-C', REPO_DIR, 'reset', '--hard'])
        subprocess.check_call(['git', '-C', REPO_DIR, 'clean', '-fd'])
        subprocess.check_call(['git', '-C', REPO_DIR, 'pull'])
        print('✅ Repository synchronized with latest changes!')
    except Exception as e:
        print('⚠️ Sync failed, recreating repository directory:', e)
        import shutil
        shutil.rmtree(REPO_DIR, ignore_errors=True)
        subprocess.check_call(['git', 'clone', REPO_URL, REPO_DIR, '--depth=1'])
        print('✅ Clean repository cloned successfully!')

os.chdir(REPO_DIR)
if REPO_DIR not in sys.path:
    sys.path.insert(0, REPO_DIR)
print('Working dir:', os.getcwd())
```

**Step 3 — Add Cell 2: Install dependencies & launch backend**

Paste the following into the second notebook cell and run it:

```python
import os, sys
REPO_DIR = '/kaggle/working/snapstudio'
os.chdir(REPO_DIR)
if REPO_DIR not in sys.path:
    sys.path.insert(0, REPO_DIR)

# Run the official startup bootstrapper
exec(open(REPO_DIR + '/kaggle_startup.py').read())
```

> ⏳ On the **first run**, models are downloaded and cached — this can take **5–10 minutes**. Subsequent runs are much faster.

**Step 4 — Copy the public URL**

When startup completes, look for this line in the cell output:
```
Running on public URL: https://xxxxxxxx.gradio.live
```
Copy that URL.

### 2. Open the Frontend (Vercel)
1. Visit your Vercel deployment URL
2. Paste the `*.gradio.live` URL into the **Backend URL** box at the top
3. Click **Connect** → upload a photo → pick a tab → go!

### 3. (One-time) Deploy Frontend to Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New Project → Import Git Repository**
2. Select `chaitanyabhujbal912006-afk/Snapstudio_AI`
3. Set **Root Directory** to `frontend`
4. Click **Deploy** — done!

### 4. Run Frontend Locally
```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

---

## 📁 Project Structure

```
Snapstudio_AI/
├── frontend/                  # 🖥️ Next.js frontend (Vercel)
│   ├── app/                   # App Router pages & components
│   │   ├── page.tsx           # Main app entry
│   │   ├── layout.tsx         # Root layout
│   │   ├── api/proxy/         # Server-side proxy (avoids browser CORS)
│   │   └── components/        # Tab components (EnhanceTab, StyleTab, …)
│   ├── public/                # Static assets
│   └── package.json
│
├── pipeline/                  # ⚙️ AI pipeline modules (run on Kaggle backend)
│   ├── enhance.py             # Auto-enhance: white balance, exposure, CLAHE
│   ├── denoise.py             # Image denoising: NLM, bilateral, multi-pass
│   ├── retouch.py             # Portrait retouching: smoothing, clarity, vibrance
│   ├── effects.py             # Creative effects: HDR, vignette, film grain, tilt-shift…
│   ├── color_grade.py         # Color grading: curves, LUT, split-tone
│   ├── face_enhance.py        # Face detection + enhancement
│   ├── segment.py             # Subject segmentation (rembg)
│   ├── depth_edges.py         # Depth map extraction (MiDaS)
│   ├── generate_bg.py         # Background generation (SD 1.5 + ControlNet + LCM-LoRA)
│   ├── bg_blur.py             # Background blur (bokeh simulation)
│   ├── composite.py           # Composite subject onto new background
│   ├── harmonize.py           # Shadow & tone harmonization
│   ├── style_filter.py        # Style transfer (SD img2img + LCM-LoRA)
│   ├── inpaint.py             # Object removal (SD inpainting)
│   ├── outpaint.py            # Canvas extension / outpainting
│   ├── text2img.py            # Text-to-image (SDXL-Turbo)
│   └── upscale.py             # AI upscaling 2×/4× (Swin2SR, tiled)
│
├── presets/
│   ├── styles.py              # Background style prompt templates
│   └── style_filters.py       # Art style prompt templates (Anime, Ghibli, Pixar, Cyberpunk…)
│
├── docs/                      # 📚 AI-agent-optimized developer docs
│   ├── ARCHITECTURE.md        # System design & data flow
│   ├── BACKEND_GUIDE.md       # How to add/modify backend features
│   ├── FRONTEND_GUIDE.md      # How to add/modify frontend panels
│   ├── API_REFERENCE.md       # All API endpoint signatures
│   └── TROUBLESHOOTING.md     # Debugging guide
│
├── AGENTS.md                  # Quick-reference index for AI agents
├── kaggle_notebook.ipynb      # 🏃 Run this on Kaggle for the GPU backend
├── kaggle_startup.py          # Backend startup & Gradio interface definition
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
| Frontend | Next.js 14 (App Router), TypeScript, Vanilla CSS, Framer Motion |
| Hosting | Vercel (free tier), maxDuration=300s |
| Backend | Python 3.10, Gradio (SSE), FastAPI |
| GPU Compute | Kaggle (free T4 × 2 GPU, ~30h/week) |
| AI Models | Stable Diffusion 1.5, SDXL-Turbo, ControlNet Depth, LCM-LoRA, SD Inpainting, Swin2SR, MiDaS |
| Image Processing | OpenCV, PIL/Pillow, NumPy, rembg |
| Client Optim | HTML5 Canvas pre-scaling (max 1920px), 60 FPS Canvas Studio |

---

## 📚 Developer Documentation

AI-agent-optimized docs — designed to give full context without reading source files:

| Doc | Purpose |
|---|---|
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | System design, data flow, GPU allocation |
| [`docs/BACKEND_GUIDE.md`](./docs/BACKEND_GUIDE.md) | How to add/modify backend features |
| [`docs/FRONTEND_GUIDE.md`](./docs/FRONTEND_GUIDE.md) | How to add/modify frontend panels |
| [`docs/API_REFERENCE.md`](./docs/API_REFERENCE.md) | Every API endpoint with TypeScript signatures |
| [`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md) | Debugging guide for common errors |
| [`AGENTS.md`](./AGENTS.md) | Quick-reference index for AI agents |

---

## 📄 License

MIT