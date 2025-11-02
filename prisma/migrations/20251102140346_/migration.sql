-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "user_profiles_email_idx" ON "user_profiles"("email");

-- CreateIndex
CREATE INDEX "user_profiles_authUserId_idx" ON "user_profiles"("authUserId");
