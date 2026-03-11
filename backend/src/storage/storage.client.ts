import { S3Client } from "@aws-sdk/client-s3";

export const storageClient = new S3Client({
  region: process.env.STORAGE_REGION,

  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY!,
    secretAccessKey: process.env.STORAGE_SECRET_KEY!,
  },

  endpoint: process.env.STORAGE_ENDPOINT || undefined,

  forcePathStyle: process.env.STORAGE_DRIVER === "minio",
});