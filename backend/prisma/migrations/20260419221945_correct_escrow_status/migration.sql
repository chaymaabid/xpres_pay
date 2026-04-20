/*
  Warnings:

  - The values [REALISED] on the enum `EscrowState` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EscrowState_new" AS ENUM ('INITIATED', 'LOCKED', 'DELIVERED', 'RELEASED');
ALTER TABLE "public"."Transaction" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Transaction" ALTER COLUMN "status" TYPE "EscrowState_new" USING ("status"::text::"EscrowState_new");
ALTER TABLE "TransactionLedger" ALTER COLUMN "previousStatus" TYPE "EscrowState_new" USING ("previousStatus"::text::"EscrowState_new");
ALTER TABLE "TransactionLedger" ALTER COLUMN "currentStatus" TYPE "EscrowState_new" USING ("currentStatus"::text::"EscrowState_new");
ALTER TYPE "EscrowState" RENAME TO "EscrowState_old";
ALTER TYPE "EscrowState_new" RENAME TO "EscrowState";
DROP TYPE "public"."EscrowState_old";
ALTER TABLE "Transaction" ALTER COLUMN "status" SET DEFAULT 'INITIATED';
COMMIT;
