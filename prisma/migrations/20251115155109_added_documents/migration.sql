-- CreateTable
CREATE TABLE "document_references" (
    "id" TEXT NOT NULL,
    "fileName" VARCHAR(500) NOT NULL,
    "remotePath" VARCHAR(1000) NOT NULL,
    "publicToken" VARCHAR(255) NOT NULL,
    "contentType" VARCHAR(100) NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,

    CONSTRAINT "document_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_mappings" (
    "id" TEXT NOT NULL,
    "documentReferenceId" VARCHAR(255) NOT NULL,
    "entityType" VARCHAR(100) NOT NULL,
    "entityId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_mappings_entityType_entityId_idx" ON "document_mappings"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "document_references" ADD CONSTRAINT "document_references_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_mappings" ADD CONSTRAINT "document_mappings_documentReferenceId_fkey" FOREIGN KEY ("documentReferenceId") REFERENCES "document_references"("id") ON DELETE CASCADE ON UPDATE CASCADE;
