"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Zap, Loader2, ChevronDown } from "lucide-react";
import UploadZone from "@/app/components/UploadZone";
import ResultPanel from "@/app/components/ResultPanel";
import { useBackend } from "@/app/context/BackendContext";
import { apiOutpaint } from "@/app/lib/api";

const DIRECTIONS = [
  { id: "right",     label: "→ Right",     desc: "Extend right side" },
  { id: "left",      label: "← Left",      desc: "Extend left side" },
  { id: "bottom",    label: "↓ Bottom",    desc: "Extend downward" },
  { id: "top",       label: "↑ Top",       desc: "Extend upward" },
  { id: "all sides", label: "⬛ All Sides", desc: "Expand all around" },
];

export default function OutpaintPanel() {
  const { backendUrl, isConnected } = useBackend();
  const [preview, setPreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [direction, setDirection] = useState("right");
  const [amount, setAmount] = useState(256);
  const [prompt, setPrompt] = useState("");

  const handleFile = useCallback((file: File, b64: string) => {
    setPreview(b64); setImageB64(b64); setResult(null); setError("");
  }, []);

  const handleRun = async () => {
    if (!imageB64 || !isConnected) return;
    setIsProcessing(true); setError("");
    const res = await apiOutpaint(backendUrl, imageB64, direction, amount, prompt);
    setIsProcessing(false);
    if (res.success) setResult(res.data); else setError(res.error);
  };

  const download = (url: string) => { const a = document.createElement("a"); a.href = url; a.download = "snapstudio-outpaint.png"; a.click(); };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
          <Zap size={18} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">Outpaint</h2>
          <p className="text-zinc-500 text-sm">Extend the canvas beyond its original borders — AI fills new areas seamlessly. ~1–3 min.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Original</p><UploadZone onFile={handleFile} preview={preview} /></div>
        <div className="space-y-2"><p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Extended</p><ResultPanel result={result} isProcessing={isProcessing} placeholder={{ icon: "🔄", text: "Extended canvas will appear here" }} onDownload={download} /></div>
      </div>

      {/* Direction */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Direction</label>
        <div className="grid grid-cols-3 gap-2">
          {DIRECTIONS.slice(0, 4).map(d => (
            <button key={d.id} onClick={() => setDirection(d.id)}
              className={`py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${direction === d.id ? "border-violet-500/50 bg-violet-600/20 text-white" : "border-white/10 bg-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300"}`}>
              <div className="text-sm font-medium">{d.label}</div>
            </button>
          ))}
          <button onClick={() => setDirection("all sides")}
            className={`col-span-2 py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer ${direction === "all sides" ? "border-violet-500/50 bg-violet-600/20 text-white" : "border-white/10 bg-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300"}`}>
            <div className="text-sm font-medium">⬛ All Sides</div>
          </button>
        </div>
      </div>

      {/* Amount + Prompt */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-zinc-500">Extend Amount</label>
            <span className="text-xs text-white">{amount}px</span>
          </div>
          <input type="range" min={64} max={512} step={64} value={amount}
            onChange={(e) => setAmount(Number(e.target.value))} className="w-full accent-violet-500" />
          <div className="flex justify-between text-[10px] text-zinc-700 mt-1"><span>64px</span><span>512px</span></div>
        </div>
        <div>
          <label className="text-xs text-zinc-500 block mb-1">Content Hint (optional)</label>
          <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. forest, city skyline, ocean"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-violet-500/50 transition-colors placeholder-zinc-600" />
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-950/50 border border-red-500/20 px-4 py-3 text-red-400 text-sm">{error}</div>}

      <button onClick={handleRun} disabled={!imageB64 || !isConnected || isProcessing}
        className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer shadow-lg shadow-purple-900/30">
        {isProcessing ? <><Loader2 size={16} className="animate-spin" />Outpainting…</> : <><Zap size={16} />Extend Canvas</>}
      </button>
    </motion.div>
  );
}
