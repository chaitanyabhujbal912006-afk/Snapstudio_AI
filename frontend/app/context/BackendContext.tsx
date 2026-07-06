"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface BackendContextType {
  backendUrl: string;
  setBackendUrl: (url: string) => void;
  isConnected: boolean;
  isConnecting: boolean;
  connect: (url: string) => Promise<boolean>;
  presets: { styles: string[]; style_filters: string[] };
}

const BackendContext = createContext<BackendContextType | null>(null);

export function BackendProvider({ children }: { children: ReactNode }) {
  const [backendUrl, setBackendUrl] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [presets, setPresets] = useState<{ styles: string[]; style_filters: string[] }>({
    styles: [],
    style_filters: [],
  });

  const connect = useCallback(async (url: string): Promise<boolean> => {
    const trimmed = url.replace(/\/$/, "");
    setIsConnecting(true);
    setIsConnected(false);
    try {
      // Call Gradio API to get presets
      const res = await fetch(`${trimmed}/call/api_get_presets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [] }),
      });
      if (!res.ok) throw new Error("Connection failed");
      const json = await res.json();
      const eventId = json.event_id;

      // Poll for result
      const resultRes = await fetch(`${trimmed}/call/api_get_presets/${eventId}`);
      const text = await resultRes.text();
      const match = text.match(/data:\s*(\[[\s\S]*?\])/);
      if (match) {
        const data = JSON.parse(match[1]);
        const presetsData = data[0];
        setPresets(presetsData);
      }

      setBackendUrl(trimmed);
      setIsConnected(true);
      setIsConnecting(false);
      return true;
    } catch {
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
