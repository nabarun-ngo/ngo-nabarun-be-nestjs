import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Auth0User } from "src/modules/user/infrastructure/external/auth0-user.service";

export const CurrentUser = createParamDecorator(
  (data: keyof Auth0User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

export const UserPermissions = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.permissions || [];
  },
);
