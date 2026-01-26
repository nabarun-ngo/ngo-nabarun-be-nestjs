import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Donation, DonationStatus, DonationType } from '../../domain/model/donation.model';
import { DONATION_REPOSITORY } from '../../domain/repositories/donation.repository.interface';
import type { IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { formatDate } from 'src/shared/utilities/common.util';
import { groupBy } from 'lodash';
import { DocumentGeneratorService } from 'src/modules/shared/document-generator/services/document-generator.service';
import { IExcelRowData } from 'src/modules/shared/document-generator/interfaces/excel-generator.interface';
import { ConfigService } from '@nestjs/config';
import { Configkey } from 'src/shared/config-keys';


@Injectable()
export class GenerateDonationSummaryReportUseCase implements IUseCase<{ startDate: Date, endDate: Date }, Buffer> {
  constructor(
    @Inject(DONATION_REPOSITORY)
    private readonly donationRepository: IDonationRepository,
    private readonly documentGenerator: DocumentGeneratorService,
    private readonly configService: ConfigService,

  ) { }

  async execute(request: { startDate: Date, endDate: Date }): Promise<Buffer> {
    const monthName = formatDate(request.startDate!, {
      format: 'MMM yyyy'
    })

    const password = this.configService.get(Configkey.APP_SECRET);

    const paidDonations = await this.donationRepository.findAll({
      startDate_confirmedOn: request.startDate,
      endDate_confirmedOn: request.endDate,
      status: [DonationStatus.PAID]
    });

    const pendingDonations = await this.donationRepository.findAll({
      status: Donation.outstandingStatus,
    });
    const accountWisePaidDonations = groupBy(paidDonations, (donation) => donation.paidToAccount?.id);
    const memberWisePendingDonations = groupBy(pendingDonations.filter(f => !f.isGuest), (donation) => donation.donorId);

    /**
     * ExcelData processing
     */
    const paidDonationsData: IExcelRowData[] = [];
    for (const donation of paidDonations) {
      paidDonationsData.push({
        id: donation.id,
        donationType: donation.type,
        period: donation.type == DonationType.REGULAR ? `${formatDate(donation.startDate!, {
          format: 'MMM yyyy'
        })} - ${formatDate(donation.endDate!, {
          format: 'MMM yyyy'
        })}` : '',
        donorName: donation.donorName,
        donationAmount: donation.amount,
        paidOn: formatDate(donation.paidOn!, { format: 'dd/MM/yyyy' }),
        paidToAccount: `${donation.paidToAccount?.id} - ${donation.paidToAccount?.name}`,
        paymentMethod: donation.paymentMethod,
        confirmedBy: donation.confirmedBy?.fullName,
        txnId: donation.transactionRef
      });
    }
    const pendingDonationsData: IExcelRowData[] = [];
    for (const donation of pendingDonations) {
      pendingDonationsData.push({
        id: donation.id,
        donationType: donation.type,
        period: donation.type == DonationType.REGULAR ? `${formatDate(donation.startDate!, {
          format: 'MMM yyyy'
        })} - ${formatDate(donation.endDate!, {
          format: 'MMM yyyy'
        })}` : '', donorName: donation.donorName,
        donationAmount: donation.amount,
        status: donation.status,
      });
    }

    const accountWisePaidDonationsData: IExcelRowData[] = [];
    for (const [accountId, donations] of Object.entries(accountWisePaidDonations)) {
      accountWisePaidDonationsData.push({
        id: accountId,
        accountHolder: donations[0].paidToAccount?.name,
        accountType: donations[0].paidToAccount?.type,
        totalDonation: donations.reduce((acc, donation) => acc + donation.amount, 0),
        totalDonationsCount: donations.length,
      });
    }

    const donorWisePendingDonationsData: IExcelRowData[] = [];
    for (const [donorId, donations] of Object.entries(memberWisePendingDonations)) {
      donorWisePendingDonationsData.push({
        id: donorId,
        donorName: donations[0].donorName,
        totalDonation: donations.reduce((acc, donation) => acc + donation.amount, 0),
        pendingMonths: donations
          .filter(d => d.startDate)
          .map(d => formatDate(d.startDate!, {
            format: 'MMMM yyyy'
          })).join(", "),
      });
    }



    const summaryData = {
      totalPaidAmount: paidDonations.reduce((acc, d) => acc + d.amount, 0),
      totalPaidCount: paidDonations.length,
      totalPendingAmount: pendingDonations.reduce((acc, d) => acc + d.amount, 0),
      totalPendingCount: pendingDonations.length,
    };

    const excelBuilder = this.documentGenerator.createExcelBuilder();
    const summarySheet = excelBuilder.addSheet({
      name: 'Overall Summary',
      autoSizeColumns: true,
      protection: {
        sheet: true,
        password: password
      },
    });

    const leftPadding = 2;
    const allborder: any = { bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' } };
    summarySheet
      .setColumnWidth(leftPadding + 1, 30)
      .setColumnWidth(leftPadding + 2, 15)
      .setCell(1, leftPadding + 1, 'Donation Summary Report', { font: { bold: true, size: 18 } })
      .setCell(2, leftPadding + 1, `Period: ${formatDate(request.startDate, { format: 'dd/MM/yyyy' })} to ${formatDate(request.endDate, { format: 'dd/MM/yyyy' })}`, { font: { italic: true } })

      .setCell(4, leftPadding + 1, 'Key Metrics', { font: { bold: true, size: 12 }, fill: { type: 'pattern', pattern: 'solid', fgColor: 'FFCC99' }, border: allborder })
      .mergeCells(4, leftPadding + 1, 4, leftPadding + 2)
      .setCell(5, leftPadding + 1, 'Total Paid Amount in ' + monthName, { border: allborder })
      .setCell(5, leftPadding + 2, summaryData.totalPaidAmount, { numFmt: '₹ #,##0.00', border: allborder })
      .setCell(6, leftPadding + 1, 'Total Paid Count in ' + monthName, { border: allborder })
      .setCell(6, leftPadding + 2, summaryData.totalPaidCount, { border: allborder })
      .setCell(7, leftPadding + 1, 'Total Pending Amount', { border: allborder })
      .setCell(7, leftPadding + 2, summaryData.totalPendingAmount, { numFmt: '₹ #,##0.00', border: allborder })
      .setCell(8, leftPadding + 1, 'Total Pending Count', { border: allborder })
      .setCell(8, leftPadding + 2, summaryData.totalPendingCount, { border: allborder })

      .setCell(10, leftPadding + 1, 'Account Wise Summary', { font: { bold: true, size: 12 }, fill: { type: 'pattern', pattern: 'solid', fgColor: 'FFCC99' }, border: allborder })
      .mergeCells(10, leftPadding + 1, 10, leftPadding + 2)
      .setCell(11, leftPadding + 1, 'Account Name', { font: { bold: true }, border: allborder })
      .setCell(11, leftPadding + 2, 'Total Amount', { font: { bold: true }, border: allborder })

    // Add account wise summary rows
    let summaryCurrentRow = 12;
    for (const acc of accountWisePaidDonationsData) {
      summarySheet.setCell(summaryCurrentRow, leftPadding + 1, `${acc.id} - ${acc.accountHolder}`, { alignment: { wrapText: true }, border: allborder });
      summarySheet.setCell(summaryCurrentRow, leftPadding + 2, acc.totalDonation, { numFmt: '₹ #,##0.00', border: allborder });
      summaryCurrentRow++;
    }

    // Add footer
    summarySheet.setCell(summaryCurrentRow + 2, leftPadding + 1, `Generated on ${formatDate(new Date(), { format: 'dd/MM/yyyy HH:mm:ss' })}`, { font: { size: 8, italic: true } });

    return await summarySheet
      .endSheet()
      .addSheet({
        name: `Paid Donations - ${monthName}`,
        protection: {
          sheet: true,
          password: password
        },
        freezePane: {
          row: 1
        },
        columns: [
          {
            header: 'Donation Id',
            key: 'id',
          },
          {
            header: 'Donation Type',
            key: 'donationType',
          },
          {
            header: 'Donation Period',
            key: 'period',
          },
          {
            header: 'Donation Amount',
            key: 'donationAmount',
            style: { numFmt: '₹ #,##0.00' }
          },
          {
            header: 'Donor Name',
            key: 'donorName',
          },
          {
            header: 'Paid On',
            key: 'paidOn',
          },
          {
            header: 'Paid To Account',
            key: 'paidToAccount',
          },
          {
            header: 'Payment Method',
            key: 'paymentMethod',
          },
          {
            header: 'Confirmed By',
            key: 'confirmedBy',
          },
          {
            header: 'Transaction Id',
            key: 'txnId',
          }
        ]
      })
      .addRows(paidDonationsData)
      .endSheet()
      .addSheet({
        name: `Pending Donations`,
        protection: {
          sheet: true,
          password: password
        },
        freezePane: {
          row: 1
        },
        columns: [
          {
            header: 'Donation Id',
            key: 'id',
          },
          {
            header: 'Donation Type',
            key: 'donationType',
          },
          {
            header: 'Donation Period',
            key: 'period',
          },
          {
            header: 'Donation Amount',
            key: 'donationAmount',
            style: { numFmt: '₹ #,##0.00' }
          },
          {
            header: 'Donor Name',
            key: 'donorName',
          },
          {
            header: 'Donation Status',
            key: 'status',
          }
        ]
      })
      .addRows(pendingDonationsData)
      .endSheet()
      .addSheet({
        name: `Pending Donations - Donor Wise`,
        autoSizeColumns: true,
        protection: {
          sheet: true,
          password: password
        },
        freezePane: {
          row: 1
        },
        columns: [
          {
            header: 'Donor Name',
            key: 'donorName',
          },
          {
            header: 'Total Outstanding Amount',
            key: 'totalDonation',
            style: { numFmt: '₹ #,##0.00' }

          },
          {
            header: 'Outstanding Months',
            key: 'pendingMonths',
            width: 75,
            style: {
              alignment: {
                wrapText: true,
              }
            }
          }
        ]
      })
      .addRows(donorWisePendingDonationsData)
      .endSheet()
      .build();
  }
}


