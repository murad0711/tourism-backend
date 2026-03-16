import { Test, TestingModule } from '@nestjs/testing';
import { AppSettingsController } from './app-settings.controller';
import { AppSettingsService } from './app-settings.service';
import { AppSetting, AppSettingType } from './entities/app-setting.entity';

describe('AppSettingsController', () => {
  let controller: AppSettingsController;
  let service: AppSettingsService;

  const mockSetting: AppSetting = {
    id: 1,
    key: 'web-profile-image',
    value: 'https://example.com/img.png',
    type: AppSettingType.IMAGE,
    description: 'Web profile image',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockService = {
    findByKey: jest.fn().mockResolvedValue(mockSetting),
    upsert: jest.fn().mockResolvedValue(mockSetting),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppSettingsController],
      providers: [
        {
          provide: AppSettingsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<AppSettingsController>(AppSettingsController);
    service = module.get<AppSettingsService>(AppSettingsService);
    jest.clearAllMocks();
  });

  describe('findByKey', () => {
    it('should return a setting by key', async () => {
      mockService.findByKey.mockResolvedValue(mockSetting);

      const result = await controller.findByKey('web-profile-image');

      expect(result).toEqual(mockSetting);
      expect(mockService.findByKey).toHaveBeenCalledWith('web-profile-image');
    });
  });

  describe('getValueRaw', () => {
    it('should return raw value by key', async () => {
      mockService.findByKey.mockResolvedValue(mockSetting);

      const result = await controller.getValueRaw('web-profile-image');

      expect(result).toBe(mockSetting.value);
      expect(mockService.findByKey).toHaveBeenCalledWith('web-profile-image');
    });
  });

  describe('store', () => {
    it('should create/update a setting', async () => {
      const dto = {
        key: 'web-profile-image',
        value: 'https://example.com/img.png',
        type: AppSettingType.IMAGE,
      };
      mockService.upsert.mockResolvedValue(mockSetting);

      const result = await controller.store(dto);

      expect(result).toEqual(mockSetting);
      expect(mockService.upsert).toHaveBeenCalledWith(dto);
    });
  });
});
