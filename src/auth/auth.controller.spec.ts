import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    verifyLogin: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    resendOtp: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    changePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.login', async () => {
      const loginDto = { email: 'test@example.com', password: 'password' };
      const ip = '127.0.0.1';
      mockAuthService.login.mockResolvedValue({ message: 'OTP sent' });

      const result = await controller.login(loginDto, ip);

      expect(authService.login).toHaveBeenCalledWith(loginDto, ip);
      expect(result).toEqual({ message: 'OTP sent' });
    });
  });

  describe('verifyLogin', () => {
    it('should call authService.verifyLogin', async () => {
      const verifyLoginDto = { email: 'test@example.com', otp: '12345' };
      mockAuthService.verifyLogin.mockResolvedValue({ accessToken: 'token' });

      const result = await controller.verifyLogin(verifyLoginDto);

      expect(authService.verifyLogin).toHaveBeenCalledWith(
        'test@example.com',
        '12345',
        false,
      );
      expect(result).toEqual({ accessToken: 'token' });
    });
  });

  // More simple delegation tests could be added
  describe('forgotPassword', () => {
    it('should call authService.forgotPassword', async () => {
      const dto = { email: 'test@example.com' };
      const ip = '127.0.0.1';
      mockAuthService.forgotPassword.mockResolvedValue({ message: 'OTP sent' });

      const result = await controller.forgotPassword(dto, ip);

      expect(authService.forgotPassword).toHaveBeenCalledWith(dto.email, ip);
      expect(result).toEqual({ message: 'OTP sent' });
    });
  });

  describe('resetPassword', () => {
    it('should call authService.resetPassword', async () => {
      const dto = {
        email: 'test@example.com',
        otp: '12345',
        newPassword: 'new1',
        confirmPassword: 'new1',
      };
      mockAuthService.resetPassword.mockResolvedValue({
        message: 'Password reset',
      });

      const result = await controller.resetPassword(dto);

      expect(authService.resetPassword).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ message: 'Password reset' });
    });
  });

  describe('getProfile', () => {
    it('should call authService.getProfile', async () => {
      const user = { id: 1 } as any;
      mockAuthService.getProfile.mockResolvedValue({ id: 1, email: 'test' });

      const result = await controller.getProfile(user);

      expect(authService.getProfile).toHaveBeenCalledWith(user.id);
      expect(result).toEqual({ id: 1, email: 'test' });
    });
  });
});
