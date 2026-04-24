from fastapi import APIRouter
from pydantic import BaseModel
from app.services.proof_delivery_service import verify_proof

router = APIRouter()


class ProofDeliveryRequest(BaseModel):
    fileBase64: str
    mimeType: str
    fullOrderId: str
    shortOrderId: str


@router.post("/proof-delivery")
async def verify_delivery(req: ProofDeliveryRequest):
    return verify_proof(
        req.mimeType,
        req.fileBase64,
        req.fullOrderId,
        req.shortOrderId
    )