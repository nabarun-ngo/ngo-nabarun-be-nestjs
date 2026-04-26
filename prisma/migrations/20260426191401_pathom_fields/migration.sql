-- AlterTable
ALTER TABLE "meetings" ADD COLUMN     "meetingActionItems" TEXT,
ADD COLUMN     "meetingNotes" TEXT,
ADD COLUMN     "meetingRecordingUrl" VARCHAR(1000),
ADD COLUMN     "meetingTranscript" TEXT;
