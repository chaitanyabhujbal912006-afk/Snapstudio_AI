"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2, Sparkles } from "lucide-react";

interface ResultPanelProps {
  result?: string | null;
  results?: string[] | null;
  isProcessing: boolean;
  placeholder?: { icon: string; text: string };
  onDownload?: (url: string, index?: number) => void;
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
    <div className="relative h-72 rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <AnimatePresence mode="wait">
        {isProcessing ? (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
          >
            {/* Animated gradient ring */}
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-2 border-violet-600/30" />
              <div className="absolute inset-0 rounded-full border-t-2 border-violet-500 animate-spin" />
              <div className="absolute inset-2 rounded-full border-t-2 border-purple-400/50 animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.9s" }} />
              <Sparkles size={20} className="absolute inset-0 m-auto text-violet-400 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-white/80 font-medium text-sm">Processing…</p>
              <p className="text-zinc-600 text-xs mt-1">GPU is working on your image</p>
            </div>
          </motion.div>
        ) : hasResult ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {results ? (
              // Gallery view for multiple results
              <div className={`h-full grid gap-2 p-2 ${results.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {results.map((src, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Result ${i + 1}`} className="w-full h-full object-contain bg-black/30" />
                    <button
                      onClick={() => onDownload?.(src, i)}
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200
                        bg-black/70 backdrop-blur-sm text-white rounded-lg p-1.5 hover:bg-violet-600
                        cursor-pointer"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              // Single image view
              <div className="relative h-full group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={result!} alt="Result" className="w-full h-full object-contain" />
                <button
                  onClick={() => onDownload?.(result!)}
                  className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200
                    flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white rounded-xl px-3 py-2
                    text-xs font-semibold hover:bg-violet-600 cursor-pointer"
                >
                  <Download size={13} /> Download
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
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          >
            <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
              {placeholder.icon}
            </div>
            <p className="text-zinc-600 text-sm">{placeholder.text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
