/*
  Warnings:

  - A unique constraint covering the columns `[extMeetingId]` on the table `meetings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "meetingAgenda" TEXT,
ADD COLUMN     "meetingOutcomes" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "meetings_extMeetingId_key" ON "meetings"("extMeetingId");
