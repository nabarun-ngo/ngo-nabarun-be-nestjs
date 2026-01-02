import { Module } from "@nestjs/common";
import { FirebaseModule } from "../firebase/firebase.module";
import { DocumentRepository } from "./infrastructure/document.repository";
import { DmsService } from "./application/services/dms.service";
import { DOCUMENT_REPOSITORY } from "./domain/document.repository.interface";
import { DmsController } from "./presentation/controller/dms.controller";
import { StaticDocsService } from "./application/services/static-docs.service";
import { StaticDocsController } from "./presentation/controller/static-document.controller";

@Module({
    controllers: [DmsController, StaticDocsController],
    imports: [FirebaseModule],
    providers: [
        DmsService,
        StaticDocsService,
        {
            provide: DOCUMENT_REPOSITORY,
            useClass: DocumentRepository,
        },
    ],
    exports: [
        DmsService,
        StaticDocsService
    ],
})
export class DMSModule { }