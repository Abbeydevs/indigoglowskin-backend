/*
  Warnings:

  - You are about to drop the column `description` on the `Blog` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Blog` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category` to the `Blog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `Blog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `excerpt` to the `Blog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Blog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Blog" DROP COLUMN "description",
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "excerpt" TEXT NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL,
ALTER COLUMN "authorName" SET DEFAULT 'Indigoglowskin Experts';

-- CreateIndex
CREATE UNIQUE INDEX "Blog_slug_key" ON "Blog"("slug");
