import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AppSettingType {
  IMAGE = 'image',
  CONTENT = 'content',
  TEXT = 'text',
  URL = 'url',
}

@Entity('app_settings')
export class AppSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'enum', enum: AppSettingType })
  type: AppSettingType;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
