import { Injectable } from '@nestjs/common';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { GetLedgerByAccountUseCase } from './get-ledger-by-account.use-case';
import { DocumentGeneratorService } from 'src/modules/shared/document-generator/services/document-generator.service';
import { formatDate } from 'src/shared/utilities/common.util';

export interface GenerateLedgerByAccountExcelRequest {
  accountId: string;
  fromDate?: Date;
  toDate?: Date;
  includeRunningBalance?: boolean;
}

/**
 * Generates an Excel file for the ledger-by-account report.
 */
@Injectable()
export class GenerateLedgerByAccountExcelUseCase
  implements IUseCase<GenerateLedgerByAccountExcelRequest, Buffer>
{
  constructor(
    private readonly getLedgerByAccountUseCase: GetLedgerByAccountUseCase,
    private readonly documentGenerator: DocumentGeneratorService,
  ) {}

  async execute(
    request: GenerateLedgerByAccountExcelRequest,
  ): Promise<Buffer> {
    const report = await this.getLedgerByAccountUseCase.execute({
      accountId: request.accountId,
      fromDate: request.fromDate,
      toDate: request.toDate,
      includeRunningBalance: request.includeRunningBalance ?? true,
    });

    const numFmt = '#,##0.00';
    const hasRunningBalance = report.lines.some((l) => l.runningBalance !== undefined);
    const excelBuilder = this.documentGenerator.createExcelBuilder();
    const sheet = excelBuilder.addSheet({
      name: 'Ledger',
      autoSizeColumns: true,
      freezePane: { row: 4 },
    });

    sheet
      .setCell(1, 1, `Account: ${report.accountName ?? report.accountId}`, { font: { bold: true, size: 12 } })
      .setColumnWidth(1, 36)
      .setColumnWidth(2, 36)
      .setColumnWidth(3, 12)
      .setColumnWidth(4, 14)
      .setColumnWidth(5, 14)
      .setColumnWidth(6, 40)
      .setColumnWidth(7, 14);

    const periodStr =
      report.fromDate && report.toDate
        ? `Period: ${formatDate(report.fromDate, { format: 'dd/MM/yyyy' })} to ${formatDate(report.toDate, { format: 'dd/MM/yyyy' })}`
        : 'All dates';
    sheet.setCell(2, 1, periodStr, { font: { italic: true } });

    sheet
      .setCell(4, 1, 'Line #', { font: { bold: true } })
      .setCell(4, 2, 'Journal Entry ID', { font: { bold: true } })
      .setCell(4, 3, 'Date', { font: { bold: true } })
      .setCell(4, 4, 'Debit', { font: { bold: true } })
      .setCell(4, 5, 'Credit', { font: { bold: true } })
      .setCell(4, 6, 'Particulars', { font: { bold: true } });
    if (hasRunningBalance) {
      sheet.setCell(4, 7, 'Running Balance', { font: { bold: true } });
    }

    report.lines.forEach((line, i) => {
      const row = 5 + i;
      sheet
        .setCell(row, 1, line.lineNumber)
        .setCell(row, 2, line.journalEntryId)
        .setCell(row, 3, formatDate(line.createdAt, { format: 'dd/MM/yyyy' }))
        .setCell(row, 4, line.debitAmount, { numFmt })
        .setCell(row, 5, line.creditAmount, { numFmt })
        .setCell(row, 6, line.particulars ?? '');
      if (line.runningBalance !== undefined) {
        sheet.setCell(row, 7, line.runningBalance, { numFmt });
      }
    });

    const dataRowCount = report.lines.length;
    const totalsRow = dataRowCount + 6;
    sheet
      .setCell(totalsRow, 1, 'Closing Balance', { font: { bold: true } })
      .setCell(totalsRow, hasRunningBalance ? 7 : 6, report.closingBalance, { numFmt, font: { bold: true } });

    const footerRow = dataRowCount + 8;
    sheet.setCell(
      footerRow,
      1,
      `Generated on ${formatDate(new Date(), { format: 'dd/MM/yyyy HH:mm:ss' })}`,
      { font: { size: 8, italic: true } },
    );

    return sheet.endSheet().build();
  }
}
