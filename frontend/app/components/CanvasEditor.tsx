"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import UploadZone from "@/app/components/UploadZone";
import {
  Sliders, Crop, RotateCw, FlipHorizontal, FlipVertical,
  Download, Sparkles, RefreshCw, Zap
} from "lucide-react";

interface Adjustments {
  brightness: number;  // -100 to 100
  contrast: number;    // -100 to 100
  saturation: number;  // 0 to 200
  temperature: number; // -50 to 50 (warmth)
  sepia: number;       // 0 to 100
  grayscale: boolean;
  blur: number;        // 0 to 20
  vignette: number;    // 0 to 100
  rotation: number;    // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
}

const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 100,
  temperature: 0,
  sepia: 0,
  grayscale: false,
  blur: 0,
  vignette: 0,
  rotation: 0,
  flipH: false,
  flipV: false,
};

const ASPECT_RATIOS = [
  { label: "Original", value: "free" },
  { label: "1:1 Square", value: "1:1" },
  { label: "9:16 Story", value: "9:16" },
  { label: "16:9 Banner", value: "16:9" },
  { label: "4:5 Portrait", value: "4:5" },
  { label: "3:2 Camera", value: "3:2" },
];

export default function CanvasEditor() {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<Adjustments>(DEFAULT_ADJUSTMENTS);
  const [aspectRatio, setAspectRatio] = useState("free");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleFile = (uploadedFile: File, base64: string) => {
    setFile(uploadedFile);
    setImageSrc(base64);
    setAdjustments(DEFAULT_ADJUSTMENTS);

    const img = new Image();
    img.src = base64;
    img.onload = () => {
      imgRef.current = img;
      renderCanvas();
    };
  };

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate crop / dimension aspect ratio
    let targetW = img.naturalWidth;
    let targetH = img.naturalHeight;

    if (aspectRatio !== "free") {
      const [rw, rh] = aspectRatio.split(":").map(Number);
      const targetRatio = rw / rh;
      const currentRatio = targetW / targetH;

      if (currentRatio > targetRatio) {
        targetW = Math.round(targetH * targetRatio);
      } else {
        targetH = Math.round(targetW / targetRatio);
      }
    }

    // Set canvas dimensions considering rotation
    const isRotated90 = adjustments.rotation === 90 || adjustments.rotation === 270;
    canvas.width = isRotated90 ? targetH : targetW;
    canvas.height = isRotated90 ? targetW : targetH;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply transforms (Rotation & Flipping)
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((adjustments.rotation * Math.PI) / 180);
    ctx.scale(adjustments.flipH ? -1 : 1, adjustments.flipV ? -1 : 1);

    // Filters (CSS Canvas Filter String)
    const brightnessVal = 100 + adjustments.brightness;
    const contrastVal = 100 + adjustments.contrast;
    const saturateVal = adjustments.grayscale ? 0 : adjustments.saturation;
    const blurPx = adjustments.blur;
    const sepiaPct = adjustments.sepia;

    ctx.filter = `brightness(${brightnessVal}%) contrast(${contrastVal}%) saturate(${saturateVal}%) sepia(${sepiaPct}%) blur(${blurPx}px)`;

    // Draw image centered & cropped
    const sx = Math.max(0, (img.naturalWidth - targetW) / 2);
    const sy = Math.max(0, (img.naturalHeight - targetH) / 2);

    const drawW = isRotated90 ? canvas.height : canvas.width;
    const drawH = isRotated90 ? canvas.width : canvas.height;

    ctx.drawImage(img, sx, sy, targetW, targetH, -drawW / 2, -drawH / 2, drawW, drawH);

    ctx.restore();

    // Warmth / Temperature Tint Overlay
    if (adjustments.temperature !== 0) {
      ctx.save();
      const temp = adjustments.temperature;
      ctx.fillStyle = temp > 0
        ? `rgba(255, 160, 50, ${Math.min(0.35, (temp / 100) * 0.5)})`
        : `rgba(50, 150, 255, ${Math.min(0.35, (Math.abs(temp) / 100) * 0.5)})`;
      ctx.globalCompositeOperation = "overlay";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // Vignette Overlay
    if (adjustments.vignette > 0) {
      ctx.save();
      const radius = Math.max(canvas.width, canvas.height) * 0.75;
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, radius * 0.4,
        canvas.width / 2, canvas.height / 2, radius
      );
      const alpha = (adjustments.vignette / 100) * 0.85;
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, `rgba(0,0,0,${alpha})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }, [adjustments, aspectRatio]);

  useEffect(() => {
    if (imageSrc) {
      renderCanvas();
    }
  }, [imageSrc, adjustments, aspectRatio, renderCanvas]);

  const updateAdj = (key: keyof Adjustments, value: unknown) => {
    setAdjustments((prev) => ({ ...prev, [key]: value }));
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "snapstudio-canvas-edit.jpg";
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
      {/* Header Banner */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
          <Zap size={20} className="text-amber-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-lg text-white">Live Canvas Studio</h2>
            <span className="text-[0.6rem] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 uppercase">
              0ms Latency · 60 FPS
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Instant client-side adjustments, cropping, rotation & color grading with zero server lag.
          </p>
        </div>
      </div>

      {/* Main Studio Viewport */}
      {!imageSrc ? (
        <UploadZone onFile={handleFile} preview={imageSrc} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interactive Canvas Stage */}
          <div className="lg:col-span-2 bg-black/60 border border-white/[0.08] rounded-2xl p-4 flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden">
            <canvas ref={canvasRef} className="max-w-full max-h-[500px] rounded-lg shadow-2xl object-contain" />
            <div className="mt-4 flex items-center justify-between w-full border-t border-white/[0.06] pt-3 text-[0.68rem] text-zinc-400 font-mono">
              <span>CANVAS LIVE PREVIEW</span>
              <button onClick={() => setImageSrc(null)} className="text-amber-500 hover:underline">
                Change Photo
              </button>
            </div>
          </div>

          {/* Adjustments & Controls Panel */}
          <div className="bg-zinc-950/80 border border-white/[0.08] rounded-2xl p-5 flex flex-col gap-5 max-h-[560px] overflow-y-auto">
            {/* Aspect Ratio Cropper */}
            <div>
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5 mb-2">
                <Crop size={14} className="text-amber-500" /> Aspect Ratio
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.value}
                    onClick={() => setAspectRatio(ar.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-[0.7rem] font-medium transition-all ${
                      aspectRatio === ar.value
                        ? "bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold"
                        : "bg-zinc-900 border border-white/[0.05] text-zinc-400 hover:text-white"
                    }`}
                  >
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transform Controls */}
            <div>
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5 mb-2">
                <RotateCw size={14} className="text-amber-500" /> Transform
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateAdj("rotation", (adjustments.rotation + 90) % 360)}
                  className="flex-1 py-1.5 rounded-lg bg-zinc-900 border border-white/[0.05] text-xs text-zinc-300 flex items-center justify-center gap-1 hover:border-white/20"
                >
                  <RotateCw size={12} /> Rotate
                </button>
                <button
                  onClick={() => updateAdj("flipH", !adjustments.flipH)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs flex items-center justify-center gap-1 ${
                    adjustments.flipH ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "bg-zinc-900 border-white/[0.05] text-zinc-300"
                  }`}
                >
                  <FlipHorizontal size={12} /> Flip H
                </button>
                <button
                  onClick={() => updateAdj("flipV", !adjustments.flipV)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs flex items-center justify-center gap-1 ${
                    adjustments.flipV ? "bg-amber-500/20 border-amber-500/40 text-amber-400" : "bg-zinc-900 border-white/[0.05] text-zinc-300"
                  }`}
                >
                  <FlipVertical size={12} /> Flip V
                </button>
              </div>
            </div>

            {/* Adjustments Sliders */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Sliders size={14} className="text-amber-500" /> Lighting & Color Sliders
              </label>

              {[
                { key: "brightness", label: "Brightness", min: -100, max: 100, val: adjustments.brightness },
                { key: "contrast", label: "Contrast", min: -100, max: 100, val: adjustments.contrast },
                { key: "saturation", label: "Saturation", min: 0, max: 200, val: adjustments.saturation },
                { key: "temperature", label: "Warmth / Temp", min: -50, max: 50, val: adjustments.temperature },
                { key: "vignette", label: "Vignette", min: 0, max: 100, val: adjustments.vignette },
                { key: "blur", label: "Blur", min: 0, max: 20, val: adjustments.blur },
              ].map((s) => (
                <div key={s.key}>
                  <div className="flex justify-between text-[0.7rem] text-zinc-400 mb-1 font-mono">
                    <span>{s.label}</span>
                    <span className="text-amber-400">{s.val}</span>
                  </div>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    value={s.val}
                    onChange={(e) => updateAdj(s.key as keyof Adjustments, Number(e.target.value))}
                    className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                  />
                </div>
              ))}
            </div>

            {/* Action Bar */}
            <div className="flex gap-2 mt-2 pt-3 border-t border-white/[0.06]">
              <button
                onClick={() => setAdjustments(DEFAULT_ADJUSTMENTS)}
                className="px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs text-zinc-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw size={13} /> Reset
              </button>
              <button onClick={handleDownload} className="btn-studio flex-1 justify-center py-2 text-xs">
                <Download size={14} /> Export Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
