from fastapi import APIRouter, HTTPException
from app.models.schema import FaceRequest, FaceResponse
from app.services.face_service import compare_faces

router = APIRouter()

@router.post("/face", response_model=FaceResponse)
async def verify_face(body: FaceRequest):
    try:
        return FaceResponse(**compare_faces(body.cinImage, body.faceImage))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))