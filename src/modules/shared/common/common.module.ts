import { Global, Module } from "@nestjs/common";
import { CorrespondenceModule } from "../correspondence/correspondence.module";
import { AppEventEmitter } from "./app-event-emitter.service";

@Global()
@Module({
  imports: [CorrespondenceModule],
  controllers: [],
  providers: [AppEventEmitter],
  exports: [AppEventEmitter],
})
export class CommonModule { }
