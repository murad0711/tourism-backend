import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PlanStatus, PlanType } from '../entities/plan.entity';

export class PlanFilterDto extends PaginationDto {
  @IsOptional()
  @IsEnum(PlanType)
  type?: PlanType;

  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;

  @IsOptional()
  @IsString()
  planName?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startFromStart?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startFromEnd?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expireOnStart?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expireOnEnd?: Date;
}
