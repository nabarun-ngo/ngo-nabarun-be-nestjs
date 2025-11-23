import { Module } from "@nestjs/common";
import { UserModule } from "src/modules/user/user.module";
import { WorkflowModule } from "src/modules/workflow/workflow.module";
import { PublicController } from "./presentation/controller/public.controller";
import { PublicService } from "./application/services/public.services";
import { FirebaseModule } from "../shared/firebase/firebase.module";

@Module({
  imports: [FirebaseModule,UserModule,WorkflowModule],
  controllers: [PublicController],
  providers: [PublicService],
  exports: [],
})
export class PublicModule { }