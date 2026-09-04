-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "slipId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Photo_slipId_key" ON "Photo"("slipId");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_slipId_fkey" FOREIGN KEY ("slipId") REFERENCES "Slip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
