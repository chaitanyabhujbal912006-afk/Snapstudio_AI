import { NextResponse } from "next/server";

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
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Target server returned status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const targetUrl = request.headers.get("x-target-url");
    if (!targetUrl) {
      return NextResponse.json({ error: "Missing x-target-url header" }, { status: 400 });
    }

    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Target server returned status ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.text();
    return new Response(data, {
      headers: { 
        "Content-Type": "text/plain",
        "Cache-Control": "no-store, max-age=0"
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
