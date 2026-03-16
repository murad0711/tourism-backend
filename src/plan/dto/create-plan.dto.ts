import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PlanStatus, PlanType } from '../entities/plan.entity';

export class CreatePlanDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsString()
  @IsNotEmpty()
  planName: string;

  @IsOptional()
  @IsString()
  subHeading?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsDate()
  @Type(() => Date)
  startFrom: Date;

  @IsDate()
  @Type(() => Date)
  expireOn: Date;

  @IsOptional()
  @IsString()
  backgroundImageUrl?: string;

  @IsOptional()
  @Type(() => Object)
  media?: object;

  @IsEnum(PlanType)
  type: PlanType;

  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;
}
