"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ImageIcon } from "lucide-react";
import { useDropzone } from "react-dropzone";

interface UploadZoneProps {
  onFile: (file: File, b64: string) => void;
  preview?: string | null;
  label?: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UploadZone({ onFile, preview, label = "Drop your photo here" }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      const b64 = await fileToBase64(file);
      onFile(file, b64);
      setIsDragging(false);
    },
    [onFile]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  return (
    <div
      {...getRootProps()}
      className={`relative h-72 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden
        ${isDragging
          ? "border-violet-500 bg-violet-950/30 shadow-[0_0_40px_rgba(124,58,237,0.2)]"
          : preview
          ? "border-white/10 bg-black/20"
          : "border-white/10 bg-white/[0.02] hover:border-violet-500/50 hover:bg-violet-950/10"
        }
      `}
    >
      <input {...getInputProps()} />
      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Upload preview" className="w-full h-full object-contain" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black/50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2 text-white">
                <Upload size={24} />
                <span className="text-sm font-medium">Change photo</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6"
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-300
              ${isDragging ? "bg-violet-600/30" : "bg-white/5"}`}>
              <ImageIcon size={28} className={isDragging ? "text-violet-400" : "text-zinc-500"} />
            </div>
            <div className="text-center">
              <p className="text-white/80 font-medium text-sm">{label}</p>
              <p className="text-zinc-600 text-xs mt-1">or click to browse · JPG, PNG, WEBP</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner accent when dragging */}
      {isDragging && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-violet-500 rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-violet-500 rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-violet-500 rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-violet-500 rounded-br-2xl" />
        </div>
      )}
    </div>
  );
}
