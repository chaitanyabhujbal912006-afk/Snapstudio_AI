"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Loader2, Zap } from "lucide-react";
import { useBackend } from "@/app/context/BackendContext";

export default function Header() {
  const { isConnected, isConnecting, connect, connectionError } = useBackend();
  const [inputUrl, setInputUrl] = useState("");
  const [localError, setLocalError] = useState("");

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
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5 shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-900/40">
            <Zap size={16} className="text-white" fill="white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            Snap<span className="text-violet-400">Studio</span>{" "}
            <span className="text-xs font-semibold bg-violet-600/20 text-violet-300 border border-violet-500/30 rounded-full px-2 py-0.5 ml-1">
              AI
            </span>
          </span>
        </motion.div>

        {/* Backend connector */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col items-end gap-1"
        >
          <div className="flex items-center gap-2">
            {/* Status indicator */}
            <div className="flex items-center gap-1.5">
              <AnimatePresence mode="wait">
                {isConnecting ? (
                  <motion.div key="connecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Loader2 size={14} className="text-violet-400 animate-spin" />
                  </motion.div>
                ) : isConnected ? (
                  <motion.div key="connected" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ opacity: 0 }}>
                    <Wifi size={14} className="text-emerald-400" />
                  </motion.div>
                ) : (
                  <motion.div key="disconnected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <WifiOff size={14} className="text-zinc-500" />
                  </motion.div>
                )}
              </AnimatePresence>
              <span className={`text-xs font-medium ${isConnected ? "text-emerald-400" : isConnecting ? "text-violet-400" : "text-zinc-500"}`}>
                {isConnecting ? "Connecting…" : isConnected ? "GPU Connected" : "Not connected"}
              </span>
            </div>

            {/* Input + button */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 backdrop-blur-sm">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                placeholder="https://xxxxxxxx.gradio.live"
                className="bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none px-3 w-60 font-mono"
              />
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all duration-200 shadow-md shadow-purple-900/30 flex items-center gap-1.5 cursor-pointer"
              >
                {isConnecting ? <Loader2 size={12} className="animate-spin" /> : null}
                {isConnecting ? "Connecting" : isConnected ? "Reconnect" : "Connect"}
              </button>
            </div>
          </div>
          {displayError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-400 mr-1"
            >
              {displayError}
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* Separator line with glow */}
      <div className="h-px bg-gradient-to-r from-transparent via-violet-600/30 to-transparent" />
    </header>
  );
}
