/*
  Warnings:

  - You are about to drop the column `discountPercentage` on the `Coupon` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `Coupon` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FLAT_FEE');

-- CreateEnum
CREATE TYPE "DiscountTarget" AS ENUM ('ALL_PRODUCTS', 'SPECIFIC_CATEGORIES', 'SPECIFIC_PRODUCTS');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "couponId" TEXT;

-- AlterTable
ALTER TABLE "Coupon" DROP COLUMN "discountPercentage",
DROP COLUMN "expiresAt",
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "target" "DiscountTarget" NOT NULL DEFAULT 'ALL_PRODUCTS',
ADD COLUMN     "type" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
ADD COLUMN     "value" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "couponId" TEXT;

-- CreateTable
CREATE TABLE "_CategoryToCoupon" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryToCoupon_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProductToCoupon" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProductToCoupon_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CategoryToCoupon_B_index" ON "_CategoryToCoupon"("B");

-- CreateIndex
CREATE INDEX "_ProductToCoupon_B_index" ON "_ProductToCoupon"("B");

-- AddForeignKey
ALTER TABLE "_CategoryToCoupon" ADD CONSTRAINT "_CategoryToCoupon_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToCoupon" ADD CONSTRAINT "_CategoryToCoupon_B_fkey" FOREIGN KEY ("B") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToCoupon" ADD CONSTRAINT "_ProductToCoupon_A_fkey" FOREIGN KEY ("A") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProductToCoupon" ADD CONSTRAINT "_ProductToCoupon_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
