"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";

interface SliderProps {
  beforeImg: string;
  afterImg: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function CompareSlider({
  beforeImg,
  afterImg,
  beforeLabel = "Original Portrait",
  afterLabel = "AI Enhanced & Color Graded",
}: SliderProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      className="relative w-full aspect-[4/3] max-w-2xl mx-auto rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl select-none group cursor-ew-resize bg-zinc-950"
    >
      {/* After Image (Full background) */}
      <Image
        src={afterImg}
        alt="After AI"
        fill
        sizes="(max-width: 768px) 100vw, 672px"
        className="object-cover"
        priority
      />
      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 text-[10px] tracking-wider text-violet-300 font-bold uppercase transition-all duration-300 group-hover:scale-105">
        ✨ {afterLabel}
      </div>

      {/* Before Image (Clipping container) */}
      <div
        className="absolute inset-y-0 left-0 w-full overflow-hidden"
        style={{ clipPath: `polygon(0 0, ${position}% 0, ${position}% 100%, 0 100%)` }}
      >
        <Image
          src={beforeImg}
          alt="Before AI"
          fill
          sizes="(max-width: 768px) 100vw, 672px"
          className="object-cover"
          priority
        />
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 text-[10px] tracking-wider text-zinc-400 font-medium uppercase">
          📷 {beforeLabel}
        </div>
      </div>

      {/* Dragging Handle Line */}
      <div
        className="absolute inset-y-0 w-0.5 bg-gradient-to-b from-violet-500 via-fuchsia-500 to-violet-500 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity duration-300"
        style={{ left: `${position}%` }}
      >
        {/* Handle Button */}
        <div className="absolute top-[48%] -left-3.5 w-7 h-7 rounded-full bg-white text-zinc-950 border border-violet-500 shadow-xl flex items-center justify-center font-bold text-xs pointer-events-none scale-90 group-hover:scale-100 transition-transform duration-300">
          ↔
        </div>
      </div>
    </div>
  );
}
