"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BackendProvider } from "@/app/context/BackendContext";
import Header from "@/app/components/Header";
import Sidebar, { type FeatureId } from "@/app/components/Sidebar";

// Panels — quick edit
import EnhanceTab from "@/app/components/EnhanceTab";
import ColorGradePanel from "@/app/components/panels/ColorGradePanel";
import StyleTab from "@/app/components/StyleTab";
import DenoisePanel from "@/app/components/panels/DenoisePanel";
import EffectsPanel from "@/app/components/panels/EffectsPanel";

// Panels — AI enhance
import UpscalePanel from "@/app/components/panels/UpscalePanel";
import FaceEnhancePanel from "@/app/components/panels/FaceEnhancePanel";
import BgSwapTab from "@/app/components/BgSwapTab";
import RemoveTab from "@/app/components/RemoveTab";
import OutpaintPanel from "@/app/components/panels/OutpaintPanel";
import Text2ImgPanel from "@/app/components/panels/Text2ImgPanel";

// Re-use existing components for bg_blur & retouch (wrap generically)
import { useBackend } from "@/app/context/BackendContext";
import UploadZone from "@/app/components/UploadZone";
import ResultPanel from "@/app/components/ResultPanel";
import { apiBgBlur, apiRetouch } from "@/app/lib/api";
import { Loader2, ArrowsUpFromLine, UserCheck } from "lucide-react";
import { useCallback } from "react";

// ── Inline BgBlur panel ───────────────────────────────────────────────────────
function BgBlurPanel() {
  const { backendUrl, isConnected } = useBackend();
  const [preview, setPreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [blur, setBlur] = useState(0.6);
  const [useDepth, setUseDepth] = useState(true);
  const [subjectType, setSubjectType] = useState("person");

  const handleFile = useCallback((file: File, b64: string) => {
    setPreview(b64); setImageB64(b64); setResult(null); setError("");
  }, []);
  const handleRun = async () => {
    if (!imageB64 || !isConnected) return;
    setIsProcessing(true); setError("");
    const res = await apiBgBlur(backendUrl, imageB64, blur, useDepth, subjectType);
    setIsProcessing(false);
    if (res.success) setResult(res.data); else setError(res.error);
  };
  const download = (url: string) => { const a = document.createElement("a"); a.href = url; a.download = "snapstudio-bokeh.png"; a.click(); };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
          <ArrowsUpFromLine size={18} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">Background Blur</h2>
          <p className="text-zinc-500 text-sm">DSLR-style bokeh: subject stays sharp, background gets depth-aware natural blur. ~3–8s.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Original</p><UploadZone onFile={handleFile} preview={preview} /></div>
        <div className="space-y-2"><p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Bokeh</p><ResultPanel result={result} isProcessing={isProcessing} placeholder={{ icon: "🌸", text: "Bokeh result will appear here" }} onDownload={download} /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <div className="flex justify-between mb-1"><label className="text-xs text-zinc-500">Blur Amount</label><span className="text-xs text-white">{blur.toFixed(2)}</span></div>
          <input type="range" min={0} max={1} step={0.05} value={blur} onChange={(e) => setBlur(Number(e.target.value))} className="w-full accent-violet-500" />
          <div className="flex justify-between text-[10px] text-zinc-700 mt-1"><span>Subtle</span><span>Very blurry</span></div>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-zinc-500">Subject</label>
          <div className="grid grid-cols-2 gap-1">
            {[["person","Portrait"],["general","Object"]].map(([v,l]) => (
              <button key={v} onClick={() => setSubjectType(v)}
                className={`py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${subjectType === v ? "border-violet-500/50 bg-violet-600/20 text-white" : "border-white/10 bg-white/5 text-zinc-500"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setUseDepth(!useDepth)} className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${useDepth ? "bg-violet-600" : "bg-white/10"}`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${useDepth ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
        <span className="text-xs text-zinc-400">Depth-based blur (MiDaS — more natural, slower)</span>
      </div>
      {error && <div className="rounded-xl bg-red-950/50 border border-red-500/20 px-4 py-3 text-red-400 text-sm">{error}</div>}
      <button onClick={handleRun} disabled={!imageB64 || !isConnected || isProcessing}
        className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer shadow-lg shadow-purple-900/30">
        {isProcessing ? <><Loader2 size={16} className="animate-spin" />Blurring…</> : <><ArrowsUpFromLine size={16} />Apply Bokeh</>}
      </button>
    </motion.div>
  );
}

// ── Inline Retouch panel ──────────────────────────────────────────────────────
function RetouchPanel() {
  const { backendUrl, isConnected } = useBackend();
  const [preview, setPreview] = useState<string | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [p, setP] = useState({ skin_smooth: 0.5, clarity: 0.3, sharpen: 0.4, vibrance: 0.3, shadow_lift: 0.2, teeth_whiten: 0.0 });
  const handleFile = useCallback((file: File, b64: string) => { setPreview(b64); setImageB64(b64); setResult(null); setError(""); }, []);
  const handleRun = async () => {
    if (!imageB64 || !isConnected) return;
    setIsProcessing(true); setError("");
    const res = await apiRetouch(backendUrl, imageB64, p);
    setIsProcessing(false);
    if (res.success) setResult(res.data); else setError(res.error);
  };
  const download = (url: string) => { const a = document.createElement("a"); a.href = url; a.download = "snapstudio-retouched.png"; a.click(); };
  const sliders = [
    { key: "skin_smooth", label: "Skin Smooth", min: 0, max: 1, step: 0.05 },
    { key: "clarity", label: "Clarity", min: 0, max: 1, step: 0.05 },
    { key: "sharpen", label: "Sharpen", min: 0, max: 1, step: 0.05 },
    { key: "vibrance", label: "Vibrance", min: 0, max: 1, step: 0.05 },
    { key: "shadow_lift", label: "Shadow Lift", min: 0, max: 1, step: 0.05 },
    { key: "teeth_whiten", label: "Teeth Whiten", min: 0, max: 1, step: 0.05 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center shrink-0"><UserCheck size={18} className="text-violet-400" /></div>
        <div>
          <h2 className="text-white font-semibold text-lg">Portrait Retouch</h2>
          <p className="text-zinc-500 text-sm">Professional skin smoothing, clarity, sharpening, vibrance, shadow lift & teeth whitening — all OpenCV, instant.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Original</p><UploadZone onFile={handleFile} preview={preview} /></div>
        <div className="space-y-2"><p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Retouched</p><ResultPanel result={result} isProcessing={isProcessing} placeholder={{ icon: "✨", text: "Retouched portrait will appear here" }} onDownload={download} /></div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {sliders.map(s => (
          <div key={s.key}>
            <div className="flex justify-between mb-1"><label className="text-xs text-zinc-500">{s.label}</label><span className="text-xs text-white">{(p[s.key as keyof typeof p] as number).toFixed(2)}</span></div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={p[s.key as keyof typeof p] as number}
              onChange={(e) => setP(prev => ({ ...prev, [s.key]: Number(e.target.value) }))} className="w-full accent-violet-500" />
          </div>
        ))}
      </div>
      {error && <div className="rounded-xl bg-red-950/50 border border-red-500/20 px-4 py-3 text-red-400 text-sm">{error}</div>}
      <button onClick={handleRun} disabled={!imageB64 || !isConnected || isProcessing}
        className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer shadow-lg shadow-purple-900/30">
        {isProcessing ? <><Loader2 size={16} className="animate-spin" />Retouching…</> : <><UserCheck size={16} />Retouch Portrait</>}
      </button>
    </motion.div>
  );
}

// ── Panel router ──────────────────────────────────────────────────────────────
function ActivePanel({ id }: { id: FeatureId }) {
  const panels: Record<FeatureId, React.ReactNode> = {
    enhance:      <EnhanceTab />,
    color_grade:  <ColorGradePanel />,
    retouch:      <RetouchPanel />,
    denoise:      <DenoisePanel />,
    effects:      <EffectsPanel />,
    upscale:      <UpscalePanel />,
    face_enhance: <FaceEnhancePanel />,
    bg_blur:      <BgBlurPanel />,
    bg_swap:      <BgSwapTab />,
    style_filter: <StyleTab />,
    remove_object:<RemoveTab />,
    outpaint:     <OutpaintPanel />,
    text2img:     <Text2ImgPanel />,
  };
  return (
    <AnimatePresence mode="wait">
      <motion.div key={id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}>
        {panels[id]}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main app ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [activeId, setActiveId] = useState<FeatureId>("enhance");

  return (
    <BackendProvider>
      <div className="relative min-h-screen overflow-x-hidden flex flex-col">
        {/* Background orbs */}
        <div className="bg-orb w-[700px] h-[700px] bg-violet-700/12 top-[-150px] left-[-250px]" />
        <div className="bg-orb w-[500px] h-[500px] bg-purple-700/8 top-[45%] right-[-150px]" />
        <div className="bg-orb w-[400px] h-[400px] bg-fuchsia-700/6 bottom-0 left-[35%]" />

        <Header />

        {/* Main layout */}
        <div className="relative z-10 flex flex-1 pt-16 max-w-[1280px] mx-auto w-full">
          {/* Sidebar */}
          <Sidebar activeId={activeId} onChange={setActiveId} />

          {/* Content */}
          <main className="flex-1 overflow-y-auto px-8 py-8">
            {/* Tool header breadcrumb */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 text-xs text-zinc-600">
                <span>SnapStudio AI</span>
                <span>/</span>
                <span className="text-violet-400 font-medium capitalize">
                  {activeId.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Panel card */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] backdrop-blur-xl shadow-2xl shadow-black/30 overflow-hidden">
              <div className="h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
              <div className="p-6 md:p-8">
                <ActivePanel id={activeId} />
              </div>
            </div>

            {/* Tip */}
            <p className="text-center text-xs text-zinc-700 mt-5">
              ⚡ GPU features require a connected Kaggle backend · Sessions last 9–12 hrs
            </p>
          </main>
        </div>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/[0.04] py-5 px-6 text-center">
          <p className="text-zinc-700 text-xs">
            SnapStudio AI · 13 AI-powered tools · Frontend on <span className="text-zinc-500">Vercel</span> · GPU on <span className="text-zinc-500">Kaggle</span>
          </p>
        </footer>
      </div>
    </BackendProvider>
  );
}
