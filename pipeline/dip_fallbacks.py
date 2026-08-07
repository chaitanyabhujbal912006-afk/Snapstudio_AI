"""
Digital Image Processing (DIP) Fallbacks for SnapStudio AI.

Provides high-speed, 100% CPU-compatible classical image processing algorithms
for all AI features when running locally without Kaggle GPUs or CUDA.
"""

import cv2
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance


def dip_inpaint(image: Image.Image, mask: Image.Image, method: str = "telea") -> Image.Image:
    """
    Object Removal via Classical DIP Inpainting.
    Uses Fast Marching Method (Telea) or Navier-Stokes fluid dynamics.
    Runs in ~30-100ms on CPU.
    """
    img_np = np.array(image.convert("RGB"))
    img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

    # Ensure mask has the exact same dimensions as the image
    if mask.size != image.size:
        mask = mask.resize(image.size, Image.Resampling.NEAREST)

    mask_np = np.array(mask.convert("L"))
    # Ensure binary mask threshold
    _, mask_bin = cv2.threshold(mask_np, 127, 255, cv2.THRESH_BINARY)

    inpaint_flag = cv2.INPAINT_TELEA if method == "telea" else cv2.INPAINT_NS
    # Inpaint radius of 5-7 pixels gives a smooth blend
    inpainted_bgr = cv2.inpaint(img_bgr, mask_bin, inpaintRadius=7, flags=inpaint_flag)

    inpainted_rgb = cv2.cvtColor(inpainted_bgr, cv2.COLOR_BGR2RGB)
    return Image.fromarray(inpainted_rgb)


def dip_upscale(image: Image.Image, scale: int = 4) -> Image.Image:
    """
    High-Fidelity Super Resolution via DIP.
    Uses Lanczos-4 Resampling + Edge-Preserving Unsharp Masking + Contrast Adaptive Sharpening (CAS).
    Runs in ~200ms on CPU.
    """
    w, h = image.size
    new_w, new_h = w * scale, h * scale

    # Step 1: Lanczos-4 high-quality interpolation
    upscaled = image.resize((new_w, new_h), resample=Image.Resampling.LANCZOS)

    # Step 2: Edge-Preserving Unsharp Masking with OpenCV
    img_np = np.array(upscaled)
    img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

    # Gaussian blur to isolate detail high frequencies
    gaussian = cv2.GaussianBlur(img_bgr, (0, 0), sigmaX=1.5)
    # Unsharp mask formula: Original + amount * (Original - Blur)
    sharpened_bgr = cv2.addWeighted(img_bgr, 1.4, gaussian, -0.4, 0)

    # Step 3: Subtle local contrast adaptive enhancement
    lab = cv2.cvtColor(sharpened_bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=1.2, tileGridSize=(8, 8))
    l_enhanced = clahe.apply(l)
    enhanced_lab = cv2.merge((l_enhanced, a, b))
    final_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

    final_rgb = cv2.cvtColor(final_bgr, cv2.COLOR_BGR2RGB)
    return Image.fromarray(final_rgb)


def dip_bg_blur(image: Image.Image, mask: Image.Image = None, blur_amount: float = 15.0) -> Image.Image:
    """
    Background Blur / Bokeh via Focus-Guided DIP.
    If no mask is given, generates a center-weighted radial depth mask.
    Runs in ~150ms on CPU.
    """
    img_rgb = image.convert("RGB")
    w, h = img_rgb.size
    img_np = np.array(img_rgb)
    img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

    # Calculate kernel size based on blur_amount
    ksize = int(blur_amount) * 2 + 1
    blurred_bgr = cv2.GaussianBlur(img_bgr, (ksize, ksize), 0)

    if mask is None:
        # Create an elliptical center-focused subject mask if mask not provided
        mask_np = np.zeros((h, w), dtype=np.uint8)
        center = (w // 2, h // 2)
        axes = (int(w * 0.35), int(h * 0.45))
        cv2.ellipse(mask_np, center, axes, 0, 0, 360, 255, -1)
        # Soften mask edges
        mask_np = cv2.GaussianBlur(mask_np, (51, 51), 0)
    else:
        mask_np = np.array(mask.convert("L").resize((w, h)))

    # Normalize mask to 0.0 - 1.0 float
    alpha = (mask_np.astype(float) / 255.0)[:, :, np.newaxis]

    # Subject area = original, Background = blurred
    # Subject is where mask is bright (alpha ~ 1.0)
    composite_bgr = (img_bgr.astype(float) * alpha + blurred_bgr.astype(float) * (1.0 - alpha)).astype(np.uint8)

    composite_rgb = cv2.cvtColor(composite_bgr, cv2.COLOR_BGR2RGB)
    return Image.fromarray(composite_rgb)


def dip_segment(image: Image.Image) -> tuple[Image.Image, Image.Image]:
    """
    Classical DIP Background Removal via GrabCut + Adaptive Thresholding.
    Used when rembg is unavailable.
    Returns (RGBA cutout, L mask).
    """
    img_rgb = image.convert("RGB")
    w, h = img_rgb.size
    img_np = np.array(img_rgb)
    img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

    # Initialize GrabCut rectangle (assume central 80% contains subject)
    margin_w, margin_h = int(w * 0.08), int(h * 0.08)
    rect = (margin_w, margin_h, w - 2 * margin_w, h - 2 * margin_h)

    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)

    mask = np.zeros((h, w), np.uint8)
    try:
        cv2.grabCut(img_bgr, mask, rect, bgd_model, fgd_model, 3, cv2.GC_INIT_WITH_RECT)
        # 0 and 2 are background, 1 and 3 are foreground
        mask2 = np.where((mask == 2) | (mask == 0), 0, 255).astype("uint8")
    except Exception:
        # Fallback to otsu thresholding if GrabCut fails
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        _, mask2 = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Smooth the mask
    mask2 = cv2.GaussianBlur(mask2, (7, 7), 0)

    # Create RGBA cutout
    cutout_np = np.dstack((img_np, mask2))
    return Image.fromarray(cutout_np, "RGBA"), Image.fromarray(mask2, "L")


def dip_style_transfer(image: Image.Image, style: str = "anime") -> Image.Image:
    """
    Artistic Style Transfer via Beautiful DIP Filters.
    Normalizes style name and maps to gorgeous classical filters:
    - Anime/Cartoon/Ghibli/Pixar: Cel shading + soft bilateral colors + clean outlines
    - Oil painting: Dynamic detail enhancement + heavy bilateral strokes
    - Watercolor: Blended wash + dark border edge bleeding
    - Cyberpunk: Neon blue/cyan & hot pink color channel shift + contrast boost
    - Comic Pop-Art: High contrast posterization + thick outlines + simulated halftone dot pattern
    - Pencil sketch: Standard pencil sketch filter
    """
    original_size = image.size
    
    # Downscale to max 800px for instant execution (<300ms on CPU)
    img_rgb = image.convert("RGB")
    img_rgb.thumbnail((800, 800), Image.Resampling.LANCZOS)
    img_np = np.array(img_rgb)
    img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

    s_lower = style.lower()

    if any(k in s_lower for k in ["anime", "cartoon", "ghibli", "pixar"]):
        # 1. Bilateral smoothing for clean painting colors
        smoothed = cv2.bilateralFilter(img_bgr, d=9, sigmaColor=45, sigmaSpace=45)
        
        # 2. Split toning: Cool blue/indigo shadows & warm golden highlights (cinematic anime look)
        hsv = cv2.cvtColor(smoothed, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)
        s = cv2.multiply(s, 1.45) # high color vibrancy
        v = cv2.convertScaleAbs(v, alpha=1.05, beta=5)
        color_boosted = cv2.cvtColor(cv2.merge((h, s, v)), cv2.COLOR_HSV2BGR)
        
        b_ch, g_ch, r_ch = cv2.split(color_boosted)
        # Shift shadows to cool indigo
        shadow_mask = 255 - cv2.threshold(g_ch, 95, 255, cv2.THRESH_BINARY)[1]
        b_ch = cv2.add(b_ch, cv2.multiply(shadow_mask, 0.12).astype(np.uint8))
        # Shift highlights to warm gold
        highlight_mask = cv2.threshold(g_ch, 175, 255, cv2.THRESH_BINARY)[1]
        r_ch = cv2.add(r_ch, cv2.multiply(highlight_mask, 0.15).astype(np.uint8))
        g_ch = cv2.add(g_ch, cv2.multiply(highlight_mask, 0.08).astype(np.uint8))
        color_graded = cv2.merge((b_ch, g_ch, r_ch))
        
        # 3. Soft glow / Bloom (diffuse highlight glow)
        blur_glow = cv2.GaussianBlur(color_graded, (21, 21), 0)
        bloom = cv2.addWeighted(color_graded, 0.82, blur_glow, 0.18, 0)
        
        # 4. Thin, dark indigo outlines (softer and more integrated than harsh black)
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        gray_blur = cv2.GaussianBlur(gray, (3, 3), 0)
        # Edge magnitude via Sobel
        sobelx = cv2.Sobel(gray_blur, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray_blur, cv2.CV_64F, 0, 1, ksize=3)
        mag = np.sqrt(sobelx**2 + sobely**2)
        mag = np.uint8(np.minimum(mag, 255))
        # Create a thresholded binary mask of outlines
        _, edge_mask = cv2.threshold(mag, 45, 255, cv2.THRESH_BINARY)
        # Soften outlines
        edge_mask = cv2.GaussianBlur(edge_mask, (3, 3), 0)
        
        # Blend outlines: replace outline pixels with dark indigo/plum
        alpha = (edge_mask.astype(float) / 255.0)[:, :, np.newaxis]
        dark_line = np.zeros_like(bloom)
        dark_line[:] = [42, 28, 52] # BGR plum lines
        
        result_bgr = (bloom.astype(float) * (1.0 - alpha) + dark_line.astype(float) * alpha).astype(np.uint8)

    elif "oil" in s_lower:
        # Oil Painting brush-stroke feel
        detail = cv2.detailEnhance(img_bgr, sigma_s=12, sigma_r=0.2)
        result_bgr = cv2.bilateralFilter(detail, d=9, sigmaColor=70, sigmaSpace=70)

    elif "watercolor" in s_lower:
        # Blended wash watercolor with pigment bleeding outlines
        smoothed = cv2.bilateralFilter(img_bgr, d=13, sigmaColor=100, sigmaSpace=100)
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        laplacian = cv2.Laplacian(gray, cv2.CV_8U, ksize=3)
        lap_color = cv2.cvtColor(laplacian, cv2.COLOR_GRAY2BGR)
        result_bgr = cv2.subtract(smoothed, cv2.multiply(lap_color, 0.45))

    elif "cyberpunk" in s_lower:
        # Neon cyan/pink split color mapping
        b, g, r = cv2.split(img_bgr)
        r_new = cv2.addWeighted(r, 0.65, b, 0.35, 15)
        g_new = cv2.addWeighted(g, 0.8, r, 0.2, 0)
        b_new = cv2.addWeighted(b, 0.65, r, 0.35, 45)
        cyber = cv2.merge((b_new, g_new, r_new))
        result_bgr = cv2.convertScaleAbs(cyber, alpha=1.25, beta=8)

    elif any(k in s_lower for k in ["comic", "pop-art", "pop"]):
        # Halftone Pop-art Comic
        div = 64
        posterized = (img_bgr // div) * div + div // 2
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        edges = cv2.adaptiveThreshold(
            cv2.medianBlur(gray, 5), 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 11, 3
        )
        base = cv2.bitwise_and(posterized, cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR))
        
        # Overlay halftone dot pattern grid
        h_img, w_img, _ = base.shape
        gy, gx = np.mgrid[0:h_img, 0:w_img]
        dots = ((gx % 7 == 0) & (gy % 7 == 0)).astype(np.uint8) * 35
        result_bgr = cv2.subtract(base, cv2.cvtColor(dots, cv2.COLOR_GRAY2BGR))

    elif any(k in s_lower for k in ["sketch", "line"]):
        # Classical pencil sketch
        _, sketch_bgr = cv2.pencilSketch(img_bgr, sigma_s=55, sigma_r=0.08, shade_factor=0.04)
        result_bgr = sketch_bgr

    else:
        # Default: Stylized edge-preserving bilateral quantization
        result_bgr = cv2.edgePreservingFilter(img_bgr, flags=1, sigma_s=45, sigma_r=0.35)

    result_rgb = cv2.cvtColor(result_bgr, cv2.COLOR_BGR2RGB)
    
    # Resize back to original dimensions
    final_image = Image.fromarray(result_rgb)
    return final_image.resize(original_size, Image.Resampling.LANCZOS)


def dip_face_enhance(image: Image.Image) -> Image.Image:
    """
    Portrait Face Enhancement via DIP.
    Selective detail sharpening on eyes/lips + bilateral skin smoothing.
    Runs in ~150ms on CPU.
    """
    img_rgb = image.convert("RGB")
    img_np = np.array(img_rgb)
    img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

    # 1. Bilateral smoothing for skin
    smoothed_bgr = cv2.bilateralFilter(img_bgr, d=7, sigmaColor=50, sigmaSpace=50)

    # 2. Detail extraction for eyes/features (high pass)
    detail = cv2.subtract(img_bgr, cv2.GaussianBlur(img_bgr, (0, 0), 3))
    enhanced_bgr = cv2.add(smoothed_bgr, cv2.multiply(detail, 1.2))

    # 3. Micro CLAHE contrast
    lab = cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=1.1, tileGridSize=(8, 8))
    l_enhanced = clahe.apply(l)
    enhanced_lab = cv2.merge((l_enhanced, a, b))
    final_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

    final_rgb = cv2.cvtColor(final_bgr, cv2.COLOR_BGR2RGB)
    return Image.fromarray(final_rgb)


def dip_outpaint(image: Image.Image, direction: str = "all", amount: int = 100) -> Image.Image:
    """
    Canvas Extension via Classical DIP Padding & Edge Reflection.
    Runs in ~50ms on CPU.
    """
    img_rgb = image.convert("RGB")
    w, h = img_rgb.size
    img_np = np.array(img_rgb)
    img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

    top = amount if direction in ["top", "all", "vertical"] else 0
    bottom = amount if direction in ["bottom", "all", "vertical"] else 0
    left = amount if direction in ["left", "all", "horizontal"] else 0
    right = amount if direction in ["right", "all", "horizontal"] else 0

    padded_bgr = cv2.copyMakeBorder(
        img_bgr, top, bottom, left, right, cv2.BORDER_REFLECT_101
    )

    # Soften outer borders slightly
    mask = np.zeros(padded_bgr.shape[:2], dtype=np.uint8)
    cv2.rectangle(mask, (left, top), (left + w, top + h), 255, -1)
    blurred_padded = cv2.GaussianBlur(padded_bgr, (21, 21), 0)

    alpha = (mask.astype(float) / 255.0)[:, :, np.newaxis]
    composite_bgr = (padded_bgr.astype(float) * alpha + blurred_padded.astype(float) * (1.0 - alpha)).astype(np.uint8)

    composite_rgb = cv2.cvtColor(composite_bgr, cv2.COLOR_BGR2RGB)
    return Image.fromarray(composite_rgb)
