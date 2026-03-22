import { Injectable } from '@nestjs/common';
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { storageClient } from "./storage.client";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

@Injectable()
export class StorageService {
    async uploadFile(file: Express.Multer.File,folder: string, subfolder: string): Promise<string> {

    const fileName = `${Date.now()}-${file.originalname}`;

    const key = `kyc/${folder}/${subfolder}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.STORAGE_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await storageClient.send(command);

    return key;
    }
    async deleteFile(fileUrl: string) {
        await storageClient.send(
            new DeleteObjectCommand({
            Bucket: process.env.STORAGE_BUCKET,
            Key: fileUrl,
            }),
        );

        return { deleted: true };
    }
    getFileUrl(key: string) {

    if (process.env.STORAGE_DRIVER === "minio") {

      return `${process.env.STORAGE_ENDPOINT}/${process.env.STORAGE_BUCKET}/${key}`;

    }

    return `https://${process.env.STORAGE_BUCKET}.s3.${process.env.STORAGE_REGION}.amazonaws.com/${key}`;
  }
  async getSignedFileUrl(key: string) {

  const command = new GetObjectCommand({
    Bucket: process.env.STORAGE_BUCKET,
    Key: key,
  });

  const url = await getSignedUrl(storageClient, command, {
    expiresIn: 60,
  });

  return url;
}
 
}


  