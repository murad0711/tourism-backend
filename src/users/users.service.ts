import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { hashPassword } from '../common/utils/hash.util';
import { paginate } from '../common/utils/pagination.util';
import { EmailService } from '../email/email.service';
import { Role } from '../rbac/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersFilterDto } from './dto/users-filter.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    private emailService: EmailService,
  ) {}

  async findAll(filterDto: UsersFilterDto): Promise<PaginatedResult<User>> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles');

    if (filterDto.isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', {
        isActive: filterDto.isActive,
      });
    }

    if (filterDto.role) {
      queryBuilder.andWhere('roles.name = :role', { role: filterDto.role });
    }

    if (filterDto.name) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :name OR user.lastName ILIKE :name)',
        { name: `%${filterDto.name}%` },
      );
    }

    if (filterDto.email) {
      queryBuilder.andWhere('user.email ILIKE :email', {
        email: `%${filterDto.email}%`,
      });
    }

    if (filterDto.department) {
      queryBuilder.andWhere('user.department ILIKE :department', {
        department: `%${filterDto.department}%`,
      });
    }

    return paginate(queryBuilder, filterDto, [
      'user.firstName',
      'user.lastName',
      'user.email',
    ]);
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .where('user.id = :id', { id })
      .getOne();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, roles: roleIds, ...otherDetails } = createUserDto;

    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await hashPassword(password);

    let roles: Role[] = [];
    if (roleIds && roleIds.length > 0) {
      roles = await this.rolesRepository.findBy({
        id: In(roleIds),
      });

      if (roles.length !== roleIds.length) {
        throw new NotFoundException('Some roles were not found');
      }
    }

    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      ...otherDetails,
      roles,
      invitationSentAt: new Date(),
    });

    const savedUser = await this.usersRepository.save(user);

    // Send invitation email in the background
    this.emailService
      .sendInvitationEmail(email, otherDetails.firstName, password)
      .catch((err) => {
        console.error(`Failed to send invitation email to ${email}:`, err);
      });

    return savedUser;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    const { roles: roleIds, email, password, ...otherUpdates } = updateUserDto;

    if (roleIds) {
      const roles = await this.rolesRepository.findBy({
        id: In(roleIds),
      });

      if (roles.length !== roleIds.length) {
        throw new NotFoundException('Some roles were not found');
      }
      user.roles = roles;
    }

    if (email && email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email },
      });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
      user.email = email;
    }

    if (password) {
      user.password = await hashPassword(password);
    }

    Object.assign(user, otherUpdates);
    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }
}
