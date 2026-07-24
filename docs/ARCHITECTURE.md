# Architecture — SnapStudio AI

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  USER BROWSER                                                       │
│  Next.js App (Vercel) — always-on, free                            │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────┐   │
│  │ Landing     │  │ Editor      │  │ Canvas Editor             │   │
│  │ page.tsx    │  │ /editor     │  │ (100% client-side, 0ms)  │   │
│  └─────────────┘  └──────┬──────┘  └──────────────────────────┘   │
│                           │ apiX() calls                            │
│                    ┌──────▼──────┐                                  │
│                    │  api.ts     │  Gradio SSE client              │
│                    └──────┬──────┘                                  │
│                           │                                         │
│             ┌─────────────▼──────────────┐                         │
│             │  /api/proxy  (route.ts)     │  ← avoids CORS         │
│             │  maxDuration = 300s         │                         │
│             └─────────────┬──────────────┘                         │
└───────────────────────────┼─────────────────────────────────────────┘
                            │  HTTPS to *.gradio.live
┌───────────────────────────┼─────────────────────────────────────────┐
│  KAGGLE GPU (T4 × 2)      │                                         │
│                    ┌──────▼──────────────┐                          │
│                    │  backend_app.py      │  Gradio SSE server      │
│                    │  14 api_* endpoints  │                          │
│                    └──────┬──────────────┘                          │
│                           │                                         │
│         ┌─────────────────┼──────────────────┐                     │
│         │                 │                  │                      │
│    ┌────▼────┐      ┌─────▼────┐      ┌─────▼────┐               │
│    │cuda:0   │      │cuda:1    │      │  CPU     │               │
│    │SD 1.5   │      │SD Inpaint│      │ enhance  │               │
│    │bg_swap  │      │style_filt│      │ retouch  │               │
│    │t2i SDXL │      │upscale   │      │ effects  │               │
│    └─────────┘      └──────────┘      └──────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

## Request Flow (Step by Step)

1. **User uploads image** → `UploadZone` calls `compressAndResizeImage(file, 1920, 0.90)` → produces JPEG base64 (≤800KB)
2. **User clicks "Process"** → Panel component calls `apiX(backendUrl, imageB64, ...params)`
3. **`api.ts`** calls `gradioCall(baseUrl, fnName, payload)`:
   - Remote URL: `POST /api/proxy` with `x-target-url` header → proxy forwards to `{backendUrl}/call/{fn}`
   - Returns `{ event_id }`
4. **`api.ts` GET**: `GET /api/proxy` with `x-target-url: {backendUrl}/call/{fn}/{event_id}` → SSE stream piped through
5. **Backend**: Gradio runs the Python function → calls into `pipeline/` module → returns JSON `{ success, image }`
6. **`api.ts`** scans SSE lines in reverse for last `data: [...]` → parses → returns `ApiResult<string>`
7. **Panel** receives result → `ResultPanel` shows download / compare slider

## Data Format Rules

| Item | Format | Notes |
|---|---|---|
| Image input | `data:image/jpeg;base64,...` | Always compressed first |
| Image output | `data:image/png;base64,...` | Backend returns PNG |
| Mask (inpaint) | `data:image/png;base64,...` | From canvas drawing |
| API payload | JSON array sent as `{ data: [...] }` | Gradio convention |
| API response | SSE stream, last `data: [...]` | Backend JSON |

## GPU Model Allocation (device_helper.py)

| Device | Models |
|---|---|
| `cuda:0` | SD 1.5 pipeline (bg_swap, generate_bg), SDXL-Turbo (t2i) |
| `cuda:1` | SD Inpainting (inpaint), StyleFilter SD (style), Swin2SR (upscale) |
| CPU | All non-ML ops: enhance, retouch, effects, denoise, relight, color_grade |

`free_gpu_models(keep="bg_swap")` is called before each GPU task — it unloads all GPU models except the needed one on single-GPU installs. Dual-GPU skips unloading.

## Environment Variables / Config

| Key | Location | Value |
|---|---|---|
| `OMP_NUM_THREADS` | backend_app.py L16 | `"4"` |
| `MKL_NUM_THREADS` | backend_app.py L17 | `"4"` |
| `torch.backends.cudnn.benchmark` | backend_app.py L20 | `True` |
| `bodySizeLimit` | next.config.ts | `"25mb"` |
| `maxDuration` | vercel.json + route.ts L4 | `300` (seconds) |

## Key Design Decisions

- **Why Kaggle?** Free T4 GPU (up to 30h/week), no credit card required.
- **Why Gradio SSE?** Supports long-running jobs (1–4 min) without timeout. Polling or WebSocket not needed.
- **Why /api/proxy?** Browsers block cross-origin fetch to `*.gradio.live`. A server-side route in Next.js has no CORS restriction.
- **Why base64?** Eliminates file upload complexity, presigned URLs, and S3. Simpler for a demo/personal tool.
- **Why client-side compression?** Vercel Serverless Function body limit is 4.5MB. A 4K photo is 15MB+ raw.
