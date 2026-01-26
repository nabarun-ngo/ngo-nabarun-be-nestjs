import { Module } from '@nestjs/common';
import { DocumentGeneratorService } from './services/document-generator.service';

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
    ],
    exports: [
        DocumentGeneratorService,
    ],
})
export class DocumentGeneratorModule { }
