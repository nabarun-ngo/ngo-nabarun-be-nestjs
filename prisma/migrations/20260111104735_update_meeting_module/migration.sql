/*
  Warnings:

  - You are about to drop the column `extAudioConferenceLink` on the `meetings` table. All the data in the column will be lost.
  - You are about to drop the column `meetingDate` on the `meetings` table. All the data in the column will be lost.
  - The `meetingStartTime` column on the `meetings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `meetingEndTime` column on the `meetings` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `meetingId` on the `notices` table. All the data in the column will be lost.
  - You are about to drop the `meeting_attendees` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "meeting_attendees" DROP CONSTRAINT "meeting_attendees_meetingId_fkey";

-- DropForeignKey
ALTER TABLE "meeting_attendees" DROP CONSTRAINT "meeting_attendees_userId_fkey";

-- DropForeignKey
ALTER TABLE "notices" DROP CONSTRAINT "notices_meetingId_fkey";

-- DropIndex
DROP INDEX "meetings_meetingDate_idx";

-- DropIndex
DROP INDEX "notices_meetingId_key";

-- AlterTable
ALTER TABLE "meetings" DROP COLUMN "extAudioConferenceLink",
DROP COLUMN "meetingDate",
ADD COLUMN     "attendees" TEXT,
DROP COLUMN "meetingStartTime",
ADD COLUMN     "meetingStartTime" TIMESTAMP(3),
DROP COLUMN "meetingEndTime",
ADD COLUMN     "meetingEndTime" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "notices" DROP COLUMN "meetingId";

-- DropTable
DROP TABLE "meeting_attendees";
