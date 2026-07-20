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
import { Loader2, ArrowUpFromLine, UserCheck, ArrowLeft, Zap } from "lucide-react";
import { useCallback } from "react";
import Link from "next/link";

// ── All panel logic is UNCHANGED — only layout/visual wrapper updated ──

// ── BgBlur Panel ─────────────────────────────────────────────────────────────
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Panel header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ArrowUpFromLine size={18} style={{ color: "#a78bfa" }} />
        </div>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)", marginBottom: 4 }}>Background Blur</h2>
          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>DSLR-style bokeh: subject stays sharp, background gets depth-aware natural blur. ~3–8s.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.14em", color: "var(--text-dim)" }}>ORIGINAL</p>
          <UploadZone onFile={handleFile} preview={preview} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.14em", color: "var(--text-dim)" }}>BOKEH RESULT</p>
          <ResultPanel result={result} isProcessing={isProcessing} placeholder={{ icon: "🌸", text: "Bokeh result will appear here" }} onDownload={download} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <div style={{ gridColumn: "span 2" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "var(--font-display)" }}>Blur Amount</label>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--amber)" }}>{blur.toFixed(2)}</span>
          </div>
          <input type="range" min={0} max={1} step={0.05} value={blur} onChange={(e) => setBlur(Number(e.target.value))} className="w-full accent-amber-500" />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-dim)" }}>Subtle</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--text-dim)" }}>Max blur</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "var(--font-display)" }}>Subject</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[["person", "Portrait"], ["general", "Object"]].map(([v, l]) => (
              <button key={v} onClick={() => setSubjectType(v)}
                style={{
                  padding: "7px 4px", borderRadius: 8, fontSize: "0.7rem",
                  fontFamily: "var(--font-display)", fontWeight: 600, cursor: "pointer",
                  border: subjectType === v ? "1px solid rgba(245,158,11,0.4)" : "1px solid var(--border-subtle)",
                  background: subjectType === v ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.025)",
                  color: subjectType === v ? "var(--amber)" : "var(--text-dim)",
                  transition: "all 0.18s",
                }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setUseDepth(!useDepth)}
          style={{
            position: "relative", width: 40, height: 22, borderRadius: 11,
            background: useDepth ? "rgba(245,158,11,0.8)" : "rgba(255,255,255,0.08)",
            border: "none", cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
          }}>
          <div style={{ position: "absolute", top: 3, left: useDepth ? 20 : 3, width: 16, height: 16, borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
        </button>
        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontFamily: "var(--font-display)" }}>Depth-based blur (MiDaS — more natural, slower)</span>
      </div>

      {error && <div style={{ borderRadius: 10, background: "rgba(153,27,27,0.25)", border: "1px solid rgba(248,113,113,0.2)", padding: "12px 16px", color: "#f87171", fontSize: "0.78rem" }}>{error}</div>}

      <button onClick={handleRun} disabled={!imageB64 || !isConnected || isProcessing} className="btn-studio w-full" style={{ justifyContent: "center", padding: "13px 24px" }}>
        {isProcessing ? <><Loader2 size={15} className="animate-spin" /> Blurring…</> : <><ArrowUpFromLine size={15} /> Apply Bokeh</>}
      </button>
    </motion.div>
  );
}

// ── Retouch Panel ─────────────────────────────────────────────────────────────
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
    { key: "clarity",     label: "Clarity",     min: 0, max: 1, step: 0.05 },
    { key: "sharpen",     label: "Sharpen",     min: 0, max: 1, step: 0.05 },
    { key: "vibrance",    label: "Vibrance",    min: 0, max: 1, step: 0.05 },
    { key: "shadow_lift", label: "Shadow Lift", min: 0, max: 1, step: 0.05 },
    { key: "teeth_whiten",label: "Teeth Whiten",min: 0, max: 1, step: 0.05 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <UserCheck size={18} style={{ color: "#34d399" }} />
        </div>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)", marginBottom: 4 }}>Portrait Retouch</h2>
          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>Professional skin smoothing, clarity, sharpening, vibrance, shadow lift & teeth whitening — all OpenCV, instant.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.14em", color: "var(--text-dim)" }}>ORIGINAL</p>
          <UploadZone onFile={handleFile} preview={preview} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.14em", color: "var(--text-dim)" }}>RETOUCHED</p>
          <ResultPanel result={result} isProcessing={isProcessing} placeholder={{ icon: "✨", text: "Retouched portrait will appear here" }} onDownload={download} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px" }}>
        {sliders.map((s) => (
          <div key={s.key}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontFamily: "var(--font-display)" }}>{s.label}</label>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--amber)" }}>
                {(p[s.key as keyof typeof p] as number).toFixed(2)}
              </span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={p[s.key as keyof typeof p] as number}
              onChange={(e) => setP((prev) => ({ ...prev, [s.key]: Number(e.target.value) }))}
              className="w-full accent-amber-500" />
          </div>
        ))}
      </div>

      {error && <div style={{ borderRadius: 10, background: "rgba(153,27,27,0.25)", border: "1px solid rgba(248,113,113,0.2)", padding: "12px 16px", color: "#f87171", fontSize: "0.78rem" }}>{error}</div>}

      <button onClick={handleRun} disabled={!imageB64 || !isConnected || isProcessing} className="btn-studio w-full" style={{ justifyContent: "center", padding: "13px 24px" }}>
        {isProcessing ? <><Loader2 size={15} className="animate-spin" /> Retouching…</> : <><UserCheck size={15} /> Retouch Portrait</>}
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

// ── Main Editor App ───────────────────────────────────────────────────────────
export default function Home() {
  const [activeId, setActiveId] = useState<FeatureId>("enhance");

  return (
    <BackendProvider>
      <div
        style={{
          position: "relative",
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-void)",
        }}
      >
        {/* Ambient orbs */}
        <div className="bg-orb" style={{ width: 600, height: 600, background: "radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)", top: -200, left: -200 }} />
        <div className="bg-orb" style={{ width: 500, height: 500, background: "radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)", top: "50%", right: -150 }} />

        <Header />

        {/* Main layout — pt for header (6px filmstrip + ~58px bar) */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flex: 1,
            paddingTop: 70,
            maxWidth: 1320,
            margin: "0 auto",
            width: "100%",
            overflow: "hidden",
          }}
        >
          <Sidebar activeId={activeId} onChange={setActiveId} />

          {/* Content area */}
          <main
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "28px 28px 24px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Breadcrumb */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Link
                  href="/"
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.62rem",
                    letterSpacing: "0.1em",
                    color: "var(--text-dim)",
                    textDecoration: "none",
                    transition: "color 0.15s",
                  }}
                  className="hover:text-amber-500"
                >
                  <ArrowLeft size={11} />
                  HOME
                </Link>
                <span style={{ color: "var(--border-medium)", fontFamily: "var(--font-mono)", fontSize: "0.62rem" }}>/</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.62rem",
                    letterSpacing: "0.12em",
                    color: "var(--amber)",
                  }}
                >
                  {activeId.replace("_", " ").toUpperCase()}
                </span>
              </div>

              {/* GPU tip in header */}
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: "rgba(245,158,11,0.06)",
                  border: "1px solid rgba(245,158,11,0.12)",
                }}
              >
                <Zap size={10} style={{ color: "var(--amber)" }} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.08em", color: "var(--text-dim)" }}>
                  GPU SESSIONS LAST 9–12 HRS
                </span>
              </div>
            </div>

            {/* Panel card */}
            <div
              style={{
                borderRadius: 16,
                border: "1px solid var(--border-subtle)",
                background: "rgba(17,17,32,0.7)",
                backdropFilter: "blur(20px)",
                overflow: "hidden",
                flex: 1,
              }}
            >
              {/* Top accent */}
              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)" }} />

              <div style={{ padding: "24px 28px" }}>
                <ActivePanel id={activeId} />
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                borderTop: "1px solid var(--border-subtle)",
                paddingTop: 16,
                marginTop: 16,
                textAlign: "center",
              }}
            >
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.1em", color: "var(--text-dim)" }}>
                SNAPSTUDIO AI · 13 AI-POWERED TOOLS · FRONTEND ON VERCEL · GPU ON KAGGLE
              </p>
            </div>
          </main>
        </div>
      </div>
    </BackendProvider>
  );
}
