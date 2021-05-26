/*
  Warnings:

  - The primary key for the `Profile` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `username` on the `Profile` table. All the data in the column will be lost.
  - Added the required column `city` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `Profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birthday` to the `Profile` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Profile_userId_unique";

-- DropIndex
DROP INDEX "Profile.username_unique";

-- AlterTable
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_pkey",
DROP COLUMN "username",
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "birthday" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "birthYearVisibility" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "locationRange" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "locationVisibility" BOOLEAN NOT NULL DEFAULT true,
ADD PRIMARY KEY ("userId");

-- CreateTable
CREATE TABLE "Images" (
    "id" TEXT NOT NULL,
    "cloudinaryId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Images" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
