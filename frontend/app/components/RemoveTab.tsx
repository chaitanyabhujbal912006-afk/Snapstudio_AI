"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Eraser, Loader2, RotateCcw, Upload } from "lucide-react";
import ResultPanel from "@/app/components/ResultPanel";
import { useBackend } from "@/app/context/BackendContext";
import { apiRemoveObject } from "@/app/lib/api";

export default function RemoveTab() {
  const { backendUrl, isConnected } = useBackend();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageB64, setImageB64] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [brushSize, setBrushSize] = useState(25);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasMask, setHasMask] = useState(false);

  const drawImageToCanvas = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    overlay.width = img.naturalWidth;
    overlay.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      drawImageToCanvas(img);
      setResult(null);
      setError("");
      setHasMask(false);
    };
    img.src = url;

    const reader = new FileReader();
    reader.onload = () => setImageB64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = overlayRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const paint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(139, 92, 246, 0.6)";
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
    setHasMask(true);
  };

  const clearMask = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d")!;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    setHasMask(false);
  };

  const getMaskB64 = (): string => {
    const overlay = overlayRef.current!;
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = overlay.width;
    maskCanvas.height = overlay.height;
    const ctx = maskCanvas.getContext("2d")!;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    const overlayCtx = overlay.getContext("2d")!;
    const data = overlayCtx.getImageData(0, 0, overlay.width, overlay.height);
    const maskData = ctx.createImageData(overlay.width, overlay.height);
    for (let i = 0; i < data.data.length; i += 4) {
      const a = data.data[i + 3];
      const val = a > 10 ? 255 : 0;
      maskData.data[i] = val;
      maskData.data[i + 1] = val;
      maskData.data[i + 2] = val;
      maskData.data[i + 3] = 255;
    }
    ctx.putImageData(maskData, 0, 0);
    return maskCanvas.toDataURL("image/png");
  };

  const handleRun = async () => {
    if (!imageB64 || !isConnected || !hasMask) return;
    const maskB64 = getMaskB64();
    setIsProcessing(true);
    setError("");
    const res = await apiRemoveObject(backendUrl, imageB64, maskB64);
    setIsProcessing(false);
    if (res.success) setResult(res.data);
    else setError(res.error);
  };

  const handleDownload = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = "snapstudio-removed.png";
    a.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
          <Eraser size={18} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-white font-semibold text-lg">Remove Object</h2>
          <p className="text-zinc-500 text-sm mt-0.5">
            Paint over anything you want erased — the AI fills it with realistic surroundings. Slower (~2–4 min) due to a dedicated inpainting model.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Canvas zone */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Paint to remove</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-600">Brush: {brushSize}px</span>
              <input
                type="range" min="5" max="80" value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-20 accent-violet-500"
              />
              <button
                onClick={clearMask}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-500 hover:text-white hover:border-white/20 transition-colors cursor-pointer"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>

          <div className="relative h-72 rounded-2xl border border-white/10 bg-black/20 overflow-hidden">
            {image ? (
              <div className="relative w-full h-full canvas-drawing">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain" />
                <canvas
                  ref={overlayRef}
                  className="absolute inset-0 w-full h-full object-contain"
                  onMouseDown={(e) => { setIsDrawing(true); paint(e); }}
                  onMouseMove={paint}
                  onMouseUp={() => setIsDrawing(false)}
                  onMouseLeave={() => setIsDrawing(false)}
                  onTouchStart={(e) => { setIsDrawing(true); paint(e); }}
                  onTouchMove={paint}
                  onTouchEnd={() => setIsDrawing(false)}
                />
              </div>
            ) : (
              <label htmlFor="remove-file" className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer group">
                <div className="w-16 h-16 rounded-2xl bg-white/5 group-hover:bg-violet-600/20 transition-colors flex items-center justify-center">
                  <Upload size={28} className="text-zinc-500 group-hover:text-violet-400 transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-white/80 font-medium text-sm">Upload photo to paint</p>
                  <p className="text-zinc-600 text-xs mt-1">Then brush over what to remove</p>
                </div>
              </label>
            )}
            <input type="file" id="remove-file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          {image && (
            <label htmlFor="remove-file" className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 cursor-pointer transition-colors">
              <Upload size={12} /> Change photo
            </label>
          )}
        </div>

        {/* Result zone */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Result</p>
          <ResultPanel
            result={result}
            isProcessing={isProcessing}
            placeholder={{ icon: "🧹", text: "Object-removed result will appear here" }}
            onDownload={handleDownload}
          />
        </div>
      </div>

      {hasMask && !isProcessing && (
        <p className="text-xs text-violet-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block animate-pulse" />
          Mask painted — ready to remove
        </p>
      )}

      {error && (
        <div className="rounded-xl bg-red-950/50 border border-red-500/20 px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      <button
        onClick={handleRun}
        disabled={!imageB64 || !isConnected || !hasMask || isProcessing}
        className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-200
          bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500
          disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-purple-900/30 text-white cursor-pointer"
      >
        {isProcessing ? <><Loader2 size={16} className="animate-spin" />Removing…</> : <><Eraser size={16} />Remove Object</>}
      </button>
    </motion.div>
  );
}
