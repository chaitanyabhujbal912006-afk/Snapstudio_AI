# 🎨 SnapStudio AI — Kaggle GPU Backend User Guide

This guide explains how to spin up your GPU-accelerated AI backend using **Kaggle T4 x2 GPUs** and link it to your Next.js frontend application.

---

## 🚀 Step-by-Step Setup

### Phase 1: Set Up Kaggle Environment
1. Log in to [Kaggle](https://www.kaggle.com/) and click **"New Notebook"**.
2. **Configure Accelerator**: On the right sidebar, expand **Notebook options** and set **Accelerator** to **GPU T4 x2** (or GPU T4 x1).
3. **Turn Internet ON**: Ensure **Internet on** is toggled **ON** in settings (required to download model weights and sync the repository).

---

### Phase 2: Run the Notebook cells in order
You can import the fully-formatted notebook directly from the repository at [kaggle_notebook.ipynb](file:///c:/projects/snapstudio-ai/kaggle_notebook.ipynb) or copy-paste these 4 steps into separate cells:

#### 📥 Step 1: Clean and Install Dependencies
This cell uninstalls conflicting pre-installed libraries, handles the Gradio 5.x system-wide override, avoids the broken `mediapipe` package, and installs all required weights-friendly pipelines.
```python
import subprocess, sys
print('🧹 Cleaning up pre-installed conflicting packages...')
try:
    subprocess.check_call([sys.executable, '-m', 'pip', 'uninstall', '-y', 'onnxruntime', 'onnxruntime-gpu', 'rembg', 'numba', 'mediapipe', '-q'])
except Exception as e:
    print(f'Clean step warning: {e}')

# Force-reinstall compatible Gradio and HuggingFace Hub versions
print('📥 Force-reinstalling Gradio and HuggingFace Hub...')
subprocess.check_call([
    sys.executable, '-m', 'pip', 'install',
    '--force-reinstall', '--no-deps',
    'gradio>=4.40.0,<5.0.0',
    'huggingface_hub>=0.20.0,<0.26.0',
    '-q'
])

# Install remaining AI pipelines
packages = [
    'numpy>=2.0.0', 'numba>=0.60.0,<0.62.0',
    'gradio>=4.40.0,<5.0.0',
    'diffusers>=0.30.0', 'transformers>=4.46.3',
    'accelerate>=0.26.0', 'peft>=0.8.0',
    'controlnet-aux>=0.0.10', 'rembg>=2.0.68',
    'onnxruntime>=1.19.0', 'opencv-python-headless>=4.8.0',
    'scipy>=1.11.0', 'scikit-image>=0.21.0',
    'huggingface_hub>=0.20.0,<0.26.0', 'safetensors>=0.4.0', 'xformers'
]
print('📥 Installing remaining dependencies (takes ~2-3 mins)...')
subprocess.check_call([sys.executable, '-m', 'pip', 'install', *packages, '-q'])
print('Done! Restarting kernel to apply updates...')
import os; os._exit(0)
```

> [!NOTE]
> Running this cell will automatically kill the session's current Python kernel. Don't worry — this is normal and necessary for Jupyter to register the updated NumPy, Gradio, and Numba modules. Proceed to **Step 2** once the kernel completes restarting.

#### 🔄 Step 2: Clone and Sync Repository
Syncs the codebase. Includes a robust self-healing logic that automatically cleans local conflicts and redownloads from scratch if git pull fails.
```python
import os, subprocess, sys
REPO_URL = 'https://github.com/chaitanyabhujbal912006-afk/Snapstudio_AI.git'
REPO_DIR = '/kaggle/working/snapstudio'

if not os.path.exists(REPO_DIR):
    subprocess.check_call(['git', 'clone', REPO_URL, REPO_DIR, '--depth=1'])
    print('Cloned!')
else:
    try:
        subprocess.check_call(['git', '-C', REPO_DIR, 'reset', '--hard'])
        subprocess.check_call(['git', '-C', REPO_DIR, 'clean', '-fd'])
        subprocess.check_call(['git', '-C', REPO_DIR, 'pull'])
        print('Pulled latest!')
    except Exception as e:
        print('Git pull failed, removing directory and cloning fresh...')
        import shutil
        shutil.rmtree(REPO_DIR, ignore_errors=True)
        subprocess.check_call(['git', 'clone', REPO_URL, REPO_DIR, '--depth=1'])
        print('Cloned fresh!')

os.chdir(REPO_DIR)
sys.path.insert(0, REPO_DIR)
print('Working dir:', os.getcwd())
```

#### 🖥️ Step 3: Verify GPU Availability
Verifies that PyTorch is accurately accessing your Nvidia T4 cores.
```python
import torch
if torch.cuda.is_available():
    print('GPU:', torch.cuda.get_device_name(0))
    print('VRAM:', round(torch.cuda.get_device_properties(0).total_memory/1e9,1), 'GB')
else:
    print('No GPU! Set Accelerator to GPU T4 x2 in Kaggle settings.')
```

#### 🚀 Step 4: Launch Backend API
Runs the centralized launch script from the repo. This will start the Gradio API server, spin up the job queue, and output a public live proxy URL.
```python
# Step 4: Launch SnapStudio AI Backend
import os, sys
REPO_DIR = '/kaggle/working/snapstudio'
os.chdir(REPO_DIR)
if REPO_DIR not in sys.path:
    sys.path.insert(0, REPO_DIR)
exec(open(REPO_DIR + '/kaggle_startup.py').read())
```

---

## 📡 Linking to the Frontend App
1. When **Step 4** completes, locate the line in output that says:
   `Running on public URL: https://xxxxxxxxxxxx.gradio.live`
2. Copy this URL.
3. Open your Next.js application frontend.
4. Input or paste this URL into the **"Backend Server Connection"** input field (found in the header/settings bar).
5. The connection indicator will turn green (`CONNECTED`)! You can now start using Background Swap, Upscaling, Object Removal, and all remaining GPU tools.

> [!IMPORTANT]
> Kaggle notebook sessions automatically terminate after 9–12 hours. If your sessions close, simply reload your Kaggle notebook, click **Run All**, and update the new `*.gradio.live` URL in your Next.js frontend header.
