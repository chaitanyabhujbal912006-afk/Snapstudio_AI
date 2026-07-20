"use client";

import { motion } from "framer-motion";
import {
  Sparkles, ImageIcon, Palette, Eraser, Zap,
  SlidersHorizontal, UserCheck, Wind, ArrowUpFromLine,
  Scan, Wand2, Type, Maximize2
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
  color: string;
}

interface Category {
  label: string;
  badge?: string;
  badgeColor: string;
  features: Feature[];
}

const CATEGORIES: Category[] = [
  {
    label: "Quick Edit",
    badge: "CPU · Instant",
    badgeColor: "#06b6d4",
    features: [
      { id: "enhance",     label: "Auto-Enhance",     icon: Sparkles,          speed: "~2s",   color: "#06b6d4" },
      { id: "color_grade", label: "Color Grade",       icon: SlidersHorizontal, speed: "~0.2s", color: "#f59e0b" },
      { id: "retouch",     label: "Portrait Retouch",  icon: UserCheck,         speed: "~0.5s", color: "#34d399" },
      { id: "denoise",     label: "Denoise",           icon: Wind,              speed: "~1s",   color: "#94a3b8" },
      { id: "effects",     label: "Effects",           icon: Wand2,             speed: "<0.5s", color: "#a78bfa" },
    ],
  },
  {
    label: "AI Enhance",
    badge: "GPU · 5–30s",
    badgeColor: "#f59e0b",
    features: [
      { id: "upscale",      label: "Upscale 4×",     icon: Maximize2,       speed: "~15s", color: "#f97316" },
      { id: "face_enhance", label: "Face Restore",    icon: Scan,            speed: "~20s", color: "#ec4899" },
      { id: "bg_blur",      label: "Bokeh Blur",      icon: ArrowUpFromLine, speed: "~5s",  color: "#a78bfa" },
    ],
  },
  {
    label: "AI Transform",
    badge: "GPU · 1–5 min",
    badgeColor: "#f87171",
    features: [
      { id: "bg_swap",       label: "Background Swap",  icon: ImageIcon, speed: "~2 min", color: "#8b5cf6" },
      { id: "style_filter",  label: "Style Filter",     icon: Palette,   speed: "~60s",   color: "#f59e0b" },
      { id: "remove_object", label: "Remove Object",    icon: Eraser,    speed: "~4 min", color: "#94a3b8" },
      { id: "outpaint",      label: "Outpaint",         icon: Zap,       speed: "~3 min", color: "#fbbf24" },
    ],
  },
  {
    label: "Generate",
    badge: "GPU · ~10s",
    badgeColor: "#fb923c",
    features: [
      { id: "text2img", label: "Text → Image", icon: Type, speed: "~10s", color: "#fb923c" },
    ],
  },
];

interface SidebarProps {
  activeId: FeatureId;
  onChange: (id: FeatureId) => void;
}

export default function Sidebar({ activeId, onChange }: SidebarProps) {
  return (
    <aside
      style={{
        width: 200,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        paddingBlock: "24px 16px",
        paddingInline: 8,
        borderRight: "1px solid var(--border-subtle)",
        background: "rgba(11,11,20,0.6)",
        overflowY: "auto",
      }}
    >
      {CATEGORIES.map((cat) => (
        <div key={cat.label} style={{ marginBottom: 6 }}>
          {/* Category header */}
          <div style={{ padding: "4px 10px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.58rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "var(--text-dim)",
              }}
            >
              {cat.label.toUpperCase()}
            </p>
            {cat.badge && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.5rem",
                  letterSpacing: "0.06em",
                  color: cat.badgeColor,
                  background: `${cat.badgeColor}12`,
                  border: `1px solid ${cat.badgeColor}25`,
                  borderRadius: 4,
                  padding: "1px 5px",
                }}
              >
                {cat.badge}
              </span>
            )}
          </div>

          {/* Feature buttons */}
          {cat.features.map((feat) => {
            const Icon = feat.icon;
            const isActive = feat.id === activeId;
            return (
              <button
                key={feat.id}
                onClick={() => onChange(feat.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "8px 10px",
                  borderRadius: 9,
                  textAlign: "left",
                  cursor: "pointer",
                  border: "none",
                  position: "relative",
                  transition: "all 0.18s ease",
                  background: isActive
                    ? `${feat.color}12`
                    : "transparent",
                  outline: "none",
                }}
                className={isActive ? "" : "hover:bg-white/[0.03]"}
              >
                {/* Active left bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeSidebar"
                    style={{
                      position: "absolute",
                      left: 0, top: 4, bottom: 4,
                      width: 2.5,
                      borderRadius: 2,
                      background: feat.color,
                      boxShadow: `0 0 8px ${feat.color}60`,
                    }}
                  />
                )}

                {/* Icon */}
                <div
                  style={{
                    width: 26, height: 26,
                    borderRadius: 7,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: isActive ? `${feat.color}20` : "rgba(255,255,255,0.03)",
                    border: isActive ? `1px solid ${feat.color}30` : "1px solid transparent",
                    flexShrink: 0,
                    transition: "all 0.18s",
                  }}
                >
                  <Icon
                    size={12}
                    style={{ color: isActive ? feat.color : "var(--text-dim)" }}
                  />
                </div>

                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "0.75rem",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                    flex: 1,
                    transition: "color 0.18s",
                  }}
                >
                  {feat.label}
                </span>

                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.5rem",
                    letterSpacing: "0.04em",
                    color: isActive ? feat.color : "var(--text-dim)",
                    transition: "color 0.18s",
                  }}
                >
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
