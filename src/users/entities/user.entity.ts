import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { Role } from '../../rbac/entities/role.entity';
import { Application } from '../../applications/entities/application.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  department: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  @Exclude()
  password: string;

  // OTP fields for email-based login/forgot-password verification
  @Column({ type: 'varchar', nullable: true })
  @Exclude()
  otp: string | null;

  @Column({ type: 'timestamp', nullable: true })
  otpExpiresAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  otpType: 'login' | 'forgot_password' | null;

  // Rate limiting for OTP requests
  @Column({ default: 0 })
  otpRequestAttempts: number;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  otpRequestWindowStart: Date | null;

  // Lockout for failed OTP verification
  @Column({ default: 0 })
  otpVerifyAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  otpLockedUntil: Date | null;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  invitationSentAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  joinedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];

  @ManyToMany(() => Role)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles: Role[];

  @OneToMany(() => Application, (application) => application.tourist)
  applications: Application[];
}
