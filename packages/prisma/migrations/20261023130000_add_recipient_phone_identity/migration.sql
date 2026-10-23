-- CreateEnum
CREATE TYPE "IdentityType" AS ENUM ('EMAIL', 'PHONE');

-- AlterTable
ALTER TABLE "Recipient" ADD COLUMN     "identityType" "IdentityType" NOT NULL DEFAULT 'EMAIL',
ADD COLUMN     "phone" VARCHAR(32);
