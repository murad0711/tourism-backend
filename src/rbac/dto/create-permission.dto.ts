import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsNumber()
  parentId?: number;
}
