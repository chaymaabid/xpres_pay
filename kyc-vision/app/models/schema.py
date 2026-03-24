from pydantic import BaseModel

class OcrRequest(BaseModel):
    cinImage: str   # base64 JPEG of the ID card
    fullName: str   # typed by user in step 1
    idNumber: str   # typed by user in step 1

class OcrResponse(BaseModel):
    matched:        bool
    extracted_name: str
    extracted_id:   str
    detail:         str

class FaceRequest(BaseModel):
    cinImage:  str  # base64 JPEG of the ID card (saved from step 2)
    faceImage: str  # base64 JPEG of the live selfie

class FaceResponse(BaseModel):
    matched:  bool
    distance: float
    detail:   str