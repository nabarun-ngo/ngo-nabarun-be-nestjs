import { Injectable } from "@nestjs/common";
import { BaseRepository } from "src/shared/models/repository.base";
import { Document, DocumentProps } from "../domain/document.model";
import { PrismaBaseRepository, PrismaPostgresService } from "../../database";
import { BaseFilter } from "src/shared/models/base-filter-props";
import { PagedResult } from "src/shared/models/paged-result";
import { DocumentReference, Prisma, PrismaClient } from "@prisma/client";
import { DocumentMapping, DocumentMappingRefType } from "../domain/mapping.model";
import { IDocumentRepository } from "../domain/document.repository.interface";

//TODO: Remove PrismaBaseRepository and use PrismaPostgresService directly
@Injectable()
export class DocumentRepository
    extends PrismaBaseRepository<
        Document,
        PrismaClient['documentReference'],
        Prisma.DocumentReferenceWhereUniqueInput,
        Prisma.DocumentReferenceWhereInput,
        Prisma.DocumentReferenceGetPayload<any>,
        Prisma.DocumentReferenceCreateInput,
        Prisma.DocumentReferenceUpdateInput>
    implements IDocumentRepository {

    constructor(prisma: PrismaPostgresService) {
        super(prisma);
    }

    async findAll(filter: DocumentProps): Promise<Document[]> {
        return await this.findMany<Prisma.DocumentReferenceInclude>(this.whereQuery(filter), {
            mappings: true,
        });
    }

    async findPaged(filter?: BaseFilter<DocumentProps> | undefined): Promise<PagedResult<Document>> {
        const result = await this.findPaginated<Prisma.DocumentReferenceInclude>(this.whereQuery(filter?.props!), filter?.pageIndex ?? 0, filter?.pageSize ?? 1000, {
            mappings: true,
        });
        return new PagedResult<Document>(result.data, result.total, result.page, result.pageSize);
    }

    private whereQuery(filter: DocumentProps): Prisma.DocumentReferenceWhereInput {
        const where: Prisma.DocumentReferenceWhereInput = {
            mappings: { some: { entityId: filter.refId, entityType: filter.refType as DocumentMappingRefType } }
        };
        return where;
    }

    async findById(id: string): Promise<Document | null> {
        return await this.findUnique<Prisma.DocumentReferenceInclude>({ id }, {
            mappings: true,
        });
    }
    async create(entity: Document): Promise<Document> {
        return await this.createRecord({
            fileName: entity.fileName,
            remotePath: entity.remotePath,
            publicToken: entity.publicToken,
            contentType: entity.contentType,
            fileSize: entity.fileSize,
            isPublic: entity.isPublic,
            mappings: {
                create: entity.getMappings().map(m => ({
                    entityId: m.refId,
                    entityType: m.refType,
                    createdAt: m.createdAt,
                    id: m.id,
                }))
            }
        })
    }
    async update(id: string, entity: Document): Promise<Document> {
        return await this.updateRecord({ id }, {
            publicToken: entity.publicToken,
            isPublic: entity.isPublic,
            mappings: {
                create: entity.getMappings().map(m => ({
                    entityId: m.refId,
                    entityType: m.refType,
                    createdAt: m.createdAt,
                    id: m.id,
                }))
            }
        });
    }
    async delete(id: string): Promise<void> {
        return await this.hardDelete({ id });
    }

    protected getDelegate(prisma: PrismaPostgresService) {
        return prisma.documentReference;
    }
    protected toDomain(prismaModel: Prisma.DocumentReferenceGetPayload<{
        include: { mappings: true }
    }>): Document | null {
        return new Document(
            prismaModel.id,
            prismaModel.fileName,
            prismaModel.remotePath,
            prismaModel.publicToken,
            prismaModel.contentType,
            Number(prismaModel.fileSize),
            prismaModel.mappings ? prismaModel.mappings.map(m => new DocumentMapping(
                m.id,
                m.entityId,
                m.entityType as DocumentMappingRefType,
                m.createdAt,
            )) : [],
            prismaModel.isPublic,
        );
    }



}





