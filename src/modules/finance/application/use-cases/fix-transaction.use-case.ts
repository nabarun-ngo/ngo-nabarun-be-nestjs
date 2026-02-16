import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { FixTransactionDto } from '../dto/account.dto';
import { DONATION_REPOSITORY, type IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { ACCOUNT_REPOSITORY, type IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { TransactionRefType, TransactionType } from '../../domain/model/transaction.model';
import { DonationStatus } from '../../domain/model/donation.model';
import { CreateTransactionUseCase } from './create-transaction.use-case';
import { PrismaPostgresService } from 'src/modules/shared/database';
import { ExpenseStatus } from '../../domain/model/expense.model';
import { EXPENSE_REPOSITORY, type IExpenseRepository } from '../../domain/repositories/expense.repository.interface';

@Injectable()
export class FixTransactionUseCase implements IUseCase<FixTransactionDto, void> {
    constructor(
        @Inject(TRANSACTION_REPOSITORY)
        private readonly transactionRepository: ITransactionRepository,
        @Inject(DONATION_REPOSITORY)
        private readonly donationRepository: IDonationRepository,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: IAccountRepository,
        @Inject(EXPENSE_REPOSITORY)
        private readonly expenseRepository: IExpenseRepository,
        private readonly transactionUseCase: CreateTransactionUseCase,
        private readonly prisma: PrismaPostgresService
    ) { }

    async execute(request: FixTransactionDto): Promise<void> {
        if (request.itemType == 'DONATION') {
            const donation = await this.donationRepository.findById(request.itemId);
            if (!donation) {
                throw new BusinessException(`Donation not found with id: ${request.itemId}`);
            }
            if (donation.status != DonationStatus.PAID) {
                throw new BusinessException(`Donation is not in paid state`);
            }
            const account = await this.accountRepository.findById(request.newAccountId);
            if (!account) {
                throw new BusinessException(`Account not found with id: ${request.newAccountId}`);
            }

            const oldTransaction = await this.transactionRepository.findById(donation.transactionRef!);
            if (!oldTransaction) {
                throw new BusinessException(`Transaction not found with id: ${donation.transactionRef}`);
            }

            const newTransaction = await this.transactionUseCase.execute({
                accountId: request.newAccountId!,
                txnAmount: donation.amount!,
                currency: 'INR',
                txnDescription: `Donation amount for ${donation.id}, Payment method: ${donation.paymentMethod}, Paid using UPI: ${donation.paidUsingUPI}`,
                txnType: TransactionType.IN,
                txnDate: donation.paidOn,
                txnRefId: donation.id,
                txnRefType: TransactionRefType.DONATION,
                txnParticulars: `Donation amount for ${donation.id}`,
            })
            await this.prisma.donation.update({
                where: { id: donation.id },
                data: {
                    status: DonationStatus.PAID,
                    paidToAccountId: request.newAccountId!,
                    transactionRef: newTransaction.id
                }
            })
            await this.transactionRepository.delete(oldTransaction.id);
        }

        if (request.itemType == 'EXPENSE') {
            const expense = await this.expenseRepository.findById(request.itemId);
            if (!expense) {
                throw new BusinessException(`Expense not found with id: ${request.itemId}`);
            }
            if (expense.status != ExpenseStatus.SETTLED) {
                throw new BusinessException(`Expense is not in settled state`);
            }
            const account = await this.accountRepository.findById(request.newAccountId);
            if (!account) {
                throw new BusinessException(`Account not found with id: ${request.newAccountId}`);
            }

            const oldTransaction = await this.transactionRepository.findById(expense.transactionId!);
            if (!oldTransaction) {
                throw new BusinessException(`Transaction not found with id: ${expense.transactionId}`);
            }

            const newTransaction = await this.transactionUseCase.execute({
                txnAmount: expense.amount,
                currency: expense.currency,
                accountId: request.newAccountId!,
                txnDescription: `Expense settlement: ${expense.name}`,
                txnRefId: expense.id,
                txnRefType: TransactionRefType.EXPENSE,
                txnType: TransactionType.OUT,
                txnDate: new Date(),
                txnParticulars: 'Expense settlement',
            });
            await this.prisma.expense.update({
                where: { id: expense.id },
                data: {
                    status: ExpenseStatus.SETTLED,
                    accountId: request.newAccountId!,
                    transactionRef: newTransaction.id
                }
            })
            await this.transactionRepository.delete(oldTransaction.id);
        }
    }
}


