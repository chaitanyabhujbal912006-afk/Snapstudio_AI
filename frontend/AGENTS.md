<!-- Agent rules for the frontend/ Next.js sub-project -->

# Frontend Agent Rules

## Stack & Conventions
- Next.js 14 App Router — all components are `"use client"` (no Server Components used in this project)
- TypeScript strict mode — no `any` types, no ts-ignore
- CSS: vanilla CSS in `globals.css` with design tokens — no Tailwind, no inline styles
- Icons: Lucide React only
- Animation: Framer Motion only

## NEVER Do These
- Do NOT call `*.gradio.live` URLs directly from browser JS — use `/api/proxy` instead
- Do NOT skip `compressAndResizeImage` — Vercel will 413 on raw large images
- Do NOT add Redux, Zustand, or any state management library — use `useState` + BackendContext
- Do NOT use `any` TypeScript type

## Always Do These
- Read `../docs/FRONTEND_GUIDE.md` before creating a new panel
- Use `useBackend()` hook from `BackendContext` for backend URL
- Add `"use client"` at the top of every component file
- Return `ApiResult<T>` from every `api.ts` function (never throw)

## Adding a Feature — 4 Required Steps
1. `app/lib/api.ts` — add `apiMyFeature()` function
2. `app/components/panels/MyFeaturePanel.tsx` — create panel using template in FRONTEND_GUIDE.md
3. `app/components/Sidebar.tsx` — add to `FeatureId` type + `SIDEBAR_ITEMS` array
4. `app/editor/page.tsx` — add import + case in ActivePanel switch

## File Reference
- `../docs/FRONTEND_GUIDE.md` — full guide with templates
- `../docs/API_REFERENCE.md` — all API function signatures
- `../AGENTS.md` — project root quick-reference index
