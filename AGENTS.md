# SnapStudio AI — Agent Quick-Reference Index

> **Read this file first.** It points you to the right doc so you don't burn tokens scanning source files blindly.

## Project in One Sentence
AI-powered photo editor. **Next.js frontend** (Vercel) calls a **Python/Gradio GPU backend** (Kaggle T4 × 2) through a server-side proxy to avoid CORS. All images travel as base64 data URIs.

## When to Read Which Doc

| You want to… | Read |
|---|---|
| Understand full architecture & data flow | [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) |
| Add / modify a backend AI feature | [`docs/BACKEND_GUIDE.md`](./docs/BACKEND_GUIDE.md) |
| Add / modify a frontend panel or UI | [`docs/FRONTEND_GUIDE.md`](./docs/FRONTEND_GUIDE.md) |
| See every API endpoint signature | [`docs/API_REFERENCE.md`](./docs/API_REFERENCE.md) |
| Debug a specific error or known gotcha | [`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md) |
| Deploy frontend / run backend | [`README.md`](./README.md) |

## Directory Map (Token-Efficient)

```
snapstudio-ai/
├── frontend/           Next.js 14 App Router — Vercel deployed
│   ├── app/
│   │   ├── page.tsx              Landing page (hero, upload, feature showcase)
│   │   ├── editor/page.tsx       MAIN EDITOR — all panel routing lives here
│   │   ├── layout.tsx            Root layout, font, metadata
│   │   ├── globals.css           Global CSS design tokens + animations
│   │   ├── api/proxy/route.ts    Server-side CORS proxy for Kaggle calls
│   │   ├── context/
│   │   │   └── BackendContext.tsx  Global backendUrl + isConnected state
│   │   ├── lib/
│   │   │   └── api.ts            ALL frontend→backend API calls (Gradio SSE)
│   │   └── components/
│   │       ├── Header.tsx        Backend URL connect bar + nav
│   │       ├── Sidebar.tsx       Left nav — feature selection (FeatureId enum)
│   │       ├── UploadZone.tsx    Drag-drop upload with compressAndResizeImage
│   │       ├── ResultPanel.tsx   Download / compare after processing
│   │       ├── CompareSlider.tsx Before/after slider
│   │       ├── CanvasEditor.tsx  60 FPS client-side adjustments (0ms latency)
│   │       ├── EnhanceTab.tsx    Auto-enhance panel
│   │       ├── StyleTab.tsx      Art style transfer panel
│   │       ├── BgSwapTab.tsx     Background swap + custom prompt
│   │       ├── RemoveTab.tsx     Object erase/replace with brush mask
│   │       └── panels/           One file per AI feature panel
│   │           ├── RelightPanel.tsx
│   │           ├── ColorGradePanel.tsx
│   │           ├── DenoisePanel.tsx
│   │           ├── EffectsPanel.tsx
│   │           ├── FaceEnhancePanel.tsx
│   │           ├── UpscalePanel.tsx
│   │           ├── OutpaintPanel.tsx
│   │           └── Text2ImgPanel.tsx
│   ├── next.config.ts     bodySizeLimit: 25mb, typescript strict
│   └── vercel.json        maxDuration: 300s for proxy route
│
├── backend_app.py        Gradio app — all 14 endpoint definitions
├── kaggle_startup.py     Bootstrap: pip install → launch backend_app.py
├── kaggle_notebook.ipynb Kaggle entry point (2-cell notebook)
├── requirements.txt      Python deps
│
├── pipeline/             One module per AI operation (Kaggle-only)
│   ├── device_helper.py  Dual-GPU allocation (cuda:0 / cuda:1)
│   ├── enhance.py        Auto white-balance, CLAHE, exposure
│   ├── color_grade.py    LUT curves, split-tone, color grading
│   ├── retouch.py        Portrait skin smoothing, clarity, vibrance
│   ├── denoise.py        NLM / bilateral denoising
│   ├── effects.py        HDR, vignette, film grain, bloom, tilt-shift…
│   ├── relight.py        Surface-normal studio relighting (8 presets)
│   ├── segment.py        Subject segmentation (rembg)
│   ├── depth_edges.py    Depth map (MiDaS)
│   ├── generate_bg.py    SD1.5 + ControlNet + LCM-LoRA bg generation
│   ├── bg_blur.py        Depth-guided bokeh blur
│   ├── composite.py      Subject + new background compositing
│   ├── harmonize.py      Shadow & tone harmonization
│   ├── style_filter.py   SD img2img art style transfer
│   ├── inpaint.py        SD inpainting — erase or replace objects
│   ├── outpaint.py       Canvas extension / outpainting
│   ├── text2img.py       SDXL-Turbo text-to-image
│   └── upscale.py        Swin2SR 2×/4× super-resolution
│
├── presets/
│   ├── styles.py         Background scene prompt templates
│   ├── style_filters.py  Art style prompt templates (incl. Pixar, Ghibli, Cyberpunk…)
│   └── color_grades.py   Color grade preset definitions
│
└── docs/                 AI agent documentation (this suite)
    ├── ARCHITECTURE.md
    ├── BACKEND_GUIDE.md
    ├── FRONTEND_GUIDE.md
    ├── API_REFERENCE.md
    └── TROUBLESHOOTING.md
```

## Critical Rules for AI Agents

1. **Never call Kaggle URLs directly from browser JS** — always route through `/api/proxy`.
2. **All images are base64 data URIs**, not file uploads or URLs.
3. **`compressAndResizeImage(file, 1920, 0.90)`** must be called before any API call — Vercel rejects bodies >4.5MB.
4. **Gradio SSE pattern**: POST → get `event_id` → GET SSE stream → parse last `data: [...]` line.
5. **Backend response shape**: always `{ success: bool, image?: string, images?: string[], error?: string }`.
6. **To add a feature**: create `pipeline/X.py` → expose `api_X` in `backend_app.py` → add `apiX` in `frontend/app/lib/api.ts` → create panel in `frontend/app/components/panels/XPanel.tsx` → register in `Sidebar.tsx` and `editor/page.tsx`.
