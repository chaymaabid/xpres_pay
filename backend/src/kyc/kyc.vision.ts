import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OcrResult {
  matched:        boolean;
  extracted_name: string;
  extracted_id:   string;
  detail:         string;
}

export interface FaceResult {
  matched:  boolean;
  distance: number;
  detail:   string;
}

/**
 * KycVisionService
 * ─────────────────
 * The single point of contact between NestJS and the Python kyc-vision
 * container. No other file in the backend should know this service exists.
 *
 * Reads KYC_VISION_URL from .env  →  set it to http://kyc-vision:8000
 */
@Injectable()
export class KycVisionService {
  private readonly logger  = new Logger(KycVisionService.name);
  private readonly baseUrl: string;

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get<string>('KYC_VISION_URL', 'http://kyc-vision:8000');
  }

  /** Step 2 — OCR: extract text from CIN photo and compare to form data */
  async verifyCin(cinImage: string, fullName: string, idNumber: string): Promise<OcrResult> {
    return this.post<OcrResult>('/verify/ocr', { cinImage, fullName, idNumber });
  }

  /** Step 3 — Face: compare selfie against the CIN photo using DeepFace */
  async verifyFace(cinImage: string, faceImage: string): Promise<FaceResult> {
    return this.post<FaceResult>('/verify/face', { cinImage, faceImage });
  }

  private async post<T>(path: string, body: object): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    this.logger.log(`→ POST ${url}`);

    let response: Response;
    try {
      response = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
    } catch (err) {
      this.logger.error(`kyc-vision unreachable: ${err}`);
      throw new InternalServerErrorException('Vision service unreachable');
    }

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`kyc-vision ${path} → ${response.status}: ${text}`);
      throw new InternalServerErrorException('Vision service error');
    }

    return response.json() as Promise<T>;
  }
}