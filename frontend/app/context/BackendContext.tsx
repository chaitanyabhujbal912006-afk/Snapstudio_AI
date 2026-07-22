"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface BackendPresets {
  bg_styles: string[];
  style_filters: string[];
  color_grades: string[];
  t2i_styles: string[];
  outpaint_directions: string[];
  effect_types: string[];
  has_gpu: boolean;
  gpu_name: string;
}

interface BackendContextType {
  backendUrl: string;
  setBackendUrl: (url: string) => void;
  isConnected: boolean;
  isConnecting: boolean;
  connect: (url: string) => Promise<boolean>;
  presets: BackendPresets | null;
  connectionError: string;
}

const BackendContext = createContext<BackendContextType | null>(null);

/** Parse a Gradio SSE stream text and return the data payload array */
function parseGradioSSE(text: string): unknown[] | null {
  // Gradio sends: "event: complete\ndata: [...]\n\n"
  // Find the last `data:` line that contains a JSON array
  const lines = text.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith("data:")) {
      const raw = line.slice(5).trim();
      if (raw.startsWith("[")) {
        try {
          return JSON.parse(raw);
        } catch {
          // keep looking
        }
      }
    }
  }
  return null;
}

export function BackendProvider({ children }: { children: ReactNode }) {
  const [backendUrl, setBackendUrl] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [presets, setPresets] = useState<BackendPresets | null>(null);
  const [connectionError, setConnectionError] = useState("");

  const connect = useCallback(async (url: string): Promise<boolean> => {
    // Normalize URL — strip trailing slash
    const trimmed = url.trim().replace(/\/$/, "");
    if (!trimmed) return false;

    setIsConnecting(true);
    setIsConnected(false);
    setConnectionError("");

    const isRemote =
      trimmed.includes(".gradio.live") ||
      trimmed.startsWith("https://") ||
      trimmed.includes("gradio.app");

    try {
      // ── STEP 1: POST to kick off the api_get_presets call ──────────────────
      let postRes: Response;
      if (isRemote) {
        postRes = await fetch("/api/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-target-url": `${trimmed}/call/api_get_presets`,
          },
          body: JSON.stringify({ data: [] }),
          signal: AbortSignal.timeout(30_000), // 30 s — fail fast if backend unreachable
        });
      } else {
        postRes = await fetch(`${trimmed}/call/api_get_presets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: [] }),
          signal: AbortSignal.timeout(30_000),
        });
      }

      if (!postRes.ok) {
        let errMsg = `HTTP ${postRes.status}`;
        try {
          const body = await postRes.json();
          if (body.detail) errMsg += `: ${body.detail}`;
          else if (body.error) errMsg += `: ${body.error}`;
        } catch { /* not JSON */ }
        throw new Error(`Backend connection failed — ${errMsg}`);
      }

      const postJson = await postRes.json();
      const eventId: string = postJson.event_id;
      if (!eventId) {
        throw new Error(
          "Backend responded but returned no event_id — " +
          "make sure the Gradio server started correctly."
        );
      }

      // ── STEP 2: GET the SSE result ─────────────────────────────────────────
      let getRes: Response;
      if (isRemote) {
        getRes = await fetch("/api/proxy", {
          method: "GET",
          headers: {
            "x-target-url": `${trimmed}/call/api_get_presets/${eventId}`,
          },
        });
      } else {
        getRes = await fetch(`${trimmed}/call/api_get_presets/${eventId}`);
      }

      if (!getRes.ok) {
        throw new Error(`GET poll failed — HTTP ${getRes.status}`);
      }

      const sseText = await getRes.text();
      const parsed = parseGradioSSE(sseText);

      if (parsed && parsed[0]) {
        setPresets(parsed[0] as BackendPresets);
      }

      setBackendUrl(trimmed);
      setIsConnected(true);
      setIsConnecting(false);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const friendly = msg.includes("abort") || msg.includes("timeout")
        ? "Connection timed out — is the Kaggle backend running and the URL correct?"
        : msg;
      console.error("[BackendContext] Connection error:", msg);
      setConnectionError(friendly);
      setIsConnected(false);
      setIsConnecting(false);
      return false;
    }
  }, []);

  React.useEffect(() => {
    const autoConnect = async () => {
      try {
        const res = await fetch("/api/backend", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data.url) {
            console.log("[BackendContext] Auto-connecting to synced USP/Kaggle link:", data.url);
            await connect(data.url);
          }
        }
      } catch (err) {
        console.error("[BackendContext] Failed to retrieve registered URL:", err);
      }
    };
    autoConnect();
  }, [connect]);

  return (
    <BackendContext.Provider
      value={{ backendUrl, setBackendUrl, isConnected, isConnecting, connect, presets, connectionError }}
    >
      {children}
    </BackendContext.Provider>
  );
}

export function useBackend() {
  const ctx = useContext(BackendContext);
  if (!ctx) throw new Error("useBackend must be used within BackendProvider");
  return ctx;
}
