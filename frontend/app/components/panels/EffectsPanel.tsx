"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Wand2, Loader2 } from "lucide-react";
import UploadZone from "@/app/components/UploadZone";
import ResultPanel from "@/app/components/ResultPanel";
import { useBackend } from "@/app/context/BackendContext";
import { apiEffect } from "@/app/lib/api";

const EFFECTS = [
  { id: "hdr",           label: "HDR",              emoji: "⚡", desc: "Dramatic tone mapping" },
  { id: "bloom",         label: "Bloom",            emoji: "✨", desc: "Glow from bright areas" },
  { id: "orton",         label: "Orton Glow",       emoji: "🌟", desc: "Dreamy soft focus" },
  { id: "grain",         label: "Film Grain",       emoji: "📽️", desc: "Authentic film texture" },
  { id: "vignette",     label: "Vignette",         emoji: "⭕", desc: "Radial edge darkening" },
  { id: "chromatic",    label: "Chrom. Aberration",emoji: "🌈", desc: "Lens fringe distortion" },
  { id: "cross_process",label: "Cross Process",    emoji: "🎞️", desc: "Film lab darkroom look" },
  { id: "color_splash", label: "Color Splash",     emoji: "💧", desc: "Selective color effect" },
];

// Per-effect parameters
const EFFECT_PARAMS: Record<string, { label: string; key: string; min: number; max: number; step: number; default: number }[]> = {
  hdr:          [{ label: "Strength", key: "strength", min: 0, max: 1, step: 0.05, default: 0.7 }],
  bloom:        [
    { label: "Strength", key: "strength", min: 0, max: 1, step: 0.05, default: 0.5 },
    { label: "Threshold", key: "threshold", min: 0.3, max: 1, step: 0.05, default: 0.75 },
  ],
  orton:        [{ label: "Strength", key: "strength", min: 0, max: 1, step: 0.05, default: 0.4 }],
  grain:        [
    { label: "Amount", key: "amount", min: 0, max: 1, step: 0.05, default: 0.4 },
    { label: "Coarseness", key: "size", min: 0, max: 1, step: 0.05, default: 0.5 },
  ],
  vignette:     [
    { label: "Strength", key: "strength", min: 0, max: 1, step: 0.05, default: 0.5 },
    { label: "Feather", key: "feather", min: 0.1, max: 1, step: 0.05, default: 0.7 },
  ],
  chromatic:    [{ label: "Strength", key: "strength", min: 0, max: 1, step: 0.05, default: 0.3 }],
  cross_process:[{ label: "Strength", key: "strength", min: 0, max: 1, step: 0.05, default: 0.7 }],
  color_splash: [
    { label: "Hue (0=Red 60=Green 120=Blue)", key: "hue", min: 0, max: 179, step: 1, default: 0 },
    { label: "Hue Range", key: "range", min: 5, max: 50, step: 1, default: 20 },
  ],
};

export default function EffectsPanel() {
  const { backendUrl, isConnected } = useBackend();
  const [preview, setPreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [selectedEffect, setSelectedEffect] = useState("hdr");
  const [paramValues, setParamValues] = useState<Record<string, number>>({
    strength: 0.7, threshold: 0.75, amount: 0.4, size: 0.5,
    feather: 0.7, hue: 0, range: 20,
  });

  const handleFile = useCallback((file: File, b64: string) => {
    setPreview(b64); setImageB64(b64); setResult(null); setError("");
  }, []);

  const handleRun = async () => {
    if (!imageB64 || !isConnected) return;
    setIsProcessing(true); setError("");
    const params: Record<string, unknown> = {};
    (EFFECT_PARAMS[selectedEffect] || []).forEach(p => { params[p.key] = paramValues[p.key] ?? p.default; });
    const res = await apiEffect(backendUrl, imageB64, selectedEffect, params);
    setIsProcessing(false);
    if (res.success) setResult(res.data); else setError(res.error);
  };

  const download = (url: string) => { const a = document.createElement("a"); a.href = url; a.download = `snapstudio-${selectedEffect}.png`; a.click(); };
  const currentParams = EFFECT_PARAMS[selectedEffect] || [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
          <Wand2 size={18} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">Effects</h2>
          <p className="text-zinc-500 text-sm">HDR, bloom, film grain, vignette, chromatic aberration, color splash — all instant CPU effects.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Original</p><UploadZone onFile={handleFile} preview={preview} /></div>
        <div className="space-y-2"><p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Result</p><ResultPanel result={result} isProcessing={isProcessing} placeholder={{ icon: "⚡", text: "Effect result will appear here" }} onDownload={download} /></div>
      </div>

      {/* Effect picker */}
      <div className="grid grid-cols-4 gap-2">
        {EFFECTS.map(e => (
          <button key={e.id} onClick={() => setSelectedEffect(e.id)}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${selectedEffect === e.id ? "border-violet-500/50 bg-violet-600/20 text-white" : "border-white/10 bg-white/5 text-zinc-500 hover:border-white/20"}`}>
            <div className="text-lg mb-0.5">{e.emoji}</div>
            <div className="text-[10px] font-medium leading-tight">{e.label}</div>
            <div className="text-[9px] text-zinc-600 mt-0.5">{e.desc}</div>
          </button>
        ))}
      </div>

      {/* Param sliders */}
      {currentParams.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {currentParams.map(p => (
            <div key={p.key}>
              <div className="flex justify-between mb-1">
                <label className="text-xs text-zinc-500">{p.label}</label>
                <span className="text-xs text-white">{(paramValues[p.key] ?? p.default).toFixed(p.step < 1 ? 2 : 0)}</span>
              </div>
              <input type="range" min={p.min} max={p.max} step={p.step} value={paramValues[p.key] ?? p.default}
                onChange={(e) => setParamValues(v => ({ ...v, [p.key]: Number(e.target.value) }))}
                className="w-full accent-violet-500" />
            </div>
          ))}
        </div>
      )}

      {error && <div className="rounded-xl bg-red-950/50 border border-red-500/20 px-4 py-3 text-red-400 text-sm">{error}</div>}

      <button onClick={handleRun} disabled={!imageB64 || !isConnected || isProcessing}
        className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer shadow-lg shadow-purple-900/30">
        {isProcessing ? <><Loader2 size={16} className="animate-spin" />Applying…</> : <><Wand2 size={16} />Apply Effect</>}
      </button>
    </motion.div>
  );
}
