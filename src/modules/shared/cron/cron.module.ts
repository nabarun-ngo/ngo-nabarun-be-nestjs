import { Module } from "@nestjs/common";
import { CronService } from "./application/services/cron.service";
import { CronController } from "./presentation/controllers/cron.controller";
import { FirebaseModule } from "../firebase/firebase.module";
import { CronLogStorageService } from "./infrastructure/services/cron-log-storage.service";
import { DatabaseModule } from "../database/database.module";
import { JobProcessingModule } from "../job-processing/job-processing.module";
import { CronConfigService } from "./infrastructure/services/cron-config.service";

@Module({
    imports: [FirebaseModule, DatabaseModule, JobProcessingModule],
    controllers: [CronController],
    providers: [CronService, CronLogStorageService, CronConfigService],
    exports: [CronLogStorageService],
})
export class CronModule { }