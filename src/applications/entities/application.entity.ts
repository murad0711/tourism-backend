import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESUBMISSION_REQUESTED = 'RESUBMISSION_REQUESTED',
  RESUBMITTED = 'RESUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum TouristType {
  DOMESTIC = 'DOMESTIC',
  FOREIGN = 'FOREIGN',
}

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.applications, { eager: true })
  tourist: User;

  @Column()
  touristName: string;

  @Column()
  mobileNumber: string;

  @Column({ nullable: true })
  guardianName: string;

  @Column({ nullable: true })
  guardianMobile: string;

  @Column()
  permanentAddress: string;

  @Column()
  presentAddress: string;

  @Column()
  occupation: string;

  @Column()
  placeOfOrigin: string;

  @Column()
  destination: string;

  @Column({ type: 'date' })
  arrivalDate: Date;

  @Column({ type: 'date' })
  departureDate: Date;

  @Column({
    type: 'enum',
    enum: TouristType,
    default: TouristType.DOMESTIC,
  })
  touristType: TouristType;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.DRAFT,
  })
  status: ApplicationStatus;

  @Column({ nullable: true })
  nidPath: string;

  @Column({ nullable: true })
  passportPath: string;

  @Column({ nullable: true, type: 'text' })
  adminRemarks: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
