-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "createdById" VARCHAR(255);

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
