
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const REQUIRE_ALL_KEY = 'requireAll';

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const RequireAllPermissions = (...permissions: string[]) : MethodDecorator => {
  return (target, key, descriptor) => {
    SetMetadata(PERMISSIONS_KEY, permissions)(target, key, descriptor);
    SetMetadata(REQUIRE_ALL_KEY, true)(target, key, descriptor);
  };
};


