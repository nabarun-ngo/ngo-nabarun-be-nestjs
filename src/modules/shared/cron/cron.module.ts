import { Module } from "@nestjs/common";
import { CronSchedulerService } from "./cron-scheduler.service";
import { CronController } from "./cron.controller";
import { FirebaseModule } from "../firebase/firebase.module";
import { CronLogStorageService } from "./cron-log-storage.service";
import { DatabaseModule } from "../database/database.module";

@Module({
    imports: [FirebaseModule, DatabaseModule],
    controllers: [CronController],
    providers: [CronSchedulerService, CronLogStorageService],
    exports: [CronLogStorageService],
})
export class CronModule { }