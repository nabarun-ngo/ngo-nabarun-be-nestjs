import { Module } from "@nestjs/common";
import { UserModule } from "src/modules/user/user.module";
import { WorkflowModule } from "src/modules/workflow/workflow.module";
import { PublicController } from "./presentation/controller/public.controller";
import { PublicService } from "./application/services/public.service";
import { FirebaseModule } from "../shared/firebase/firebase.module";
import { ContentService } from "./application/services/content.service";
import { CallbackController } from "./presentation/controller/callback.controller";
import { HealthController } from "./presentation/controller/health.controller";
import { AuthModule } from "../shared/auth/auth.module";

@Module({
  imports: [FirebaseModule, UserModule, WorkflowModule, AuthModule],
  controllers: [PublicController, CallbackController, HealthController],
  providers: [PublicService, ContentService],
  exports: [],
})
export class PublicModule { }