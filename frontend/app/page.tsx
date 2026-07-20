"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import CompareSlider from "@/app/components/CompareSlider";
import {
  Sparkles, SlidersHorizontal, UserCheck, Wind, Wand2,
  Maximize2, Scan, ArrowUpFromLine, ImageIcon, Palette, Eraser, Zap, Type, ArrowRight, GitBranch
} from "lucide-react";

const FEATURES = [
  { icon: Sparkles,          name: "Auto-Enhance",      desc: "One-click light & tone correction",        color: "#06b6d4", bg: "rgba(6,182,212,0.1)"    },
  { icon: SlidersHorizontal, name: "Pro Color Grading", desc: "15 Hollywood-grade color curves",           color: "#f59e0b", bg: "rgba(245,158,11,0.1)"   },
  { icon: UserCheck,         name: "Portrait Retouch",  desc: "Skin-smoothing, teeth-whitening",           color: "#34d399", bg: "rgba(52,211,153,0.1)"   },
  { icon: Maximize2,         name: "Swin2SR Upscale",   desc: "True 4× resolution restorer",               color: "#f97316", bg: "rgba(249,115,22,0.1)"   },
  { icon: ArrowUpFromLine,   name: "Bokeh Depth Blur",  desc: "DSLR-style focus fields via MiDaS",         color: "#ec4899", bg: "rgba(236,72,153,0.1)"   },
  { icon: ImageIcon,         name: "Background Swap",   desc: "AI product & portrait environment builder", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)"   },
  { icon: Palette,           name: "Style Filters",     desc: "Ghibli, sketch & oil painting transfers",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)"   },
  { icon: Eraser,            name: "Object Removal",    desc: "AI mask-inpainting removal tool",           color: "#94a3b8", bg: "rgba(148,163,184,0.1)"  },
  { icon: Zap,               name: "Extend Canvas",     desc: "Generative outpainting canvas",             color: "#a78bfa", bg: "rgba(167,139,250,0.1)"  },
  { icon: Type,              name: "Text → Image",      desc: "Lightning-fast SDXL-Turbo generator",       color: "#fb923c", bg: "rgba(251,146,60,0.1)"   },
];

const STEPS = [
  { n: "01", title: "Launch Kaggle GPU Node",  desc: "Upload kaggle_notebook.ipynb. Activate GPU & Internet, then run the server cell.", icon: "🖥" },
  { n: "02", title: "Bind Public Endpoint",    desc: "Copy the Gradio URL printed at the end of the Kaggle notebook.",                    icon: "🔗" },
  { n: "03", title: "Begin Generating",        desc: "Paste the live link inside SnapStudio, unlock dual GPU engines, and create.",        icon: "⚡" },
];

function FilmHoles({ count = 12 }: { count?: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex-shrink-0"
          style={{ width: 14, height: 5, borderRadius: 2, background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.07)" }}
        />
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: "var(--bg-void)", color: "var(--text-primary)", fontFamily: "var(--font-body)" }}>

      {/* ── AMBIENT ORBS ─────────────────────────────────────────── */}
      <div className="bg-orb" style={{ width: 700, height: 700, background: "radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)", top: -200, left: -200, animation: "float-slow 22s ease-in-out infinite" }} />
      <div className="bg-orb" style={{ width: 500, height: 500, background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)", top: "40%", right: -150, animation: "float-med 28s ease-in-out infinite" }} />
      <div className="bg-orb" style={{ width: 400, height: 400, background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)", bottom: 0, left: "25%", animation: "float-slow 35s ease-in-out infinite reverse" }} />

      {/* ── NAVBAR ───────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50" style={{ background: "rgba(8,8,16,0.82)", backdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        {/* Film strip row */}
        <div className="flex items-center overflow-hidden px-4" style={{ height: 8, background: "var(--bg-raised)", borderBottom: "1px solid rgba(255,255,255,0.04)", gap: 8 }}>
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i} className="flex-shrink-0" style={{ width: 14, height: 5, borderRadius: 2, background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.07)" }} />
          ))}
        </div>
        <div className="w-full max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-default">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(245,158,11,0.3)" }}>
              <span style={{ fontSize: 17, fontWeight: 900, color: "#1a0e00", fontFamily: "var(--font-display)" }}>S</span>
            </div>
            <div style={{ lineHeight: 1 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.02em", color: "var(--text-primary)", display: "block" }}>
                Snap<span style={{ color: "var(--amber)" }}>Studio</span>
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", color: "var(--amber)", letterSpacing: "0.16em", display: "block", marginTop: 1 }}>AI · STUDIO</span>
            </div>
          </div>
          {/* Nav */}
          <nav className="flex items-center gap-4">
            <Link href="https://github.com/chaitanyabhujbal912006-afk/Snapstudio_AI" target="_blank" style={{ color: "var(--text-dim)", display: "flex", alignItems: "center", transition: "color 0.2s" }} className="hover:text-amber-400">
              <GitBranch size={16} />
            </Link>
            <Link href="/editor" style={{ padding: "7px 15px", borderRadius: 8, fontSize: "0.75rem", fontWeight: 600, fontFamily: "var(--font-display)", letterSpacing: "0.04em", background: "rgba(245,158,11,0.1)", color: "var(--amber)", border: "1px solid rgba(245,158,11,0.25)", textDecoration: "none", transition: "all 0.2s" }} className="hover:bg-amber-500/20">
              Open Workspace ↗
            </Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative z-10 w-full flex flex-col items-center text-center px-6" style={{ paddingTop: "clamp(120px, 22vh, 180px)", paddingBottom: 80 }}>
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 mb-7"
          style={{ padding: "5px 14px", borderRadius: 100, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--amber)", boxShadow: "0 0 8px rgba(245,158,11,0.6)", display: "inline-block", animation: "pulse-glow 2s ease-in-out infinite" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.16em", color: "var(--amber)" }}>13 AI ENGINES · ZERO CPU LATENCY</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          className="w-full max-w-4xl mx-auto"
          style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.4rem, 6vw, 5.2rem)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-0.025em" }}>
          <span style={{ color: "var(--text-primary)" }}>Your Images.</span>
          <br />
          <span className="shimmer-text">Reborn in the Studio.</span>
        </motion.h1>

        {/* Sub */}
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.22 }}
          className="w-full max-w-xl mx-auto mt-6"
          style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: 1.72 }}>
          A professional-grade sandbox of{" "}
          <span style={{ color: "var(--text-primary)" }}>editing, restoration, and diffusion engines</span>{" "}
          — all running on free Kaggle GPU nodes.
        </motion.p>

        {/* CTA row */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.34 }}
          className="flex items-center justify-center flex-wrap gap-3 mt-9">
          <Link href="/editor" className="btn-studio" style={{ fontSize: "0.875rem", padding: "13px 26px" }}>
            Launch SnapStudio <ArrowRight size={16} />
          </Link>
          <Link href="https://github.com/chaitanyabhujbal912006-afk/Snapstudio_AI" target="_blank" className="btn-ghost" style={{ fontSize: "0.875rem", padding: "13px 20px" }}>
            <GitBranch size={15} /> View on GitHub
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
          className="flex items-center justify-center flex-wrap gap-10 mt-12">
          {[{ v: "13", l: "AI MODELS" }, { v: "4×", l: "UPSCALING" }, { v: "Free", l: "GPU RUNTIME" }].map((s) => (
            <div key={s.l} className="text-center">
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem", color: "var(--amber)" }}>{s.v}</p>
              <p style={{ fontSize: "0.62rem", color: "var(--text-dim)", letterSpacing: "0.12em", marginTop: 3 }}>{s.l}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── COMPARE SLIDER ───────────────────────────────────────── */}
      <section className="relative z-10 w-full px-6 pb-28">
        <div className="w-full max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            {/* Gradient border frame */}
            <div className="w-full" style={{ padding: 2, borderRadius: 20, background: "linear-gradient(135deg, rgba(245,158,11,0.4), rgba(139,92,246,0.2), rgba(6,182,212,0.2))", boxShadow: "0 0 80px rgba(245,158,11,0.08), 0 40px 80px rgba(0,0,0,0.5)" }}>
              <div className="w-full" style={{ borderRadius: 18, overflow: "hidden", background: "var(--bg-surface)" }}>
                {/* Frame header */}
                <div className="flex items-center justify-between px-4" style={{ height: 36, borderBottom: "1px solid rgba(255,255,255,0.05)", background: "var(--bg-raised)" }}>
                  <FilmHoles count={6} />
                  <div className="flex items-center gap-2">
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--text-dim)", letterSpacing: "0.1em" }}>BEFORE / AFTER</span>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--amber)", boxShadow: "0 0 6px rgba(245,158,11,0.6)" }} />
                  </div>
                  <FilmHoles count={6} />
                </div>
                {/* Slider */}
                <div className="p-3">
                  <CompareSlider beforeImg="/before.png" afterImg="/after.png" />
                </div>
              </div>
            </div>
            <p className="text-center mt-4" style={{ fontFamily: "var(--font-mono)", fontSize: "0.62rem", color: "var(--text-dim)", letterSpacing: "0.08em" }}>
              ↔ DRAG TO COMPARE · Neon studio transform via ControlNet + SDXL
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────────────────── */}
      <section className="relative z-10 w-full py-24" style={{ borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", background: "linear-gradient(180deg, rgba(17,17,32,0.6) 0%, rgba(12,12,22,0.8) 100%)" }}>
        <div className="w-full max-w-6xl mx-auto px-6">
          {/* Heading */}
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="text-center mb-14">
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.2em", color: "var(--amber)", marginBottom: 12 }}>CREATIVE SUITE</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.6rem, 3vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
              13 Dedicated AI Engines
            </h2>
            <p className="mt-3" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              From instant CPU edits to long-running GPU diffusion — everything in one workspace.
            </p>
          </motion.div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              // Convert hex color to rgba for glow vars
              const glowRgba = `${feat.color}99`; // 60% opacity
              return (
                <motion.div
                  key={feat.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.04 }}
                  className="glitter-card-wrap"
                  style={{
                    // Per-card accent color passed as CSS vars
                    ["--card-glow" as string]: glowRgba,
                    ["--card-glow-solid" as string]: feat.color,
                  }}
                >
                  {/* Spinning conic glow ring */}
                  <div className="glow-ring" />

                  {/* Sparkle cross dots — 6 positions around card edges */}
                  <span className="sparkle sparkle-tl" style={{ ["--card-glow" as string]: feat.color }} />
                  <span className="sparkle sparkle-tr" style={{ ["--card-glow" as string]: feat.color }} />
                  <span className="sparkle sparkle-ml" style={{ ["--card-glow" as string]: feat.color }} />
                  <span className="sparkle sparkle-mr" style={{ ["--card-glow" as string]: feat.color }} />
                  <span className="sparkle sparkle-bl" style={{ ["--card-glow" as string]: feat.color }} />
                  <span className="sparkle sparkle-br" style={{ ["--card-glow" as string]: feat.color }} />

                  {/* Side edge glow bars */}
                  <div className="side-glow-left" />
                  <div className="side-glow-right" />

                  {/* Actual card content */}
                  <div
                    className="glitter-card-inner"
                    style={{
                      border: "1px solid var(--border-subtle)",
                      background: "rgba(17,17,32,0.85)",
                      padding: "18px 16px",
                      cursor: "default",
                    }}
                  >
                    <div
                      style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: feat.bg,
                        border: `1px solid ${feat.color}25`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginBottom: 12,
                        transition: "transform 0.2s, box-shadow 0.2s",
                        boxShadow: "none",
                      }}
                      className="group-hover:scale-110"
                    >
                      <Icon size={16} style={{ color: feat.color }} />
                    </div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "0.8rem", color: "var(--text-primary)", marginBottom: 5 }}>{feat.name}</h3>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-dim)", lineHeight: 1.55 }}>{feat.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="relative z-10 w-full py-28 px-6">
        <div className="w-full max-w-5xl mx-auto">
          {/* Heading */}
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="text-center mb-14">
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.2em", color: "var(--cyan)", marginBottom: 12 }}>ARCHITECTURE</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.6rem, 3vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
              Decoupled Pipeline Integration
            </h2>
            <p className="mt-3" style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              A secure 2-part pipeline: local client wrapper connecting instantly to free Kaggle GPU nodes.
            </p>
          </motion.div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{ borderRadius: 16, border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", padding: "28px 24px", position: "relative", overflow: "hidden" }}
              >
                {/* Watermark */}
                <div style={{ position: "absolute", top: -8, right: 10, fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "5rem", color: "rgba(255,255,255,0.025)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>{step.n}</div>
                {/* Badge */}
                <div className="inline-flex items-center mb-5" style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.58rem", letterSpacing: "0.12em", color: "var(--amber)" }}>STEP {step.n}</span>
                </div>
                <div className="text-3xl mb-3">{step.icon}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────── */}
      <section className="relative z-10 w-full py-24 px-6 text-center" style={{ borderTop: "1px solid var(--border-subtle)", background: "linear-gradient(180deg, rgba(12,12,22,0) 0%, rgba(8,8,16,0.8) 100%)" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 600px 300px at 50% 80%, rgba(245,158,11,0.06), transparent)", pointerEvents: "none" }} />
        <div className="relative w-full max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="flex justify-center mb-8 opacity-25">
              <FilmHoles count={10} />
            </div>
            <h2 className="w-full" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: 16, textAlign: "center" }}>
              Ready to Upgrade Your{" "}
              <span style={{ color: "var(--amber)" }}>Editing Engine?</span>
            </h2>
            <p className="w-full max-w-lg mx-auto mb-8" style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.72 }}>
              Step into a professional creative canvas with built-in segment mapping, multi-stage render buffers, and zero cost.
            </p>
            <div className="flex justify-center">
              <Link href="/editor" className="btn-studio" style={{ fontSize: "0.875rem", padding: "13px 30px" }}>
                Open Creative Suite <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer className="relative z-10 w-full py-8 text-center" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <div className="flex justify-center mb-4 opacity-10">
          <FilmHoles count={16} />
        </div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.12em", color: "var(--text-dim)" }}>
          SNAPSTUDIO AI · BUILT WITH NEXT.JS & GRADIO API · 2026 CREATIVE SANDBOX
        </p>
      </footer>

    </div>
  );
}
