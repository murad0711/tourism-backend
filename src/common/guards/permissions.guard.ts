import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    const hasPermission = () =>
      requiredPermissions.every((permission) =>
        this.checkPermission(user as AuthenticatedUser, permission),
      );

    if (!hasPermission()) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }

  private checkPermission(
    user: AuthenticatedUser,
    permissionSlug: string,
  ): boolean {
    if (!user.permissions) return false;
    return user.permissions.includes(permissionSlug);
  }
}
