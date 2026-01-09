import { Module } from "@nestjs/common";
import { CronSchedulerService } from "./cron-scheduler.service";
import { CronController } from "./cron.controller";
import { FirebaseModule } from "../firebase/firebase.module";

@Module({
    imports: [FirebaseModule],
    controllers: [CronController],
    providers: [CronSchedulerService],
    exports: [],
})
export class CronModule { }