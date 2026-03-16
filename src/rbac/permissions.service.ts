import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../rbac/entities/permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const { parentId, ...rest } = createPermissionDto;
    let parent: Permission | null = null;

    if (parentId) {
      parent = await this.permissionsRepository.findOne({
        where: { id: parentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent permission not found');
      }
    }

    const permission = this.permissionsRepository.create({
      ...rest,
      parentId: parentId || null,
    });
    return this.permissionsRepository.save(permission);
  }

  findAll(): Promise<Permission[]> {
    return this.permissionsRepository.find();
  }

  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionsRepository.findOne({
      where: { id },
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    return permission;
  }

  async update(
    id: number,
    updatePermissionDto: UpdatePermissionDto,
  ): Promise<Permission> {
    const permission = await this.findOne(id);
    const { parentId, ...rest } = updatePermissionDto as any;

    if (parentId) {
      const parent = await this.permissionsRepository.findOne({
        where: { id: parentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent permission not found');
      }
      permission.parentId = parentId;
    }

    Object.assign(permission, rest);
    return this.permissionsRepository.save(permission);
  }

  async remove(id: number): Promise<void> {
    const permission = await this.findOne(id);
    await this.permissionsRepository.remove(permission);
  }
}
