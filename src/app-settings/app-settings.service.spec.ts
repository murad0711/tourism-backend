import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSettingsService } from './app-settings.service';
import { AppSetting, AppSettingType } from './entities/app-setting.entity';

describe('AppSettingsService', () => {
  let service: AppSettingsService;
  let repository: Repository<AppSetting>;

  const mockSetting: AppSetting = {
    id: 1,
    key: 'web-profile-image',
    value: 'https://example.com/img.png',
    type: AppSettingType.IMAGE,
    description: 'Web profile image',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppSettingsService,
        {
          provide: getRepositoryToken(AppSetting),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AppSettingsService>(AppSettingsService);
    repository = module.get<Repository<AppSetting>>(
      getRepositoryToken(AppSetting),
    );
    jest.clearAllMocks();
  });

  describe('findByKey', () => {
    it('should return a setting by key', async () => {
      mockRepository.findOne.mockResolvedValue(mockSetting);

      const result = await service.findByKey('web-profile-image');

      expect(result).toEqual(mockSetting);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { key: 'web-profile-image' },
      });
    });

    it('should throw NotFoundException if key not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findByKey('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('upsert', () => {
    const dto = {
      key: 'web-profile-image',
      value: 'https://example.com/new.png',
      type: AppSettingType.IMAGE,
      description: 'Updated image',
    };

    it('should update an existing setting', async () => {
      const existingSetting = { ...mockSetting };
      mockRepository.findOne.mockResolvedValue(existingSetting);
      mockRepository.save.mockResolvedValue({ ...existingSetting, ...dto });

      const result = await service.upsert(dto);

      expect(result.value).toBe(dto.value);
      expect(mockRepository.save).toHaveBeenCalled();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('should create a new setting if key does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(dto);
      mockRepository.save.mockResolvedValue({ id: 2, ...dto });

      const result = await service.upsert(dto);

      expect(result.id).toBe(2);
      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
});
