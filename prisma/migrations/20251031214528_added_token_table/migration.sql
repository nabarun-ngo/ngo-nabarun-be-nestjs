-- CreateTable
CREATE TABLE "oauth_tokens" (
    "id" TEXT NOT NULL,
    "provider" VARCHAR(20) NOT NULL,
    "clientId" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenType" VARCHAR(20),
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "oauth_tokens_email_clientId_idx" ON "oauth_tokens"("email", "clientId");
