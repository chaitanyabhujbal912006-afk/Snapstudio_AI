"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import UploadZone from "@/app/components/UploadZone";
import ResultPanel from "@/app/components/ResultPanel";
import { useBackend } from "@/app/context/BackendContext";
import { apiEnhance } from "@/app/lib/api";

export default function EnhanceTab() {
  const { backendUrl, isConnected } = useBackend();
  const [preview, setPreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleFile = useCallback((file: File, b64: string) => {
    setPreview(b64);
    setImageB64(b64);
    setResult(null);
    setError("");
  }, []);

  const handleRun = async () => {
    if (!imageB64 || !isConnected) return;
    setIsProcessing(true);
    setError("");
    const res = await apiEnhance(backendUrl, imageB64);
    setIsProcessing(false);
    if (res.success) setResult(res.data);
    else setError(res.error);
  };

  const handleDownload = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = "snapstudio-enhanced.png";
    a.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
          <Sparkles size={18} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">Auto-Enhance</h2>
          <p className="text-zinc-500 text-sm mt-0.5">
            Instantly fixes lighting, color balance, contrast, and sharpness — no AI model, so it&apos;s near-instant (~1–2 sec).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Original</p>
          <UploadZone onFile={handleFile} preview={preview} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Enhanced</p>
          <ResultPanel
            result={result}
            isProcessing={isProcessing}
            placeholder={{ icon: "✨", text: "Enhanced result will appear here" }}
            onDownload={handleDownload}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-950/50 border border-red-500/20 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleRun}
        disabled={!imageB64 || !isConnected || isProcessing}
        className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-200
          bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500
          disabled:opacity-40 disabled:cursor-not-allowed
          shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50
          text-white cursor-pointer"
      >
        {isProcessing ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Enhance Photo
          </>
        )}
      </button>

      {!isConnected && (
        <p className="text-center text-xs text-zinc-600">
          Connect a GPU backend above to enable processing
        </p>
      )}
    </motion.div>
  );
}
