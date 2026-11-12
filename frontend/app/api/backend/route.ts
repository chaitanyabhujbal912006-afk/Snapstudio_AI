import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Fetch settings from environment
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ROLE_KEY || "";
const registrySecret = process.env.SECRET_REGISTRY_KEY || "";

const isDbConfigured = supabaseUrl && supabaseServiceKey;

// Helper to create client conditionally
const getSupabaseClient = () => {
  if (!isDbConfigured) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
};

// GET: Returns the currently active registered Gradio URL
export async function GET() {
  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      // DB not configured yet — return empty URL without leaking env var state
      console.warn("[Registry GET] Supabase is not configured yet.");
      return NextResponse.json({ url: "" });
    }

    const { data, error } = await supabase
      .from("system_registry")
      .select("url")
      .eq("id", 1)
      .single();

    if (error) {
      // Log the real error server-side; return a generic message to the client
      console.error("[Registry GET] Database query failed:", error.message);
      return NextResponse.json({ error: "Registry unavailable" }, { status: 500 });
    }

    return NextResponse.json({ url: data?.url || "" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Registry GET] Exception occurred:", msg);
    return NextResponse.json({ error: "Registry unavailable" }, { status: 500 });
  }
}

// POST: Updates the active Gradio URL (called from the Kaggle startup script)
export async function POST(req: Request) {
  try {
    const { url, secret } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Missing backend url parameters" }, { status: 400 });
    }

    // Reject when secret env var is unset (prevents unauthenticated writes)
    // or when the provided secret doesn't match.
    if (!registrySecret || secret !== registrySecret) {
      console.warn("[Registry POST] Unauthorized registry attempt.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("[Registry POST] Supabase is not configured on this Vercel deployment.");
      return NextResponse.json({ error: "Database configuration missing on host server" }, { status: 500 });
    }

    // Upsert to ensure row id=1 exists and is updated
    const { error } = await supabase
      .from("system_registry")
      .upsert(
        { id: 1, url, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );

    if (error) {
      console.error("[Registry POST] Database upsert failed:", error.message);
      return NextResponse.json({ error: "Registry update failed" }, { status: 500 });
    }

    console.log("[Registry POST] Successfully updated active Gradio link to:", url);
    return NextResponse.json({ success: true, message: "URL registry sync complete" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Registry POST] Exception occurred:", msg);
    return NextResponse.json({ error: "Registry update failed" }, { status: 500 });
  }
}
