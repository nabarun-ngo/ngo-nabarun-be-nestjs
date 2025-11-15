import { Module } from "@nestjs/common";
import { FirebaseModule } from "../firebase/firebase.module";
import { DocumentRepository } from "./infrastructure/document.repository";
import { DmsService } from "./services/dms.service";
import { DOCUMENT_REPOSITORY } from "./domain/document.repository.interface";

@Module({
    imports: [FirebaseModule],
    providers: [
        DmsService,
        {
            provide: DOCUMENT_REPOSITORY,
            useExisting: DocumentRepository,
        },
    ],
    exports: [
        DmsService
    ],
})
export class DMSModule { }