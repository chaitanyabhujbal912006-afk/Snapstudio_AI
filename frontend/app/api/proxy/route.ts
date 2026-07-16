import { NextResponse } from "next/server";

export const runtime = "nodejs";        // required for streaming / long-lived connections
export const maxDuration = 300;         // 5-min ceiling on Vercel — covers GPU ops (bg-swap ~2min, inpaint ~4min)
export const dynamic = "force-dynamic"; // never cache proxy responses

// ── Helpers ────────────────────────────────────────────────────────────────────

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-target-url",
  };
}

/** Preflight (OPTIONS) — required for browsers hitting the proxy from a different origin */
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

// ── POST — kick off a Gradio job, returns { event_id } ───────────────────────

export async function POST(request: Request) {
  try {
    const targetUrl = request.headers.get("x-target-url");
    if (!targetUrl) {
      return NextResponse.json(
        { error: "Missing x-target-url header" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Parse body (may be large — 4K base64 images up to ~8 MB)
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // 25-second timeout to get the event_id — if the backend doesn't respond, fail fast
    const controller = new AbortController();
    const timerId = setTimeout(() => controller.abort(), 25_000);

    let response: Response;
    try {
      response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timerId);
    }

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      return NextResponse.json(
        { error: `Backend returned HTTP ${response.status}`, detail: errBody },
        { status: response.status, headers: corsHeaders() }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { headers: corsHeaders() });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const isTimeout = msg.includes("abort") || msg.includes("timeout");
    console.error("[proxy POST]", msg);
    return NextResponse.json(
      { error: isTimeout ? "Backend did not respond within 25 s — is it running?" : msg },
      { status: isTimeout ? 504 : 500, headers: corsHeaders() }
    );
  }
}

// ── GET — stream the Gradio SSE result back to the client ────────────────────

export async function GET(request: Request) {
  try {
    const targetUrl = request.headers.get("x-target-url");
    if (!targetUrl) {
      return NextResponse.json(
        { error: "Missing x-target-url header" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // No AbortSignal timeout here — GPU jobs can take 1-4+ minutes.
    // The Vercel maxDuration = 300 is the hard ceiling.
    const upstream = await fetch(targetUrl, {
      headers: {
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });

    if (!upstream.ok) {
      const errBody = await upstream.text().catch(() => "");
      return NextResponse.json(
        { error: `Backend returned HTTP ${upstream.status}`, detail: errBody },
        { status: upstream.status, headers: corsHeaders() }
      );
    }

    if (!upstream.body) {
      return NextResponse.json(
        { error: "No body in upstream SSE response" },
        { status: 502, headers: corsHeaders() }
      );
    }

    // Pipe the ReadableStream straight through — zero buffering, no timeout risk.
    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...corsHeaders(),
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no", // disable nginx buffering on Vercel edge
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[proxy GET]", msg);
    return NextResponse.json(
      { error: msg },
      { status: 500, headers: corsHeaders() }
    );
  }
}
