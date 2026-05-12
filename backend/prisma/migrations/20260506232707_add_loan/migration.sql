/*
  Warnings:

  - You are about to drop the column `creditId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `Credit` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Credit" DROP CONSTRAINT "Credit_borrowerId_fkey";

-- DropForeignKey
ALTER TABLE "Credit" DROP CONSTRAINT "Credit_lenderId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_creditId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "creditId",
ADD COLUMN     "loanId" TEXT;

-- DropTable
DROP TABLE "Credit";

-- CreateTable
CREATE TABLE "CreditOffer" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "CreditOfferStatus" NOT NULL DEFAULT 'PENDING',
    "paymentIntentId" TEXT,
    "transferId" TEXT,
    "refundId" TEXT,
    "cancelledBy" TEXT,
    "note" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "lenderId" TEXT NOT NULL,
    "borrowerId" TEXT NOT NULL,
    "totalCredit" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditOffer" ADD CONSTRAINT "CreditOffer_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_lenderId_fkey" FOREIGN KEY ("lenderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
