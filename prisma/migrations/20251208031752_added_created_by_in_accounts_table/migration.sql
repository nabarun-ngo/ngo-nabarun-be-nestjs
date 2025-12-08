-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "createdById" TEXT;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
