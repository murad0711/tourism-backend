import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as paginationUtil from '../common/utils/pagination.util';
import { Plan, PlanStatus, PlanType } from './entities/plan.entity';
import { PlanService } from './plan.service';

describe('PlanService', () => {
  let service: PlanService;
  let repository: Repository<Plan>;

  const mockPlanRepository = {
    createQueryBuilder: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanService,
        {
          provide: getRepositoryToken(Plan),
          useValue: mockPlanRepository,
        },
      ],
    }).compile();

    service = module.get<PlanService>(PlanService);
    repository = module.get<Repository<Plan>>(getRepositoryToken(Plan));

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
    it('should call paginate and return results', async () => {
      const mockQb = {
        andWhere: jest.fn().mockReturnThis(),
      };
      mockPlanRepository.createQueryBuilder.mockReturnValue(mockQb);

      const filterDto = {
        type: PlanType.PREPAID,
        status: PlanStatus.ACTIVE,
        planName: 'test',
        startFromStart: new Date(),
        startFromEnd: new Date(),
        expireOnStart: new Date(),
        expireOnEnd: new Date(),
      };

      const result = await service.findAll(filterDto);

      expect(mockPlanRepository.createQueryBuilder).toHaveBeenCalledWith(
        'plan',
      );
      expect(mockQb.andWhere).toHaveBeenCalledTimes(7); // type, status, planName, and 4 date range filters
      expect(result.results).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a plan if found', async () => {
      const plan = { id: 1, planName: 'Test Plan' };
      mockPlanRepository.findOne.mockResolvedValue(plan);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(plan);
    });

    it('should throw NotFoundException if plan not found', async () => {
      mockPlanRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and save a new plan', async () => {
      const createDto = {
        planName: 'New Plan',
        price: 9.99,
        type: PlanType.POSTPAID,
        startFrom: new Date(),
        expireOn: new Date(),
      };
      const savedPlan = { id: 1, ...createDto };
      mockPlanRepository.create.mockReturnValue(savedPlan);
      mockPlanRepository.save.mockResolvedValue(savedPlan);

      const result = await service.create(createDto as any);

      expect(mockPlanRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockPlanRepository.save).toHaveBeenCalledWith(savedPlan);
      expect(result).toEqual(savedPlan);
    });
  });

  describe('update', () => {
    it('should update and save a plan', async () => {
      const existingPlan = { id: 1, planName: 'Old Name' };
      const updateDto = { planName: 'New Name' };
      const updatedPlan = { ...existingPlan, ...updateDto };

      mockPlanRepository.findOne.mockResolvedValue(existingPlan);
      mockPlanRepository.save.mockResolvedValue(updatedPlan);

      const result = await service.update(1, updateDto);

      expect(mockPlanRepository.save).toHaveBeenCalled();
      expect(result.planName).toBe('New Name');
    });
  });

  describe('remove', () => {
    it('should remove a plan', async () => {
      const plan = { id: 1 };
      mockPlanRepository.findOne.mockResolvedValue(plan);
      mockPlanRepository.remove.mockResolvedValue(undefined);

      await service.remove(1);

      expect(mockPlanRepository.remove).toHaveBeenCalledWith(plan);
    });
  });
});
