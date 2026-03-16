import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAppSettingDto } from './dto/create-app-setting.dto';
import { AppSetting } from './entities/app-setting.entity';

@Injectable()
export class AppSettingsService {
  constructor(
    @InjectRepository(AppSetting)
    private appSettingRepository: Repository<AppSetting>,
  ) {}

  async findByKey(key: string): Promise<AppSetting> {
    const setting = await this.appSettingRepository.findOne({ where: { key } });
    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }
    return setting;
  }

  async upsert(dto: CreateAppSettingDto): Promise<AppSetting> {
    const existing = await this.appSettingRepository.findOne({
      where: { key: dto.key },
    });

    if (existing) {
      Object.assign(existing, dto);
      return this.appSettingRepository.save(existing);
    }

    const setting = this.appSettingRepository.create(dto);
    return this.appSettingRepository.save(setting);
  }
}
