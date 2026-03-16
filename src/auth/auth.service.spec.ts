import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as hashUtil from '../common/utils/hash.util';
import * as otpUtil from '../common/utils/otp.util';
import { EmailService } from '../email/email.service';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { RefreshToken } from './entities/refresh-token.entity';

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockRefreshTokenRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockEmailService = {
    sendLoginOtpEmail: jest.fn(),
    sendPasswordResetOtpEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepository,
        },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Default config mocks
    mockConfigService.get.mockImplementation((key: string) => {
      if (key.includes('secret')) return 'test-secret';
      if (key.includes('expiresIn')) return '1h';
      return null;
    });

    jest.spyOn(hashUtil, 'hashPassword').mockResolvedValue('hashed-pass');
    jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(true);
    jest.spyOn(hashUtil, 'hashToken').mockResolvedValue('hashed-token');
    jest.spyOn(hashUtil, 'compareToken').mockResolvedValue(true);
    jest.spyOn(otpUtil, 'generateOTP').mockReturnValue('12345');

    // Default builder mock
    mockUserRepository.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ id: 1, roles: [] }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(
        service.login({ email: 't@t.com', password: 'p' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password wrong', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        email: 't@t.com',
        isActive: true,
      });
      jest.spyOn(hashUtil, 'comparePassword').mockResolvedValueOnce(false);
      await expect(
        service.login({ email: 't@t.com', password: 'p' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should generate OTP and save to user and send email', async () => {
      const user = { id: 1, email: 't@t.com', isActive: true, password: 'p' };
      mockUserRepository.findOne.mockResolvedValue(user);

      const res = await service.login({ email: 't@t.com', password: 'p' });
      expect(res.message).toContain('OTP sent');
      expect(mockEmailService.sendLoginOtpEmail).toHaveBeenCalledWith(
        't@t.com',
        '12345',
      );
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });

  describe('verifyLogin', () => {
    it('should verify OTP and return tokens', async () => {
      const pastTime = new Date();
      pastTime.setMinutes(pastTime.getMinutes() + 10);
      const user = {
        id: 1,
        email: 't@t.com',
        isActive: true,
        otp: 'h',
        otpExpiresAt: pastTime,
        otpType: 'login',
      };
      mockUserRepository.findOne.mockResolvedValue(user);

      mockJwtService.sign
        .mockReturnValueOnce('access')
        .mockReturnValueOnce('refresh');

      const res = await service.verifyLogin('t@t.com', '12345');

      expect(res.accessToken).toBe('access');
      expect(res.refreshToken).toBe('refresh');
      expect(res.user.id).toBe(1);
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset OTP', async () => {
      const user = { id: 1, email: 't@t.com', isActive: true };
      mockUserRepository.findOne.mockResolvedValue(user);

      const res = await service.forgotPassword('t@t.com');

      expect(res.message).toContain('OTP has been sent');
      expect(mockEmailService.sendPasswordResetOtpEmail).toHaveBeenCalledWith(
        't@t.com',
        '12345',
      );
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });
});
