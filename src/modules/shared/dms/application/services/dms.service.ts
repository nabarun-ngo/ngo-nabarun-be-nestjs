import { Inject, Injectable } from "@nestjs/common";
import { FirebaseStorageService } from "../../../firebase/storage/firebase-storage.service";
import { DOCUMENT_REPOSITORY, type IDocumentRepository } from "../../domain/document.repository.interface";
import { Document } from "../../domain/document.model";
import { DocumentMapping, DocumentMappingRefType } from "../../domain/mapping.model";
import { DmsUploadDto } from "../../presentation/dto/dms-upload.dto";
import { toDocumentDto } from "../../presentation/dms-sto-mapper";
import { DocumentDto } from "../../presentation/dto/document.dto";
import { AuthUser } from "src/modules/shared/auth/domain/models/api-user.model";
@Injectable()
export class DmsService {
    constructor(private readonly firebaseStorage: FirebaseStorageService,
        @Inject(DOCUMENT_REPOSITORY) private readonly documentRepository: IDocumentRepository
    ) { }

    async uploadFile(body: DmsUploadDto, authUserId: string): Promise<DocumentDto> {
        const content = Buffer.from(body.fileBase64, 'base64');
        const mapped: DocumentMapping[] = body.documentMapping.map(mapping => DocumentMapping.create(
            {
                refId: mapping.entityId,
                refType: mapping.entityType as DocumentMappingRefType
            }
        ));

        const document = Document.create({
            fileName: body.filename,
            contentType: body.contentType,
            fileSize: content.length,
            isPublic: false,
            mappedTo: mapped,
            uploadedBy: { id: authUserId }
        })
        const url = await this.firebaseStorage.uploadFile(document.remotePath, document.contentType, document.publicToken, content);
        await this.documentRepository.create(document);
        return { ...toDocumentDto(document), fileUrl: url };
    }


    async getDocuments(type: DocumentMappingRefType, id: string) {
        const documents = await this.documentRepository.findAll({ refType: type, refId: id });
        return documents.map(doc => toDocumentDto(doc));
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

    async downloadFile(id: string): Promise<{ fileName: string, stream: NodeJS.ReadableStream }> {
        const document = await this.documentRepository.findById(id);
        if (!document) {
            throw new Error('Document not found');
        }
        return {
            fileName: document.fileName,
            stream: await this.firebaseStorage.downloadFile(document.remotePath)
        };
    }
}
