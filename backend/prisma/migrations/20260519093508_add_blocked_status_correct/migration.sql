/*
  Warnings:

  - The values [BLOCKED] on the enum `CreditOfferStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CreditOfferStatus_new" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');
ALTER TABLE "public"."CreditOffer" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "CreditOffer" ALTER COLUMN "status" TYPE "CreditOfferStatus_new" USING ("status"::text::"CreditOfferStatus_new");
ALTER TYPE "CreditOfferStatus" RENAME TO "CreditOfferStatus_old";
ALTER TYPE "CreditOfferStatus_new" RENAME TO "CreditOfferStatus";
DROP TYPE "public"."CreditOfferStatus_old";
ALTER TABLE "CreditOffer" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
ALTER TYPE "EscrowState" ADD VALUE 'BLOCKED';
