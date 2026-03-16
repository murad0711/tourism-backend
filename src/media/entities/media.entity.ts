import { Expose } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  path: string;

  @Column()
  mimetype: string;

  @Column({ type: 'int' })
  size: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Expose()
  get fullUrl(): string {
    // This will be handled by a transformation or interceptor if needed,
    // but for now, we can provide a getter.
    // The actual BASE_URL should ideally come from config.
    const baseUrl = process.env.APP_URL || 'http://localhost:4000';
    return `${baseUrl}/${this.path}`;
  }
}
