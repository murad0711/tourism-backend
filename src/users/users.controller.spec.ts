import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call usersService.findAll with filterDto', async () => {
      const filterDto = { page: 1, limit: 10 };
      mockUsersService.findAll.mockResolvedValue({
        results: [],
        page: 1,
        limit: 10,
        totalPages: 0,
        totalResults: 0,
      });

      const result = await controller.findAll(filterDto);

      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual({
        results: [],
        page: 1,
        limit: 10,
        totalPages: 0,
        totalResults: 0,
      });
    });
  });

  describe('findOne', () => {
    it('should call usersService.findOne', async () => {
      const id = 1;
      mockUsersService.findOne.mockResolvedValue({ id });

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual({ id });
    });
  });

  describe('create', () => {
    it('should call usersService.create', async () => {
      const createDto = {
        firstName: 'Test',
        lastName: 'User',
        email: 't@t.com',
        department: 'D',
        password: 'P',
      };
      mockUsersService.create.mockResolvedValue({ id: 1, ...createDto });

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual({ id: 1, ...createDto });
    });
  });

  describe('update', () => {
    it('should call usersService.update', async () => {
      const id = 1;
      const updateDto = { firstName: 'Updated' };
      mockUsersService.update.mockResolvedValue({ id, ...updateDto });

      const result = await controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(id, updateDto);
      expect(result).toEqual({ id, ...updateDto });
    });
  });

  describe('remove', () => {
    it('should call usersService.remove', async () => {
      const id = 1;
      mockUsersService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toBeUndefined();
    });
  });
});
