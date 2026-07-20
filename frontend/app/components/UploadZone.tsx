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
      style={{
        position: "relative",
        height: 280,
        borderRadius: 14,
        border: isDragging
          ? "2px dashed var(--amber)"
          : preview
          ? "1px solid var(--border-subtle)"
          : "2px dashed var(--border-medium)",
        background: isDragging
          ? "rgba(245,158,11,0.06)"
          : preview
          ? "rgba(8,8,16,0.5)"
          : "rgba(17,17,32,0.4)",
        cursor: "pointer",
        overflow: "hidden",
        transition: "all 0.25s ease",
        boxShadow: isDragging ? "0 0 40px rgba(245,158,11,0.12)" : "none",
      }}
      className={!isDragging && !preview ? "hover:border-amber-500/40 hover:bg-amber-950/10" : ""}
    >
      <input {...getInputProps()} />

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "absolute", inset: 0 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Upload preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />

            {/* Hover overlay */}
            <div
              style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 8,
                background: "rgba(8,8,16,0.65)",
                opacity: 0,
                transition: "opacity 0.2s",
                backdropFilter: "blur(4px)",
              }}
              className="hover:opacity-100"
            >
              <Upload size={22} style={{ color: "var(--amber)" }} />
              <span style={{ fontSize: "0.78rem", fontFamily: "var(--font-display)", fontWeight: 500, color: "var(--text-primary)" }}>
                Replace photo
              </span>
            </div>

            {/* Corner frame decorations */}
            {["top-0 left-0 border-t-2 border-l-2 rounded-tl-xl",
              "top-0 right-0 border-t-2 border-r-2 rounded-tr-xl",
              "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl",
              "bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl",
            ].map((cls, i) => (
              <div
                key={i}
                className={`absolute w-5 h-5 ${cls}`}
                style={{ borderColor: "rgba(245,158,11,0.4)" }}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 14, padding: 24,
            }}
          >
            {/* Icon container */}
            <div
              style={{
                width: 64, height: 64,
                borderRadius: 16,
                border: `1px solid ${isDragging ? "var(--amber)" : "var(--border-medium)"}`,
                background: isDragging ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.025)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.25s",
              }}
            >
              <ImageIcon size={26} style={{ color: isDragging ? "var(--amber)" : "var(--text-dim)" }} />
            </div>

            <div style={{ textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  fontSize: "0.83rem",
                  color: isDragging ? "var(--amber)" : "var(--text-secondary)",
                  marginBottom: 4,
                  transition: "color 0.25s",
                }}
              >
                {isDragging ? "Release to upload" : label}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.62rem",
                  letterSpacing: "0.08em",
                  color: "var(--text-dim)",
                }}
              >
                JPG · PNG · WEBP · click to browse
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
