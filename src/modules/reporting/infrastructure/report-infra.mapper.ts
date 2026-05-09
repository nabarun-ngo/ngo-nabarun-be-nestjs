import { MapperUtils } from 'src/modules/shared/database/mapper-utils';
import { Report, ReportStatus } from '../domain/models/report.model';
import { Prisma } from '@prisma/client';

export type ReportPersistence = Prisma.ReportGetPayload<{
    select: {
        id: true,
        reportCode: true,
        requestedById: true,
        status: true,
        parameters: true,
        createdAt: true,
        updatedAt: true,
        docVersion: true,
        needApproval: true,
        approvedBy: true,
        approvedAt: true,
        approvers: true,
        viewers: true,
        docId: true,
        workflowId: true,
        reportName: true,
    };
}>;

export class ReportInfraMapper {

    static toDomain(p: ReportPersistence): Report | null {
        if (!p) return null;

        return new Report(
            p.id,
            p.reportCode,
            p.reportName,
            MapperUtils.nullToUndefined(p.requestedById),
            p.status as ReportStatus,
            (p.parameters as Record<string, any>) ?? undefined,
            p.needApproval,
            MapperUtils.nullToUndefined(p.approvedBy),
            MapperUtils.nullToUndefined(p.approvedAt),
            p.approvers,
            p.viewers,
            MapperUtils.nullToUndefined(p.docId),
            MapperUtils.nullToUndefined(p.workflowId),
            p.docVersion,
            p.createdAt,
            p.updatedAt,
        );
    }

    static toCreatePersistence(domain: Report): Prisma.ReportCreateInput {
        return {
            id: domain.id,
            reportCode: domain.reportCode,
            requestedBy: (domain.requestedById && domain.requestedById !== 'system')
                ? { connect: { id: domain.requestedById } }
                : undefined,
            status: domain.status,
            reportName: domain.reportName,
            parameters: domain.parameters ?? Prisma.DbNull,
            docId: MapperUtils.undefinedToNull(domain.dmsDocumentId),
            needApproval: domain.needApproval,
            approvedBy: MapperUtils.undefinedToNull(domain.approvedBy),
            approvedAt: domain.approvedAt,
            approvers: domain.approvers,
            viewers: domain.viewers,
            docVersion: domain.version,
            createdAt: domain.createdAt,
            workflowId: domain.workflowId,
            updatedAt: domain.updatedAt,
        };
    }

    static toUpdatePersistence(domain: Report): Prisma.ReportUpdateInput {
        return {
            status: domain.status,
            reportName: domain.reportName,
            docId: MapperUtils.undefinedToNull(domain.dmsDocumentId),
            docVersion: domain.version,
            updatedAt: domain.updatedAt,
            approvedBy: MapperUtils.undefinedToNull(domain.approvedBy),
            workflowId: domain.workflowId,
            approvedAt: domain.approvedAt,
        };
    }
}
