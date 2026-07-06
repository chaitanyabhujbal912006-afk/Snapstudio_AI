"""
SnapStudio AI — Kaggle GPU Startup Script
==========================================
Run this on Kaggle: GPU T4 x2, Internet ON

Steps:
1. Create a new Kaggle Notebook
2. Upload this file (or paste cells below)
3. Settings → Accelerator → GPU T4 x2
4. Settings → Internet → ON
5. Run All (Shift+Enter each cell or Run All from menu)
6. Copy the 'gradio.live' URL printed at the end → paste into your Vercel app
"""

# ─── CELL 1: Install dependencies ────────────────────────────────────────────
import subprocess, sys

packages = [
    "numpy>=1.24.0,<2.0.0",
    "gradio>=4.40.0",
    "diffusers>=0.30.0",
    "transformers>=4.46.3",
    "accelerate>=0.26.0",
    "peft>=0.8.0",
    "controlnet-aux>=0.0.10",
    "rembg>=2.0.68",
    "onnxruntime>=1.16.0",
    "opencv-python-headless>=4.8.0",
    "scipy>=1.11.0",
    "scikit-image>=0.21.0",
    "huggingface_hub>=0.20.0",
    "safetensors>=0.4.0",
    "xformers",   # memory-efficient attention for GPU
]

subprocess.check_call([sys.executable, "-m", "pip", "install", *packages, "-q"])
print("✅ Dependencies installed")


# ─── CELL 2: Clone / sync the SnapStudio repo ────────────────────────────────
import os

# Option A: Clone from GitHub (if repo is public)
REPO_URL = "https://github.com/chaitanyabhujbal912006-afk/Snapstudio_AI.git"
REPO_DIR = "/kaggle/working/snapstudio"

if not os.path.exists(REPO_DIR):
    subprocess.check_call(["git", "clone", REPO_URL, REPO_DIR, "--depth=1"])
    print(f"✅ Repo cloned to {REPO_DIR}")
else:
    subprocess.check_call(["git", "-C", REPO_DIR, "pull"])
    print("✅ Repo updated")

os.chdir(REPO_DIR)
sys.path.insert(0, REPO_DIR)
print(f"✅ Working directory: {os.getcwd()}")


# ─── CELL 3: Verify GPU ────────────────────────────────────────────────────────
import torch

if torch.cuda.is_available():
    print(f"✅ GPU: {torch.cuda.get_device_name(0)}")
    print(f"   VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
else:
    print("⚠️  No GPU detected — using CPU (much slower!)")
    print("    Make sure Accelerator is set to GPU T4 x2 in Kaggle settings")


# ─── CELL 4: Launch the backend ───────────────────────────────────────────────
# This starts the Gradio server and prints a public *.gradio.live URL.
# Copy that URL and paste it into your Vercel app's "Backend URL" box.

print("\n🚀 Starting SnapStudio AI backend...")
print("   Waiting for URL (models download on first run — may take 5-10 minutes)...\n")

exec(open("backend_app.py").read())
