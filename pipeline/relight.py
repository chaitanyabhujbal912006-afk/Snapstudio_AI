"""
Virtual Studio Relighting Pipeline:
Applies directional light sources, rim lighting, and ambient color grade to photos
using luminance gradients and normal estimation via OpenCV.
Runs on CPU/GPU in ~0.2-0.5s.
"""

import cv2
import numpy as np
from PIL import Image

COLOR_PRESETS = {
    "warm_gold": (255, 180, 100),
    "cyber_neon": (0, 220, 255),
    "sunset_pink": (255, 90, 150),
    "cool_blue": (80, 160, 255),
    "emerald_glow": (50, 255, 180),
    "studio_white": (255, 250, 240),
    "dramatic_red": (255, 60, 60),
    "violet_aura": (180, 100, 255),
}


def relight_image(
    image: Image.Image,
    preset: str = "warm_gold",
    light_angle: float = 45.0,
    intensity: float = 0.5,
    rim_light: float = 0.4,
    ambient_darkening: float = 0.2,
) -> Image.Image:
    """
    Directionally relights a photo by generating pseudo-normal maps from luminance gradients
    and compositing a colored spotlight + rim light wrap.
    """
    img_np = np.array(image.convert("RGB"))
    h, w, _ = img_np.shape

    # Convert to float 0-1
    img_float = img_np.astype(np.float32) / 255.0

    # Grayscale & luminance gradients for pseudo 3D normal vector estimation
    gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
    gray_blur = cv2.GaussianBlur(gray, (7, 7), 0)

    # Sobel gradients to approximate Surface Normal (Nx, Ny, Nz)
    sobelx = cv2.Sobel(gray_blur, cv2.CV_32F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray_blur, cv2.CV_32F, 0, 1, ksize=3)

    # Light direction vector (Lx, Ly, Lz)
    rad = np.radians(light_angle)
    lx = np.cos(rad)
    ly = np.sin(rad)
    lz = 0.6  # slant toward camera

    light_dir = np.array([lx, ly, lz], dtype=np.float32)
    light_dir /= np.linalg.norm(light_dir)

    # Normal map calculation
    nx = -sobelx * 2.0
    ny = -sobely * 2.0
    nz = np.ones_like(gray, dtype=np.float32)
    norm = np.sqrt(nx**2 + ny**2 + nz**2) + 1e-6
    nx /= norm
    ny /= norm
    nz /= norm

    # Lambertian Diffuse Lighting: N · L
    dot_product = nx * light_dir[0] + ny * light_dir[1] + nz * light_dir[2]
    diffuse = np.clip(dot_product, 0.0, 1.0)
    diffuse = cv2.GaussianBlur(diffuse, (15, 15), 0)

    # Target Light Color
    rgb_color = COLOR_PRESETS.get(preset, COLOR_PRESETS["warm_gold"])
    light_color_arr = np.array(rgb_color, dtype=np.float32) / 255.0

    # Ambient darkening map
    ambient_factor = 1.0 - (ambient_darkening * 0.5)
    relit = img_float * ambient_factor

    # Add colored directional spotlight effect
    spotlight = np.zeros_like(img_float)
    for c in range(3):
        spotlight[:, :, c] = diffuse * light_color_arr[c]

    relit = relit + (spotlight * intensity)

    # Edge detection for Rim Lighting
    if rim_light > 0.01:
        laplacian = cv2.Laplacian(gray_blur, cv2.CV_32F)
        rim_mask = np.clip(np.abs(laplacian) * 3.0, 0.0, 1.0)
        # Directional rim emphasis
        rim_directional = rim_mask * np.clip(dot_product, 0.2, 1.0)
        rim_directional = cv2.GaussianBlur(rim_directional, (5, 5), 0)

        for c in range(3):
            relit[:, :, c] += rim_directional * light_color_arr[c] * rim_light * 0.8

    # Soft clipping
    final_np = np.clip(relit * 255.0, 0, 255).astype(np.uint8)
    return Image.fromarray(final_np)
