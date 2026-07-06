"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ImageIcon, Palette, Eraser, ArrowRight, GitBranch } from "lucide-react";
import { BackendProvider } from "@/app/context/BackendContext";
import Header from "@/app/components/Header";
import EnhanceTab from "@/app/components/EnhanceTab";
import BgSwapTab from "@/app/components/BgSwapTab";
import StyleTab from "@/app/components/StyleTab";
import RemoveTab from "@/app/components/RemoveTab";

const TABS = [
  {
    id: "enhance",
    label: "Auto-Enhance",
    shortLabel: "Enhance",
    icon: Sparkles,
    speed: "~2s",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "bgswap",
    label: "Background Swap",
    shortLabel: "BG Swap",
    icon: ImageIcon,
    speed: "~2 min",
    color: "from-purple-500 to-fuchsia-600",
  },
  {
    id: "style",
    label: "Style Filter",
    shortLabel: "Style",
    icon: Palette,
    speed: "~60s",
    color: "from-fuchsia-500 to-pink-600",
  },
  {
    id: "remove",
    label: "Remove Object",
    shortLabel: "Remove",
    icon: Eraser,
    speed: "~4 min",
    color: "from-pink-500 to-rose-600",
  },
];

function TabPanel({ activeTab }: { activeTab: string }) {
  return (
    <AnimatePresence mode="wait">
      {activeTab === "enhance" && <EnhanceTab key="enhance" />}
      {activeTab === "bgswap" && <BgSwapTab key="bgswap" />}
      {activeTab === "style" && <StyleTab key="style" />}
      {activeTab === "remove" && <RemoveTab key="remove" />}
    </AnimatePresence>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("enhance");

  return (
    <BackendProvider>
      <div className="relative min-h-screen overflow-x-hidden">

        {/* Background glow orbs */}
        <div className="bg-orb w-[600px] h-[600px] bg-violet-700/15 top-[-100px] left-[-200px]" />
        <div className="bg-orb w-[500px] h-[500px] bg-purple-700/10 top-[40%] right-[-150px]" />
        <div className="bg-orb w-[400px] h-[400px] bg-fuchsia-700/8 bottom-0 left-[30%]" />

        <Header />

        {/* Hero section */}
        <section className="relative z-10 pt-32 pb-16 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-300 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              Powered by free GPU on Kaggle
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
              Your{" "}
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                AI photo studio,
              </span>
              <br />
              always free
            </h1>

            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Auto-enhance, swap backgrounds, apply art styles, or erase objects.
              <br />
              <span className="text-zinc-500 text-base">Custom frontend on Vercel · GPU backend on Kaggle · 100% free.</span>
            </p>

            <div className="flex items-center justify-center gap-4">
              <a
                href="#app"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600
                  hover:from-violet-500 hover:to-purple-500 text-white font-semibold transition-all duration-200
                  shadow-xl shadow-purple-900/40 hover:shadow-purple-900/60 hover:-translate-y-0.5"
              >
                Start editing <ArrowRight size={16} />
              </a>
              <a
                href="https://github.com/chaitanyabhujbal912006-afk/Snapstudio_AI"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10
                  hover:bg-white/10 hover:border-white/20 text-zinc-300 font-semibold transition-all duration-200"
              >
                <GitBranch size={16} /> GitHub
              </a>
            </div>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center justify-center gap-3 flex-wrap mt-12"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <div
                  key={tab.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-sm"
                >
                  <Icon size={13} className="text-violet-400" />
                  {tab.label}
                  <span className="text-xs text-zinc-600 border-l border-white/10 pl-2">{tab.speed}</span>
                </div>
              );
            })}
          </motion.div>
        </section>

        {/* Main App */}
        <section id="app" className="relative z-10 px-6 pb-24 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden"
          >
            {/* Glowing top border */}
            <div className="h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

            {/* Tab bar */}
            <div className="flex border-b border-white/10 bg-white/[0.02] overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative flex items-center gap-2.5 px-5 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer flex-1 justify-center
                      ${isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"}
                    `}
                  >
                    <Icon size={15} className={isActive ? "text-violet-400" : ""} />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full hidden md:inline
                      ${isActive ? "bg-violet-600/20 text-violet-300" : "text-zinc-700"}`}>
                      {tab.speed}
                    </span>

                    {/* Active underline */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-purple-500"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Panel content */}
            <div className="p-6 md:p-8">
              <TabPanel activeTab={activeTab} />
            </div>
          </motion.div>

          {/* Info note */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center"
          >
            <p className="text-zinc-600 text-sm">
              ⚡ Connect a Kaggle GPU backend above to start processing. Sessions last 9–12 hrs —{" "}
              <span className="text-zinc-500">paste a new URL when it expires.</span>
            </p>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/5 py-8 px-6 text-center">
          <p className="text-zinc-700 text-sm">
            SnapStudio AI · Frontend on <span className="text-zinc-500">Vercel</span> · GPU on{" "}
            <span className="text-zinc-500">Kaggle</span> · Built with ❤️
          </p>
        </footer>
      </div>
    </BackendProvider>
  );
}
