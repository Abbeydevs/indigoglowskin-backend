-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('TREATMENT', 'CONSULTATION');

-- AlterTable
ALTER TABLE "SpaService" ADD COLUMN     "image" TEXT,
ADD COLUMN     "type" "ServiceType" NOT NULL DEFAULT 'TREATMENT';
