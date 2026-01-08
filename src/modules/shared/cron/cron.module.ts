import { Module } from "@nestjs/common";
import { CronSchedulerService } from "./cron-scheduler.service";
import { CronController } from "./cron.controller";

@Module({
    imports: [],
    controllers: [CronController],
    providers: [CronSchedulerService],
    exports: [],
})
export class CronModule { }