import { SetMetadata, Type } from '@nestjs/common';
import { ProtocolError } from 'puppeteer';
import { User } from 'src/modules/user/domain/model/user.model';
import { EmailTemplateName } from 'src/shared/email-keys';
import { NotificationKeys } from 'src/shared/notification-keys';

export const REPORT_PROVIDER_METADATA_KEY = 'REPORT_PROVIDER_METADATA_KEY';


export function ReportProvider(): <T extends Type<IReportProvider<any>>>(target: T) => void {
    return (target: Type<IReportProvider<any>>) => {
        SetMetadata(REPORT_PROVIDER_METADATA_KEY, true)(target);
    };
}


export interface ReportGeneratedData {
    buffer: Buffer;
    fileName: string;
    contentType: string;
}

export interface IReportProvider<TParams = any> {
    readonly reportCode: string;
    readonly displayName: string;
    readonly description: string;
    readonly requiresApproval: boolean;
    readonly approverRoles: string[] | undefined;
    readonly visibleToRoles: string[];
    generate(params: TParams): Promise<ReportGeneratedData>;

}

