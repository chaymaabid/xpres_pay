from fastapi import FastAPI
from app.routers import ocr, face

app = FastAPI(title="KYC Vision Service", version="1.0.0")

app.include_router(ocr.router,  prefix="/verify", tags=["OCR"])
app.include_router(face.router, prefix="/verify", tags=["Face"])

@app.get("/health")
def health():
    return {"status": "ok"}