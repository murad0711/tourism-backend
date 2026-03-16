import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from './entities/media.entity';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
  ) {}

  async create(file: Express.Multer.File) {
    const media = this.mediaRepository.create({
      filename: file.filename,
      path: `media/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size, // in bytes
    });
    return await this.mediaRepository.save(media);
  }

  async findAll() {
    return await this.mediaRepository.find();
  }

  async findOne(id: string) {
    return await this.mediaRepository.findOneBy({ id });
  }
}
