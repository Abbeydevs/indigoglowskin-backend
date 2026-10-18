/*
  Warnings:

  - You are about to drop the column `type` on the `SpaService` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "consultationId" TEXT;

-- AlterTable
ALTER TABLE "SpaService" DROP COLUMN "type";

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "Consultation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
