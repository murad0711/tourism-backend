import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolesModule } from './roles.module';
import { PermissionsModule } from './permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission]),
    RolesModule,
    PermissionsModule,
  ],
  exports: [RolesModule, PermissionsModule],
})
export class RbacModule {}
