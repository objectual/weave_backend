/*
  Warnings:

  - You are about to drop the column `locationId` on the `Event` table. All the data in the column will be lost.
  - The primary key for the `Location` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Location` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_locationId_fkey";

-- DropIndex
DROP INDEX "Location.address_unique";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "locationId",
ADD COLUMN     "locationLat" DOUBLE PRECISION,
ADD COLUMN     "locationLong" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Location" DROP CONSTRAINT "Location_pkey",
DROP COLUMN "id",
ADD PRIMARY KEY ("lat", "long");

-- AddForeignKey
ALTER TABLE "Event" ADD FOREIGN KEY ("locationLat", "locationLong") REFERENCES "Location"("lat", "long") ON DELETE SET NULL ON UPDATE CASCADE;
