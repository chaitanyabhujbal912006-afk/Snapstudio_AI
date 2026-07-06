"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Maximize2, Loader2, ArrowUp } from "lucide-react";
import UploadZone from "@/app/components/UploadZone";
import ResultPanel from "@/app/components/ResultPanel";
import { useBackend } from "@/app/context/BackendContext";
import { apiUpscale } from "@/app/lib/api";

export default function UpscalePanel() {
  const { backendUrl, isConnected } = useBackend();
  const [preview, setPreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [scale, setScale] = useState(4);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);

  const handleFile = useCallback((file: File, b64: string) => {
    setPreview(b64); setImageB64(b64); setResult(null); setError("");
    const img = new Image();
    img.onload = () => setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = b64;
  }, []);

  const handleRun = async () => {
    if (!imageB64 || !isConnected) return;
    setIsProcessing(true); setError("");
    const res = await apiUpscale(backendUrl, imageB64, scale);
    setIsProcessing(false);
    if (res.success) setResult(res.data); else setError(res.error);
  };

  const download = (url: string) => { const a = document.createElement("a"); a.href = url; a.download = `snapstudio-${scale}x.png`; a.click(); };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
          <Maximize2 size={18} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">AI Upscale</h2>
          <p className="text-zinc-500 text-sm">Swin2SR transformer model — recovers genuine detail, not just bicubic blur. ~5–15s on T4 GPU.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Original</p><UploadZone onFile={handleFile} preview={preview} /></div>
        <div className="space-y-2"><p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Upscaled</p><ResultPanel result={result} isProcessing={isProcessing} placeholder={{ icon: "🔍", text: "High-res result will appear here" }} onDownload={download} /></div>
      </div>

      {/* Scale selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Scale Factor</label>
        <div className="grid grid-cols-2 gap-3">
          {[2, 4].map(s => (
            <button key={s} onClick={() => setScale(s)}
              className={`py-4 rounded-xl border text-center transition-all cursor-pointer ${scale === s ? "border-violet-500/50 bg-violet-600/20 text-white" : "border-white/10 bg-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300"}`}>
              <div className="text-2xl font-bold">{s}×</div>
              {imgSize && (
                <div className="text-xs mt-1 text-zinc-500">
                  {imgSize.w * s} × {imgSize.h * s} px
                </div>
              )}
              <div className="text-[10px] text-zinc-600 mt-0.5">
                {s === 4 ? "Maximum quality" : "Faster, less VRAM"}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 text-xs text-zinc-500 space-y-1">
        <p>⚡ <strong className="text-zinc-300">Model:</strong> Swin2SR (realworld-sr, HuggingFace)</p>
        <p>📐 <strong className="text-zinc-300">Input limit:</strong> Tiled processing — handles any size</p>
        <p>💾 <strong className="text-zinc-300">Output:</strong> Full PNG, no compression artifacts</p>
      </div>

      {error && <div className="rounded-xl bg-red-950/50 border border-red-500/20 px-4 py-3 text-red-400 text-sm">{error}</div>}

      <button onClick={handleRun} disabled={!imageB64 || !isConnected || isProcessing}
        className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer shadow-lg shadow-purple-900/30">
        {isProcessing ? <><Loader2 size={16} className="animate-spin" />Upscaling…</> : <><ArrowUp size={16} />Upscale {scale}×</>}
      </button>
    </motion.div>
  );
}
