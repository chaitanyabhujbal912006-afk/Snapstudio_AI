# SnapStudio AI 🎨

**AI-powered photo editing — Next.js frontend on Vercel, GPU backend on Kaggle.**

Upload a photo and get studio-quality results instantly: auto-enhance, swap backgrounds, apply art styles, remove objects, or generate from text — all powered by free GPU on Kaggle.

---

## ✨ Features

| Mode | What it does | Speed |
|---|---|---|
| ✨ Auto-Enhance | Fixes lighting, color, contrast, exposure & sharpness | ~1–2 sec |
| 🖼️ Background Swap | Replaces background with AI-generated scene | ~1–2 min |
| 🎨 Style Filter | Transforms photo into anime, painting, sketch, etc. | ~30–60 sec |
| 🧹 Object Removal | Paint over anything to erase it | ~2–4 min |
| 🖌️ Text-to-Image | Generate images from a text prompt (SDXL-Turbo) | ~10–20 sec |
| 🔍 Upscale | 2× or 4× AI super-resolution (Swin2SR) | ~15–60 sec |
| 🎭 Portrait Retouch | Skin smoothing, clarity, vibrance, shadow lift | ~0.2 sec |
| 🌟 Creative Effects | HDR, vignette, film grain, bloom, tilt-shift, etc. | ~0.5 sec |

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
│   └── style_filters.py       # Art style prompt templates
│
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
| Frontend | Next.js 14 (App Router), TypeScript, CSS Modules |
| Hosting | Vercel (free tier) |
| Backend | Python 3.10, Gradio, FastAPI |
| GPU Compute | Kaggle (free T4 GPU) |
| AI Models | Stable Diffusion 1.5, SDXL-Turbo, ControlNet Depth, LCM-LoRA, SD Inpainting, Swin2SR |
| Image Processing | OpenCV, PIL/Pillow, NumPy, rembg |

---

## 📄 License

MIT