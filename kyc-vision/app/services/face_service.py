import base64
import os
import tempfile
from io import BytesIO

from PIL import Image
from deepface import DeepFace

# ArcFace + cosine: same person when distance < 0.40
DISTANCE_THRESHOLD = 0.40


def _b64_to_tempfile(b64: str) -> str:
    """Write base64 image to a temp file; DeepFace works best with paths."""
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    raw = base64.b64decode(b64)
    img = Image.open(BytesIO(raw)).convert("RGB")
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
    img.save(tmp.name, format="JPEG")
    tmp.close()
    return tmp.name


def compare_faces(cin_b64: str, selfie_b64: str) -> dict:
    cin_path    = _b64_to_tempfile(cin_b64)
    selfie_path = _b64_to_tempfile(selfie_b64)

    try:
        result = DeepFace.verify(
            img1_path        = cin_path,
            img2_path        = selfie_path,
            model_name       = "ArcFace",
            distance_metric  = "cosine",
            enforce_detection = False,   # don't crash on slightly blurry ID photos
        )
        distance = float(result["distance"])
        matched  = distance < DISTANCE_THRESHOLD

        return {
            "matched":  matched,
            "distance": distance,
            "detail":   "Face verified — you match your ID card."
                        if matched
                        else f"Face did not match (score {distance:.3f}). Please retake your selfie.",
        }
    except Exception as exc:
        return {"matched": False, "distance": 1.0, "detail": f"Face detection failed: {exc}"}
    finally:
        os.unlink(cin_path)
        os.unlink(selfie_path)