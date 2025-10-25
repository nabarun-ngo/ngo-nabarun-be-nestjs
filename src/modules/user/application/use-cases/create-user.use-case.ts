import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import { User } from '../../domain/model/user.model';
import  {  USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { CreateUserDto, CreateUserResponseDto } from '../dto/create-user.dto';
import { randomUUID } from 'crypto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class CreateUserUseCase implements IUseCase<CreateUserDto, CreateUserResponseDto> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: CreateUserDto): Promise<CreateUserResponseDto> {
    // Check if user exists
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create domain entity
    const user = User.create({
      email: request.email,
      firstName:  request.firstName,
      lastName: request.lastName,
      number: request.phoneNumber,
      isTemporary: request.isTemporary || false,
    });

    // Save to repository
    const savedUser = await this.userRepository.save(user);

    // Emit domain events
    for (const event of user.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    user.clearEvents();

    return {
      id: savedUser.id,
      name: '',
      email: '',
      createdAt: savedUser.createdAt,
    };
  }
}