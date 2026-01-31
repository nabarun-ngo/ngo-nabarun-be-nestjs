/*
  Warnings:

  - You are about to drop the column `archivedAt` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `isArchived` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `isPushSent` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `isRead` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `pushDelivered` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `pushError` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `pushSentAt` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `readAt` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `notifications` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_userId_fkey";

-- DropIndex
DROP INDEX "notifications_userId_createdAt_idx";

-- DropIndex
DROP INDEX "notifications_userId_isRead_idx";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "archivedAt",
DROP COLUMN "isArchived",
DROP COLUMN "isPushSent",
DROP COLUMN "isRead",
DROP COLUMN "pushDelivered",
DROP COLUMN "pushError",
DROP COLUMN "pushSentAt",
DROP COLUMN "readAt",
DROP COLUMN "userId";

-- CreateTable
CREATE TABLE "user_notifications" (
    "id" TEXT NOT NULL,
    "userId" VARCHAR(255) NOT NULL,
    "notificationId" VARCHAR(255) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "isPushSent" BOOLEAN NOT NULL DEFAULT false,
    "pushSentAt" TIMESTAMP(3),
    "pushDelivered" BOOLEAN NOT NULL DEFAULT false,
    "pushError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_notifications_userId_isRead_idx" ON "user_notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "user_notifications_userId_createdAt_idx" ON "user_notifications"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
