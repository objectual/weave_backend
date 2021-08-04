/*
  Warnings:

  - You are about to drop the column `roomId` on the `Folder` table. All the data in the column will be lost.
  - You are about to drop the `_FolderConnect` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_folderId_fkey";

-- DropForeignKey
ALTER TABLE "_FolderConnect" DROP CONSTRAINT "_FolderConnect_A_fkey";

-- DropForeignKey
ALTER TABLE "_FolderConnect" DROP CONSTRAINT "_FolderConnect_B_fkey";

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "roomId";

-- DropTable
DROP TABLE "_FolderConnect";
