# 🎨 SnapStudio AI — Kaggle GPU Backend User Guide

This guide explains how to spin up your GPU-accelerated AI backend using **Kaggle T4 x2 GPUs** and link it to your Next.js frontend application.

---

## 🚀 Step-by-Step Setup

### Phase 1: Set Up Kaggle Environment
1. Log in to [Kaggle](https://www.kaggle.com/) and click **"New Notebook"**.
2. **Configure Accelerator**: On the right sidebar, expand **Notebook options** and set **Accelerator** to **GPU T4 x2** (or GPU T4 x1).
3. **Turn Internet ON**: Ensure **Internet on** is toggled **ON** in settings (required to download model weights and sync the repository).

---

### Phase 2: Run Notebook Cells in Order
You can import the fully-formatted notebook directly from the repository at [kaggle_notebook.ipynb](file:///c:/projects/snapstudio-ai/kaggle_notebook.ipynb) or copy-paste these 2 cells into your Kaggle notebook:

#### 🔄 Step 1: Clone / Sync SnapStudio Repo
This cell clones the repository on the first run, and pulls/syncs the latest changes automatically on subsequent runs with self-healing features in case of merge conflicts.
```python
import os, subprocess, sys
REPO_URL = 'https://github.com/chaitanyabhujbal912006-afk/Snapstudio_AI.git'
REPO_DIR = '/kaggle/working/snapstudio'

if not os.path.exists(REPO_DIR):
    subprocess.check_call(['git', 'clone', REPO_URL, REPO_DIR, '--depth=1'])
    print('✅ Repository cloned successfully!')
else:
    try:
        subprocess.check_call(['git', '-C', REPO_DIR, 'reset', '--hard'])
        subprocess.check_call(['git', '-C', REPO_DIR, 'clean', '-fd'])
        subprocess.check_call(['git', '-C', REPO_DIR, 'pull'])
        print('✅ Repository synchronized with latest changes!')
    except Exception as e:
        print('⚠️ Sync failed, recreating repository directory:', e)
        import shutil
        shutil.rmtree(REPO_DIR, ignore_errors=True)
        subprocess.check_call(['git', 'clone', REPO_URL, REPO_DIR, '--depth=1'])
        print('✅ Clean repository cloned successfully!')

os.chdir(REPO_DIR)
if REPO_DIR not in sys.path:
    sys.path.insert(0, REPO_DIR)
print('Working dir:', os.getcwd())
```

#### 🚀 Step 2: Bootstrap Dependencies and Launch Backend
This cell will clean conflicting preloader packages (such as conflicting ONNX runtime elements and broken MediaPipe versions), verify GPU acceleration (preferring GPU T4 x2 for optimum rendering speed), load the warm VRAM models cache, and launch the Gradio instance.
```python
import os, sys
REPO_DIR = '/kaggle/working/snapstudio'
os.chdir(REPO_DIR)
if REPO_DIR not in sys.path:
    sys.path.insert(0, REPO_DIR)

# Run the official startup bootstrapper
exec(open(REPO_DIR + '/kaggle_startup.py').read())
```
> [!NOTE]
> When executing for the first time, model architectures are cached in parallel to make subsequent operations instant. The launching phase prints a public live url at the bottom.

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
