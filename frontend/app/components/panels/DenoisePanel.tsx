"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Wind, Loader2 } from "lucide-react";
import UploadZone from "@/app/components/UploadZone";
import ResultPanel from "@/app/components/ResultPanel";
import { useBackend } from "@/app/context/BackendContext";
import { apiDenoise } from "@/app/lib/api";

const MODES = [
  { id: "light",    label: "Light",    desc: "Gentle pass, fastest" },
  { id: "balanced", label: "Balanced", desc: "Best quality/speed" },
  { id: "strong",   label: "Strong",   desc: "Heavily noisy images" },
];

export default function DenoisePanel() {
  const { backendUrl, isConnected } = useBackend();
  const [preview, setPreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [strength, setStrength] = useState(0.5);
  const [mode, setMode] = useState("balanced");
  const [preserveColor, setPreserveColor] = useState(true);

  const handleFile = useCallback((file: File, b64: string) => {
    setPreview(b64); setImageB64(b64); setResult(null); setError("");
  }, []);

  const handleRun = async () => {
    if (!imageB64 || !isConnected) return;
    setIsProcessing(true); setError("");
    const res = await apiDenoise(backendUrl, imageB64, strength, mode, preserveColor);
    setIsProcessing(false);
    if (res.success) setResult(res.data); else setError(res.error);
  };

  const download = (url: string) => { const a = document.createElement("a"); a.href = url; a.download = "snapstudio-denoised.png"; a.click(); };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
          <Wind size={18} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">Denoise</h2>
          <p className="text-zinc-500 text-sm">Remove noise & grain from photos using Non-Local Means in LAB space — preserves colors perfectly.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Noisy</p><UploadZone onFile={handleFile} preview={preview} /></div>
        <div className="space-y-2"><p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Clean</p><ResultPanel result={result} isProcessing={isProcessing} placeholder={{ icon: "🔇", text: "Denoised result will appear here" }} onDownload={download} /></div>
      </div>

      {/* Mode selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Mode</label>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${mode === m.id ? "border-violet-500/50 bg-violet-600/20 text-white" : "border-white/10 bg-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300"}`}>
              <div className="text-xs font-medium">{m.label}</div>
              <div className="text-[10px] text-zinc-600 mt-0.5">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Strength + color preserve */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-zinc-500">Strength</label>
            <span className="text-xs text-white">{strength.toFixed(2)}</span>
          </div>
          <input type="range" min={0} max={1} step={0.05} value={strength}
            onChange={(e) => setStrength(Number(e.target.value))}
            className="w-full accent-violet-500" />
          <div className="flex justify-between text-[10px] text-zinc-700 mt-1">
            <span>Gentle</span><span>Aggressive</span>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => setPreserveColor(!preserveColor)}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${preserveColor ? "bg-violet-600" : "bg-white/10"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${preserveColor ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <div>
              <p className="text-xs text-zinc-300 font-medium">Preserve Colors</p>
              <p className="text-[10px] text-zinc-600">LAB luminance-only denoising</p>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-950/50 border border-red-500/20 px-4 py-3 text-red-400 text-sm">{error}</div>}

      <button onClick={handleRun} disabled={!imageB64 || !isConnected || isProcessing}
        className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer shadow-lg shadow-purple-900/30">
        {isProcessing ? <><Loader2 size={16} className="animate-spin" />Denoising…</> : <><Wind size={16} />Denoise Photo</>}
      </button>
    </motion.div>
  );
}
