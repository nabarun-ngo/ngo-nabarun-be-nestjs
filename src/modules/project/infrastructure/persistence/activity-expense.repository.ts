import { Injectable } from '@nestjs/common';
import { IActivityExpenseRepository, ActivityExpense, ActivityExpenseProps } from '../../domain/repositories/activity-expense.repository.interface';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { randomUUID } from 'crypto';

@Injectable()
class ActivityExpenseRepository implements IActivityExpenseRepository {
  constructor(private readonly prisma: PrismaPostgresService) {}

  async findById(id: string): Promise<ActivityExpense | null> {
    const expense = await this.prisma.activityExpense.findUnique({
      where: { id },
      include: {
        activity: true,
        expense: true,
        creator: true,
      },
    });

    if (!expense) return null;

    return {
      id: expense.id,
      activityId: expense.activityId,
      expenseId: expense.expenseId,
      allocationPercentage: expense.allocationPercentage ? Number(expense.allocationPercentage) : undefined,
      allocationAmount: expense.allocationAmount ? Number(expense.allocationAmount) : undefined,
      notes: expense.notes || undefined,
      createdBy: expense.createdBy,
      createdAt: expense.createdAt,
    };
  }

  async findByActivityId(activityId: string): Promise<ActivityExpense[]> {
    const expenses = await this.prisma.activityExpense.findMany({
      where: { activityId },
      include: {
        activity: true,
        expense: true,
        creator: true,
      },
    });

    return expenses.map(e => ({
      id: e.id,
      activityId: e.activityId,
      expenseId: e.expenseId,
      allocationPercentage: e.allocationPercentage ? Number(e.allocationPercentage) : undefined,
      allocationAmount: e.allocationAmount ? Number(e.allocationAmount) : undefined,
      notes: e.notes || undefined,
      createdBy: e.createdBy,
      createdAt: e.createdAt,
    }));
  }

  async findByExpenseId(expenseId: string): Promise<ActivityExpense[]> {
    const expenses = await this.prisma.activityExpense.findMany({
      where: { expenseId },
      include: {
        activity: true,
        expense: true,
        creator: true,
      },
    });

    return expenses.map(e => ({
      id: e.id,
      activityId: e.activityId,
      expenseId: e.expenseId,
      allocationPercentage: e.allocationPercentage ? Number(e.allocationPercentage) : undefined,
      allocationAmount: e.allocationAmount ? Number(e.allocationAmount) : undefined,
      notes: e.notes || undefined,
      createdBy: e.createdBy,
      createdAt: e.createdAt,
    }));
  }

  async create(props: ActivityExpenseProps): Promise<ActivityExpense> {
    const created = await this.prisma.activityExpense.create({
      data: {
        id: randomUUID(),
        activityId: props.activityId,
        expenseId: props.expenseId,
        allocationPercentage: props.allocationPercentage,
        allocationAmount: props.allocationAmount,
        notes: props.notes,
        createdBy: props.createdBy,
        createdAt: new Date(),
      },
      include: {
        activity: true,
        expense: true,
        creator: true,
      },
    });

    return {
      id: created.id,
      activityId: created.activityId,
      expenseId: created.expenseId,
      allocationPercentage: created.allocationPercentage ? Number(created.allocationPercentage) : undefined,
      allocationAmount: created.allocationAmount ? Number(created.allocationAmount) : undefined,
      notes: created.notes || undefined,
      createdBy: created.createdBy,
      createdAt: created.createdAt,
    };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.activityExpense.delete({
      where: { id },
    });
  }

  async deleteByActivityAndExpense(activityId: string, expenseId: string): Promise<void> {
    await this.prisma.activityExpense.deleteMany({
      where: {
        activityId,
        expenseId,
      },
    });
  }
}

export { ActivityExpenseRepository };

