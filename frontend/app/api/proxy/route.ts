import { NextResponse } from "next/server";

export const runtime = "nodejs"; // required for streaming/long-lived connections
export const maxDuration = 120;   // 2-minute timeout for GPU operations

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
        { error: `Target returned ${response.status}`, detail: errBody },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const targetUrl = request.headers.get("x-target-url");
    if (!targetUrl) {
      return NextResponse.json({ error: "Missing x-target-url header" }, { status: 400 });
    }

    // Must send Accept: text/event-stream so Gradio returns SSE format
    const response = await fetch(targetUrl, {
      headers: {
        "Accept": "text/event-stream",
      },
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      return NextResponse.json(
        { error: `Target returned ${response.status}`, detail: errBody },
        { status: response.status }
      );
    }

    // Read full SSE body and return as plain text
    const data = await response.text();
    return new Response(data, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
