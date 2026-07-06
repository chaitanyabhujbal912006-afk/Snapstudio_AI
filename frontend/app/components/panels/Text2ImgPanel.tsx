"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Type, Loader2, Shuffle } from "lucide-react";
import ResultPanel from "@/app/components/ResultPanel";
import { useBackend } from "@/app/context/BackendContext";
import { apiText2Img } from "@/app/lib/api";

const T2I_STYLES = [
  "Photorealistic", "Cinematic", "Studio Portrait",
  "Concept Art", "Product Photography", "Anime Illustration",
  "Oil Painting", "Watercolor", "Sci-Fi", "Fantasy", "None (Custom)",
];

const RESOLUTIONS = [
  { label: "512 × 512", w: 512, h: 512 },
  { label: "512 × 768", w: 512, h: 768 },
  { label: "768 × 512", w: 768, h: 512 },
  { label: "768 × 768", w: 768, h: 768 },
];

const EXAMPLE_PROMPTS = [
  "Aerial view of a neon-lit cyberpunk city at night, rain reflections, fog",
  "Cozy coffee shop interior, warm afternoon light, film grain",
  "Ultra-detailed macro photo of a butterfly wing, vibrant colors",
  "Product shot: minimalist watch on white marble, professional studio",
  "A vast fantasy landscape, ancient ruins, golden hour, epic scale",
];

export default function Text2ImgPanel() {
  const { backendUrl, isConnected } = useBackend();
  const [results, setResults] = useState<string[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [prompt, setPrompt] = useState("");
  const [negPrompt, setNegPrompt] = useState("");
  const [style, setStyle] = useState("Photorealistic");
  const [resolution, setResolution] = useState(RESOLUTIONS[0]);
  const [steps, setSteps] = useState(4);
  const [numImages, setNumImages] = useState(1);
  const [seed, setSeed] = useState(-1);

  const randomSeed = () => setSeed(Math.floor(Math.random() * 2 ** 31));
  const randomPrompt = () => setPrompt(EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)]);

  const handleRun = async () => {
    if (!prompt.trim() || !isConnected) return;
    setIsProcessing(true); setError("");
    const res = await apiText2Img(backendUrl, {
      prompt, negative_prompt: negPrompt, style,
      width: resolution.w, height: resolution.h,
      steps, seed, num_images: numImages,
    });
    setIsProcessing(false);
    if (res.success) setResults(res.data); else setError(res.error);
  };

  const download = (url: string, index?: number) => {
    const a = document.createElement("a");
    a.href = url; a.download = `snapstudio-gen-${index ?? 0}.png`; a.click();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
          <Type size={18} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">Text → Image</h2>
          <p className="text-zinc-500 text-sm">SDXL-Turbo: 4 denoising steps, ~10s per image on T4 GPU. Style presets auto-expand your prompt.</p>
        </div>
      </div>

      {/* Prompt */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Prompt</label>
          <button onClick={randomPrompt} className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-violet-400 transition-colors cursor-pointer">
            <Shuffle size={10} /> Example
          </button>
        </div>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate…"
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-violet-500/50 transition-colors resize-none placeholder-zinc-600" />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Negative Prompt</label>
        <input type="text" value={negPrompt} onChange={(e) => setNegPrompt(e.target.value)}
          placeholder="What to avoid… (optional)"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500/50 transition-colors placeholder-zinc-600" />
      </div>

      {/* Result */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Generated</p>
        <ResultPanel results={results} isProcessing={isProcessing}
          placeholder={{ icon: "✦", text: "Your generated images will appear here" }}
          onDownload={download} />
      </div>

      {/* Style */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Style Preset</label>
        <div className="flex flex-wrap gap-1.5">
          {T2I_STYLES.map(s => (
            <button key={s} onClick={() => setStyle(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${style === s ? "bg-violet-600/30 border border-violet-500/50 text-violet-200" : "bg-white/5 border border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Options row */}
      <div className="grid grid-cols-4 gap-3">
        {/* Resolution */}
        <div className="col-span-2 space-y-1.5">
          <label className="text-xs text-zinc-500">Resolution</label>
          <select value={`${resolution.w}x${resolution.h}`}
            onChange={(e) => { const [rw,rh] = e.target.value.split("x").map(Number); setResolution({label:e.target.value,w:rw,h:rh}); }}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-violet-500/50">
            {RESOLUTIONS.map(r => <option key={r.label} value={`${r.w}x${r.h}`} className="bg-zinc-900">{r.label}</option>)}
          </select>
        </div>

        {/* Images */}
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-500">Images</label>
          <select value={numImages} onChange={(e) => setNumImages(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-violet-500/50">
            {[1,2,3,4].map(n => <option key={n} value={n} className="bg-zinc-900">{n}</option>)}
          </select>
        </div>

        {/* Steps */}
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-500">Steps</label>
          <select value={steps} onChange={(e) => setSteps(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-violet-500/50">
            {[4,6,8].map(n => <option key={n} value={n} className="bg-zinc-900">{n}</option>)}
          </select>
        </div>
      </div>

      {/* Seed */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-xs text-zinc-500 block mb-1">Seed ({seed === -1 ? "Random" : seed})</label>
          <input type="number" value={seed} onChange={(e) => setSeed(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-violet-500/50" />
        </div>
        <button onClick={randomSeed} className="mt-5 p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-colors cursor-pointer">
          <Shuffle size={16} />
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-950/50 border border-red-500/20 px-4 py-3 text-red-400 text-sm">{error}</div>}

      <button onClick={handleRun} disabled={!prompt.trim() || !isConnected || isProcessing}
        className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer shadow-lg shadow-purple-900/30">
        {isProcessing ? <><Loader2 size={16} className="animate-spin" />Generating…</> : <><Type size={16} />Generate {numImages > 1 ? `${numImages} Images` : "Image"}</>}
      </button>
    </motion.div>
  );
}
