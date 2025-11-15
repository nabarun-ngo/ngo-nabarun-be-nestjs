

import { Document } from "../domain/document.model";
import { DocumentDto } from "./dto/document.dto";


export function toDocumentDto(document: Document): DocumentDto {
    return {
        id: document.id,
        fileName: document.fileName,
        contentType: document.contentType,
        fileSize: document.fileSize,
        fileUrl: document.fileUrl,
        isPublic: document.isPublic,
        uploadedAt: document.createdAt,
    };
}