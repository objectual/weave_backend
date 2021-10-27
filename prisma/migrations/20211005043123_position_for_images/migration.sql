-- CreateEnum
CREATE TYPE "Position" AS ENUM ('LEFT', 'RIGHT', 'MIDDLE');

-- AlterTable
ALTER TABLE "Images" ADD COLUMN     "position" "Position";
