# API Reference — SnapStudio AI

All frontend functions are in `frontend/app/lib/api.ts`.
All backend endpoints are in `backend_app.py` as Gradio functions.

## Response Types

```typescript
// Every API call returns one of these:
type ApiResult<T> = { success: true; data: T } | { success: false; error: string };
// single-image calls: ApiResult<string>  (base64 data URI)
// multi-image calls:  ApiResult<string[]>
```

## Presets

### `apiGetPresets(baseUrl)`
Returns all available preset lists from the backend.
```typescript
interface Presets {
  bg_styles: string[];          // Background style names
  style_filters: string[];      // Art style names
  color_grades: string[];       // Color grade names
  t2i_styles: string[];         // Text-to-image style names
  outpaint_directions: string[];// ["left","right","top","bottom","all"]
  effect_types: string[];       // Creative effect names
  has_gpu: boolean;
  gpu_name: string;
}
```
Backend fn: `api_get_presets` | Args: none

---

## Quick Edit (CPU — instant, no GPU required)

### `apiEnhance(baseUrl, imageB64)`
Auto white-balance, CLAHE, exposure, sharpness.
```typescript
apiEnhance(baseUrl: string, imageB64: string): Promise<ApiResult<string>>
```
Backend fn: `api_enhance` | Pipeline: `enhance.py::auto_enhance`

---

### `apiColorGrade(baseUrl, imageB64, params)`
Apply a color grade preset with full manual overrides.
```typescript
interface ColorGradeParams {
  grade_name: string;       // from Presets.color_grades
  intensity: number;        // 0.0–1.0
  exposure: number;         // -2.0 to +2.0
  contrast: number | null;  // -1.0 to +1.0 (null = preset default)
  highlights: number | null;
  shadows: number | null;
  temperature: number | null; // Kelvin shift
  saturation: number | null;
  vibrance: number;         // 0.0–1.0
  vignette: number | null;
  grain: number | null;
}
```
Backend fn: `api_color_grade` | Pipeline: `color_grade.py`

> **Note**: Pass `-999` for any override you want the backend to ignore (null → -999 conversion handled in api.ts).

---

### `apiRetouch(baseUrl, imageB64, params)`
Portrait skin retouching.
```typescript
interface RetouchParams {
  skin_smooth: number;   // 0.0–1.0
  clarity: number;       // 0.0–1.0
  sharpen: number;       // 0.0–1.0
  vibrance: number;      // 0.0–1.0
  shadow_lift: number;   // 0.0–0.5
  teeth_whiten: number;  // 0.0–1.0
}
```
Backend fn: `api_retouch` | Pipeline: `retouch.py`

---

### `apiDenoise(baseUrl, imageB64, strength, mode, preserveColor)`
Image noise reduction.
```typescript
apiDenoise(
  baseUrl: string,
  imageB64: string,
  strength: number,      // 0.1–1.0
  mode: string,          // "nlm" | "bilateral" | "multi"
  preserveColor: boolean
): Promise<ApiResult<string>>
```
Backend fn: `api_denoise` | Pipeline: `denoise.py`

---

### `apiEffect(baseUrl, imageB64, effect, params)`
Creative visual effects.
```typescript
apiEffect(
  baseUrl: string,
  imageB64: string,
  effect: string,                     // from Presets.effect_types
  params: Record<string, unknown>     // effect-specific params dict
): Promise<ApiResult<string>>
```
Available effects: `"hdr"`, `"vignette"`, `"film_grain"`, `"chromatic_aberration"`, `"bloom"`, `"cross_process"`, `"color_splash"`, `"orton_glow"`

Backend fn: `api_effect` | Pipeline: `effects.py`

---

### `apiRelight(baseUrl, imageB64, params)`
AI Virtual Studio Relighting using surface normal estimation.
```typescript
interface RelightParams {
  preset: string;           // "Warm Gold" | "Cyber Neon" | "Sunset Pink" | "Cool Blue" |
                            // "Emerald Glow" | "Studio White" | "Dramatic Red" | "Violet Aura"
  light_angle: number;      // 0–360 degrees
  intensity: number;        // 0.0–2.0
  rim_light: number;        // 0.0–1.0 (edge rim light wrap)
  ambient_darkening: number;// 0.0–1.0
}
```
Backend fn: `api_relight` | Pipeline: `relight.py` (CPU, uses Sobolev gradients for surface normals)

---

## AI Enhance (GPU — seconds to ~1 minute)

### `apiBgBlur(baseUrl, imageB64, blurAmount, useDepth, subjectType)`
Depth-guided background bokeh blur.
```typescript
apiBgBlur(
  baseUrl: string,
  imageB64: string,
  blurAmount: number,   // 0.1–1.5
  useDepth: boolean,    // true = MiDaS depth, false = segmentation only
  subjectType: string   // "person" | "product" | "pet"
): Promise<ApiResult<string>>
```
Backend fn: `api_bg_blur` | Pipeline: `bg_blur.py` (MiDaS depth + rembg segment)

---

### `apiUpscale(baseUrl, imageB64, scale)`
AI super-resolution via Swin2SR.
```typescript
apiUpscale(baseUrl: string, imageB64: string, scale: number): Promise<ApiResult<string>>
// scale: 2 or 4
```
Backend fn: `api_upscale` | Pipeline: `upscale.py` (Swin2SR, tiled processing)

---

### `apiFaceEnhance(baseUrl, imageB64, upscaleStrength, retouchStrength)`
Face detection + enhancement.
```typescript
apiFaceEnhance(
  baseUrl: string,
  imageB64: string,
  upscaleStrength: number, // 0.0–1.0
  retouchStrength: number  // 0.0–1.0
): Promise<ApiResult<string>>
```
Backend fn: `api_face_enhance` | Pipeline: `face_enhance.py`

---

## AI Transform (GPU — 1–4 minutes)

### `apiBgSwap(baseUrl, imageB64, subjectType, styleName, numVariants, customPrompt?)`
Replace background with AI-generated scene.
```typescript
apiBgSwap(
  baseUrl: string,
  imageB64: string,
  subjectType: string,   // "person" | "product" | "pet"
  styleName: string,     // from Presets.bg_styles, or "Custom" if using customPrompt
  numVariants: number,   // 1–4
  customPrompt?: string  // override — used when styleName is blank or "Custom"
): Promise<ApiResult<string[]>>  // returns array of variant images
```
Backend fn: `api_bg_swap` | Pipeline: `generate_bg.py + segment.py + composite.py + harmonize.py`

---

### `apiStyleFilter(baseUrl, imageB64, styleName, strength)`
Artistic style transfer.
```typescript
apiStyleFilter(
  baseUrl: string,
  imageB64: string,
  styleName: string, // from Presets.style_filters
  strength: number   // 0.0–1.0
): Promise<ApiResult<string>>
```
Backend fn: `api_style_filter` | Pipeline: `style_filter.py` (SD img2img + LCM-LoRA)

Available styles: Anime, Oil Painting, Watercolor, Sketch, Ghibli, Pixar 3D, Comic Pop-Art, Retro 80s Film, Pencil Sketch, Cyberpunk 2077 (+ more in presets/style_filters.py)

---

### `apiRemoveObject(baseUrl, imageB64, maskB64, prompt?, negativePrompt?)`
Erase or replace objects using an inpainting mask.
```typescript
apiRemoveObject(
  baseUrl: string,
  imageB64: string,
  maskB64: string,       // white = region to inpaint, black = keep
  prompt?: string,       // empty = erase (fill with background), non-empty = replace
  negativePrompt?: string
): Promise<ApiResult<string>>
```
Backend fn: `api_remove_object` | Pipeline: `inpaint.py` (SD Inpainting)

---

### `apiOutpaint(baseUrl, imageB64, direction, amount, prompt)`
Extend canvas / outpaint.
```typescript
apiOutpaint(
  baseUrl: string,
  imageB64: string,
  direction: string, // "left" | "right" | "top" | "bottom" | "all"
  amount: number,    // pixels to extend
  prompt: string     // describe what to fill in
): Promise<ApiResult<string>>
```
Backend fn: `api_outpaint` | Pipeline: `outpaint.py`

---

## Generate

### `apiText2Img(baseUrl, params)`
Text-to-image generation with SDXL-Turbo.
```typescript
interface Text2ImgParams {
  prompt: string;
  negative_prompt: string;
  style: string;      // from Presets.t2i_styles
  width: number;      // 512–1024, multiples of 64
  height: number;
  steps: number;      // 1–10 for SDXL-Turbo
  seed: number;       // -1 for random
  num_images: number; // 1–4
}
apiText2Img(baseUrl: string, p: Text2ImgParams): Promise<ApiResult<string[]>>
```
Backend fn: `api_text2img` | Pipeline: `text2img.py` (SDXL-Turbo)

---

## Client-Side Helpers (no backend required)

### `compressAndResizeImage(file, maxDimension?, quality?)`
**Must be called before any API call.** Downscales to ≤1920px, converts to JPEG.
```typescript
compressAndResizeImage(
  file: File,
  maxDimension: number = 1920,  // max width or height
  quality: number = 0.90        // JPEG quality
): Promise<string>  // returns base64 data URI
```

### `fileToBase64(file)`
Shorthand for `compressAndResizeImage(file, 1920, 0.92)`.

---

## Gradio SSE Protocol (for debugging)

```bash
# Step 1: POST to queue the job
POST {backendUrl}/call/{fn_name}
Content-Type: application/json
Body: { "data": [...args] }
→ Response: { "event_id": "abc123" }

# Step 2: GET to stream result
GET {backendUrl}/call/{fn_name}/abc123
Accept: text/event-stream
→ SSE stream:
  event: generating
  data: null

  event: complete
  data: [{"success": true, "image": "data:image/png;base64,..."}]
```

All remote calls go through `/api/proxy` with `x-target-url` header.
