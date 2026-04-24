import easyocr
import base64
import re
import io
import numpy as np
from PIL import Image
from pdf2image import convert_from_bytes

# Initialize once only
reader = easyocr.Reader(['en'], gpu=False)

OCR_NORMALIZE = str.maketrans({
    'O': '0',
    'I': '1',
    'L': '1',
    'S': '5',
    'B': '5',
    'G': '6',
    'Z': '2',
})

def normalize(text: str) -> str:
    cleaned = re.sub(r'[^A-Z0-9]', '', text.upper())
    return cleaned.translate(OCR_NORMALIZE)


def decode_to_images(image_bytes: bytes, mimeType: str) -> list:
    if mimeType == 'application/pdf':
        pil_pages = convert_from_bytes(image_bytes, dpi=200)
        return [np.array(page.convert('RGB')) for page in pil_pages]
    else:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        return [np.array(image)]


def verify_proof(mimeType: str, fileBase64: str, fullOrderId: str, shortOrderId: str):
    # Decode base64
    try:
        image_bytes = base64.b64decode(fileBase64)
    except Exception:
        return {"matched": False, "confidence": 0.0, "extracted_text": ""}

    try:
        images = decode_to_images(image_bytes, mimeType)
    except Exception:
        return {"matched": False, "confidence": 0.0, "extracted_text": ""}

    norm_full  = normalize(fullOrderId)
    norm_short = normalize(shortOrderId)

    all_texts = []
    all_confs = []

    for page_np in images:
        results = reader.readtext(page_np)

        page_texts = [text for (_, text, _) in results]
        page_confs = [conf for (_, _, conf) in results]

        all_texts.extend(page_texts)
        all_confs.extend(page_confs)

        norm_page = normalize(" ".join(page_texts))
        if norm_full in norm_page or norm_short in norm_page:
            avg_confidence = sum(all_confs) / len(all_confs) if all_confs else 0.0
            return {
                "matched": True,
                "confidence": round(avg_confidence, 3),
                "extracted_text": " ".join(all_texts)[:500],
            }

    raw_text       = " ".join(all_texts)
    avg_confidence = sum(all_confs) / len(all_confs) if all_confs else 0.0
    norm_ocr       = normalize(raw_text)
    matched        = norm_full in norm_ocr or norm_short in norm_ocr

    return {
        "matched": matched,
        "confidence": round(avg_confidence, 3),
        "extracted_text": raw_text[:500],
    }