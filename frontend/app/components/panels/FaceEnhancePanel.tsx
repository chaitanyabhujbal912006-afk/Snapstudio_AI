"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Scan, Loader2 } from "lucide-react";
import UploadZone from "@/app/components/UploadZone";
import ResultPanel from "@/app/components/ResultPanel";
import { useBackend } from "@/app/context/BackendContext";
import { apiFaceEnhance } from "@/app/lib/api";

export default function FaceEnhancePanel() {
  const { backendUrl, isConnected } = useBackend();
  const [preview, setPreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [upscaleStr, setUpscaleStr] = useState(1.0);
  const [retouchStr, setRetouchStr] = useState(0.4);

  const handleFile = useCallback((file: File, b64: string) => {
    setPreview(b64); setImageB64(b64); setResult(null); setError("");
  }, []);

  const handleRun = async () => {
    if (!imageB64 || !isConnected) return;
    setIsProcessing(true); setError("");
    const res = await apiFaceEnhance(backendUrl, imageB64, upscaleStr, retouchStr);
    setIsProcessing(false);
    if (res.success) setResult(res.data); else setError(res.error);
  };

  const download = (url: string) => { const a = document.createElement("a"); a.href = url; a.download = "snapstudio-face.png"; a.click(); };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
          <Scan size={18} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">Face Restore</h2>
          <p className="text-zinc-500 text-sm">Detects faces, AI super-resolves each one (Swin2SR), then blends enhanced faces back seamlessly. ~10–25s.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Original</p><UploadZone onFile={handleFile} preview={preview} /></div>
        <div className="space-y-2"><p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Enhanced</p><ResultPanel result={result} isProcessing={isProcessing} placeholder={{ icon: "👤", text: "Enhanced faces will appear here" }} onDownload={download} /></div>
      </div>

      {/* Steps diagram */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { n: "1", title: "Detect", desc: "DNN face detector locates every face" },
          { n: "2", title: "Restore", desc: "Swin2SR AI upscales each face region" },
          { n: "3", title: "Blend", desc: "Feathered composite back into original" },
        ].map(step => (
          <div key={step.n} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
            <div className="w-6 h-6 rounded-full bg-violet-600/30 text-violet-300 text-xs font-bold flex items-center justify-center mx-auto mb-2">{step.n}</div>
            <p className="text-xs font-medium text-zinc-300">{step.title}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-zinc-500">AI Restore Strength</label>
            <span className="text-xs text-white">{upscaleStr.toFixed(2)}</span>
          </div>
          <input type="range" min={0} max={1} step={0.05} value={upscaleStr}
            onChange={(e) => setUpscaleStr(Number(e.target.value))} className="w-full accent-violet-500" />
          <div className="flex justify-between text-[10px] text-zinc-700 mt-1"><span>Subtle blend</span><span>Full AI</span></div>
        </div>
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-zinc-500">Retouch Strength</label>
            <span className="text-xs text-white">{retouchStr.toFixed(2)}</span>
          </div>
          <input type="range" min={0} max={1} step={0.05} value={retouchStr}
            onChange={(e) => setRetouchStr(Number(e.target.value))} className="w-full accent-violet-500" />
          <div className="flex justify-between text-[10px] text-zinc-700 mt-1"><span>Off</span><span>Smooth skin</span></div>
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-950/50 border border-red-500/20 px-4 py-3 text-red-400 text-sm">{error}</div>}

      <button onClick={handleRun} disabled={!imageB64 || !isConnected || isProcessing}
        className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer shadow-lg shadow-purple-900/30">
        {isProcessing ? <><Loader2 size={16} className="animate-spin" />Restoring Faces…</> : <><Scan size={16} />Restore Faces</>}
      </button>
    </motion.div>
  );
}
