import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Ip,
  ParseIntPipe,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AddPermissionsDto } from './dto/add-permissions.dto';
import { RolesFilterDto } from './dto/roles-filter.dto';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermissions('roles.manage', 'roles.create')
  create(
    @Body() createRoleDto: CreateRoleDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return this.rolesService.create(createRoleDto, user.id, user, null, ip);
  }

  @Get()
  @RequirePermissions('roles.manage', 'roles.read')
  findAll(@Query() filterDto: RolesFilterDto) {
    return this.rolesService.findAll(filterDto);
  }

  @Get('list')
  @RequirePermissions('roles.manage', 'roles.read')
  findAllList() {
    return this.rolesService.findAllList();
  }

  @Get(':id')
  @RequirePermissions('roles.manage', 'roles.read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('roles.manage', 'roles.update')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return this.rolesService.update(id, updateRoleDto, user.id, user, null, ip);
  }

  @Delete(':id')
  @RequirePermissions('roles.manage', 'roles.delete')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return this.rolesService.remove(id, user.id, user, null, ip);
  }

  @Post(':id/permissions')
  @RequirePermissions('roles.manage', 'roles.assign-permission')
  setPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() addPermissionDto: AddPermissionsDto,
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    return this.rolesService.setPermissions(
      id,
      addPermissionDto,
      user.id,
      user,
      null,
      ip,
    );
  }
}
