import { Document } from "../domain/document.model";
import { DocumentReference } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { DocumentMapping, DocumentMappingRefType } from "../domain/mapping.model";
import { MapperUtils } from "../../database";

export class DocumentInfraMapper {
    static toDocumentDomain(model: Prisma.DocumentReferenceGetPayload<{
        include: {
            mappings: true;
        }
    }>): Document {
        return new Document(
            model.id,
            model.fileName,
            model.remotePath,
            model.publicToken,
            model.contentType,
            model.fileSize,
            model.mappings.map(m => new DocumentMapping(m.id, m.entityId, m.entityType as DocumentMappingRefType, m.createdAt)),
            model.isPublic,
            { id: MapperUtils.nullToUndefined(model.uploadedById) },
            model.createdAt,

        );
    }


}