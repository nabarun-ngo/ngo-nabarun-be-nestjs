import { Module } from '@nestjs/common';
import { DocumentGeneratorService } from './services/document-generator.service';
import { DOCUMENT_GENERATOR_SERVICE } from './interfaces/document-generator.interface';

/**
 * Document Generator Module
 * 
 * Provides services for generating PDF and Excel documents with a fluent builder API.
 * 
*/
@Module({
    controllers: [],
    providers: [
        DocumentGeneratorService,
        {
            provide: DOCUMENT_GENERATOR_SERVICE,
            useClass: DocumentGeneratorService,
        },
    ],
    exports: [
        DOCUMENT_GENERATOR_SERVICE,
    ],
})
export class DocumentGeneratorModule { }
