"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Download } from "lucide-react";

interface ResultPanelProps {
  result?: string | null;
  results?: string[] | null;
  isProcessing: boolean;
  placeholder?: { icon: string; text: string };
  onDownload?: (url: string, index?: number) => void;
}

// Aperture-style processing spinner
function ApertureSpinner() {
  return (
    <div style={{ position: "relative", width: 72, height: 72 }}>
      {/* Outer ring */}
      <div
        style={{
          position: "absolute", inset: 0,
          borderRadius: "50%",
          border: "1.5px solid rgba(245,158,11,0.2)",
        }}
      />
      {/* Spinning ring */}
      <div
        className="animate-spin"
        style={{
          position: "absolute", inset: 0,
          borderRadius: "50%",
          border: "1.5px solid transparent",
          borderTopColor: "var(--amber)",
          borderRightColor: "rgba(245,158,11,0.3)",
        }}
      />
      {/* Inner counter-spin */}
      <div
        className="animate-spin"
        style={{
          position: "absolute", inset: 10,
          borderRadius: "50%",
          border: "1px solid transparent",
          borderTopColor: "var(--cyan)",
          animationDirection: "reverse",
          animationDuration: "0.9s",
        }}
      />
      {/* Center dot */}
      <div
        style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "var(--amber)",
            boxShadow: "0 0 12px rgba(245,158,11,0.6)",
            animation: "pulse-glow 1.5s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

export default function ResultPanel({
  result,
  results,
  isProcessing,
  placeholder = { icon: "✦", text: "Result will appear here" },
  onDownload,
}: ResultPanelProps) {
  const hasResult = result || (results && results.length > 0);

  return (
    <div
      style={{
        position: "relative",
        height: 280,
        borderRadius: 14,
        border: "1px solid var(--border-subtle)",
        background: "rgba(8,8,16,0.6)",
        overflow: "hidden",
      }}
    >
      <AnimatePresence mode="wait">
        {isProcessing ? (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 20,
            }}
          >
            <ApertureSpinner />
            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  fontSize: "0.82rem",
                  color: "var(--text-primary)",
                  marginBottom: 4,
                }}
              >
                Processing…
              </p>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.62rem",
                  letterSpacing: "0.1em",
                  color: "var(--text-dim)",
                }}
              >
                GPU IS RENDERING YOUR IMAGE
              </p>
            </div>
          </motion.div>
        ) : hasResult ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0 }}
          >
            {results ? (
              <div
                style={{
                  height: "100%",
                  display: "grid",
                  gap: 6, padding: 6,
                  gridTemplateColumns: results.length === 1 ? "1fr" : "1fr 1fr",
                }}
              >
                {results.map((src, i) => (
                  <div key={i} style={{ position: "relative", borderRadius: 10, overflow: "hidden" }} className="group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Result ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "contain", background: "rgba(0,0,0,0.3)" }} />
                    <button
                      onClick={() => onDownload?.(src, i)}
                      style={{
                        position: "absolute", bottom: 6, right: 6,
                        opacity: 0, transition: "opacity 0.2s",
                        background: "rgba(8,8,16,0.85)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid var(--border-medium)",
                        borderRadius: 7,
                        padding: "5px 8px",
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: "0.65rem",
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                      }}
                      className="group-hover:opacity-100"
                    >
                      <Download size={11} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ position: "relative", height: "100%" }} className="group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result!} alt="Result" style={{ width: "100%", height: "100%", objectFit: "contain" }} />

                {/* Corner frame decorations */}
                {["top-0 left-0 border-t-2 border-l-2",
                  "top-0 right-0 border-t-2 border-r-2",
                  "bottom-0 left-0 border-b-2 border-l-2",
                  "bottom-0 right-0 border-b-2 border-r-2",
                ].map((cls, i) => (
                  <div
                    key={i}
                    className={`absolute w-5 h-5 ${cls} opacity-0 group-hover:opacity-100 transition-opacity`}
                    style={{ borderColor: "var(--amber)", margin: 4, borderRadius: 3 }}
                  />
                ))}

                <button
                  onClick={() => onDownload?.(result!)}
                  style={{
                    position: "absolute", bottom: 10, right: 10,
                    opacity: 0, transition: "all 0.2s",
                    display: "flex", alignItems: "center", gap: 6,
                    background: "rgba(8,8,16,0.88)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    borderRadius: 9,
                    padding: "7px 14px",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    color: "var(--amber)",
                    cursor: "pointer",
                    letterSpacing: "0.02em",
                  }}
                  className="group-hover:opacity-100"
                >
                  <Download size={13} />
                  Save Image
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 52, height: 52, borderRadius: 13,
                border: "1px dashed var(--border-medium)",
                background: "rgba(255,255,255,0.015)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.5rem",
              }}
            >
              {placeholder.icon}
            </div>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.62rem",
                letterSpacing: "0.08em",
                color: "var(--text-dim)",
              }}
            >
              {placeholder.text.toUpperCase()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
