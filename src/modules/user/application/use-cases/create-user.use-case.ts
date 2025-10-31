import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { User } from '../../domain/model/user.model';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { CreateUserDto, UserDto } from '../dto/create-user.dto';
import { PhoneNumber } from '../../domain/model/phone-number.vo';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { toUserDTO } from '../dto/mapper';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CreateUserUseCase implements IUseCase<CreateUserDto, UserDto> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly eventPublisher: EventEmitter2,
  ) {}

  async execute(request: CreateUserDto): Promise<UserDto> {
    // Check if user exists
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new BusinessException('User with this email already exists');
    }

    // Create domain entity
    const user = User.create({
      email: request.email,
      firstName: request.firstName,
      lastName: request.lastName,
      number: PhoneNumber.create(
        request.phoneNumber.code,
        request.phoneNumber.number,
      ),
      isTemporary: request.isTemporary || false,
    });

    // Save to repository
    const savedUser = await this.userRepository.create(user);

    // Emit domain events
    for (const event of user.domainEvents) {
      await this.eventPublisher.emitAsync(event.constructor.name, event);
    }
    user.clearEvents();

    return toUserDTO(savedUser);
  }
}
