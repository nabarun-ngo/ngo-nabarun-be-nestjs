import { Module } from "@nestjs/common";
import { FirebaseModule } from "../firebase/firebase.module";
import { StaticDocsService } from "./application/services/static-docs.service";
import { StaticDocsController } from "./presentation/controller/static-document.controller";
import { DISCOVERY_PROVIDER } from "../discovery/interfaces/discovery-provider.interface";
import { StaticDocsProvider } from "./application/providers/static-docs.provider";

@Module({
    controllers: [StaticDocsController],
    imports: [FirebaseModule],
    providers: [
        StaticDocsService,
        {
            provide: DISCOVERY_PROVIDER,
            useClass: StaticDocsProvider,
        },
    ],
    exports: [
        StaticDocsService,
        DISCOVERY_PROVIDER
    ],
})
export class StaticDocsModule { }
