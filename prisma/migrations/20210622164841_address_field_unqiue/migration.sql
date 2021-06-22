/*
  Warnings:

  - A unique constraint covering the columns `[address]` on the table `Location` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Location.address_unique" ON "Location"("address");
