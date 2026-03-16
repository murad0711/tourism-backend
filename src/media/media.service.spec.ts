import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from './entities/media.entity';
import { MediaService } from './media.service';

describe('MediaService', () => {
  let service: MediaService;
  let repository: Repository<Media>;

  const mockMediaRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: getRepositoryToken(Media),
          useValue: mockMediaRepository,
        },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
    repository = module.get<Repository<Media>>(getRepositoryToken(Media));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a media record', async () => {
      const mockFile = {
        filename: 'test.png',
        mimetype: 'image/png',
        size: 1024,
      } as Express.Multer.File;

      const mockMedia = {
        id: 'uuid',
        ...mockFile,
        path: 'media/test.png',
      };

      mockMediaRepository.create.mockReturnValue(mockMedia);
      mockMediaRepository.save.mockResolvedValue(mockMedia);

      const result = await service.create(mockFile);

      expect(repository.create).toHaveBeenCalledWith({
        filename: mockFile.filename,
        path: `media/${mockFile.filename}`,
        mimetype: mockFile.mimetype,
        size: mockFile.size,
      });
      expect(repository.save).toHaveBeenCalledWith(mockMedia);
      expect(result).toEqual(mockMedia);
    });
  });

  describe('findAll', () => {
    it('should return an array of media records', async () => {
      const mockMediaArray = [{ id: '1', filename: 'img1.png' }];
      mockMediaRepository.find.mockResolvedValue(mockMediaArray);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual(mockMediaArray);
    });
  });

  describe('findOne', () => {
    it('should return a single media record', async () => {
      const mockMedia = { id: '1', filename: 'img1.png' };
      mockMediaRepository.findOneBy.mockResolvedValue(mockMedia);

      const result = await service.findOne('1');

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: '1' });
      expect(result).toEqual(mockMedia);
    });
  });
});
