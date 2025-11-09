import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { User, UserAttributesProps, UserProfileProps, UserStatus } from '../../domain/model/user.model';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { Auth0UserService } from '../../infrastructure/external/auth0-user.service';
import { AppEventEmitter } from 'src/modules/shared/common/app-event-emitter.service';
import { PhoneNumber } from '../../domain/model/phone-number.vo';
import { Address } from '../../domain/model/address.model';
import { Link } from '../../domain/model/link.model';

class CreateUserProps {
    id: string;
    mode: 'admin' | 'self';
    profile?: UserProfileProps;
    detail?: UserAttributesProps;
}

@Injectable()
export class UpdateUserUseCase implements IUseCase<CreateUserProps, User> {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly eventEmitter: AppEventEmitter,
        private readonly auth0User: Auth0UserService,
    ) { }

    async execute(request: CreateUserProps): Promise<User> {
        // Check if user exists
        const existingUser = await this.userRepository.findById(request.id);
        if (!existingUser) {
            throw new BusinessException('User not exists with id ' + request.id);
        }
        if (request.mode === 'admin') {
            existingUser.updateAdmin(request.detail!);
        } else if (request.mode === 'self') {
            existingUser.updateUser(request.profile!);
        }

        // Save to repository
        const savedUser = await this.userRepository.update(existingUser.id, existingUser);

        if (existingUser.updateAuth) {
            await this.auth0User.updateUser(existingUser.authUserId!, existingUser);
        }

        // Emit domain events
        for (const event of existingUser.domainEvents) {
            this.eventEmitter.publish(event.constructor.name, event);
        }
        existingUser.clearEvents();

        return savedUser;
    }
}
