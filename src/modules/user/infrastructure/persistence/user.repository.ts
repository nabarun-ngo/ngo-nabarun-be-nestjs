import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/model/user.model';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}
  async findById(id: string): Promise<User | null> {
    var user  = await this.prisma.userProfile.findUnique({
      where: { id : id},
    });
    return user? User.reconstitute(
      user.id,
      user.firstName,
      user.email,
      user.isPublic!,
      user.createdAt,
      user.updatedAt,
    ) : null;

  }
  findByEmail(email: string): Promise<User | null> {
    throw new Error('Method not implemented.');
  }
  save(user: User): Promise<User> {
    throw new Error('Method not implemented.');
  }
  delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  findAll(): Promise<User[]> {
    throw new Error('Method not implemented.');
  }

}