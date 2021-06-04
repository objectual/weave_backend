-- CreateEnum
CREATE TYPE "ImageTypes" AS ENUM ('USER', 'CHAT');

-- AlterTable
ALTER TABLE "Images" ADD COLUMN     "type" "ImageTypes" NOT NULL DEFAULT E'USER';
