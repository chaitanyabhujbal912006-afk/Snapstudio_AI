"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, Loader2 } from "lucide-react";
import UploadZone from "@/app/components/UploadZone";
import ResultPanel from "@/app/components/ResultPanel";
import { useBackend } from "@/app/context/BackendContext";
import { apiColorGrade } from "@/app/lib/api";

const COLOR_GRADES = [
  "None (Reset)",
  "Cinematic — Teal & Orange",
  "Vintage Film",
  "Moody Dark",
  "Clean & Bright",
  "Golden Hour",
  "Faded Matte",
  "Cool Blue",
  "Sunset Drama",
  "Urban Grit",
  "Pastel Dream",
  "Forest Green",
  "Futuristic Neon",
  "B&W Classic",
  "B&W High Contrast",
];

interface Slider { label: string; key: string; min: number; max: number; step: number; default: number; unit?: string; }

const SLIDERS: Slider[] = [
  { label: "Intensity",    key: "intensity",    min: 0, max: 1,    step: 0.05, default: 1.0 },
  { label: "Exposure",     key: "exposure",     min: -3, max: 3,   step: 0.1,  default: 0,   unit: " EV" },
  { label: "Contrast",     key: "contrast",     min: -100, max: 100, step: 1, default: 0 },
  { label: "Highlights",   key: "highlights",   min: -100, max: 100, step: 1, default: 0 },
  { label: "Shadows",      key: "shadows",      min: -100, max: 100, step: 1, default: 0 },
  { label: "Temperature",  key: "temperature",  min: -100, max: 100, step: 1, default: 0 },
  { label: "Saturation",   key: "saturation",   min: 0, max: 2,    step: 0.05, default: 1.0 },
  { label: "Vibrance",     key: "vibrance",     min: 0, max: 1,    step: 0.05, default: 0 },
  { label: "Vignette",     key: "vignette",     min: 0, max: 1,    step: 0.05, default: 0 },
  { label: "Film Grain",   key: "grain",        min: 0, max: 0.5,  step: 0.01, default: 0 },
];

type Params = Record<string, number>;

export default function ColorGradePanel() {
  const { backendUrl, isConnected } = useBackend();
  const [preview, setPreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("Cinematic — Teal & Orange");
  const [useManual, setUseManual] = useState(false);
  const [params, setParams] = useState<Params>(
    Object.fromEntries(SLIDERS.map(s => [s.key, s.default]))
  );

  const handleFile = useCallback((file: File, b64: string) => {
    setPreview(b64); setImageB64(b64); setResult(null); setError("");
  }, []);

  const handleRun = async () => {
    if (!imageB64 || !isConnected) return;
    setIsProcessing(true); setError("");
    const res = await apiColorGrade(backendUrl, imageB64, {
      grade_name: selectedGrade,
      intensity: params.intensity,
      exposure: params.exposure,
      contrast: useManual ? params.contrast : null,
      highlights: useManual ? params.highlights : null,
      shadows: useManual ? params.shadows : null,
      temperature: useManual ? params.temperature : null,
      saturation: useManual ? params.saturation : null,
      vibrance: params.vibrance,
      vignette: useManual ? params.vignette : null,
      grain: useManual ? params.grain : null,
    });
    setIsProcessing(false);
    if (res.success) setResult(res.data);
    else setError(res.error);
  };

  const download = (url: string) => { const a = document.createElement("a"); a.href = url; a.download = "snapstudio-graded.png"; a.click(); };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
          <SlidersHorizontal size={18} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">Color Grade</h2>
          <p className="text-zinc-500 text-sm">15 cinematic presets + full manual control. Exposure, contrast, highlights, grain — all of it.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Original</p><UploadZone onFile={handleFile} preview={preview} /></div>
        <div className="space-y-2"><p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Graded</p><ResultPanel result={result} isProcessing={isProcessing} placeholder={{ icon: "🎞️", text: "Graded result will appear here" }} onDownload={download} /></div>
      </div>

      {/* Grade picker */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Preset Grade</label>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_GRADES.map(g => (
            <button key={g} onClick={() => setSelectedGrade(g)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${selectedGrade === g ? "bg-violet-600/30 border border-violet-500/50 text-violet-200" : "bg-white/5 border border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300"}`}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Manual toggle */}
      <div className="flex items-center gap-3">
        <button onClick={() => setUseManual(!useManual)}
          className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${useManual ? "bg-violet-600" : "bg-white/10"}`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${useManual ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
        <span className="text-xs text-zinc-400">Manual override sliders</span>
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {SLIDERS.map(s => (
          <div key={s.key} className={(s.key === "intensity" || s.key === "exposure" || s.key === "vibrance") || useManual ? "" : "opacity-30 pointer-events-none"}>
            <div className="flex justify-between mb-1">
              <label className="text-xs text-zinc-500">{s.label}</label>
              <span className="text-xs text-white">{params[s.key].toFixed(s.step < 0.1 ? 2 : s.step < 1 ? 1 : 0)}{s.unit || ""}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={params[s.key]}
              onChange={(e) => setParams(p => ({ ...p, [s.key]: Number(e.target.value) }))}
              className="w-full accent-violet-500" />
          </div>
        ))}
      </div>

      {error && <div className="rounded-xl bg-red-950/50 border border-red-500/20 px-4 py-3 text-red-400 text-sm">{error}</div>}

      <button onClick={handleRun} disabled={!imageB64 || !isConnected || isProcessing}
        className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer shadow-lg shadow-purple-900/30">
        {isProcessing ? <><Loader2 size={16} className="animate-spin" />Grading…</> : <><SlidersHorizontal size={16} />Apply Grade</>}
      </button>
    </motion.div>
  );
}
