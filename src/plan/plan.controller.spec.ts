import { Test, TestingModule } from '@nestjs/testing';
import { PlanType } from './entities/plan.entity';
import { PlanController } from './plan.controller';
import { PlanService } from './plan.service';

describe('PlanController', () => {
  let controller: PlanController;
  let service: PlanService;

  const mockPlanService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanController],
      providers: [
        {
          provide: PlanService,
          useValue: mockPlanService,
        },
      ],
    }).compile();

    controller = module.get<PlanController>(PlanController);
    service = module.get<PlanService>(PlanService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call service.findAll and return results', async () => {
      const filterDto = { page: 1, limit: 10, type: PlanType.PREPAID };
      const expectedResult = {
        results: [],
        page: 1,
        limit: 10,
        totalPages: 0,
        totalResults: 0,
      };
      mockPlanService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(filterDto as any);

      expect(service.findAll).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne and return a plan', async () => {
      const plan = { id: 1, planName: 'Test' };
      mockPlanService.findOne.mockResolvedValue(plan);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(plan);
    });
  });

  describe('create', () => {
    it('should call service.create and return created plan', async () => {
      const createDto = { planName: 'New', price: 10, type: PlanType.PREPAID };
      const createdPlan = { id: 1, ...createDto };
      mockPlanService.create.mockResolvedValue(createdPlan);

      const result = await controller.create(createDto as any);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(createdPlan);
    });
  });

  describe('update', () => {
    it('should call service.update and return updated plan', async () => {
      const updateDto = { planName: 'Updated' };
      const updatedPlan = { id: 1, planName: 'Updated' };
      mockPlanService.update.mockResolvedValue(updatedPlan);

      const result = await controller.update(1, updateDto);

      expect(service.update).toHaveBeenCalledWith(1, updateDto);
      expect(result).toEqual(updatedPlan);
    });
  });

  describe('remove', () => {
    it('should call service.remove', async () => {
      mockPlanService.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
