import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { AppSettingsService } from './app-settings.service';
import { CreateAppSettingDto } from './dto/create-app-setting.dto';

@Controller('app-settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AppSettingsController {
  constructor(private readonly appSettingsService: AppSettingsService) {}

  @Public()
  @Get(':key')
  findByKey(@Param('key') key: string) {
    return this.appSettingsService.findByKey(key);
  }

  @Public()
  @Get(':key/raw')
  async getValueRaw(@Param('key') key: string) {
    const setting = await this.appSettingsService.findByKey(key);
    return setting.value;
  }

  @Post()
  @RequirePermissions('app_settings.create')
  store(@Body() createAppSettingDto: CreateAppSettingDto) {
    return this.appSettingsService.upsert(createAppSettingDto);
  }
}
