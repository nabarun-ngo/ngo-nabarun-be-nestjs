import { Module } from "@nestjs/common";
import { UserModule } from "src/modules/user/user.module";
import { WorkflowModule } from "src/modules/workflow/workflow.module";
import { PublicController } from "./presentation/controller/public.controller";
import { PublicService } from "./application/services/public.services";
import { FirebaseModule } from "../shared/firebase/firebase.module";
import { ContentService } from "./application/services/content.service";
import { CallbackController } from "./presentation/controller/callback.controller";
import { HealthController } from "./presentation/controller/health.controller";

@Module({
  imports: [FirebaseModule, UserModule, WorkflowModule],
  controllers: [PublicController, CallbackController, HealthController],
  providers: [PublicService, ContentService],
  exports: [],
})
export class PublicModule { }