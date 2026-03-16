import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { ApplicationFilterDto } from './dto/application-filter.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import {
  Application,
  ApplicationStatus,
  IdentityType,
  TouristType,
} from './entities/application.entity';

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

    const queryBuilder =
      this.applicationRepository.createQueryBuilder('application');

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

  async submit(id: number) {
    const application = await this.findOne(id);

    if (application.status !== ApplicationStatus.DRAFT) {
      throw new BadRequestException('Application is not in DRAFT status');
    }

    // Business Rule Validation: NID for Domestic, Passport for Foreign
    if (application.touristType === TouristType.DOMESTIC) {
      if (!application.nidPath) {
        throw new BadRequestException(
          'NID document is required for domestic tourists',
        );
      }
      if (application.identityType !== IdentityType.NID) {
        throw new BadRequestException(
          'Identity type must be NID for domestic tourists',
        );
      }
    } else if (application.touristType === TouristType.FOREIGN) {
      if (!application.passportPath) {
        throw new BadRequestException(
          'Passport document is required for foreign tourists',
        );
      }
      if (application.identityType !== IdentityType.PASSPORT) {
        throw new BadRequestException(
          'Identity type must be PASSPORT for foreign tourists',
        );
      }
    }

    if (!application.identityNumber) {
      throw new BadRequestException('Identity number is required');
    }

    application.status = ApplicationStatus.SUBMITTED;
    return this.applicationRepository.save(application);
  }

  async findMyHistory(user: User, filterDto: ApplicationFilterDto) {
    const { status, limit = 10, page = 1 } = filterDto;
    const skip = (page - 1) * limit;

    const queryBuilder =
      this.applicationRepository.createQueryBuilder('application');
    queryBuilder.where('application.touristId = :userId', { userId: user.id });

    if (status) {
      queryBuilder.andWhere('application.status = :status', { status });
    }

    queryBuilder
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

  async review(
    id: number,
    action: 'APPROVE' | 'REJECT' | 'REQUEST_RESUBMISSION',
    remarks?: string,
  ) {
    const application = await this.findOne(id);

    if (action === 'APPROVE') {
      application.status = ApplicationStatus.APPROVED;
    } else if (action === 'REJECT') {
      if (!remarks) {
        throw new BadRequestException('Remarks are required for rejection');
      }
      application.status = ApplicationStatus.REJECTED;
      application.adminRemarks = remarks;
    } else if (action === 'REQUEST_RESUBMISSION') {
      if (!remarks) {
        throw new BadRequestException(
          'Remarks are required for resubmission request',
        );
      }
      application.status = ApplicationStatus.RESUBMISSION_REQUESTED;
      application.adminRemarks = remarks;
    }

    return this.applicationRepository.save(application);
  }

  async remove(id: number) {
    const application = await this.findOne(id);
    if (application.status !== ApplicationStatus.DRAFT) {
      throw new BadRequestException('Only draft applications can be deleted');
    }
    return this.applicationRepository.remove(application);
  }
}
