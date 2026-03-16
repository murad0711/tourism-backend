import { Test, TestingModule } from '@nestjs/testing';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { AddPermissionsDto } from './dto/add-permissions.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

describe('RolesController', () => {
  let controller: RolesController;
  let service: RolesService;

  const mockRolesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    setPermissions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a role', async () => {
      const createRoleDto: CreateRoleDto = {
        name: 'admin',
        description: 'Admin role',
      };
      const expectedResult = { id: '1', ...createRoleDto, permissions: [] };
      const mockUser = { id: 'user-1', tenantId: 'tenant-1' };
      mockRolesService.create.mockResolvedValue(expectedResult);

      expect(
        await controller.create(createRoleDto, mockUser as any, '127.0.0.1'),
      ).toEqual(expectedResult);
      expect(mockRolesService.create).toHaveBeenCalledWith(
        createRoleDto,
        'tenant-1',
        'user-1',
        mockUser,
        null,
        '127.0.0.1',
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of roles', async () => {
      const expectedResult = [
        { id: '1', name: 'admin', description: 'Admin role', permissions: [] },
      ];
      const mockUser = { id: 'user-1', tenantId: 'tenant-1' };
      mockRolesService.findAll.mockResolvedValue(expectedResult);

      expect(await controller.findAll({}, mockUser as any)).toEqual(
        expectedResult,
      );
      expect(mockRolesService.findAll).toHaveBeenCalledWith({}, 'tenant-1');
    });
  });

  describe('findOne', () => {
    it('should return a single role', async () => {
      const id = '1';
      const expectedResult = {
        id,
        name: 'admin',
        description: 'Admin role',
        permissions: [],
      };
      const mockUser = { id: 'user-1', tenantId: 'tenant-1' };
      mockRolesService.findOne.mockResolvedValue(expectedResult);

      expect(await controller.findOne(id, mockUser as any)).toEqual(
        expectedResult,
      );
      expect(mockRolesService.findOne).toHaveBeenCalledWith(id, 'tenant-1');
    });
  });

  describe('update', () => {
    it('should update a role', async () => {
      const id = '1';
      const updateRoleDto: UpdateRoleDto = { name: 'superadmin' };
      const expectedResult = {
        id,
        name: 'superadmin',
        description: 'Admin role',
        permissions: [],
      };
      const mockUser = { id: 'user-1', tenantId: 'tenant-1' };
      mockRolesService.update.mockResolvedValue(expectedResult);

      expect(
        await controller.update(
          id,
          updateRoleDto,
          mockUser as any,
          '127.0.0.1',
        ),
      ).toEqual(expectedResult);
      expect(mockRolesService.update).toHaveBeenCalledWith(
        id,
        updateRoleDto,
        'tenant-1',
        'user-1',
        mockUser,
        null,
        '127.0.0.1',
      );
    });
  });

  describe('remove', () => {
    it('should remove a role', async () => {
      const id = '1';
      const mockUser = { id: 'user-1', tenantId: 'tenant-1' };
      mockRolesService.remove.mockResolvedValue(undefined);

      expect(
        await controller.remove(id, mockUser as any, '127.0.0.1'),
      ).toBeUndefined();
      expect(mockRolesService.remove).toHaveBeenCalledWith(
        id,
        'tenant-1',
        'user-1',
        mockUser,
        null,
        '127.0.0.1',
      );
    });
  });

  describe('setPermissions', () => {
    it('should set permissions for a role', async () => {
      const id = '1';
      const addPermissionsDto: AddPermissionsDto = {
        permissionIds: ['perm1', 'perm2'],
      };
      const expectedResult = {
        id,
        name: 'admin',
        description: 'Admin role',
        permissions: [
          { id: 'perm1', name: 'read' },
          { id: 'perm2', name: 'write' },
        ],
      };
      const mockUser = { id: 'user-1', tenantId: 'tenant-1' };
      mockRolesService.setPermissions = jest
        .fn()
        .mockResolvedValue(expectedResult);

      expect(
        await controller.setPermissions(
          id,
          addPermissionsDto,
          mockUser as any,
          '127.0.0.1',
        ),
      ).toEqual(expectedResult);
      expect(mockRolesService.setPermissions).toHaveBeenCalledWith(
        id,
        addPermissionsDto,
        'tenant-1',
        'user-1',
        mockUser,
        null,
        '127.0.0.1',
      );
    });
  });
});
