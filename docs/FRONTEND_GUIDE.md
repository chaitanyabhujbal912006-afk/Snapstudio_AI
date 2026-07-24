# Frontend Guide — SnapStudio AI

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router (TypeScript) |
| Styling | Vanilla CSS Modules + globals.css design tokens |
| Animations | Framer Motion |
| Icons | Lucide React |
| State | React `useState` + `BackendContext` (no Redux/Zustand) |
| Hosting | Vercel (root dir = `frontend/`) |

## Key Files & Responsibilities

| File | Responsibility |
|---|---|
| `app/editor/page.tsx` | **MAIN** — all panel routing, `FeatureId → component` map |
| `app/context/BackendContext.tsx` | Global `backendUrl` + `isConnected` — all panels consume this |
| `app/lib/api.ts` | ALL backend API calls — only file that talks to Gradio |
| `app/components/Sidebar.tsx` | Left nav — defines `FeatureId` union type |
| `app/components/Header.tsx` | Backend URL input bar + connection status |
| `app/components/UploadZone.tsx` | Drag-drop upload, calls `compressAndResizeImage` |
| `app/components/CanvasEditor.tsx` | 60 FPS HTML5 Canvas editor (brightness, contrast, crop, etc.) |
| `app/globals.css` | All design tokens, animations, utility classes |

## How to Add a New Panel

### Step 1 — Create `app/components/panels/MyFeaturePanel.tsx`

Use this exact template (all existing panels follow this pattern):

```tsx
"use client";
import { useState, useCallback } from "react";
import { useBackend } from "@/app/context/BackendContext";
import UploadZone from "@/app/components/UploadZone";
import ResultPanel from "@/app/components/ResultPanel";
import { apiMyFeature } from "@/app/lib/api";  // import your API fn

export default function MyFeaturePanel() {
  const { backendUrl, isConnected } = useBackend();
  const [preview, setPreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  // ... your params state ...

  const handleFile = useCallback((file: File, b64: string) => {
    setPreview(b64); setImageB64(b64); setResult(null); setError("");
  }, []);

  const handleRun = async () => {
    if (!imageB64 || !isConnected) return;
    setIsProcessing(true); setError("");
    const res = await apiMyFeature(backendUrl, imageB64, /* params */);
    setIsProcessing(false);
    if (res.success) setResult(res.data);
    else setError(res.error);
  };

  return (
    <div className="panel-container">
      {/* Upload */}
      {!result && <UploadZone onFileSelect={handleFile} preview={preview} />}
      
      {/* Controls */}
      <div className="panel-controls">
        {/* sliders, selects, etc. */}
        <button onClick={handleRun} disabled={!imageB64 || !isConnected || isProcessing}>
          {isProcessing ? "Processing…" : "Apply"}
        </button>
        {error && <p className="error-text">{error}</p>}
      </div>

      {/* Result */}
      {result && (
        <ResultPanel
          original={preview!}
          result={result}
          filename="snapstudio-myfeature.png"
          onReset={() => setResult(null)}
        />
      )}
    </div>
  );
}
```

### Step 2 — Add API function in `app/lib/api.ts`

```typescript
// For single-image result:
export const apiMyFeature = (baseUrl: string, imageB64: string, param: number) =>
  single(baseUrl, "api_my_feature", [imageB64, param]);

// For multi-image result (e.g. variants):
export const apiMyFeatureMulti = (baseUrl: string, imageB64: string) =>
  multi(baseUrl, "api_my_feature", [imageB64]);
```

### Step 3 — Register in `app/components/Sidebar.tsx`

```typescript
// 1. Add to FeatureId union type:
export type FeatureId = "enhance" | "canvas_studio" | ... | "my_feature";

// 2. Add to SIDEBAR_ITEMS array:
{
  id: "my_feature",
  label: "My Feature",
  icon: SomeIcon,  // from lucide-react
  category: "ai_enhance",  // "quick_edit" | "ai_enhance" | "ai_transform" | "generate"
}
```

### Step 4 — Register in `app/editor/page.tsx`

```typescript
// 1. Import panel:
import MyFeaturePanel from "@/app/components/panels/MyFeaturePanel";

// 2. Add to ActivePanel router:
case "my_feature": return <MyFeaturePanel />;
```

## BackendContext API

```typescript
// Usage in any component:
import { useBackend } from "@/app/context/BackendContext";
const { backendUrl, isConnected } = useBackend();

// backendUrl: string — the *.gradio.live URL
// isConnected: boolean — true after successful ping
```

## Image Upload Pattern

`UploadZone` calls `onFileSelect(file: File, b64: string)` where `b64` is already compressed by `compressAndResizeImage`. **Never bypass UploadZone** — it handles drag-drop, paste, and compression.

## Canvas Editor Features (client-side, 0ms latency)

The `CanvasEditor` component provides real-time adjustments without any API calls:
- **Tone**: Brightness, Contrast, Saturation, Warmth
- **Stylistic**: Blur, Vignette, Sepia
- **Transform**: Crop, Rotate 90°, Flip H/V

Usage:
```tsx
<CanvasEditor imageB64={imageB64} onResult={(b64) => setResult(b64)} />
```

## Sidebar Feature Categories

| Category key | Sidebar section label |
|---|---|
| `quick_edit` | Quick Edit (CPU, instant) |
| `ai_enhance` | AI Enhance (GPU, seconds) |
| `ai_transform` | AI Transform (GPU, minutes) |
| `generate` | Generate (GPU, seconds) |

## CSS Design Tokens (globals.css)

```css
/* Primary palette */
--color-primary: hsl(258, 90%, 66%);     /* purple */
--color-primary-dark: hsl(258, 90%, 50%);
--color-accent: hsl(190, 100%, 50%);      /* cyan */
--color-bg: hsl(220, 20%, 7%);            /* dark bg */
--color-surface: hsl(220, 16%, 12%);

/* Spacing */
--space-1: 0.25rem; --space-2: 0.5rem; --space-4: 1rem; --space-6: 1.5rem;

/* Key utility classes */
.panel-container       /* standard panel wrapper */
.panel-controls        /* controls sidebar area */
.btn-primary           /* primary CTA button */
.btn-ghost             /* ghost/secondary button */
.slider-row            /* label + range slider row */
.error-text            /* red error message */
.processing-overlay    /* loading state */
```

## Vercel Deployment Notes

- **Root Directory**: set to `frontend` in Vercel project settings
- **Build Command**: `npm run build` (auto-detected)
- **Body size limit**: 25MB (for large base64 payloads going through serverless functions)
- **Function timeout**: 300s (5 minutes) — covers GPU inference waiting
- **No env vars required** — backend URL is entered by user at runtime
