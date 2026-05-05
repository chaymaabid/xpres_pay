/*
  Warnings:

  - Added the required column `updatedAt` to the `Credit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Credit" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripePaymentMethodId" TEXT;
