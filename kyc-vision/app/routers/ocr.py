from fastapi import APIRouter, HTTPException
from app.models.schema import OcrRequest, OcrResponse
from app.services.ocr_service import extract_and_compare

router = APIRouter()

@router.post("/ocr", response_model=OcrResponse)
async def verify_cin(body: OcrRequest):
    try:
        return OcrResponse(**extract_and_compare(body.cinImage, body.fullName, body.idNumber))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))