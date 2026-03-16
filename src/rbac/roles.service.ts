import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from '../rbac/entities/role.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AddPermissionsDto } from './dto/add-permissions.dto';
import { RolesFilterDto } from './dto/roles-filter.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { paginate } from '../common/utils/pagination.util';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  async create(
    createRoleDto: CreateRoleDto,
    actorUserId = 0,
    actorSnapshot: any = null,
    tenantSnapshot: any = null,
    ip: string = '127.0.0.1',
  ): Promise<Role> {
    const { permissionIds, ...rest } = createRoleDto;
    let permissions: Permission[] = [];

    if (permissionIds && permissionIds.length > 0) {
      permissions = await this.permissionsRepository.findBy({
        id: In(permissionIds),
      });
      if (permissions.length !== permissionIds.length) {
        throw new NotFoundException('Some permissions were not found');
      }
    }

    const role = this.rolesRepository.create({
      ...rest,
      permissions,
    });
    const savedRole = await this.rolesRepository.save(role);

    return savedRole;
  }

  async findAll(filterDto: RolesFilterDto): Promise<PaginatedResult<Role>> {
    const queryBuilder = this.rolesRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permissions');

    if (filterDto.isActive !== undefined) {
      queryBuilder.andWhere('role.isActive = :isActive', {
        isActive: filterDto.isActive,
      });
    }

    if (filterDto.name) {
      queryBuilder.andWhere('role.name ILIKE :name', {
        name: `%${filterDto.name}%`,
      });
    }

    return paginate(queryBuilder, filterDto, ['role.name', 'role.description']);
  }

  findAllList(): Promise<Role[]> {
    return this.rolesRepository.find({
      select: ['id', 'name'],
      where: [{ isActive: true }],
    });
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: [{ id }],
      relations: ['permissions'],
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async update(
    id: number,
    updateRoleDto: UpdateRoleDto,
    actorUserId = 0,
    actorSnapshot: any = null,
    tenantSnapshot: any = null,
    ip: string = '127.0.0.1',
  ): Promise<Role> {
    const role = await this.findOne(id);
    // Clone logic for simple objects without deep nested circular structures
    const oldValue = JSON.parse(JSON.stringify(role));

    const { permissionIds, ...rest } = updateRoleDto as any;

    if (permissionIds) {
      const permissions = await this.permissionsRepository.findBy({
        id: In(permissionIds),
      });
      if (permissions.length !== permissionIds.length) {
        throw new NotFoundException('Some permissions were not found');
      }
      role.permissions = permissions;
    }

    Object.assign(role, rest);
    const updatedRole = await this.rolesRepository.save(role);

    return updatedRole;
  }

  async setPermissions(
    id: number,
    addPermissionsDto: AddPermissionsDto,
    actorUserId = 0,
    actorSnapshot: any = null,
    tenantSnapshot: any = null,
    ip: string = '127.0.0.1',
  ): Promise<Role> {
    const role = await this.findOne(id);
    const oldValue = JSON.parse(JSON.stringify(role));
    const { permissionIds } = addPermissionsDto;

    if (permissionIds && permissionIds.length > 0) {
      const permissions = await this.permissionsRepository.findBy({
        id: In(permissionIds),
      });
      if (permissions.length !== permissionIds.length) {
        throw new NotFoundException('Some permissions were not found');
      }
      role.permissions = permissions;
    } else {
      role.permissions = [];
    }

    const updatedRole = await this.rolesRepository.save(role);

    return updatedRole;
  }

  async remove(
    id: number,
    actorUserId = 0,
    actorSnapshot: any = null,
    tenantSnapshot: any = null,
    ip: string = '127.0.0.1',
  ): Promise<void> {
    const role = await this.findOne(id);
    if (role.isStatic) {
      throw new BadRequestException('Cannot delete a static role.');
    }
    await this.rolesRepository.remove(role);
  }
}
