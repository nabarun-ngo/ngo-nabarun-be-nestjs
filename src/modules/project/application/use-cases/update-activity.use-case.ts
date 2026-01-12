import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Activity } from '../../domain/model/activity.model';
import { ACTIVITY_REPOSITORY } from '../../domain/repositories/activity.repository.interface';
import type { IActivityRepository } from '../../domain/repositories/activity.repository.interface';
import { UpdateActivityDto } from '../dto/activity.dto';
import { BusinessException } from '../../../../shared/exceptions/business-exception';

@Injectable()
export class UpdateActivityUseCase implements IUseCase<{ activityId: string; data: UpdateActivityDto }, Activity> {
    constructor(
        @Inject(ACTIVITY_REPOSITORY)
        private readonly activityRepository: IActivityRepository,
    ) { }

    async execute(request: { activityId: string; data: UpdateActivityDto }): Promise<Activity> {
        const activity = await this.activityRepository.findById(request.activityId);
        if (!activity) {
            throw new BusinessException('Activity not found');
        }

        // Update domain entity
        activity.update(request.data);

        // Handle status update separately if provided
        if (request.data.status) {
            activity.updateStatus(request.data.status);
        }

        return await this.activityRepository.update(request.activityId, activity);
    }
}
