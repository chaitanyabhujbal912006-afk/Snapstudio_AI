"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Palette, Loader2 } from "lucide-react";
import UploadZone from "@/app/components/UploadZone";
import ResultPanel from "@/app/components/ResultPanel";
import { useBackend } from "@/app/context/BackendContext";
import { apiStyleFilter } from "@/app/lib/api";

const STYLE_FILTERS = ["Anime", "Cartoon", "Oil painting", "Watercolor", "Cyberpunk"];

const STYLE_META: Record<string, { emoji: string; desc: string }> = {
  Anime: { emoji: "⛩️", desc: "Vibrant cel-shading" },
  Cartoon: { emoji: "🎭", desc: "Bold outlines & flat colors" },
  "Oil painting": { emoji: "🖼️", desc: "Classical brush strokes" },
  Watercolor: { emoji: "💧", desc: "Soft flowing colors" },
  Cyberpunk: { emoji: "🌆", desc: "Neon-lit futuristic glow" },
};

export default function StyleTab() {
  const { backendUrl, isConnected } = useBackend();
  const [preview, setPreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [styleName, setStyleName] = useState("Anime");
  const [strength, setStrength] = useState(60);

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
    const res = await apiStyleFilter(backendUrl, imageB64, styleName, strength / 100);
    setIsProcessing(false);
    if (res.success) setResult(res.data);
    else setError(res.error);
  };

  const handleDownload = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `snapstudio-${styleName.toLowerCase()}.png`;
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
          <Palette size={18} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">Style Filter</h2>
          <p className="text-zinc-500 text-sm mt-0.5">
            Transform your photo into anime, painting, watercolor, and more using AI image-to-image generation (~30–60 sec).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Original</p>
          <UploadZone onFile={handleFile} preview={preview} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Stylized</p>
          <ResultPanel
            result={result}
            isProcessing={isProcessing}
            placeholder={{ icon: "🎨", text: "Stylized result will appear here" }}
            onDownload={handleDownload}
          />
        </div>
      </div>

      {/* Style picker */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Art Style</label>
        <div className="grid grid-cols-5 gap-2">
          {STYLE_FILTERS.map((s) => {
            const meta = STYLE_META[s];
            return (
              <button
                key={s}
                onClick={() => setStyleName(s)}
                className={`p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer
                  ${styleName === s
                    ? "border-violet-500/60 bg-violet-600/20 text-white"
                    : "border-white/10 bg-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                  }`}
              >
                <div className="text-lg mb-1">{meta.emoji}</div>
                <div className="text-xs font-medium">{s}</div>
                <div className="text-[10px] text-zinc-600 mt-0.5">{meta.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Strength slider */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Transformation Strength: <span className="text-white">{(strength / 100).toFixed(2)}</span>
        </label>
        <input
          type="range" min="30" max="90" value={strength}
          onChange={(e) => setStrength(Number(e.target.value))}
          className="w-full accent-violet-500"
        />
        <div className="flex justify-between text-xs text-zinc-600">
          <span>Subtle (keeps original)</span>
          <span>Dramatic restyle</span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-950/50 border border-red-500/20 px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      <button
        onClick={handleRun}
        disabled={!imageB64 || !isConnected || isProcessing}
        className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-200
          bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500
          disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-900/30 text-white cursor-pointer"
      >
        {isProcessing ? <><Loader2 size={16} className="animate-spin" />Applying Style…</> : <><Palette size={16} />Apply Style</>}
      </button>
    </motion.div>
  );
}
