/*
  Warnings:

  - A unique constraint covering the columns `[lenderId,borrowerId]` on the table `Loan` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Loan_lenderId_borrowerId_key" ON "Loan"("lenderId", "borrowerId");
