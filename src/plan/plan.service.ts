import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { paginate } from '../common/utils/pagination.util';
import { CreatePlanDto } from './dto/create-plan.dto';
import { PlanFilterDto } from './dto/plan-filter.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { Plan } from './entities/plan.entity';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Plan)
    private planRepository: Repository<Plan>,
  ) {}

  async findAll(filterDto: PlanFilterDto): Promise<PaginatedResult<Plan>> {
    const queryBuilder = this.planRepository.createQueryBuilder('plan');

    if (filterDto.type) {
      queryBuilder.andWhere('plan.type = :type', { type: filterDto.type });
    }

    if (filterDto.status) {
      queryBuilder.andWhere('plan.status = :status', {
        status: filterDto.status,
      });
    }

    if (filterDto.planName) {
      queryBuilder.andWhere('plan.planName ILIKE :planName', {
        planName: `%${filterDto.planName}%`,
      });
    }

    if (filterDto.startFromStart) {
      queryBuilder.andWhere('plan.startFrom >= :startFromStart', {
        startFromStart: filterDto.startFromStart,
      });
    }

    if (filterDto.startFromEnd) {
      queryBuilder.andWhere('plan.startFrom <= :startFromEnd', {
        startFromEnd: filterDto.startFromEnd,
      });
    }

    if (filterDto.expireOnStart) {
      queryBuilder.andWhere('plan.expireOn >= :expireOnStart', {
        expireOnStart: filterDto.expireOnStart,
      });
    }

    if (filterDto.expireOnEnd) {
      queryBuilder.andWhere('plan.expireOn <= :expireOnEnd', {
        expireOnEnd: filterDto.expireOnEnd,
      });
    }

    return paginate(queryBuilder, filterDto, ['plan.planName']);
  }

  async findOne(id: number): Promise<Plan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }
    return plan;
  }

  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    const plan = this.planRepository.create(createPlanDto);
    return this.planRepository.save(plan);
  }

  async update(id: number, updatePlanDto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.findOne(id);
    Object.assign(plan, updatePlanDto);
    return this.planRepository.save(plan);
  }

  async remove(id: number): Promise<void> {
    const plan = await this.findOne(id);
    await this.planRepository.remove(plan);
  }
}
