/*
  Warnings:

  - A unique constraint covering the columns `[deviceFingerprint]` on the table `UserDevice` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserDevice_deviceFingerprint_key" ON "UserDevice"("deviceFingerprint");
