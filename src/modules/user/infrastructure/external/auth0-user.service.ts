import { Injectable, Logger } from '@nestjs/common';
import { Auth0Service } from '../../../../shared/infrastructure/external/auth0/auth0.service';
import { ThirdPartyException } from '../../../../shared/exceptions/third-party-exception';
import { LoginMethod, User, UserStatus } from '../../domain/model/user.model';
import { ManagementClient } from 'auth0';
import { UserMapper } from '../user.mapper';

export type Auth0User = Awaited<ReturnType<ManagementClient['users']['get']>>;

@Injectable()
export class Auth0UserService {
  private readonly logger = new Logger(Auth0UserService.name);

  constructor(private auth0Service: Auth0Service) {}

  async getUserByEmail(email: string): Promise<User[]> {
    try {
      const users: Auth0User[] =
        await this.auth0Service.client.users.listUsersByEmail({
          email: email,
        });
      return users.map((user) => UserMapper.toAuthUser(user));
    } catch (e) {
      this.logger.error(`Failed to get user by email ${email}: ${e}`);
      throw new ThirdPartyException('auth0', e as Error);
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const users: Auth0User[] = (await this.auth0Service.client.users.list())
        .data;
      return users.map((user) => UserMapper.toAuthUser(user));
    } catch (e) {
      this.logger.error(`Failed to get users: ${e}`);
      throw new ThirdPartyException('auth0', e as Error);
    }
  }

  async getUser(id: string): Promise<User> {
    try {
      const user = await this.auth0Service.client.users.get(id);
      return UserMapper.toAuthUser(user);
    } catch (e) {
      this.logger.error(`Failed to get user ${id}: ${e}`);
      throw new ThirdPartyException('auth0', e as Error);
    }
  }

  // async createUser(newUser: User, emailVerified: boolean): Promise<User> {
  //   try {
  //     for (const lm of newUser.loginMethod) {
  //       await this.auth0Service.client.users.create({
  //         email: newUser.email,
  //         connection: UserMapper.loginMethod2Connection(lm),
  //         given_name: newUser.firstName,
  //         family_name: newUser.lastName,
  //         name: newUser.fullName,
  //         picture: newUser.picture,
  //         user_metadata: {
  //           profile_id: newUser.id,
  //           active_user: newUser.status == UserStatus.ACTIVE,
  //           reset_password: true,
  //           profile_updated: newUser.isProfileCompleted,
  //         },
  //         password:
  //           lm == LoginMethod.PASSWORD ? newUser.createPassword() : undefined,
  //         email_verified: emailVerified,
  //       });
  //     }
  //     const users = await this.auth0Service.client.users.listUsersByEmail({
  //       email: newUser.email,
  //     });
  //     if (users.length > 0 && users.length == 1) return UserMapper.toAuthUser(users[0]);
  //     const primaryUser = users[0];
  //     for(let index = 1; index < users.length; index++){
  //       const user = users[index];
  //       await this.auth0Service.client
  //     }
  //   } catch (e) {
  //     this.logger.error(`Error creating Auth0 user:`, e);
  //     throw new ThirdPartyException('auth0', e as Error);
  //   }
  // }

  // async updateUser(id: string, user: Partial<User>): Promise<User> {
  //   try {
  //     const response = await this.managementClient.users.update(
  //       { id },
  //       { ...user },
  //     );
  //     return response.data;
  //   } catch (e) {
  //     this.logger.error(`Failed to update user ${id}: ${e.message}`, e.stack);
  //     throw new ThirdPartyException('Could not update user.', e);
  //   }
  // }

  // async deleteUser(id: string): Promise<void> {
  //   try {
  //     await this.managementClient.users.delete({ id });
  //   } catch (e) {
  //     this.logger.error(`Failed to delete user ${id}: ${e.message}`, e.stack);
  //     throw new ThirdPartyException('Could not delete user.', e);
  //   }
  // }

  // async assignRolesToUser(userId: string, roleIds: string[]): Promise<void> {
  //   try {
  //     await this.managementClient.users.assignRoles(
  //       { id: userId },
  //       { roles: roleIds },
  //     );
  //   } catch (e) {
  //     this.logger.error(
  //       `Failed to assign roles to user ${userId}: ${e.message}`,
  //       e.stack,
  //     );
  //     throw new ThirdPartyException('Could not assign roles to user.', e);
  //   }
  // }

  // async removeRolesFromUser(userId: string, roleIds: string[]): Promise<void> {
  //   try {
  //     await this.managementClient.users.removeRoles(
  //       { id: userId },
  //       { roles: roleIds },
  //     );
  //   } catch (e) {
  //     this.logger.error(
  //       `Failed to remove roles from user ${userId}: ${e.message}`,
  //       e.stack,
  //     );
  //     throw new ThirdPartyException('Could not remove roles from user.', e);
  //   }
  // }

  // async assignUsersToRole(roleId: string, userIds: string[]): Promise<void> {
  //   try {
  //     await this.managementClient.roles.assignUsers(
  //       { id: roleId },
  //       { users: userIds },
  //     );
  //   } catch (e) {
  //     this.logger.error(
  //       `Failed to assign users to role ${roleId}: ${e.message}`,
  //       e.stack,
  //     );
  //     throw new ThirdPartyException('Could not assign users to role.', e);
  //   }
  // }

  // async getRoles(): Promise<RolesResponse['roles']> {
  //   try {
  //     const response = await this.managementClient.roles.getAll();
  //     return response.data.roles;
  //   } catch (e) {
  //     this.logger.error(`Failed to get roles: ${e.message}`, e.stack);
  //     throw new ThirdPartyException('Could not fetch roles.', e);
  //   }
  // }

  // async loginWithUser(options: LoginWithPasswordOptions) {
  //   try {
  //     const response =
  //       await this.authenticationClient.passwordless.signIn(options);
  //     return response.data;
  //   } catch (e) {
  //     this.logger.error(`Failed to login user: ${e.message}`, e.stack);
  //     throw new ThirdPartyException('Could not login user.', e);
  //   }
  // }

  // async getScopes(identifier: string): Promise<Scope[]> {
  //   try {
  //     // The Node SDK doesn't have a direct `getByAudience` method.
  //     // We list all and find the one we need.
  //     const response = await this.managementClient.resourceServers.getAll();
  //     const resourceServer = response.data.find(
  //       (rs) => rs.identifier === identifier,
  //     );
  //     if (!resourceServer) {
  //       throw new Error(
  //         `Resource server with identifier ${identifier} not found.`,
  //       );
  //     }
  //     return resourceServer.scopes;
  //   } catch (e) {
  //     this.logger.error(
  //       `Failed to get scopes for ${identifier}: ${e.message}`,
  //       e.stack,
  //     );
  //     throw new ThirdPartyException('Could not fetch scopes.', e);
  //   }
  // }

  // async linkIdentity(
  //   primaryId: string,
  //   secondaryId: string,
  //   provider: string,
  //   connectionId?: string,
  // ): Promise<void> {
  //   try {
  //     await this.managementClient.users.link(
  //       { id: primaryId },
  //       { user_id: secondaryId, provider, connection_id: connectionId },
  //     );
  //   } catch (e) {
  //     this.logger.error(
  //       `Failed to link identity for user ${primaryId}: ${e.message}`,
  //       e.stack,
  //     );
  //     throw new ThirdPartyException('Could not link user identity.', e);
  //   }
  // }

  // async unlinkIdentity(
  //   primaryId: string,
  //   provider: string,
  //   secondaryUserId: string,
  // ): Promise<void> {
  //   try {
  //     await this.managementClient.userBlocks.unblock({ id: primaryId });
  //   } catch (e) {
  //     this.logger.error(
  //       `Failed to unlink identity for user ${primaryId}: ${e.message}`,
  //       e.stack,
  //     );
  //     throw new ThirdPartyException('Could not unlink user identity.', e);
  //   }
  // }

}
