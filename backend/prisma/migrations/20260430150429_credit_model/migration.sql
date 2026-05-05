/*
  Warnings:

  - You are about to drop the column `currentBalance` on the `Credit` table. All the data in the column will be lost.
  - You are about to drop the column `limit` on the `Credit` table. All the data in the column will be lost.
  - Added the required column `amount` to the `Credit` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CreditOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'CREDIT_OFFER_REJECTED';

-- AlterTable
ALTER TABLE "Credit" DROP COLUMN "currentBalance",
DROP COLUMN "limit",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "cancelledBy" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'usd',
ADD COLUMN     "note" TEXT,
ADD COLUMN     "paymentIntentId" TEXT,
ADD COLUMN     "refundId" TEXT,
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "status" "CreditOfferStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "transferId" TEXT;

-- AlterTable
ALTER TABLE "TrustProfile" ALTER COLUMN "trustScore" SET DEFAULT 10.0;
