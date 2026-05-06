import { Inject, Injectable } from "@nestjs/common";
import { type IReportRepository, REPORT_REPOSITORY } from "../../domain/repositories/report.repository.interface";
import { ReportApprovedEvent } from "../../domain/events/report-approved.event";

@Injectable()
export class ReportEventHandler {

    constructor(
        @Inject(REPORT_REPOSITORY)
        private readonly reportRepository: IReportRepository,
    ) { }

    async handleReportApproved(event: ReportApprovedEvent) {

    }
}