"use client";

import { motion } from "framer-motion";
import {
  Sparkles, ImageIcon, Palette, Eraser, Zap,
  SlidersHorizontal, UserCheck, Wind, ArrowsUpFromLine,
  Scan, Wand2, Type, Maximize2, ChevronRight
} from "lucide-react";

export type FeatureId =
  | "enhance" | "color_grade" | "retouch" | "denoise" | "effects"
  | "upscale" | "face_enhance" | "bg_blur"
  | "bg_swap" | "style_filter" | "remove_object" | "outpaint"
  | "text2img";

interface Feature {
  id: FeatureId;
  label: string;
  icon: React.ElementType;
  speed: string;
}

interface Category {
  label: string;
  badge?: string;
  features: Feature[];
}

const CATEGORIES: Category[] = [
  {
    label: "Quick Edit",
    badge: "CPU · Instant",
    features: [
      { id: "enhance",     label: "Auto-Enhance",     icon: Sparkles,          speed: "~2s"    },
      { id: "color_grade", label: "Color Grade",       icon: SlidersHorizontal, speed: "~0.2s"  },
      { id: "retouch",     label: "Portrait Retouch",  icon: UserCheck,         speed: "~0.5s"  },
      { id: "denoise",     label: "Denoise",           icon: Wind,              speed: "~1s"    },
      { id: "effects",     label: "Effects",           icon: Wand2,             speed: "<0.5s"  },
    ],
  },
  {
    label: "AI Enhance",
    badge: "GPU · 5–30s",
    features: [
      { id: "upscale",      label: "Upscale 4×",          icon: Maximize2,       speed: "~15s"  },
      { id: "face_enhance", label: "Face Restore",         icon: Scan,            speed: "~20s"  },
      { id: "bg_blur",      label: "Background Blur",      icon: ArrowsUpFromLine, speed: "~5s"  },
    ],
  },
  {
    label: "AI Transform",
    badge: "GPU · 1–5 min",
    features: [
      { id: "bg_swap",      label: "Background Swap",  icon: ImageIcon, speed: "~2 min" },
      { id: "style_filter", label: "Style Filter",     icon: Palette,   speed: "~60s"   },
      { id: "remove_object",label: "Remove Object",    icon: Eraser,    speed: "~4 min" },
      { id: "outpaint",     label: "Outpaint",         icon: Zap,       speed: "~3 min" },
    ],
  },
  {
    label: "Generate",
    badge: "GPU · ~10s",
    features: [
      { id: "text2img", label: "Text → Image", icon: Type, speed: "~10s" },
    ],
  },
];

interface SidebarProps {
  activeId: FeatureId;
  onChange: (id: FeatureId) => void;
}

export default function Sidebar({ activeId, onChange }: SidebarProps) {
  return (
    <aside className="w-56 shrink-0 flex flex-col gap-1 py-6 px-3 border-r border-white/[0.06] bg-white/[0.01] overflow-y-auto">
      {CATEGORIES.map((cat) => (
        <div key={cat.label} className="mb-3">
          {/* Category header */}
          <div className="px-3 mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-600">
              {cat.label}
            </p>
            {cat.badge && (
              <p className="text-[9px] text-zinc-700 mt-0.5">{cat.badge}</p>
            )}
          </div>

          {/* Feature items */}
          {cat.features.map((feat) => {
            const Icon = feat.icon;
            const isActive = feat.id === activeId;
            return (
              <button
                key={feat.id}
                onClick={() => onChange(feat.id)}
                className={`
                  w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left
                  transition-all duration-150 cursor-pointer group relative
                  ${isActive
                    ? "bg-violet-600/20 text-white"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                  }
                `}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeSidebar"
                    className="absolute left-0 top-1 bottom-1 w-0.5 bg-violet-500 rounded-full"
                  />
                )}

                <Icon
                  size={14}
                  className={isActive ? "text-violet-400" : "text-zinc-600 group-hover:text-zinc-400"}
                />
                <span className="text-xs font-medium flex-1">{feat.label}</span>
                <span className={`text-[9px] ${isActive ? "text-violet-400" : "text-zinc-700"}`}>
                  {feat.speed}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </aside>
  );
}
