/*
  Warnings:

  - A unique constraint covering the columns `[apiKeyId]` on the table `api_keys` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "api_keys_apiKeyId_key" ON "api_keys"("apiKeyId");
