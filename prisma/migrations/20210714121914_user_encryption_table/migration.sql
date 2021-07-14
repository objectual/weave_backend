-- CreateTable
CREATE TABLE "Encryption" (
    "id" TEXT NOT NULL,
    "pub" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Encryption.pub_unique" ON "Encryption"("pub");

-- AddForeignKey
ALTER TABLE "Encryption" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
