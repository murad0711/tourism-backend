import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AppSettingType } from '../entities/app-setting.entity';

export class CreateAppSettingDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsEnum(AppSettingType)
  type: AppSettingType;

  @IsOptional()
  @IsString()
  description?: string;
}
