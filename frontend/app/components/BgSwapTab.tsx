"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ImageIcon, Loader2, Users, Package, Sparkles } from "lucide-react";
import UploadZone from "@/app/components/UploadZone";
import ResultPanel from "@/app/components/ResultPanel";
import { useBackend } from "@/app/context/BackendContext";
import { apiBgSwap } from "@/app/lib/api";

const PORTRAIT_STYLES = [
  "Portrait - city bokeh",
  "Portrait - clean studio",
  "Portrait - golden hour outdoor",
];
const PRODUCT_STYLES = [
  "Studio - white sweep",
  "Studio - marble surface",
  "Lifestyle - kitchen counter",
  "Lifestyle - outdoor table",
];

export default function BgSwapTab() {
  const { backendUrl, isConnected } = useBackend();
  const [preview, setPreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [results, setResults] = useState<string[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [subjectType, setSubjectType] = useState("Portrait / selfie");
  const [styleName, setStyleName] = useState("Portrait - clean studio");
  const [customPrompt, setCustomPrompt] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [numVariants, setNumVariants] = useState(1);

  const styleOptions = subjectType === "Portrait / selfie" ? PORTRAIT_STYLES : PRODUCT_STYLES;

  const handleFile = useCallback((file: File, b64: string) => {
    setPreview(b64);
    setImageB64(b64);
    setResults(null);
    setError("");
  }, []);

  const handleSubjectChange = (type: string) => {
    setSubjectType(type);
    setStyleName(type === "Portrait / selfie" ? PORTRAIT_STYLES[0] : PRODUCT_STYLES[0]);
  };

  const handleRun = async () => {
    if (!imageB64 || !isConnected) return;
    setIsProcessing(true);
    setError("");
    const targetCustomPrompt = useCustom ? customPrompt : "";
    const res = await apiBgSwap(backendUrl, imageB64, subjectType, styleName, numVariants, targetCustomPrompt);
    setIsProcessing(false);
    if (res.success) setResults(res.data);
    else setError(res.error);
  };

  const handleDownload = (url: string, index?: number) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `snapstudio-bg-${(index ?? 0) + 1}.png`;
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
          <ImageIcon size={18} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">AI Background Swap</h2>
          <p className="text-zinc-500 text-sm mt-0.5">
            AI segments your subject and generates a brand-new background from presets or your own custom prompt (~1–2 min).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Upload</p>
          <UploadZone onFile={handleFile} preview={preview} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Result</p>
          <ResultPanel
            results={results}
            isProcessing={isProcessing}
            placeholder={{ icon: "🖼️", text: "Generated background will appear here" }}
            onDownload={handleDownload}
          />
        </div>
      </div>

      {/* Preset vs Custom Mode Toggle */}
      <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-white/[0.06] gap-1">
        <button
          onClick={() => setUseCustom(false)}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            !useCustom ? "bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold" : "text-zinc-400 hover:text-white"
          }`}
        >
          <ImageIcon size={13} /> Preset Environment Templates
        </button>
        <button
          onClick={() => setUseCustom(true)}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            useCustom ? "bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold" : "text-zinc-400 hover:text-white"
          }`}
        >
          <Sparkles size={13} /> Custom Vision Prompt
        </button>
      </div>

      {/* Custom Prompt Input */}
      {useCustom ? (
        <div className="p-3 bg-purple-950/20 border border-purple-500/20 rounded-xl space-y-2">
          <label className="text-xs font-medium text-purple-300 flex items-center gap-1.5">
            <Sparkles size={13} className="text-purple-400" /> Custom Background Description
          </label>
          <input
            type="text"
            placeholder="e.g. A futuristic neon glass penthouse overlooking rainy Tokyo skyline at sunset, bokeh depth of field"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-900/90 border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      ) : null}

      {/* Controls */}
      <div className="grid grid-cols-3 gap-4">
        {/* Subject type */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Subject</label>
          <div className="flex gap-2">
            {[
              { label: "Portrait", value: "Portrait / selfie", Icon: Users },
              { label: "Product", value: "Product / object", Icon: Package },
            ].map(({ label, value, Icon }) => (
              <button
                key={value}
                onClick={() => handleSubjectChange(value)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all duration-200 cursor-pointer
                  ${subjectType === value
                    ? "border-violet-500/50 bg-violet-600/20 text-violet-300"
                    : "border-white/10 bg-white/5 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
                  }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        {!useCustom && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Background Style</label>
            <select
              value={styleName}
              onChange={(e) => setStyleName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-violet-500/50 transition-colors"
            >
              {styleOptions.map((s) => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
            </select>
          </div>
        )}

        {/* Variants */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Variants: <span className="text-white">{numVariants}</span>
          </label>
          <div className="flex items-center gap-3 h-10">
            <input
              type="range"
              min="1" max="4" value={numVariants}
              onChange={(e) => setNumVariants(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
          </div>
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
        {isProcessing ? <><Loader2 size={16} className="animate-spin" />Generating Background…</> : <><ImageIcon size={16} />Generate Background</>}
      </button>
    </motion.div>
  );
}
