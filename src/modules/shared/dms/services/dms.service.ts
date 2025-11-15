import { Inject, Injectable } from "@nestjs/common";
import { FirebaseStorageService } from "../../firebase/storage/firebase-storage.service";
import { DOCUMENT_REPOSITORY, type IDocumentRepository } from "../domain/document.repository.interface";
import { Document } from "../domain/document.model";
import { DocumentMapping } from "../domain/mapping.model";
@Injectable()
export class DmsService {
    constructor(private readonly firebaseStorage: FirebaseStorageService,
       @Inject(DOCUMENT_REPOSITORY) private readonly documentRepository: IDocumentRepository
    ) { }

    async uploadFile(
        fileName: string,
        contentType: string,
        content: Buffer,
        mapped : DocumentMapping[]
    ): Promise<Document> {
        const document = Document.create({
            fileName,
            contentType,
            fileSize: content.length,
            isPublic: false,
            mappedTo: mapped,
        })
        const url = await this.firebaseStorage.uploadFile(document.fileName, document.contentType, document.publicToken, content);
        await this.documentRepository.create(document);
        document.fileUrl = url;
        return document;
    }

    async deleteFile(id: string): Promise<void> {
        const document = await this.documentRepository.findById(id);
        if (!document) {
            throw new Error('Document not found');
        }
        await this.firebaseStorage.deleteFile(document.remotePath);
        await this.documentRepository.delete(id);
    }

    async getSignedUrl(id: string): Promise<string> {
        const document = await this.documentRepository.findById(id);
        if (!document) {
            throw new Error('Document not found');
        }
        return await this.firebaseStorage.getSignedUrl(document.remotePath);
    }
}
