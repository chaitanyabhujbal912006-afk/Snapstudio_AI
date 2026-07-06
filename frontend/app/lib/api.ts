/**
 * Gradio API helpers — calls the Kaggle backend's Gradio API endpoints.
 * All images are sent/received as base64 data URIs.
 */

type ApiResult<T> = { success: true; data: T } | { success: false; error: string };

async function gradioCall(
  baseUrl: string,
  fnName: string,
  payload: unknown[]
): Promise<unknown[]> {
  const postRes = await fetch(`${baseUrl}/call/${fnName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  });
  if (!postRes.ok) throw new Error(`POST ${fnName} failed: ${postRes.status}`);
  const { event_id } = await postRes.json();

  const getRes = await fetch(`${baseUrl}/call/${fnName}/${event_id}`);
  if (!getRes.ok) throw new Error(`GET ${fnName} result failed`);
  const text = await getRes.text();

  // Gradio SSE format: "data: <json>\n\n"
  const match = text.match(/data:\s*(\[[\s\S]*?\])\n\n/);
  if (!match) throw new Error("Could not parse Gradio response");
  return JSON.parse(match[1]);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function apiEnhance(
  baseUrl: string,
  imageB64: string
): Promise<ApiResult<string>> {
  try {
    const [result] = await gradioCall(baseUrl, "api_enhance", [imageB64]);
    const r = result as { success: boolean; image?: string; error?: string };
    if (!r.success) return { success: false, error: r.error ?? "Unknown error" };
    return { success: true, data: r.image! };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function apiStyleFilter(
  baseUrl: string,
  imageB64: string,
  styleName: string,
  strength: number
): Promise<ApiResult<string>> {
  try {
    const [result] = await gradioCall(baseUrl, "api_style_filter", [imageB64, styleName, strength]);
    const r = result as { success: boolean; image?: string; error?: string };
    if (!r.success) return { success: false, error: r.error ?? "Unknown error" };
    return { success: true, data: r.image! };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function apiBgSwap(
  baseUrl: string,
  imageB64: string,
  subjectType: string,
  styleName: string,
  numVariants: number
): Promise<ApiResult<string[]>> {
  try {
    const [result] = await gradioCall(baseUrl, "api_bg_swap", [imageB64, subjectType, styleName, numVariants]);
    const r = result as { success: boolean; images?: string[]; error?: string };
    if (!r.success) return { success: false, error: r.error ?? "Unknown error" };
    return { success: true, data: r.images! };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function apiRemoveObject(
  baseUrl: string,
  imageB64: string,
  maskB64: string
): Promise<ApiResult<string>> {
  try {
    const [result] = await gradioCall(baseUrl, "api_remove_object", [imageB64, maskB64]);
    const r = result as { success: boolean; image?: string; error?: string };
    if (!r.success) return { success: false, error: r.error ?? "Unknown error" };
    return { success: true, data: r.image! };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}
