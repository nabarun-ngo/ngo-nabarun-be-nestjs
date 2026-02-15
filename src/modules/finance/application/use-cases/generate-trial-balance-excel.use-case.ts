import { Injectable } from '@nestjs/common';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { GetTrialBalanceUseCase } from './get-trial-balance.use-case';
import { DocumentGeneratorService } from 'src/modules/shared/document-generator/services/document-generator.service';
import { IExcelRowData } from 'src/modules/shared/document-generator/interfaces/excel-generator.interface';
import { formatDate } from 'src/shared/utilities/common.util';

export interface GenerateTrialBalanceExcelRequest {
  fromDate: Date;
  toDate: Date;
}

/**
 * Generates an Excel file for the trial balance report (date range).
 */
@Injectable()
export class GenerateTrialBalanceExcelUseCase
  implements IUseCase<GenerateTrialBalanceExcelRequest, Buffer>
{
  constructor(
    private readonly getTrialBalanceUseCase: GetTrialBalanceUseCase,
    private readonly documentGenerator: DocumentGeneratorService,
  ) {}

  async execute(
    request: GenerateTrialBalanceExcelRequest,
  ): Promise<Buffer> {
    const report = await this.getTrialBalanceUseCase.execute({
      fromDate: request.fromDate,
      toDate: request.toDate,
    });

    const rowData: IExcelRowData[] = report.lines.map((line) => ({
      accountId: line.accountId,
      accountName: line.accountName ?? '',
      currency: line.currency ?? '',
      totalDebit: line.totalDebit,
      totalCredit: line.totalCredit,
      balance: line.balance,
    }));

    const numFmt = '#,##0.00';

    const excelBuilder = this.documentGenerator.createExcelBuilder();
    const sheet = excelBuilder.addSheet({
      name: 'Trial Balance',
      autoSizeColumns: true,
      freezePane: { row: 1 },
      columns: [
        { header: 'Account ID', key: 'accountId', width: 36 },
        { header: 'Account Name', key: 'accountName', width: 30 },
        { header: 'Currency', key: 'currency', width: 10 },
        { header: 'Total Debit', key: 'totalDebit', width: 16, style: { numFmt } },
        { header: 'Total Credit', key: 'totalCredit', width: 16, style: { numFmt } },
        { header: 'Balance', key: 'balance', width: 16, style: { numFmt } },
      ],
    });

    sheet.addRows(rowData);

    // Totals row (header is row 1, data rows 2..n+1)
    const totalsRow = report.lines.length + 2;
    sheet
      .setCell(totalsRow, 1, 'Total', { font: { bold: true } })
      .setCell(totalsRow, 4, report.totalDebit, { numFmt, font: { bold: true } })
      .setCell(totalsRow, 5, report.totalCredit, { numFmt, font: { bold: true } })
      .setCell(totalsRow, 6, report.totalCredit - report.totalDebit, { numFmt, font: { bold: true } });

    const footerRow = report.lines.length + 4;
    sheet.setCell(
      footerRow,
      1,
      `Generated on ${formatDate(new Date(), { format: 'dd/MM/yyyy HH:mm:ss' })}`,
      { font: { size: 8, italic: true } },
    );

    return sheet.endSheet().build();
  }
}
