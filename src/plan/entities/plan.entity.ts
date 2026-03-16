import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PlanType {
  PREPAID = 'prepaid',
  POSTPAID = 'postpaid',
}

export enum PlanStatus {
  EXPIRED = 'expired',
  DEACTIVATED = 'deactivated',
  ACTIVE = 'active',
}

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column()
  planName: string;

  @Column({ nullable: true })
  subHeading: string;

  @Column({ nullable: true })
  link: string;

  @Column({ type: 'timestamp' })
  startFrom: Date;

  @Column({ type: 'timestamp' })
  expireOn: Date;

  @Column({ nullable: true })
  backgroundImageUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  media: object;

  @Column({ type: 'enum', enum: PlanType })
  type: PlanType;

  @Column({ type: 'enum', enum: PlanStatus, default: PlanStatus.ACTIVE })
  status: PlanStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
