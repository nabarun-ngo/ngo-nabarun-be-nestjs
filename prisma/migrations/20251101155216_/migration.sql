-- AlterTable
ALTER TABLE "api_keys" ADD COLUMN     "apiKeyId" VARCHAR(50);

-- CreateIndex
CREATE INDEX "api_keys_apiKeyId_idx" ON "api_keys"("apiKeyId");
