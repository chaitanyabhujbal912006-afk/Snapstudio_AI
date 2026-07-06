"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import CompareSlider from "@/app/components/CompareSlider";
import {
  Sparkles, SlidersHorizontal, UserCheck, Wind, Wand2,
  Maximize2, Scan, ArrowUpFromLine, ImageIcon, Palette, Eraser, Zap, Type, ArrowRight, GitBranch
} from "lucide-react";

// Neon badges for features
const FEATURES_BADGES = [
  { icon: Sparkles, name: "Auto-Enhance", desc: "One-click light & tone correction", color: "from-blue-500 to-indigo-500" },
  { icon: SlidersHorizontal, name: "Pro Color Grading", desc: "15 Hollywood-grade color curves", color: "from-purple-500 to-pink-500" },
  { icon: UserCheck, name: "Portrait Retouch", desc: "Skin-smoothing, teeth-whitening", color: "from-teal-400 to-emerald-500" },
  { icon: Maximize2, name: "Swin2SR Upscaling", desc: "True 4x resolution restorer", color: "from-amber-400 to-orange-500" },
  { icon: ArrowUpFromLine, name: "Bokeh Depth Blur", desc: "DSLR-style focus fields via MiDaS", color: "from-red-400 to-rose-500" },
  { icon: ImageIcon, name: "Background Swap", desc: "AI product & portrait environment builder", color: "from-cyan-400 to-blue-500" },
  { icon: Palette, name: "Style Filters", desc: "Ghibli anime, sketch, & oil paintings", color: "from-lime-400 to-green-500" },
  { icon: Eraser, name: "Object Removal", desc: "AI mask-inpainting removal tool", color: "from-zinc-400 to-zinc-600" },
  { icon: Zap, name: "Extend Canvas", desc: "Generative outpainting canvas", color: "from-violet-500 to-purple-600" },
  { icon: Type, name: "Text → Image", desc: "Lighting fast SDXL-Turbo generator", color: "from-fuchsia-500 to-pink-600" },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen text-white bg-[#06060c] overflow-x-hidden font-sans">
      {/* Dynamic Animated Ambient Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 40, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[140px] -top-96 -left-48 pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          x: [0, -50, 0],
          y: [0, 40, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-[500px] h-[500px] bg-fuchsia-600/5 rounded-full blur-[130px] top-[40%] right-[-100px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          x: [0, 30, 0],
          y: [0, 50, 0],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-[450px] h-[450px] bg-cyan-600/8 rounded-full blur-[120px] bottom-0 left-[20%] pointer-events-none"
      />

      {/* Decorative Grid Line System */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#06060c]/40 backdrop-blur-md border-b border-white/[0.04] px-6 py-4">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-default">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-900/30">
              S
            </div>
            <span className="font-extrabold text-sm tracking-wider uppercase bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              SnapStudio <span className="text-violet-400">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/chaitanyabhujbal912006-afk/Snapstudio_AI"
              target="_blank"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <GitBranch size={18} />
            </Link>
            <Link
              href="/editor"
              className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-xs font-semibold tracking-wide transition-all"
            >
              Skip to Workspace
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 max-w-[1200px] mx-auto z-10 flex flex-col items-center text-center">
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-6 uppercase tracking-wider"
        >
          <Sparkles size={12} className="animate-pulse" />
          The Ultimate Creative AI Sandbox
        </motion.div>

        {/* Catchy headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] max-w-4xl text-zinc-100"
        >
          Transform Your Creative Workflow With{" "}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-purple-500 bg-clip-text text-transparent select-text">
            Autonomous AI Engines
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 text-zinc-400 text-sm md:text-base max-w-2xl leading-relaxed"
        >
          An feature-packed suite of 13 professional editing, restoration, outpainting and diffusion engines. Zero CPU latency. Instant professional results.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-8"
        >
          <Link
            href="/editor"
            className="group px-7 py-4 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 flex items-center gap-2.5 shadow-xl shadow-purple-900/30 transition-all select-none hover:scale-105"
          >
            Launch SnapStudio Sandbox
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </section>

      {/* Interactive Feature: Before / After Slider */}
      <section className="relative z-10 px-6 pb-28 max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative rounded-3xl p-1 bg-gradient-to-b from-white/10 to-transparent max-w-3xl mx-auto"
        >
          <div className="rounded-[22px] overflow-hidden bg-zinc-950 p-2 md:p-3 relative z-10 border border-white/5">
            <CompareSlider
              beforeImg="/before.png"
              afterImg="/after.png"
            />
          </div>
          {/* Decorative glowing background behind slider */}
          <div className="absolute inset-4 bg-gradient-to-b from-violet-600/30 via-transparent to-transparent blur-3xl pointer-events-none -z-10" />
        </motion.div>

        <p className="text-center text-xs text-zinc-500 mt-6 select-none">
          ↔ Drag the slider to compare original portrait photography with neon studio transformation
        </p>
      </section>

      {/* Feature Section Grid */}
      <section className="relative z-10 px-6 py-20 bg-black/40 border-y border-white/[0.02]">
        <div className="max-w-[1200px] mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">13 Dedicated Creative Suites</h2>
            <p className="text-zinc-500 text-xs md:text-sm">Powering your daily workspace from instant light grading to detailed canvas outpainting.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES_BADGES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.name}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="group relative rounded-2xl border border-white/[0.05] bg-white/[0.015] p-5 hover:bg-white/[0.035] hover:border-white/10 transition-all select-none"
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${feat.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg shadow-black/30`}>
                    <Icon size={16} className="text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">{feat.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{feat.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Steps workflow for connecting the backend */}
      <section className="relative z-10 px-6 py-24 max-w-[1200px] mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Decoupled Architecture Integration</h2>
          <p className="text-zinc-500 text-xs sm:text-sm">A secure 2-part pipeline: local client wrapper connecting instantly to free Kaggle GPU nodes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { n: "01", title: "Launch Kaggle GPU Node", desc: "Upload kaggle_notebook.ipynb. Activate GPU acceleration & Internet, and run the server cell." },
            { n: "02", title: "Bind Public Endpoint", desc: "Copy the generated live Gradio URL link printed at the end of the Kaggle notebook." },
            { n: "03", title: "Begin Generating", desc: "Paste the live link directly inside SnapStudio, unlock our dual GPU engines, and enjoy dynamic AI creations." },
          ].map((item) => (
            <div key={item.n} className="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-6 relative overflow-hidden">
              <div className="absolute top-1 right-2 text-7xl font-black text-white/[0.015] leading-none select-none">
                {item.n}
              </div>
              <div className="w-7 h-7 rounded-full bg-violet-600/20 text-violet-400 text-xs font-black flex items-center justify-center mb-4">
                {item.n}
              </div>
              <h3 className="text-sm font-bold text-zinc-200">{item.title}</h3>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Bottom Section */}
      <section className="relative z-10 px-6 py-20 max-w-[900px] mx-auto text-center space-y-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_350px_at_50%_50%,rgba(124,58,237,0.08),transparent)] pointer-events-none" />
        <h2 className="text-3xl font-extrabold text-zinc-100">Ready to Upgrade Your Editing Engine?</h2>
        <p className="text-xs md:text-sm text-zinc-500 max-w-lg mx-auto">
          Step into a professional creative canvas with built-in segment mapping, multi-stage render buffers, and zero cost.
        </p>
        <div className="pt-4 flex justify-center">
          <Link
            href="/editor"
            className="group px-7 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 flex items-center gap-2 transition-all hover:scale-105"
          >
            Launch Creative Suite
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] py-8 text-center text-xs text-zinc-700">
        <p>SnapStudio AI · Built with Next.js & Gradio API · 2026 Creative Sandbox</p>
      </footer>
    </div>
  );
}
