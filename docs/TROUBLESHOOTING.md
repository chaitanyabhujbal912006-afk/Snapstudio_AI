# Troubleshooting — SnapStudio AI

## Frontend / Vercel Issues

### ❌ `413 Payload Too Large` from Vercel
**Cause**: Image base64 payload exceeded Vercel's 4.5MB body limit.
**Fix**: Ensure `compressAndResizeImage` is called before any API function. It limits max dimension to 1920px. If still failing, reduce `maxDimension` to 1024 or `quality` to 0.80.

### ❌ `504 Gateway Timeout — Backend did not respond within 25s`
**Cause**: Kaggle backend is not running, or the URL is incorrect.
**Fix**: 
1. Go to Kaggle notebook → check it's running
2. Copy the latest `*.gradio.live` URL from cell output
3. Paste it into the frontend's Backend URL box and click Connect

### ❌ `CORS error` or `fetch failed` in browser console
**Cause**: Something is calling Kaggle URL directly instead of via proxy.
**Fix**: All calls to `*.gradio.live` must go through `/api/proxy`. Check that `isRemote` detection in `api.ts` is working. Remote = URL starts with `https://` or contains `.gradio.live`.

### ❌ `No event_id returned` from API
**Cause**: Gradio function name mismatch, or backend returned an error before queuing.
**Fix**: Verify the `fn_name` string in `api.ts` exactly matches the Gradio `api_name` in `backend_app.py`. Check backend cell output for Python errors.

### ❌ TypeScript build error: `Cannot find module '@/app/...'`
**Cause**: Missing import or wrong path alias.
**Fix**: The `@` alias maps to `frontend/` (see `tsconfig.json`). Use `@/app/components/...` not `@/components/...`.

### ❌ `hydration error` in Next.js
**Cause**: Component renders differently on server vs. client (e.g., reading `window` or `document`).
**Fix**: Add `"use client";` at top of the component. All UI components in this project are client components.

---

## Backend / Kaggle Issues

### ❌ `CUDA out of memory` / OOM
**Cause**: All GPU models loaded simultaneously on a single GPU.
**Fix**: Ensure `free_gpu_models(keep="...")` is called before each GPU operation in `backend_app.py`. On Kaggle T4 × 2, models can co-exist on separate GPUs. On single GPU, OOM may happen if models aren't freed.

### ❌ `ModuleNotFoundError: No module named 'pipeline'`
**Cause**: Python working directory is wrong, or repo wasn't cloned properly.
**Fix**: In Kaggle notebook, ensure `os.chdir(REPO_DIR)` and `sys.path.insert(0, REPO_DIR)` ran before the backend. Check `kaggle_startup.py` does this.

### ❌ Backend starts but `api_get_presets` returns empty lists
**Cause**: Import error in `presets/*.py` or a pipeline module.
**Fix**: Check Kaggle cell output for warnings/errors during startup. Run `import presets.styles` manually in a new cell to isolate.

### ❌ `gradio.live` URL expired / invalid
**Cause**: Kaggle session ended (max ~9–12 hours).
**Fix**: Re-run the Kaggle notebook cells. A new URL is generated each time.

### ❌ Inpainting / BgSwap always returns black image
**Cause**: Mask is all-white (nothing to keep) or base64 includes alpha channel.
**Fix**: Mask must be `data:image/png;base64,...` with white on areas to inpaint and black on areas to keep. Check `RemoveTab.tsx` canvas drawing code.

### ❌ Style filter output looks like the original (no effect)
**Cause**: `strength` too low, or SD pipeline not loaded (CPU fallback).
**Fix**: Use `strength ≥ 0.5` for noticeable effect. Ensure GPU is enabled in Kaggle (Accelerator = GPU T4 x2).

---

## Performance / Speed Issues

### Slow image upload / network
**Cause**: Raw large image sent to Vercel proxy.
**Fix**: `compressAndResizeImage(file, 1920)` reduces 4K photos from ~15MB to ~300–800KB. Already wired into `UploadZone`.

### GPU inference extremely slow (~10min+)
**Cause**: Models downloading for first time, or running on CPU.
**Fix**: First run downloads from HuggingFace — normal. Check Kaggle accelerator setting. `api_get_presets` → `has_gpu: true` confirms GPU is active.

### Canvas Editor choppy
**Cause**: Large canvas with many operations.
**Fix**: `CanvasEditor` uses `requestAnimationFrame` for 60fps. Check if image is excessively large (>4096px). The `compressAndResizeImage` step should have already downscaled it.

---

## Common Development Mistakes

### ❌ Forgetting `"use client"` directive
All components with hooks, event handlers, or browser APIs need `"use client";` at top.

### ❌ Calling `free_gpu_models(keep=None)` in CPU-only functions
Only call `free_gpu_models` in GPU endpoints. CPU endpoints (enhance, retouch, effects, etc.) don't need it.

### ❌ Adding a new panel but forgetting one of the 4 registration steps
Must update: `api.ts` + panel file + `Sidebar.tsx` + `editor/page.tsx`. Missing any one = feature invisible or broken.

### ❌ Returning raw PIL Image from backend endpoint instead of wrapped JSON
All `api_*` functions must return `[{"success": True, "image": pil_to_b64(result)}]` — the outer list is required by Gradio.

### ❌ Sending mask as JPEG (lossy compression breaks binary mask)
Masks must be PNG. Use `canvas.toDataURL("image/png")` not `"image/jpeg"`.

---

## Debug Checklist

```
Frontend:
[ ] Is backend URL pasted and shows "Connected"?
[ ] Is image uploaded (preview visible)?
[ ] Check browser console for JS errors
[ ] Check Network tab — is /api/proxy returning 200?

Backend:
[ ] Kaggle notebook running? (kernel indicator green)
[ ] gradio.live URL is current?
[ ] GPU enabled in Kaggle settings?
[ ] No Python errors in cell output?

API:
[ ] fn_name in api.ts matches api_name in backend_app.py?
[ ] Payload array order correct (compare ts call vs py function signature)?
[ ] Response being parsed correctly (single vs multi)?
```
