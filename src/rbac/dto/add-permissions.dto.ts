import { IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class AddPermissionsDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  permissionIds: number[];
}
