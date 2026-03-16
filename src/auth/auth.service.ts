import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import {
  comparePassword,
  compareToken,
  hashPassword,
  hashToken,
} from '../common/utils/hash.util';
import { EmailService } from '../email/email.service';
import { User } from '../users/entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  /**
   * Step 1: Login with email + password → sends OTP to email
   */
  async login(
    loginDto: { email: string; password: string },
    ip: string = '127.0.0.1',
  ) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Generate and send login OTP
    await this.generateAndSendOtp(user, 'login', ip);

    return {
      message: 'OTP sent to your email. Please verify to complete login.',
      email: user.email,
    };
  }

  /**
   * Step 2: Verify login OTP → returns tokens
   */
  async verifyLogin(email: string, otp: string, rememberMe: boolean = false) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify OTP with type check
    await this.verifyOtp(user, otp, 'login');

    // Load user roles and permissions
    const userWithRoles = await this.loadUserWithRolesAndPermissions(user.id);

    const permissions = this.extractPermissions(userWithRoles);

    // Set joined date on first login
    if (!user.joinedAt) {
      user.joinedAt = new Date();
      await this.userRepository.save(user);
    }

    // Generate tokens with rememberMe flag
    const tokens = await this.generateTokens(user, permissions, rememberMe);

    const userData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      department: user.department,
      isEmailVerified: user.isEmailVerified,
      joinedAt: user.joinedAt,
      invitationSentAt: user.invitationSentAt,
      roles: userWithRoles?.roles?.map((role) => role.name) || [],
      permissions,
    };

    return { user: userData, ...tokens };
  }

  /**
   * Step 3: Forgot password → sends OTP to email
   */
  async forgotPassword(email: string, ip: string = '127.0.0.1') {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists
      return {
        message:
          'If the email exists, an OTP has been sent for password reset.',
      };
    }

    // Generate and send forgot_password OTP
    await this.generateAndSendOtp(user, 'forgot_password', ip);

    return {
      message: 'If the email exists, an OTP has been sent for password reset.',
    };
  }

  /**
   * Step 4: Reset password → verify OTP + set new password
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, otp, newPassword, confirmPassword } = resetPasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException(
        'New password and confirm password do not match',
      );
    }

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Verify OTP with type check
    await this.verifyOtp(user, otp, 'forgot_password');

    // Update password
    user.password = await hashPassword(newPassword);
    await this.userRepository.save(user);

    // Revoke all refresh tokens
    await this.refreshTokenRepository.update(
      { userId: user.id },
      { isRevoked: true },
    );

    return { message: 'Password reset successfully' };
  }

  /**
   * Step 5: Resend OTP (login or forgot_password)
   */
  async resendOtp(email: string, ip: string = '127.0.0.1') {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, an OTP has been resent.' };
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    // Check if there's a pending OTP type
    if (!user.otpType) {
      throw new BadRequestException(
        'No pending OTP request. Please login or request forgot password first.',
      );
    }

    // Resend OTP with the same type
    await this.generateAndSendOtp(user, user.otpType, ip);

    return { message: 'OTP has been resent to your email.' };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refresh.secret'),
      });

      // Find refresh token in database
      const storedToken = await this.refreshTokenRepository.findOne({
        where: {
          userId: payload.sub,
          isRevoked: false,
          expiresAt: MoreThan(new Date()),
        },
      });

      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify token hash
      const isTokenValid = await compareToken(refreshToken, storedToken.token);

      if (!isTokenValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Get user
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Revoke old refresh token
      storedToken.isRevoked = true;
      await this.refreshTokenRepository.save(storedToken);

      // Load user roles and permissions
      const userWithRoles = await this.loadUserWithRolesAndPermissions(user.id);
      const permissions = this.extractPermissions(userWithRoles);

      // Generate new tokens, preserving rememberMe flag
      const tokens = await this.generateTokens(
        user,
        permissions,
        storedToken.rememberMe,
      );

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Logout — revoke all refresh tokens for the user
   */
  async logout(userId: number, refreshToken: string) {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );

    return { message: 'Logged out successfully' };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    // Load user roles
    const userWithRoles = await this.loadUserWithRolesAndPermissions(user.id);
    const permissions = this.extractPermissions(userWithRoles);

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      department: user.department,
      isEmailVerified: user.isEmailVerified,
      joinedAt: user.joinedAt,
      invitationSentAt: user.invitationSentAt,
      roles: userWithRoles?.roles?.map((role) => role.name) || [],
      permissions,
    };
  }

  /**
   * Update authenticated user's profile
   */
  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateProfileDto.firstName !== undefined) {
      user.firstName = updateProfileDto.firstName;
    }

    if (updateProfileDto.lastName !== undefined) {
      user.lastName = updateProfileDto.lastName;
    }

    if (updateProfileDto.department !== undefined) {
      user.department = updateProfileDto.department;
    }

    if (updateProfileDto.email && updateProfileDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateProfileDto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      user.email = updateProfileDto.email;
      user.isEmailVerified = false;
    }

    await this.userRepository.save(user);

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      department: user.department,
      isEmailVerified: user.isEmailVerified,
      joinedAt: user.joinedAt,
      invitationSentAt: user.invitationSentAt,
    };
  }

  /**
   * Change authenticated user's password
   */
  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Update password
    user.password = await hashPassword(newPassword);
    await this.userRepository.save(user);

    // Revoke all refresh tokens
    await this.refreshTokenRepository.update(
      { userId: user.id },
      { isRevoked: true },
    );

    return { message: 'Password changed successfully' };
  }

  // ─── Helper Methods ──────────────────────────────────────────────────

  /**
   * Generate OTP, save to user, and send via email
   */
  private async generateAndSendOtp(
    user: User,
    otpType: 'login' | 'forgot_password',
    ip: string = '127.0.0.1',
  ) {
    const now = new Date();
    const rateLimitWindowMinutes = 15;
    const maxRequestsPerWindow = 5;

    // Check rate limit
    if (user.otpRequestWindowStart) {
      const windowEnd = new Date(user.otpRequestWindowStart);
      windowEnd.setMinutes(windowEnd.getMinutes() + rateLimitWindowMinutes);

      if (now < windowEnd) {
        if (user.otpRequestAttempts >= maxRequestsPerWindow) {
          throw new HttpException(
            'Too many OTP requests. Please try again later.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        user.otpRequestAttempts += 1;
      } else {
        user.otpRequestAttempts = 1;
        user.otpRequestWindowStart = now;
      }
    } else {
      user.otpRequestAttempts = 1;
      user.otpRequestWindowStart = now;
    }

    // Generate OTP
    // const otp = generateOTP();
    const otp = '12345'; // For testing purposes, use a fixed OTP. Replace with generateOTP() in production.
    const hashedOtp = await hashToken(otp);

    // Set OTP expiration (5 minutes)
    const otpExpirationMinutes = 5;
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + otpExpirationMinutes);

    user.otp = hashedOtp;
    user.otpExpiresAt = otpExpiresAt;
    user.otpType = otpType;
    user.otpVerifyAttempts = 0;
    user.otpLockedUntil = null;

    await this.userRepository.save(user);

    // Send OTP via email
    if (otpType === 'login') {
      await this.emailService.sendLoginOtpEmail(user.email, otp);
    } else {
      await this.emailService.sendPasswordResetOtpEmail(user.email, otp);
    }
  }

  /**
   * Verify OTP against user's stored OTP with type check
   */
  private async verifyOtp(
    user: User,
    otp: string,
    expectedType: 'login' | 'forgot_password',
  ) {
    const now = new Date();
    const lockoutDurationMinutes = 15;
    const maxVerifyAttempts = 5;

    // Check if user is locked out
    if (user.otpLockedUntil && now < user.otpLockedUntil) {
      throw new ForbiddenException(
        'Account is temporarily locked due to too many failed attempts. Please try again later.',
      );
    }

    // Reset lock if lockout period has passed
    if (user.otpLockedUntil && now >= user.otpLockedUntil) {
      user.otpLockedUntil = null;
      user.otpVerifyAttempts = 0;
    }

    // Check if OTP exists
    if (!user.otp) {
      throw new BadRequestException(
        'No OTP requested. Please request an OTP first.',
      );
    }

    // Check OTP type
    if (user.otpType !== expectedType) {
      throw new BadRequestException('Invalid OTP type for this operation.');
    }

    // Check if OTP has expired
    if (!user.otpExpiresAt || now > user.otpExpiresAt) {
      throw new BadRequestException(
        'OTP has expired. Please request a new OTP.',
      );
    }

    // Verify OTP
    const isOtpValid = await compareToken(otp, user.otp);

    if (!isOtpValid) {
      user.otpVerifyAttempts += 1;

      if (user.otpVerifyAttempts >= maxVerifyAttempts) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + lockoutDurationMinutes);
        user.otpLockedUntil = lockUntil;
        await this.userRepository.save(user);

        throw new ForbiddenException(
          'Account locked due to too many failed attempts. Please try again later.',
        );
      }

      await this.userRepository.save(user);
      throw new UnauthorizedException('Invalid OTP');
    }

    // OTP is valid — clear OTP fields
    user.otp = null;
    user.otpExpiresAt = null;
    user.otpType = null;
    user.otpVerifyAttempts = 0;
    user.otpRequestAttempts = 0;
    user.otpRequestWindowStart = null;
    user.otpLockedUntil = null;

    await this.userRepository.save(user);
  }

  /**
   * Load user with roles and permissions
   */
  private async loadUserWithRolesAndPermissions(userId: number) {
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .where('user.id = :userId', { userId })
      .getOne();
  }

  /**
   * Extract unique permissions from user roles
   */
  private extractPermissions(userWithRoles: User | null): string[] {
    return [
      ...new Set(
        userWithRoles?.roles
          ?.flatMap((role) => role.permissions)
          ?.map((permission) => permission.slug) || [],
      ),
    ];
  }

  /**
   * Generate access and refresh JWT tokens
   */
  private async generateTokens(
    user: User,
    permissions: string[],
    rememberMe: boolean = false,
  ) {
    const payload = {
      sub: user.id,
      email: user.email,
      permissions,
    };

    // @ts-ignore - JWT library type issue, works fine at runtime
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.access.secret') || 'secret',
      expiresIn:
        this.configService.get<string>('jwt.access.expiresIn') || '15m',
    });

    // @ts-ignore - JWT library type issue, works fine at runtime
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refresh.secret') || 'secret',
      expiresIn:
        this.configService.get<string>('jwt.refresh.expiresIn') || '7d',
    });

    // Hash and store refresh token
    const hashedRefreshToken = await hashToken(refreshToken);

    const expiresAt = new Date();
    const expirationDays = rememberMe ? 30 : 7;
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    const refreshTokenEntity = this.refreshTokenRepository.create({
      token: hashedRefreshToken,
      userId: user.id,
      expiresAt,
      isRevoked: false,
      rememberMe,
    });

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken,
    };
  }
}
