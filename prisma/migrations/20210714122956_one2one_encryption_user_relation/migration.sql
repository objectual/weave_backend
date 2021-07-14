/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Encryption` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Encryption_userId_unique" ON "Encryption"("userId");
