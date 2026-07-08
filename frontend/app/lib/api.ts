/**
 * SnapStudio AI — Gradio API Client
 * Talks to the Kaggle backend via Gradio's SSE API.
 * All images are transferred as base64 data URIs.
 */

// ── Core Gradio caller ────────────────────────────────────────────────────────

async function gradioCall(baseUrl: string, fnName: string, payload: unknown[]): Promise<unknown[]> {
  // Any external (https) URL goes through the server-side proxy to avoid CORS
  const isRemote = baseUrl.startsWith("https://") || baseUrl.includes(".gradio.live");


  let postRes;
  if (isRemote) {
    postRes = await fetch("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-target-url": `${baseUrl}/call/${fnName}`
      },
      body: JSON.stringify({ data: payload }),
    });
  } else {
    postRes = await fetch(`${baseUrl}/call/${fnName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: payload }),
    });
  }

  if (!postRes.ok) throw new Error(`POST ${fnName} failed: ${postRes.status}`);
  const { event_id } = await postRes.json();

  let getRes;
  if (isRemote) {
    getRes = await fetch("/api/proxy", {
      method: "GET",
      headers: {
        "x-target-url": `${baseUrl}/call/${fnName}/${event_id}`
      }
    });
  } else {
    getRes = await fetch(`${baseUrl}/call/${fnName}/${event_id}`);
  }

  if (!getRes.ok) throw new Error(`GET ${fnName} result failed: ${getRes.status}`);
  const text = await getRes.text();

  // Scan lines in reverse to find the last `data: [...]` line
  const lines = text.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith("data:")) {
      const raw = line.slice(5).trim();
      if (raw.startsWith("[")) {
        try {
          return JSON.parse(raw);
        } catch {
          // keep scanning
        }
      }
    }
  }
  throw new Error(`Could not parse Gradio SSE response. Raw text: ${text.slice(0, 300)}`);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export type ApiResult<T> = { success: true; data: T } | { success: false; error: string };

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function single(baseUrl: string, fn: string, payload: unknown[]): Promise<ApiResult<string>> {
  return gradioCall(baseUrl, fn, payload).then(([r]) => {
    const res = r as { success: boolean; image?: string; error?: string };
    if (!res.success) return { success: false as const, error: res.error ?? "Unknown error" };
    return { success: true as const, data: res.image! };
  }).catch(e => ({ success: false as const, error: String(e) }));
}

function multi(baseUrl: string, fn: string, payload: unknown[]): Promise<ApiResult<string[]>> {
  return gradioCall(baseUrl, fn, payload).then(([r]) => {
    const res = r as { success: boolean; images?: string[]; error?: string };
    if (!res.success) return { success: false as const, error: res.error ?? "Unknown error" };
    return { success: true as const, data: res.images! };
  }).catch(e => ({ success: false as const, error: String(e) }));
}

// ── Presets ───────────────────────────────────────────────────────────────────

export interface Presets {
  bg_styles: string[];
  style_filters: string[];
  color_grades: string[];
  t2i_styles: string[];
  outpaint_directions: string[];
  effect_types: string[];
  has_gpu: boolean;
  gpu_name: string;
}

export async function apiGetPresets(baseUrl: string): Promise<Presets> {
  const [r] = await gradioCall(baseUrl, "api_get_presets", []);
  return r as Presets;
}

// ── Quick Edit (CPU) ──────────────────────────────────────────────────────────

export const apiEnhance = (baseUrl: string, imageB64: string) =>
  single(baseUrl, "api_enhance", [imageB64]);

export interface ColorGradeParams {
  grade_name: string;
  intensity: number;
  exposure: number;
  contrast: number | null;
  highlights: number | null;
  shadows: number | null;
  temperature: number | null;
  saturation: number | null;
  vibrance: number;
  vignette: number | null;
  grain: number | null;
}

export const apiColorGrade = (baseUrl: string, imageB64: string, p: ColorGradeParams) =>
  single(baseUrl, "api_color_grade", [
    imageB64, p.grade_name, p.intensity, p.exposure,
    p.contrast ?? -999, p.highlights ?? -999, p.shadows ?? -999,
    p.temperature ?? -999, p.saturation ?? -999,
    p.vibrance, p.vignette ?? -999, p.grain ?? -999,
  ]);

export interface RetouchParams {
  skin_smooth: number;
  clarity: number;
  sharpen: number;
  vibrance: number;
  shadow_lift: number;
  teeth_whiten: number;
}

export const apiRetouch = (baseUrl: string, imageB64: string, p: RetouchParams) =>
  single(baseUrl, "api_retouch", [
    imageB64, p.skin_smooth, p.clarity, p.sharpen,
    p.vibrance, p.shadow_lift, p.teeth_whiten,
  ]);

export const apiDenoise = (
  baseUrl: string, imageB64: string,
  strength: number, mode: string, preserveColor: boolean
) => single(baseUrl, "api_denoise", [imageB64, strength, mode, preserveColor]);

export const apiEffect = (
  baseUrl: string, imageB64: string,
  effect: string, params: Record<string, unknown>
) => single(baseUrl, "api_effect", [imageB64, effect, params]);

// ── AI Enhance (GPU) ──────────────────────────────────────────────────────────

export const apiUpscale = (baseUrl: string, imageB64: string, scale: number) =>
  single(baseUrl, "api_upscale", [imageB64, scale]);

export const apiFaceEnhance = (
  baseUrl: string, imageB64: string,
  upscaleStrength: number, retouchStrength: number
) => single(baseUrl, "api_face_enhance", [imageB64, upscaleStrength, retouchStrength]);

export const apiBgBlur = (
  baseUrl: string, imageB64: string,
  blurAmount: number, useDepth: boolean, subjectType: string
) => single(baseUrl, "api_bg_blur", [imageB64, blurAmount, useDepth, subjectType]);

// ── AI Transform (GPU) ────────────────────────────────────────────────────────

export const apiBgSwap = (
  baseUrl: string, imageB64: string,
  subjectType: string, styleName: string, numVariants: number
) => multi(baseUrl, "api_bg_swap", [imageB64, subjectType, styleName, numVariants]);

export const apiStyleFilter = (
  baseUrl: string, imageB64: string, styleName: string, strength: number
) => single(baseUrl, "api_style_filter", [imageB64, styleName, strength]);

export const apiRemoveObject = (baseUrl: string, imageB64: string, maskB64: string) =>
  single(baseUrl, "api_remove_object", [imageB64, maskB64]);

export const apiOutpaint = (
  baseUrl: string, imageB64: string,
  direction: string, amount: number, prompt: string
) => single(baseUrl, "api_outpaint", [imageB64, direction, amount, prompt]);

// ── Generate ──────────────────────────────────────────────────────────────────

export interface Text2ImgParams {
  prompt: string;
  negative_prompt: string;
  style: string;
  width: number;
  height: number;
  steps: number;
  seed: number;
  num_images: number;
}

export const apiText2Img = (baseUrl: string, p: Text2ImgParams) =>
  multi(baseUrl, "api_text2img", [
    p.prompt, p.negative_prompt, p.style,
    p.width, p.height, p.steps, p.seed, p.num_images,
  ]);
