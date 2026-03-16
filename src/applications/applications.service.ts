import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ApplicationFilterDto } from './dto/application-filter.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { Application } from './entities/application.entity';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
  ) {}

  async create(createApplicationDto: CreateApplicationDto, user: User) {
    const application = this.applicationRepository.create({
      ...createApplicationDto,
      tourist: user,
    });
    return this.applicationRepository.save(application);
  }

  async findAll(filterDto: ApplicationFilterDto) {
    const { status, limit = 10, page = 1 } = filterDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.applicationRepository.createQueryBuilder('application');

    if (status) {
      queryBuilder.andWhere('application.status = :status', { status });
    }

    queryBuilder
      .leftJoinAndSelect('application.tourist', 'tourist')
      .skip(skip)
      .take(limit)
      .orderBy('application.createdAt', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number) {
    const application = await this.applicationRepository.findOne({
      where: { id },
    });
    if (!application) {
      throw new NotFoundException(`Application #${id} not found`);
    }
    return application;
  }

  async update(id: number, updateApplicationDto: UpdateApplicationDto) {
    const application = await this.findOne(id);
    this.applicationRepository.merge(application, updateApplicationDto);
    return this.applicationRepository.save(application);
  }

  async remove(id: number) {
    const application = await this.findOne(id);
    return this.applicationRepository.remove(application);
  }
}
