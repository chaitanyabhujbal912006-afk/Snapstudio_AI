"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import CompareSlider from "@/app/components/CompareSlider";
import {
  Sparkles, SlidersHorizontal, UserCheck, Maximize2, ArrowUpFromLine,
  ImageIcon, Palette, Eraser, Zap, Type, ArrowRight, GitBranch, Terminal
} from "lucide-react";

// Feature specs mapping to their Bento Grid columns and custom mockup renders
const BENTO_FEATURES = [
  {
    icon: Type,
    name: "Text → Image Engine",
    desc: "Lightning-fast SDXL-Turbo text-to-image generator",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.06)",
    colSpan: "md:col-span-2",
    mockup: (
      <div className="mt-4 w-full bg-black/40 border border-white/[0.06] rounded-xl p-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between border-b border-white/[0.04] pb-2 text-[0.62rem] text-zinc-500 font-mono">
          <span>PROMPT BUILDER</span>
          <span className="text-amber-500">SDXL_TURBO_v1.0</span>
        </div>
        <div className="bg-zinc-900/60 border border-white/[0.04] rounded-lg p-2 flex items-center justify-between text-[0.7rem] text-zinc-300 font-mono">
          <span>/imagine cyberpunk portrait of an android, neon rim light</span>
          <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded text-[0.55rem] font-bold">GENERATE</span>
        </div>
        <div className="flex gap-2">
          <div className="h-16 w-full rounded-lg bg-gradient-to-r from-violet-950/30 via-amber-950/20 to-cyan-950/30 border border-white/[0.03] relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-shimmer-sweep animate-[pulse_3s_infinite]" />
            <span className="text-[0.6rem] text-zinc-500 font-mono">Status: Done in 0.8s</span>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: Sparkles,
    name: "Auto-Enhance",
    desc: "One-click brightness & tone correction",
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.06)",
    colSpan: "md:col-span-1",
    mockup: (
      <div className="mt-4 w-full flex flex-col gap-2">
        <div className="flex justify-between items-center text-[0.62rem] font-mono text-zinc-400">
          <span>CORRECTION LEVEL</span>
          <span className="text-cyan-400 font-bold">85%</span>
        </div>
        <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/[0.04]">
          <div className="h-full bg-cyan-500 rounded-full" style={{ width: "85%" }} />
        </div>
        <div className="flex gap-1.5 mt-1">
          <span className="text-[0.6rem] px-2 py-0.5 rounded bg-zinc-800 border border-white/[0.05] text-zinc-300">Natural</span>
          <span className="text-[0.6rem] px-2 py-0.5 rounded bg-cyan-950/30 border border-cyan-800/30 text-cyan-400 font-medium">Vivid Pro</span>
        </div>
      </div>
    )
  },
  {
    icon: Maximize2,
    name: "Swin2SR Upscale",
    desc: "True 4× resolution restoration engine",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.06)",
    colSpan: "md:col-span-1",
    mockup: (
      <div className="mt-4 w-full flex flex-col items-center justify-center p-2.5 rounded-xl bg-orange-950/15 border border-orange-500/10 text-center">
        <span className="text-2xl font-bold font-display text-orange-400 tracking-tight">4K UHD</span>
        <span className="text-[0.58rem] font-mono text-zinc-500 tracking-widest mt-1 uppercase">Super-resolution active</span>
      </div>
    )
  },
  {
    icon: ImageIcon,
    name: "Background Swap",
    desc: "AI product & portrait environment builder",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.06)",
    colSpan: "md:col-span-2",
    mockup: (
      <div className="mt-4 w-full flex flex-col gap-2.5">
        <div className="flex justify-between items-center text-[0.62rem] text-zinc-400 font-mono">
          <span>ENVIRONMENT PRESETS</span>
          <span>4 ACTIVE</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[0.6rem] px-2 py-1 rounded-lg bg-zinc-900 border border-white/[0.05] text-zinc-400">🏔 Mountain Mist</span>
          <span className="text-[0.6rem] px-2 py-1 rounded-lg bg-violet-950/20 border border-violet-500/20 text-violet-300 font-medium">🛋 Studio Light</span>
          <span className="text-[0.6rem] px-2 py-1 rounded-lg bg-zinc-900 border border-white/[0.05] text-zinc-400">🌃 Cyber Street</span>
          <span className="text-[0.6rem] px-2 py-1 rounded-lg bg-zinc-900 border border-white/[0.05] text-zinc-400">🏖 Sunset Glow</span>
        </div>
      </div>
    )
  },
  {
    icon: Eraser,
    name: "Object Removal",
    desc: "AI mask-inpainting deletion brush",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.06)",
    colSpan: "md:col-span-1",
    mockup: (
      <div className="mt-4 w-full bg-black/30 border border-white/[0.04] rounded-xl p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-[0.65rem] text-red-400 font-bold">⚡</span>
          <div className="flex flex-col">
            <span className="text-[0.65rem] text-zinc-300 font-medium">Brush Selection</span>
            <span className="text-[0.55rem] text-zinc-500 font-mono">Size: 24px</span>
          </div>
        </div>
        <span className="text-[0.6rem] font-bold text-red-400 uppercase tracking-wider font-mono">ERASE MASK</span>
      </div>
    )
  },
  {
    icon: Zap,
    name: "Extend Canvas",
    desc: "Generative outpainting editor workspace",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.06)",
    colSpan: "md:col-span-1",
    mockup: (
      <div className="mt-4 w-full bg-black/40 border border-white/[0.05] aspect-[2/1] rounded-xl relative overflow-hidden flex items-center justify-center">
        <div className="absolute h-[80%] w-[50%] border border-dashed border-violet-500/40 rounded flex items-center justify-center">
          <span className="text-[0.5rem] text-violet-400 font-mono uppercase tracking-wider">Crop 1:1</span>
        </div>
        <div className="absolute top-2 right-2 text-[0.5rem] font-mono text-zinc-500">OUTPAINT: 16:9</div>
      </div>
    )
  },
  {
    icon: SlidersHorizontal,
    name: "Curves & Levels",
    desc: "15 Hollywood-grade grading profiles",
    color: "#eab308",
    bg: "rgba(234,179,8,0.06)",
    colSpan: "md:col-span-1",
    mockup: (
      <div className="mt-4 w-full bg-black/40 border border-white/[0.04] rounded-xl p-2.5">
        <div className="h-10 w-full relative">
          <svg className="h-full w-full stroke-amber-500/70 fill-none" viewBox="0 0 100 40">
            <path d="M0,40 C20,30 40,10 60,8 C80,6 100,0 100,0" strokeWidth="1.5" />
            <line x1="0" y1="0" x2="100" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="2,2" />
          </svg>
        </div>
        <div className="flex justify-between items-center text-[0.55rem] font-mono text-zinc-500 mt-1">
          <span>MONO LEVELS</span>
          <span className="text-amber-500 font-bold">LUT_GOLDEN_HOUR</span>
        </div>
      </div>
    )
  },
  {
    icon: ArrowUpFromLine,
    name: "Depth Bokeh",
    desc: "Bokeh focus fields via MiDaS mapping",
    color: "#ec4899",
    bg: "rgba(236,72,153,0.06)",
    colSpan: "md:col-span-1",
    mockup: (
      <div className="mt-4 w-full flex items-center justify-between bg-zinc-900/50 border border-white/[0.05] p-2 rounded-xl">
        <span className="text-[0.62rem] text-zinc-400 font-mono">FOCAL DEPTH</span>
        <div className="flex gap-1">
          <span className="text-[0.55rem] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">f2.8</span>
          <span className="text-[0.55rem] px-1.5 py-0.5 rounded bg-pink-950/30 border border-pink-500/30 text-pink-400 font-bold">f1.4</span>
        </div>
      </div>
    )
  },
  {
    icon: UserCheck,
    name: "Portrait Retouch",
    desc: "Skin-smoothing, red-eye & face maps",
    color: "#34d399",
    bg: "rgba(52,211,153,0.06)",
    colSpan: "md:col-span-1",
    mockup: (
      <div className="mt-4 w-full flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-[0.58rem] text-zinc-500 font-mono">
          <span>FACIAL MAPPING</span>
          <span className="text-emerald-400">READY</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="h-6 w-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[0.6rem] text-emerald-400">
            ✓
          </div>
          <span className="text-[0.65rem] text-zinc-300 font-mono">Skin Correct (Smooth: 60%)</span>
        </div>
      </div>
    )
  },
  {
    icon: Palette,
    name: "Style Filters",
    desc: "Anime Ghibli, sketch & oil transfers",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.06)",
    colSpan: "md:col-span-1",
    mockup: (
      <div className="mt-4 w-full flex gap-1.5">
        <div className="flex-1 bg-sky-950/20 border border-sky-500/20 rounded-lg p-1.5 text-center flex flex-col items-center">
          <span className="text-[0.55rem] text-sky-400 font-bold">Ghibli</span>
        </div>
        <div className="flex-1 bg-zinc-900 border border-white/[0.04] rounded-lg p-1.5 text-center flex flex-col items-center">
          <span className="text-[0.55rem] text-zinc-500">Classic Oil</span>
        </div>
      </div>
    )
  }
];

const STEPS = [
  { n: "01", title: "Launch Kaggle GPU Node", desc: "Upload kaggle_notebook.ipynb. Activate GPU P100/T4 & Internet, then run the notebook cell.", icon: <Terminal size={18} /> },
  { n: "02", title: "Bind Public Endpoint", desc: "Copy the Gradio URL printed at the end of the Kaggle backend notebook.", icon: <GitBranch size={18} /> },
  { n: "03", title: "Begin Generating", desc: "Paste the live link inside SnapStudio, register GPU engines, and edit images.", icon: <Sparkles size={18} /> },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black text-[#f5f5f7] select-none" style={{ fontFamily: "var(--font-body)" }}>

      {/* ── BACKGROUND LIGHTING SPEC ─────────────────────────────── */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] aspect-square rounded-full bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.06)_0%,transparent_70%)] blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[35%] right-[-10%] w-[50%] aspect-square rounded-full bg-[radial-gradient(circle_at_center,rgba(8,145,178,0.04)_0%,transparent_70%)] blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-5%] left-[20%] w-[55%] aspect-square rounded-full bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.03)_0%,transparent_70%)] blur-[120px] pointer-events-none z-0" />

      {/* ── NAV BAR (Apple Style Header) ─────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#000000]/70 backdrop-blur-[24px] border-b border-white/[0.06] h-[52px] flex items-center">
        <div className="w-full max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-6 h-6 rounded-md bg-[#ffffff] flex items-center justify-center shadow-md">
              <span className="text-[0.75rem] font-bold text-black font-display">S</span>
            </div>
            <div className="leading-[1.1]">
              <span className="font-display font-medium text-[0.8rem] tracking-tight text-[#f5f5f7]">
                Snap<span className="text-amber-500 font-semibold">Studio</span>
              </span>
            </div>
          </div>
          <nav className="flex items-center gap-6 text-[0.75rem] font-medium text-[#86868b]">
            <Link href="https://github.com/chaitanyabhujbal912006-afk/Snapstudio_AI" target="_blank" className="hover:text-[#f5f5f7] transition-colors duration-200 flex items-center gap-1.5">
              <GitBranch size={13} />
              GitHub
            </Link>
            <Link href="/editor" className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full bg-white text-black font-semibold tracking-tight hover:scale-[1.03] active:scale-[0.98] transition-all duration-200">
              Open Studio ↗
            </Link>
          </nav>
        </div>
      </header>

      {/* ── HERO SECTION ────────────────────────────────────────── */}
      <section className="relative z-10 w-full flex flex-col items-center text-center px-6 pt-[140px] pb-16">
        {/* Glow pill */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 mb-7 px-4 py-1.5 rounded-full bg-zinc-950 border border-white/[0.06] shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse" />
          <span className="font-mono text-[0.58rem] tracking-[0.18em] text-zinc-400 font-bold uppercase">13 AI ENGINES · ZERO LATENCY RUNTIME</span>
        </motion.div>

        {/* Apple Style Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl mx-auto font-display font-semibold tracking-tighter"
          style={{ fontSize: "clamp(2.5rem, 6.5vw, 5rem)", lineHeight: 1.05 }}
        >
          <span className="bg-gradient-to-b from-white to-[#86868b] bg-clip-text text-transparent">Your Images.</span>
          <br />
          <span className="shimmer-text">Reborn in the Studio.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-xl mx-auto mt-6 text-[#86868b] font-light"
          style={{ fontSize: "clamp(0.95rem, 1.8vw, 1.1rem)", lineHeight: 1.6 }}
        >
          A state-of-the-art computational workspace for <span className="text-[#f5f5f7] font-medium">neural photography editing, diffusion, and enhancement</span> — running on cloud GPU instances.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center flex-wrap gap-4 mt-10"
        >
          <Link href="/editor" className="btn-studio">
            Begin Editing <ArrowRight size={15} />
          </Link>
          <Link href="https://github.com/chaitanyabhujbal912006-afk/Snapstudio_AI" target="_blank" className="btn-ghost">
            View Source Code
          </Link>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center flex-wrap gap-x-12 gap-y-6 mt-16 border-t border-white/[0.06] pt-10 w-full max-w-2xl mx-auto"
        >
          {[{ v: "13", l: "INTEGRATED ENGINE INTERFACES" }, { v: "4×", l: "NEURAL RESOLUTION Restorer" }, { v: "0ms", l: "CPU PROCESSING OVERHEAD" }].map((s) => (
            <div key={s.l} className="text-center">
              <p className="font-display font-medium text-lg text-white">{s.v}</p>
              <p className="text-[0.55rem] text-[#86868b] tracking-[0.16em] uppercase mt-1">{s.l}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── COMPARE SLIDER DISPLAY PRELUDE ──────────────────────── */}
      <section className="relative z-10 w-full px-6 pb-20">
        <div className="w-full max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Monitor bezel bezel container */}
            <div className="w-full bg-[#0d0d10] border border-[#27272a] rounded-[24px] overflow-hidden p-3 shadow-[0_24px_60px_rgba(0,0,0,0.8)]">
              {/* Header inside screen mockup */}
              <div className="flex items-center justify-between px-3 pb-3 border-b border-white/[0.04]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
                </div>
                <div className="text-[0.58rem] text-zinc-500 font-mono tracking-[0.1em] uppercase">
                  RENDER ENGINE PREVIEW · DUAL STAGE SHOT
                </div>
                <div className="w-10" />
              </div>
              <div className="mt-3 overflow-hidden rounded-xl">
                <CompareSlider beforeImg="/before.png" afterImg="/after.png" />
              </div>
            </div>
            <p className="text-center mt-4 font-mono text-[0.58rem] tracking-[0.1em] text-zinc-500">
              ↔ DRAG SLIDER CONTROLS · CONTROLNET STYLING RENDER BUFFER MATCH
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── BENTO GRID FEATURES SHOWCASE ─────────────────────────── */}
      <section className="relative z-10 w-full py-24 border-t border-white/[0.06] bg-[#030303]">
        <div className="w-full max-w-5xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16"
          >
            <p className="font-mono text-[0.58rem] tracking-[0.2em] text-amber-500 font-bold uppercase mb-3">CREATIVE PIPELINE</p>
            <h2 className="font-display font-medium text-[1.8rem] md:text-[2.2rem] tracking-tight text-white">
              Sleek AI Modules. Pro Control.
            </h2>
            <p className="mt-3 text-zinc-500 text-[0.85rem] max-w-md mx-auto leading-relaxed">
              Every stage of your image lifecycle running with hardware-accelerated precision interfaces.
            </p>
          </motion.div>

          {/* Bento Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BENTO_FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.name}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className={`glitter-card-wrap ${feat.colSpan} group`}
                  style={{
                    ["--card-glow" as string]: `${feat.color}40`,
                    ["--card-glow-solid" as string]: feat.color,
                  }}
                >
                  {/* Rotating border lighting glow */}
                  <div className="glow-ring" />

                  {/* Edge sparkle accents (conforming to style spec alignment) */}
                  <span className="sparkle sparkle-tl" style={{ ["--card-glow-solid" as string]: feat.color }} />
                  <span className="sparkle sparkle-tr" style={{ ["--card-glow-solid" as string]: feat.color }} />
                  <span className="sparkle sparkle-bl" style={{ ["--card-glow-solid" as string]: feat.color }} />
                  <span className="sparkle sparkle-br" style={{ ["--card-glow-solid" as string]: feat.color }} />

                  {/* Translucent Bento Panel Container */}
                  <div
                    className="glitter-card-inner h-full flex flex-col justify-between"
                    style={{
                      border: "1px solid rgba(255, 255, 255, 0.06)",
                      background: "rgba(10, 10, 12, 0.75)",
                      backdropFilter: "blur(20px) saturate(180%)",
                      padding: "24px",
                    }}
                  >
                    <div>
                      {/* Icon Indicator */}
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center border transition-all duration-300 group-hover:scale-105"
                        style={{
                          background: feat.bg,
                          borderColor: `${feat.color}25`
                        }}
                      >
                        <Icon size={16} strokeWidth={1.5} style={{ color: feat.color }} />
                      </div>
                      <h3 className="font-display font-medium text-[0.85rem] tracking-tight text-white mt-4">{feat.name}</h3>
                      <p className="text-zinc-500 text-[0.72rem] leading-relaxed mt-1">{feat.desc}</p>
                    </div>

                    {/* Integrated Interactive Blueprint Mockup */}
                    {feat.mockup}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── DECOUPLED ARCHITECTURE (How It Works) ───────────────── */}
      <section className="relative z-10 w-full py-24 px-6 border-b border-white/[0.06] bg-black">
        <div className="w-full max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-16"
          >
            <p className="font-mono text-[0.58rem] tracking-[0.2em] text-[#86868b] font-bold uppercase mb-3">INFRASTRUCTURE PIPELINE</p>
            <h2 className="font-display font-medium text-[1.8rem] md:text-[2.2rem] tracking-tight text-white animate-pulse-glow">
              Zero Latency Hybrid Architecture.
            </h2>
            <p className="mt-3 text-[#86868b] text-[0.85rem] max-w-md mx-auto leading-relaxed">
              Experience lightning rendering rates via a decoupled remote GPU execution chain.
            </p>
          </motion.div>

          {/* Interactive Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="relative rounded-2xl bg-zinc-950 border border-white/[0.05] p-6 overflow-hidden flex flex-col justify-between aspect-[1.1/1]"
              >
                {/* Step badge overlay */}
                <div className="absolute top-4 right-4 text-zinc-800 font-display font-bold text-4xl block opacity-40 select-none">
                  {step.n}
                </div>
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.06] flex items-center justify-center text-amber-500 mb-6">
                  {step.icon}
                </div>
                <div>
                  <h3 className="font-display font-medium text-[0.82rem] tracking-tight text-[#f5f5f7]">{step.title}</h3>
                  <p className="text-[0.72rem] text-[#86868b] leading-relaxed mt-2">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA SECTION ───────────────────────────────────── */}
      <section className="relative z-10 w-full py-28 px-6 text-center bg-zinc-950/60 overflow-hidden">
        {/* Spotlight decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_600px_350px_at_50%_100%,rgba(217,119,6,0.05),transparent)] pointer-events-none" />

        <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="font-display font-medium text-[1.8rem] md:text-[2.6rem] tracking-tight text-white mb-6">
              Upgrade Your Photographic Engine.
            </h2>
            <p className="text-[#86868b] text-[0.85rem] leading-relaxed max-w-lg mx-auto mb-10 font-light">
              Connect to high-performance remote GPU runtimes, activate advanced segment canvas layers, and render content in high fidelity.
            </p>
            <div className="flex justify-center">
              <Link href="/editor" className="btn-studio">
                Open Creative Suite <ArrowRight size={15} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER BAR ───────────────────────────────────────────── */}
      <footer className="relative z-10 w-full py-8 border-t border-white/[0.04] bg-black">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[0.58rem] tracking-[0.16em] text-[#86868b] uppercase">
            SNAPSTUDIO AI · NEXT.JS HYBRID STACK WORKSPACE · 2026
          </p>
          <div className="flex gap-4">
            <Link href="https://github.com/chaitanyabhujbal912006-afk/Snapstudio_AI" target="_blank" className="font-mono text-[0.58rem] tracking-tight text-zinc-500 hover:text-white transition-colors duration-150">
              GITHUB CODEBASE
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
