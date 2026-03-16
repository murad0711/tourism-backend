import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { IdentityType, TouristType } from '../entities/application.entity';

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  touristName: string;

  @IsString()
  @IsNotEmpty()
  mobileNumber: string;

  @IsString()
  @IsOptional()
  guardianName?: string;

  @IsString()
  @IsOptional()
  guardianMobile?: string;

  @IsString()
  @IsNotEmpty()
  permanentAddress: string;

  @IsString()
  @IsNotEmpty()
  presentAddress: string;

  @IsString()
  @IsNotEmpty()
  occupation: string;

  @IsString()
  @IsNotEmpty()
  placeOfOrigin: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  arrivalDate: Date;

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  departureDate: Date;

  @IsEnum(TouristType)
  @IsOptional()
  touristType?: TouristType;

  @IsEnum(IdentityType)
  @IsOptional()
  identityType?: IdentityType;

  @IsString()
  @IsOptional()
  identityNumber?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  numberOfVisitors?: number;
}
