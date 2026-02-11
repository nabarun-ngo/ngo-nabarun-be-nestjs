-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "traceId" VARCHAR(100);

-- CreateIndex
CREATE INDEX "audit_logs_traceId_idx" ON "audit_logs"("traceId");
