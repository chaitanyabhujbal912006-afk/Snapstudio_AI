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
}

const BackendContext = createContext<BackendContextType | null>(null);

/** Parse a Gradio SSE stream text and return the data payload array */
function parseGradioSSE(text: string): unknown[] | null {
  // Gradio sends: "event: complete\ndata: [...]\n\n"
  // Try to find the last `data:` line that contains a JSON array
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

  const connect = useCallback(async (url: string): Promise<boolean> => {
    const trimmed = url.replace(/\/$/, "");
    setIsConnecting(true);
    setIsConnected(false);
    try {
      const isRemote = trimmed.includes(".gradio.live") || trimmed.startsWith("https://");

      // ── STEP 1: POST to kick off the preset call ──────────────────────────
      let postRes: Response;
      if (isRemote) {
        postRes = await fetch("/api/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-target-url": `${trimmed}/call/api_get_presets`,
          },
          body: JSON.stringify({ data: [] }),
        });
      } else {
        postRes = await fetch(`${trimmed}/call/api_get_presets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: [] }),
        });
      }

      if (!postRes.ok) {
        const errText = await postRes.text().catch(() => "");
        throw new Error(`POST failed ${postRes.status}: ${errText}`);
      }

      const postJson = await postRes.json();
      const eventId: string = postJson.event_id;
      if (!eventId) throw new Error("No event_id in POST response");

      // ── STEP 2: GET the SSE result ────────────────────────────────────────
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

      if (!getRes.ok) throw new Error(`GET poll failed ${getRes.status}`);

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
      console.error("[BackendContext] Connection error:", err);
      setIsConnected(false);
      setIsConnecting(false);
      return false;
    }
  }, []);

  return (
    <BackendContext.Provider value={{ backendUrl, setBackendUrl, isConnected, isConnecting, connect, presets }}>
      {children}
    </BackendContext.Provider>
  );
}

export function useBackend() {
  const ctx = useContext(BackendContext);
  if (!ctx) throw new Error("useBackend must be used within BackendProvider");
  return ctx;
}
