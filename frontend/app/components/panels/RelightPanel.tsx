"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useBackend } from "@/app/context/BackendContext";
import UploadZone from "@/app/components/UploadZone";
import ResultPanel from "@/app/components/ResultPanel";
import { apiRelight, type RelightParams } from "@/app/lib/api";
import { Sun, Loader2, Compass } from "lucide-react";

const RELIGHT_PRESETS = [
  { id: "warm_gold", name: "Warm Gold", color: "#f59e0b" },
  { id: "cyber_neon", name: "Cyber Neon", color: "#06b6d4" },
  { id: "sunset_pink", name: "Sunset Pink", color: "#ec4899" },
  { id: "cool_blue", name: "Cool Blue", color: "#3b82f6" },
  { id: "emerald_glow", name: "Emerald Glow", color: "#10b981" },
  { id: "studio_white", name: "Studio White", color: "#f4f4f5" },
  { id: "dramatic_red", name: "Dramatic Red", color: "#ef4444" },
  { id: "violet_aura", name: "Violet Aura", color: "#a855f7" },
];

export default function RelightPanel() {
  const { backendUrl, isConnected } = useBackend();
  const [preview, setPreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const [p, setP] = useState<RelightParams>({
    preset: "warm_gold",
    light_angle: 45,
    intensity: 0.5,
    rim_light: 0.4,
    ambient_darkening: 0.2,
  });

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

    const res = await apiRelight(backendUrl, imageB64, p);
    setIsProcessing(false);

    if (res.success) {
      setResult(res.data);
    } else {
      setError(res.error);
    }
  };

  const download = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `snapstudio-relit-${p.preset}.png`;
    a.click();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5">
      {/* Panel Header */}
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Sun size={20} className="text-amber-500" />
        </div>
        <div>
          <h2 className="font-display font-bold text-base text-white">AI Virtual Studio Relighting</h2>
          <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">
            Synthesize directional spotlights, rim light wraps & ambient color atmosphere using 3D surface normal estimation. ~0.3s.
          </p>
        </div>
      </div>

      {/* Stage Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[0.6rem] tracking-wider text-zinc-500 uppercase">ORIGINAL</span>
          <UploadZone onFile={handleFile} preview={preview} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[0.6rem] tracking-wider text-zinc-500 uppercase">RELIT PORTRAIT</span>
          <ResultPanel
            result={result}
            isProcessing={isProcessing}
            placeholder={{ icon: "☀️", text: "Relit result will appear here" }}
            onDownload={download}
          />
        </div>
      </div>

      {/* Presets Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-zinc-300">Light Atmosphere Preset</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {RELIGHT_PRESETS.map((pr) => (
            <button
              key={pr.id}
              onClick={() => setP((prev) => ({ ...prev, preset: pr.id }))}
              className={`p-2 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all ${
                p.preset === pr.id
                  ? "bg-amber-500/15 border-amber-500/40 text-white font-semibold shadow-md"
                  : "bg-zinc-900/60 border-white/[0.05] text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: pr.color }} />
              {pr.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
        <div>
          <div className="flex justify-between text-xs text-zinc-400 mb-1 font-mono">
            <span className="flex items-center gap-1"><Compass size={12} /> Light Direction Angle</span>
            <span className="text-amber-400 font-bold">{p.light_angle}°</span>
          </div>
          <input
            type="range"
            min={0}
            max={360}
            step={5}
            value={p.light_angle}
            onChange={(e) => setP((prev) => ({ ...prev, light_angle: Number(e.target.value) }))}
            className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-zinc-400 mb-1 font-mono">
            <span>Light Intensity</span>
            <span className="text-amber-400 font-bold">{p.intensity.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={p.intensity}
            onChange={(e) => setP((prev) => ({ ...prev, intensity: Number(e.target.value) }))}
            className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-zinc-400 mb-1 font-mono">
            <span>Edge Rim Light</span>
            <span className="text-amber-400 font-bold">{p.rim_light.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={p.rim_light}
            onChange={(e) => setP((prev) => ({ ...prev, rim_light: Number(e.target.value) }))}
            className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-zinc-400 mb-1 font-mono">
            <span>Background Darkening</span>
            <span className="text-amber-400 font-bold">{p.ambient_darkening.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={p.ambient_darkening}
            onChange={(e) => setP((prev) => ({ ...prev, ambient_darkening: Number(e.target.value) }))}
            className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-950/40 border border-red-500/20 p-3 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Execute Button */}
      <button
        onClick={handleRun}
        disabled={!imageB64 || !isConnected || isProcessing}
        className="btn-studio w-full justify-center py-3"
      >
        {isProcessing ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Synthesizing Studio Lighting…
          </>
        ) : (
          <>
            <Sun size={16} /> Relight Photo
          </>
        )}
      </button>
    </motion.div>
  );
}
