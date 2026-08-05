# 📘 SnapStudio AI — User Guide & Setup Manual

This document explains how to run SnapStudio AI on your computer, what is required from your side, and how to start or stop the application.

---

## 🛑 Current Status (System Closed)

- **Backend Port (`7860`):** CLOSED 🔴
- **Frontend Port (`3000`):** CLOSED 🔴
- **All Background Tasks:** STOPPED 🔴
- **Git Status:** 100% committed & pushed to GitHub (`origin/main`).

---

## 📋 What is Required From Your Side

Everything required has already been installed and configured on your computer. When you return, you only need to follow **one step** to run SnapStudio AI!

### Prerequisites (Already Installed)
- ✅ Python 3.10+
- ✅ OpenCV, NumPy, SciPy, Pillow, Gradio, RemBG
- ✅ Node.js & npm (Frontend)
- ✅ Git repo synced & updated

---

## 🚀 How to Run SnapStudio AI Next Time

### ⚡ Method 1: One-Click Startup (Easiest)

Simply **double-click** the batch file in your project directory:

```text
c:\projects\snapstudio-ai\start_local_snapstudio.bat
```

**What it does automatically:**
1. Starts the Python CPU backend at `http://127.0.0.1:7860`.
2. Starts the Next.js frontend at `http://localhost:3000`.
3. Opens `http://localhost:3000` in your default browser.

---

### 💻 Method 2: Manual Terminal Startup

If you prefer using the terminal:

**Terminal 1 (Backend):**
```bash
cd c:\projects\snapstudio-ai
python backend_app.py
```

**Terminal 2 (Frontend):**
```bash
cd c:\projects\snapstudio-ai\frontend
npm run dev
```

---

## 🔌 Connecting Frontend to Backend in Browser

1. Open `http://localhost:3000`.
2. Look at the **top navigation bar** (Backend Connection input box).
3. Paste:
   ```text
   http://127.0.0.1:7860
   ```
4. Click **Connect**. The badge will turn green (**Connected**).

---

## 🎛️ Feature Comparison: Local CPU vs Kaggle GPU

| Feature | Local CPU Mode | Kaggle GPU Mode |
| :--- | :--- | :--- |
| **Canvas Studio** | ⚡ Instant (0ms) | ⚡ Instant (0ms) |
| **Auto-Enhance** | ⚡ ~0.2s (Full Quality) | ⚡ ~0.5s |
| **Color Grade** | ⚡ ~0.1s (Full Quality) | ⚡ ~0.5s |
| **Portrait Retouch** | ⚡ ~0.3s (Full Quality) | ⚡ ~0.5s |
| **Studio Relight** | ⚡ ~0.2s (Full Quality) | ⚡ ~1.0s |
| **Denoise** | ⚡ ~0.4s (Full Quality) | ⚡ ~1.0s |
| **Effects (HDR/Bloom)** | ⚡ ~0.2s (Full Quality) | ⚡ ~0.5s |
| **Object Erase** | ⚡ ~0.1s (OpenCV DIP) | ⏳ ~2–4 min (Stable Diffusion) |
| **Upscale 4×** | ⚡ ~0.2s (Lanczos + Sharpening) | ⏳ ~15–60s (Swin2SR) |
| **Face Enhance** | ⚡ ~0.1s (Bilateral DIP) | ⏳ ~10–30s (GFPGAN) |
| **Bokeh / BG Blur** | ⚡ ~0.1s (Radial DIP Blur) | ⏳ ~5–15s (MiDaS Depth) |
| **Style Filter** | ⚡ ~0.3s (Canny / Quantization) | ⏳ ~30–60s (SD img2img) |
| **Outpaint** | ⚡ ~0.1s (Edge Mirror DIP) | ⏳ ~2–4 min (SD Inpaint) |
| **Text-to-Image** | ❌ Disabled (Requires GPU) | ⏳ ~10–20s (SDXL Turbo) |

---

## 🛠️ How to Stop the App

To stop the servers before shutting down your PC:
- If using `start_local_snapstudio.bat`: Close the two opened command prompt windows.
- Or run in terminal:
  ```powershell
  Get-Process python* | Stop-Process -Force
  ```
