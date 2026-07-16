"""
AI Face Restoration & Enhancement.
Detects faces in the image, super-resolves each face region using Swin2SR,
then blends enhanced faces back into the original at full quality.

Also applies portrait enhancement filters (clarity, skin smooth) to face regions.
GPU: ~10–25s. CPU: ~2–5 min.
"""

import cv2
import numpy as np
from PIL import Image
from typing import List, Tuple

from pipeline.upscale import upscale_image, _load_model as _load_sr_model
from pipeline.retouch import retouch_portrait


# ── Face Detection ─────────────────────────────────────────────────────────────

def _detect_faces(img_rgb: np.ndarray, padding: float = 0.35) -> List[Tuple[int, int, int, int]]:
    """
    Detect faces using OpenCV DNN face detector (more robust than Haar cascades).
    Falls back to Haar cascade if DNN model not available.

    Returns: list of (x1, y1, x2, y2) with padding applied.
    """
    h, w = img_rgb.shape[:2]

    faces = []

    # Try DNN detector first (more accurate)
    try:
        import urllib.request, os
        weights_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "weights")
        os.makedirs(weights_dir, exist_ok=True)
        
        prototxt = "https://raw.githubusercontent.com/opencv/opencv/master/samples/dnn/face_detector/deploy.prototxt"
        caffemodel = "https://github.com/opencv/opencv_extra/raw/master/testdata/dnn/res10_300x300_ssd_iter_140000.caffemodel"

        proto_path = os.path.join(weights_dir, "deploy.prototxt")
        model_path = os.path.join(weights_dir, "res10_300x300_ssd.caffemodel")

        if not os.path.exists(proto_path):
            urllib.request.urlretrieve(prototxt, proto_path)
        if not os.path.exists(model_path):
            urllib.request.urlretrieve(caffemodel, model_path)

        net = cv2.dnn.readNetFromCaffe(proto_path, model_path)
        blob = cv2.dnn.blobFromImage(
            cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR), 1.0, (300, 300),
            (104.0, 177.0, 123.0)
        )
        net.setInput(blob)
        detections = net.forward()

        for i in range(detections.shape[2]):
            confidence = detections[0, 0, i, 2]
            if confidence > 0.5:
                box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                x1, y1, x2, y2 = box.astype(int)
                faces.append((x1, y1, x2, y2))
    except Exception:
        pass

    # Fallback: Haar cascade
    if not faces:
        cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        gray = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2GRAY)
        detected = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
        for (x, y, fw, fh) in detected:
            faces.append((x, y, x + fw, y + fh))

    # Apply padding
    padded_faces = []
    for (x1, y1, x2, y2) in faces:
        fw, fh = x2 - x1, y2 - y1
        px = int(fw * padding)
        py = int(fh * padding)
        x1p = max(0, x1 - px)
        y1p = max(0, y1 - py)
        x2p = min(w, x2 + px)
        y2p = min(h, y2 + py)
        padded_faces.append((x1p, y1p, x2p, y2p))

    return padded_faces


def enhance_faces(
    image: Image.Image,
    upscale_strength: float = 1.0,  # 0–1, how much to use the SR-enhanced version
    retouch_strength: float = 0.4,  # skin smooth + clarity on faces
    scale: int = 4,
) -> Image.Image:
    """
    Args:
        image: PIL Image (RGB)
        upscale_strength: 0 = no SR, 1 = full AI super-resolution on face regions
        retouch_strength: skin smooth + clarity (portrait retouch) strength on faces
        scale: SR scale factor (2 or 4)

    Returns:
        PIL Image with enhanced face regions blended back in.
    """
    image = image.convert("RGB")
    img_arr = np.array(image)
    h, w = img_arr.shape[:2]

    faces = _detect_faces(img_arr)
    if not faces:
        # No faces found — apply gentle whole-image retouch instead
        return retouch_portrait(image, skin_smooth=retouch_strength * 0.4,
                                clarity=retouch_strength * 0.3,
                                sharpen=retouch_strength * 0.4,
                                vibrance=0.2)

    result = img_arr.copy().astype(np.float32)

    for (x1, y1, x2, y2) in faces:
        face_region = image.crop((x1, y1, x2, y2))
        fw, fh = face_region.size

        enhanced_face = face_region

        # 1. AI Super-Resolution on this face region
        if upscale_strength > 0 and fw >= 32 and fh >= 32:
            try:
                sr_face = upscale_image(face_region, scale=scale, max_tile_size=256)
                # Resize back to original face crop size for blending
                sr_face = sr_face.resize((fw, fh), Image.LANCZOS)
                enhanced_face = sr_face
            except Exception:
                pass  # SR failed, use original

        # 2. Portrait retouch on the face region
        if retouch_strength > 0:
            enhanced_face = retouch_portrait(
                enhanced_face,
                skin_smooth=retouch_strength * 0.5,
                clarity=retouch_strength * 0.4,
                sharpen=retouch_strength * 0.5,
                vibrance=0.2,
            )

        # 3. Blend enhanced face back using feathered mask
        face_arr = np.array(enhanced_face).astype(np.float32)
        blend_mask = np.ones((fh, fw), dtype=np.float32)

        # Feather edges of the blend region
        feather = max(8, min(fw, fh) // 8)
        for i in range(feather):
            val = i / feather
            blend_mask[i, :] *= val
            blend_mask[-i-1, :] *= val
            blend_mask[:, i] *= val
            blend_mask[:, -i-1] *= val

        blend_mask = blend_mask[..., np.newaxis]
        orig_face = result[y1:y2, x1:x2].copy()
        blended = orig_face * (1 - blend_mask * upscale_strength) + face_arr * (blend_mask * upscale_strength)
        result[y1:y2, x1:x2] = blended

    return Image.fromarray(np.clip(result, 0, 255).astype(np.uint8))
