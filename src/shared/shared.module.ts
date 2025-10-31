import { Module } from '@nestjs/common';
import { PrismaService } from './infrastructure/database/prisma.service';
import { Auth0Service } from './infrastructure/external/auth0/auth0.service';
import { DiscoveryModule } from '@nestjs/core';

@Module({
  providers: [PrismaService, Auth0Service],
  exports: [PrismaService, Auth0Service],
  imports: [DiscoveryModule],
})
export class SharedModule {}
