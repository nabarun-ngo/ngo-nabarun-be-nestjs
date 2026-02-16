-- DropForeignKey
ALTER TABLE "user_notifications" DROP CONSTRAINT "user_notifications_notificationId_fkey";

-- AddForeignKey
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
