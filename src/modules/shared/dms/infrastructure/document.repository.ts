import { Injectable } from "@nestjs/common";
import { BaseRepository } from "src/shared/models/repository.base";
import { Document, DocumentProps } from "../domain/document.model";
import { PrismaPostgresService } from "../../database";
import { BaseFilter } from "src/shared/models/base-filter-props";
import { PagedResult } from "src/shared/models/paged-result";
import { DocumentReference, Prisma, PrismaClient } from "@prisma/client";
import { DocumentMapping, DocumentMappingRefType } from "../domain/mapping.model";
import { IDocumentRepository } from "../domain/document.repository.interface";
import { DocumentInfraMapper } from "./document-infra.mapper";

//TODO: Remove PrismaBaseRepository and use PrismaPostgresService directly
@Injectable()
export class DocumentRepository
    implements IDocumentRepository {

    constructor(private readonly prisma: PrismaPostgresService) { }

    async count(filter: DocumentProps): Promise<number> {
        return await this.prisma.documentReference.count({
            where: this.whereQuery(filter),
        });
    }

    async findAll(filter: DocumentProps): Promise<Document[]> {
        const documents = await this.prisma.documentReference.findMany({
            orderBy: { createdAt: 'desc' },
            where: this.whereQuery(filter),
            include: {
                mappings: true,
            },
        });
        return documents.map(m => DocumentInfraMapper.toDocumentDomain(m));
    }

    async findPaged(filter?: BaseFilter<DocumentProps> | undefined): Promise<PagedResult<Document>> {
        throw new Error("Method not implemented.");
    }

    private whereQuery(filter: DocumentProps): Prisma.DocumentReferenceWhereInput {
        const where: Prisma.DocumentReferenceWhereInput = {
            mappings: { some: { entityId: filter.refId, entityType: filter.refType as DocumentMappingRefType } }
        };
        return where;
    }

    async findById(id: string): Promise<Document | null> {
        const document = await this.prisma.documentReference.findUnique({
            where: { id },
            include: {
                mappings: true,
            },
        });
        return document ? DocumentInfraMapper.toDocumentDomain(document) : null;
    }
    async create(entity: Document): Promise<Document> {
        const document = await this.prisma.documentReference.create({
            data: {
                fileName: entity.fileName,
                remotePath: entity.remotePath,
                publicToken: entity.publicToken,
                contentType: entity.contentType,
                fileSize: entity.fileSize,
                isPublic: entity.isPublic,
                createdAt: entity.createdAt,
                uploadedById: entity.uploadedBy?.id,
                id: entity.id,
                mappings: {
                    create: entity.mappings.map(m => ({
                        entityId: m.refId,
                        entityType: m.refType,
                        createdAt: m.createdAt,
                        id: m.id,
                    }))
                }
            },
            include: {
                mappings: true,
            },
        })
        return DocumentInfraMapper.toDocumentDomain(document);
    }
    async update(id: string, entity: Document): Promise<Document> {
        const document = await this.prisma.documentReference.update({
            where: { id },
            data: {
                publicToken: entity.publicToken,
                isPublic: entity.isPublic,
                mappings: {
                    create: entity.mappings.map(m => ({
                        entityId: m.refId,
                        entityType: m.refType,
                        createdAt: m.createdAt,
                        id: m.id,
                    }))
                }
            },
            include: {
                mappings: true,
            },
        });
        return DocumentInfraMapper.toDocumentDomain(document);
    }
    async delete(id: string): Promise<void> {
        await this.prisma.documentReference.delete({ where: { id } });
    }

}





