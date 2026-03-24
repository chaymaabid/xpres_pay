import base64
import re
import unicodedata
from difflib import SequenceMatcher
from io import BytesIO

import easyocr
import numpy as np
from PIL import Image


_reader = easyocr.Reader(['en', 'fr'], gpu=False)

SIMILARITY_THRESHOLD = 0.60   


def _decode_image(b64: str) -> np.ndarray:
    if "," in b64:
        b64 = b64.split(",", 1)[1]
    return np.array(Image.open(BytesIO(base64.b64decode(b64))).convert("RGB"))


def _normalize(text: str) -> str:
    """Lowercase, strip accents, collapse whitespace and punctuation."""
    text = text.lower().strip()
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = re.sub(r"[^a-z0-9 ]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, _normalize(a), _normalize(b)).ratio()


def _find_best_match_in_text(full_text: str, expected: str) -> tuple[bool, str]:
    """
    Instead of guessing which tokens are the name/ID, slide a window
    over the OCR text and find the substring that best matches what
    the user typed.  Returns (matched: bool, best_snippet: str).
    """
    expected_words = _normalize(expected).split()
    n = len(expected_words)
    if n == 0:
        return False, ""

    all_words = _normalize(full_text).split()

    best_score = 0.0
    best_snippet = ""

    for window_size in range(max(1, n - 1), n + 4):
        for i in range(len(all_words) - window_size + 1):
            window = " ".join(all_words[i : i + window_size])
            score = _similarity(window, _normalize(expected))
            if score > best_score:
                best_score = score
                best_snippet = window

    matched = best_score >= SIMILARITY_THRESHOLD
    return matched, best_snippet


def extract_and_compare(cin_b64: str, expected_name: str, expected_id: str) -> dict:
    image_array = _decode_image(cin_b64)

    results   = _reader.readtext(image_array, detail=0, paragraph=True)
    full_text = " ".join(results)

    print(f"[OCR] Raw text: {full_text}")  
    id_matches   = re.findall(r"\b\d{8}\b", full_text)
    extracted_id = ""
    id_ok        = False

    for candidate in id_matches:
        if _similarity(candidate, expected_id) >= SIMILARITY_THRESHOLD:
            extracted_id = candidate
            id_ok        = True
            break

    if not id_ok and id_matches:
        extracted_id = id_matches[0]

    name_ok, extracted_name = _find_best_match_in_text(full_text, expected_name)

    matched = name_ok and id_ok

    if matched:
        detail = "Name and ID number verified successfully."
    elif not name_ok and not id_ok:
        detail = f"Neither name nor ID matched. OCR read: '{full_text[:120]}'. Please retake the photo."
    elif not name_ok:
        detail = f"Name does not match (best match found: '{extracted_name}'). Please retake."
    else:
        detail = f"ID number does not match (found: '{extracted_id}'). Please retake."

    print(f"[OCR] name_ok={name_ok} id_ok={id_ok} matched={matched}")

    return {
        "matched":        matched,
        "extracted_name": extracted_name,
        "extracted_id":   extracted_id,
        "detail":         detail,
    }