import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as hashUtil from '../common/utils/hash.util';
import * as paginationUtil from '../common/utils/pagination.util';
import { EmailService } from '../email/email.service';
import { Role } from '../rbac/entities/role.entity';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRepository = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockRoleRepository = {
    findBy: jest.fn(),
  };

  const mockEmailService = {
    sendInvitationEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Role), useValue: mockRoleRepository },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    jest.spyOn(hashUtil, 'hashPassword').mockResolvedValue('hashed');
    jest.spyOn(paginationUtil, 'paginate').mockResolvedValue({
      results: [],
      page: 1,
      limit: 10,
      totalPages: 0,
      totalResults: 0,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should call paginate utility on query builder', async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQb);

      const res = await service.findAll({});
      expect(res.results).toEqual([]);
      expect(mockUserRepository.createQueryBuilder).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return user if found', async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({ id: 1 }),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQb);

      const res = await service.findOne(1);
      expect(res).toEqual({ id: 1 });
    });

    it('should throw NotFoundException if not found', async () => {
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQb);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should format dto and save user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({ id: 1, email: 't@t.com' });
      mockUserRepository.save.mockResolvedValue({ id: 1, email: 't@t.com' });

      const res = await service.create({
        firstName: 'F',
        lastName: 'L',
        email: 't@t.com',
        department: 'D',
        password: 'p',
      });

      expect(res.id).toBe(1);
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('should throw Conflict if email exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ id: 1 });

      await expect(
        service.create({
          firstName: 'F',
          lastName: 'L',
          email: 't@t.com',
          department: 'D',
          password: 'p',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should find and update user properties', async () => {
      const user = { id: 1, email: 'old@t.com' };
      // findOne uses query builder, so mock that
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQb);
      mockUserRepository.findOne.mockResolvedValue(null); // for email existing check
      mockUserRepository.save.mockResolvedValue({ ...user, firstName: 'New' });

      const res = await service.update(1, { firstName: 'New' });
      expect(res.firstName).toBe('New');
    });
  });

  describe('remove', () => {
    it('should find user and remove it', async () => {
      const user = { id: 1 };
      const mockQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      };
      mockUserRepository.createQueryBuilder.mockReturnValue(mockQb);

      await service.remove(1);
      expect(mockUserRepository.remove).toHaveBeenCalledWith(user);
    });
  });
});
