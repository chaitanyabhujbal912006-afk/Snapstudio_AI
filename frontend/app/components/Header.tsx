"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Loader2, Zap, Link2, X } from "lucide-react";
import { useBackend } from "@/app/context/BackendContext";

// ── All backend logic is UNCHANGED — only visual markup is updated ──

export default function Header() {
  const { isConnected, isConnecting, connect, connectionError } = useBackend();
  const [inputUrl, setInputUrl] = useState("");
  const [localError, setLocalError] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  const handleConnect = async () => {
    if (!inputUrl.trim()) {
      setLocalError("Please enter a backend URL");
      return;
    }
    setLocalError("");
    await connect(inputUrl.trim());
  };

  const displayError = localError || connectionError;

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Film strip top accent */}
      <div
        style={{
          height: 6,
          background: "var(--bg-raised)",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          paddingInline: 16,
          gap: 8,
          overflow: "hidden",
        }}
      >
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: 4,
              borderRadius: 2,
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}
          />
        ))}
      </div>

      {/* Main header bar */}
      <div
        style={{
          background: "rgba(8,8,16,0.85)",
          backdropFilter: "blur(24px) saturate(160%)",
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
        }}
      >
        <div
          className="max-w-7xl mx-auto flex items-center justify-between gap-4"
          style={{ padding: "10px 24px" }}
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 shrink-0"
          >
            <div
              style={{
                width: 34, height: 34,
                borderRadius: 9,
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(245,158,11,0.28)",
              }}
            >
              <Zap size={16} fill="#1a0e00" color="#1a0e00" />
            </div>
            <div style={{ lineHeight: 1 }}>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "0.92rem",
                  letterSpacing: "0.01em",
                  color: "var(--text-primary)",
                  display: "block",
                }}
              >
                Snap<span style={{ color: "var(--amber)" }}>Studio</span>
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.55rem",
                  color: "var(--amber)",
                  letterSpacing: "0.18em",
                  display: "block",
                  marginTop: 1,
                }}
              >
                AI · WORKSPACE
              </span>
            </div>
          </motion.div>

          {/* Backend connector — logic completely unchanged */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col items-end gap-1"
          >
            <div className="flex items-center gap-3">
              {/* Connection status badge */}
              <AnimatePresence mode="wait">
                {isConnecting ? (
                  <motion.div
                    key="connecting"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "5px 12px",
                      borderRadius: 100,
                      background: "rgba(245,158,11,0.1)",
                      border: "1px solid rgba(245,158,11,0.25)",
                    }}
                  >
                    <Loader2 size={11} style={{ color: "var(--amber)", animation: "spin 1s linear infinite" }} className="animate-spin" />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", color: "var(--amber)" }}>
                      LINKING GPU…
                    </span>
                  </motion.div>
                ) : isConnected ? (
                  <motion.div
                    key="connected"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "5px 12px",
                      borderRadius: 100,
                      background: "rgba(52,211,153,0.08)",
                      border: "1px solid rgba(52,211,153,0.25)",
                    }}
                  >
                    <div
                      style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#34d399",
                        boxShadow: "0 0 6px rgba(52,211,153,0.6)",
                        animation: "pulse-glow 2s ease-in-out infinite",
                      }}
                    />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", color: "#34d399" }}>
                      GPU ONLINE
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="disconnected"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "5px 12px",
                      borderRadius: 100,
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.25)",
                    }}
                  >
                    <div
                      style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#ef4444",
                        boxShadow: "0 0 6px rgba(239,68,68,0.6)",
                      }}
                    />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.1em", color: "#ef4444" }}>
                      GPU OFFLINE
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* URL input + connect button — visible only when expanded */}
              <AnimatePresence>
                {showManualInput && (
                  <motion.div
                    initial={{ opacity: 0, width: 0, scale: 0.95 }}
                    animate={{ opacity: 1, width: "auto", scale: 1 }}
                    exit={{ opacity: 0, width: 0, scale: 0.95 }}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: 10,
                      padding: "4px 4px 4px 12px",
                      backdropFilter: "blur(8px)",
                      overflow: "hidden",
                    }}
                  >
                    <Wifi size={12} style={{ color: "var(--text-dim)", flexShrink: 0 }} />
                    <input
                      type="text"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                      placeholder="https://xxxxxxxx.gradio.live"
                      style={{
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.72rem",
                        color: "var(--text-primary)",
                        width: 200,
                        letterSpacing: "0.02em",
                      }}
                      className="placeholder:text-zinc-700"
                    />
                    <button
                      onClick={handleConnect}
                      disabled={isConnecting}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 7,
                        background: isConnected
                          ? "rgba(52,211,153,0.15)"
                          : "linear-gradient(135deg, #f59e0b, #d97706)",
                        color: isConnected ? "#34d399" : "#1a0e00",
                        border: isConnected ? "1px solid rgba(52,211,153,0.3)" : "none",
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        letterSpacing: "0.04em",
                        cursor: isConnecting ? "not-allowed" : "pointer",
                        opacity: isConnecting ? 0.5 : 1,
                        transition: "all 0.2s",
                        display: "flex", alignItems: "center", gap: 5,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isConnecting ? <Loader2 size={11} className="animate-spin" /> : null}
                      {isConnecting ? "Linking…" : isConnected ? "Reconnect" : "Link CPU"}
                    </button>
                    <button
                      onClick={() => setShowManualInput(false)}
                      style={{
                        padding: 6,
                        marginInlineEnd: 2,
                        borderRadius: 6,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-dim)",
                        display: "flex", alignItems: "center",
                        transition: "color 0.2s",
                      }}
                      className="hover:text-zinc-300"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {!showManualInput && (
                <button
                  onClick={() => setShowManualInput(true)}
                  style={{
                    padding: 8,
                    borderRadius: 9,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border-subtle)",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                    display: "flex", alignItems: "center",
                    transition: "all 0.2s",
                  }}
                  title="Configure manual GPU link override"
                  className="hover:text-amber-500 hover:border-amber-500/25"
                >
                  <Link2 size={12} />
                </button>
              )}
            </div>

            {displayError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  fontSize: "0.68rem",
                  color: "#f87171",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.04em",
                  paddingRight: 4,
                }}
              >
                ✕ {displayError}
              </motion.p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.2), transparent)",
        }}
      />
    </header>
  );
}
