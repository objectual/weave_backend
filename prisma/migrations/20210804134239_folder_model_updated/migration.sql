-- CreateTable
CREATE TABLE "_FolderConnect" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_FolderConnect_AB_unique" ON "_FolderConnect"("A", "B");

-- CreateIndex
CREATE INDEX "_FolderConnect_B_index" ON "_FolderConnect"("B");

-- AddForeignKey
ALTER TABLE "Room" ADD FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FolderConnect" ADD FOREIGN KEY ("A") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FolderConnect" ADD FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
