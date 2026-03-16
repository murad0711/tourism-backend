import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from '../rbac/entities/role.entity';
import { Permission } from '../rbac/entities/permission.entity';
import { In, IsNull, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ROLE_EVENTS, AUDIT_EVENTS } from '../common/constants/events';

describe('RolesService', () => {
  let service: RolesService;
  let rolesRepository: Repository<Role>;
  let permissionsRepository: Repository<Permission>;
  let eventEmitter: EventEmitter2;

  const mockUser = {
    id: 'user-1',
    tenantId: 'tenant-1',
    roles: [],
    permissions: [],
  };

  const mockRole = {
    id: 'role-id',
    name: 'test-role',
    permissions: [
      { id: 'perm-1', slug: 'roles.create' },
      { id: 'perm-2', slug: 'roles.read' },
    ],
  } as Role;

  const mockPermissions = [
    { id: 'perm-3', slug: 'roles.update' },
    { id: 'perm-4', slug: 'roles.delete' },
  ] as Permission[];

  const mockRolesRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockPermissionsRepository = {
    findBy: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getRepositoryToken(Role),
          useValue: mockRolesRepository,
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionsRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    rolesRepository = module.get<Repository<Role>>(getRepositoryToken(Role));
    permissionsRepository = module.get<Repository<Permission>>(
      getRepositoryToken(Permission),
    );
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a role with tenantId', async () => {
      const createRoleDto = { name: 'new-role' };
      const tenantId = 'tenant-1';
      mockRolesRepository.create.mockReturnValue({
        ...createRoleDto,
        tenantId,
      });
      mockRolesRepository.save.mockImplementation((role) =>
        Promise.resolve(role),
      );

      const result = await service.create(createRoleDto as any, tenantId);

      expect(mockRolesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'new-role', tenantId }),
      );
      expect(result.tenantId).toBe(tenantId);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        ROLE_EVENTS.CREATED,
        expect.anything(),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        AUDIT_EVENTS.ROLE.CREATED,
        expect.anything(),
      );
    });
  });

  describe('setPermissions', () => {
    it('should replace existing permissions with new ones', async () => {
      mockRolesRepository.findOne.mockResolvedValue({ ...mockRole });
      mockPermissionsRepository.findBy.mockResolvedValue(mockPermissions);
      mockRolesRepository.save.mockImplementation((role) =>
        Promise.resolve(role),
      );

      const result = await service.setPermissions(
        'role-id',
        {
          permissionIds: ['perm-3', 'perm-4'],
        },
        'tenant-1',
      );

      expect(mockRolesRepository.findOne).toHaveBeenCalledWith({
        where: [{ id: 'role-id', tenantId: 'tenant-1' }],
        relations: ['permissions'],
      });
      expect(mockPermissionsRepository.findBy).toHaveBeenCalled();
      expect(result.permissions).toHaveLength(2);
      expect(result.permissions).toEqual(mockPermissions);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        ROLE_EVENTS.UPDATED,
        expect.anything(),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        AUDIT_EVENTS.ROLE.UPDATED,
        expect.anything(),
      );
    });

    it('should clear permissions if empty list is provided', async () => {
      mockRolesRepository.findOne.mockResolvedValue({ ...mockRole });
      mockRolesRepository.save.mockImplementation((role) =>
        Promise.resolve(role),
      );

      const result = await service.setPermissions(
        'role-id',
        {
          permissionIds: [],
        },
        'tenant-1',
      );

      expect(mockPermissionsRepository.findBy).not.toHaveBeenCalled();
      expect(result.permissions).toHaveLength(0);
    });

    it('should throw NotFoundException if some permissions are missing', async () => {
      mockRolesRepository.findOne.mockResolvedValue({ ...mockRole });
      mockPermissionsRepository.findBy.mockResolvedValue([mockPermissions[0]]); // Return only 1 of 2 requested

      await expect(
        service.setPermissions(
          'role-id',
          {
            permissionIds: ['perm-3', 'perm-4'],
          },
          'tenant-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });
    describe('findAll', () => {
      it('should filter by tenantId or null', async () => {
        const filterDto = { page: 1, limit: 10 };
        const tenantId = 'tenant-1';
        const mockQueryBuilder = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
          alias: 'role',
        };
        mockRolesRepository.createQueryBuilder = jest
          .fn()
          .mockReturnValue(mockQueryBuilder);

        await service.findAll(filterDto as any, tenantId);

        expect(mockQueryBuilder.where).toHaveBeenCalledWith(
          'role.tenantId = :tenantId',
          {
            tenantId,
          },
        );
      });
    });
  });
});
