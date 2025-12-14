import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { ACTIVITY_EXPENSE_REPOSITORY, ActivityExpense } from '../../domain/repositories/activity-expense.repository.interface';
import type { IActivityExpenseRepository } from '../../domain/repositories/activity-expense.repository.interface';
import { ACTIVITY_REPOSITORY } from '../../domain/repositories/activity.repository.interface';
import type { IActivityRepository } from '../../domain/repositories/activity.repository.interface';
import { LinkExpenseToActivityDto } from '../dto/activity.dto';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { PrismaPostgresService } from '../../../../modules/shared/database/prisma-postgres.service';

@Injectable()
export class LinkExpenseToActivityUseCase implements IUseCase<{ activityId: string; data: LinkExpenseToActivityDto; createdBy: string }, ActivityExpense> {
  constructor(
    @Inject(ACTIVITY_EXPENSE_REPOSITORY)
    private readonly activityExpenseRepository: IActivityExpenseRepository,
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepository: IActivityRepository,
    private readonly prisma: PrismaPostgresService,
  ) {}

  async execute(request: { activityId: string; data: LinkExpenseToActivityDto; createdBy: string }): Promise<ActivityExpense> {
    // Verify activity exists
    const activity = await this.activityRepository.findById(request.activityId);
    if (!activity) {
      throw new BusinessException('Activity not found');
    }

    // Verify expense exists in Finance module
    const expense = await this.prisma.expense.findUnique({
      where: { id: request.data.expenseId },
    });
    if (!expense || expense.deletedAt) {
      throw new BusinessException('Expense not found');
    }

    // Validate allocation
    if (!request.data.allocationPercentage && !request.data.allocationAmount) {
      throw new BusinessException('Either allocationPercentage or allocationAmount must be provided');
    }

    if (request.data.allocationPercentage) {
      if (request.data.allocationPercentage < 0 || request.data.allocationPercentage > 100) {
        throw new BusinessException('Allocation percentage must be between 0 and 100');
      }

      // Check total allocation for this expense
      const existingLinks = await this.activityExpenseRepository.findByExpenseId(request.data.expenseId);
      const totalPercentage = existingLinks.reduce((sum, link) => sum + (link.allocationPercentage || 0), 0);
      if (totalPercentage + request.data.allocationPercentage > 100) {
        throw new BusinessException('Total allocation percentage cannot exceed 100');
      }
    }

    if (request.data.allocationAmount) {
      if (request.data.allocationAmount > Number(expense.amount)) {
        throw new BusinessException('Allocation amount cannot exceed expense amount');
      }

      // Check total allocation for this expense
      const existingLinks = await this.activityExpenseRepository.findByExpenseId(request.data.expenseId);
      const totalAmount = existingLinks.reduce((sum, link) => sum + (link.allocationAmount || 0), 0);
      if (totalAmount + request.data.allocationAmount > Number(expense.amount)) {
        throw new BusinessException('Total allocation amount cannot exceed expense amount');
      }
    }

    // Create link
    return await this.activityExpenseRepository.create({
      activityId: request.activityId,
      expenseId: request.data.expenseId,
      allocationPercentage: request.data.allocationPercentage,
      allocationAmount: request.data.allocationAmount,
      notes: request.data.notes,
      createdBy: request.createdBy,
    });
  }
}

