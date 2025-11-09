import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { User, UserStatus } from '../../domain/model/user.model';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { PhoneNumber } from '../../domain/model/phone-number.vo';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Auth0UserService } from '../../infrastructure/external/auth0-user.service';
import { Role } from '../../domain/model/role.model';
import { UserMetadataService } from '../../infrastructure/external/user-metadata.service';

class AssignUserRolesProps {
    userId: string;
    newRoles: Role[];
}

@Injectable()
export class AssignRoleUseCase implements IUseCase<AssignUserRolesProps, void> {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly metadataService: UserMetadataService,
        private readonly auth0UserService: Auth0UserService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    async execute(request: AssignUserRolesProps): Promise<void> {

        const user = await this.userRepository.findById(request.userId);
        if (!user) {
            throw new Error(`User with id ${request.userId} not found`);
        }
        const defaultRole = await this.metadataService.getDefaultRoles();
        const allRoles = await this.auth0UserService.getRoles();
        const roleRecord: Record<string, string> = Object.fromEntries(
            allRoles.map(role => [role.authRoleCode, role.id])
        );

        const { toAdd, toRemove } = user?.updateRoles(request.newRoles, defaultRole);
        const roleIdsToAdd = toAdd?.map(role => roleRecord[role.authRoleCode])!;
        const roleIdsToRemove = toRemove?.map(role => roleRecord[role.authRoleCode])!;

        if (roleIdsToAdd?.length > 0) {
            await this.auth0UserService.assignRolesToUser(user.authUserId!, roleIdsToAdd);
        }

        if (roleIdsToRemove?.length > 0) {
            await this.auth0UserService.removeRolesFromUser(user.authUserId!, roleIdsToRemove!)
        }

        if (roleIdsToAdd?.length > 0 || roleIdsToRemove?.length > 0) {
            await this.userRepository.updateRoles(user?.id!, user.getRoles() as Role[]);

        }

       // Emit domain events
        for (const event of user.domainEvents) {
            this.eventEmitter.emit(event.constructor.name, event);
        }
        user.clearEvents();

        
    }
}
