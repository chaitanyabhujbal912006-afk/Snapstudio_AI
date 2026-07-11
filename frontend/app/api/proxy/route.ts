import { NextResponse } from "next/server";

export const runtime = "nodejs";     // required for streaming/long-lived connections
export const maxDuration = 300;      // 5-min ceiling — covers GPU operations (bg-swap ~2min, inpaint ~4min)
export const dynamic = "force-dynamic"; // never cache proxy responses

export async function POST(request: Request) {
  try {
    const targetUrl = request.headers.get("x-target-url");
    if (!targetUrl) {
      return NextResponse.json({ error: "Missing x-target-url header" }, { status: 400 });
    }

    const body = await request.json();

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "*/*",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      return NextResponse.json(
        { error: `Backend returned HTTP ${response.status}`, detail: errBody },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[proxy POST]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const targetUrl = request.headers.get("x-target-url");
    if (!targetUrl) {
      return NextResponse.json({ error: "Missing x-target-url header" }, { status: 400 });
    }

    // Stream the Gradio SSE response directly to the client.
    // Buffering with response.text() caused Vercel timeouts on long GPU jobs.
    const upstream = await fetch(targetUrl, {
      headers: {
        "Accept": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });

    if (!upstream.ok) {
      const errBody = await upstream.text().catch(() => "");
      return NextResponse.json(
        { error: `Backend returned HTTP ${upstream.status}`, detail: errBody },
        { status: upstream.status }
      );
    }

    if (!upstream.body) {
      return NextResponse.json({ error: "No body in upstream SSE response" }, { status: 502 });
    }

    // Pipe the ReadableStream straight through — zero buffering, no timeout risk.
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",   // disable nginx buffering on Vercel edge
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[proxy GET]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

