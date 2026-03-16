import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { EmailService } from '../src/email/email.service';

describe('AuthModule (e2e)', () => {
  let app: INestApplication;
  const adminEmail = 'admin@tourism.com';
  const adminPassword = 'Admin@123';
  const testOtp = '12345'; // Hardcoded in AuthService for testing

  const mockEmailService = {
    sendLoginOtpEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetOtpEmail: jest.fn().mockResolvedValue(undefined),
    sendInvitationEmail: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue(mockEmailService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Flow', () => {
    let accessToken: string;
    let refreshToken: string;

    it('/auth/login (POST) - should send OTP', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminEmail,
          password: adminPassword,
        })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('message');
      expect(response.body.email).toBe(adminEmail);
    });

    it('/auth/verify-login (POST) - should return tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/verify-login')
        .send({
          email: adminEmail,
          otp: testOtp,
        })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(adminEmail);

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('/auth/me (GET) - should return current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.email).toBe(adminEmail);
    });

    it('/auth/me (PUT) - should update profile', async () => {
      const response = await request(app.getHttpServer())
        .put('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: 'Admin',
          lastName: 'User',
        })
        .expect(HttpStatus.OK);

      expect(response.body.firstName).toBe('Admin');
      expect(response.body.lastName).toBe('User');
    });

    it('/auth/refresh (POST) - should refresh tokens', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refreshToken: refreshToken,
        })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('/auth/change-password (POST) - should change password', async () => {
      await request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: adminPassword,
          newPassword: 'NewAdmin@123',
        })
        .expect(HttpStatus.OK);

      // Reset password back for other tests or future runs
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminEmail,
          password: 'NewAdmin@123',
        })
        .expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .post('/auth/verify-login')
        .send({
          email: adminEmail,
          otp: testOtp,
        })
        .then(async (res) => {
          const newAccessToken = res.body.accessToken;
          await request(app.getHttpServer())
            .post('/auth/change-password')
            .set('Authorization', `Bearer ${newAccessToken}`)
            .send({
              currentPassword: 'NewAdmin@123',
              newPassword: adminPassword,
            })
            .expect(HttpStatus.OK);
        });
    });

    it('/auth/logout (POST) - should logout user', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refreshToken: refreshToken,
        })
        .expect(HttpStatus.OK);
    });
  });

  describe('Password Recovery Flow', () => {
    it('/auth/forgot-password (POST) - should send reset OTP', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({
          email: adminEmail,
        })
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('message');
    });

    it('/auth/reset-password (POST) - should reset password', async () => {
      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          email: adminEmail,
          otp: testOtp,
          newPassword: 'Reset@123',
          confirmPassword: 'Reset@123',
        })
        .expect(HttpStatus.OK);

      // Reset password back
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminEmail,
          password: 'Reset@123',
        })
        .expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .post('/auth/verify-login')
        .send({
          email: adminEmail,
          otp: testOtp,
        })
        .then(async (res) => {
          const newAccessToken = res.body.accessToken;
          await request(app.getHttpServer())
            .post('/auth/change-password')
            .set('Authorization', `Bearer ${newAccessToken}`)
            .send({
              currentPassword: 'Reset@123',
              newPassword: adminPassword,
            })
            .expect(HttpStatus.OK);
        });
    });
  });

  describe('Negative Cases', () => {
    it('/auth/login (POST) - should fail with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminEmail,
          password: 'WrongPassword',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('/auth/verify-login (POST) - should fail with invalid OTP', async () => {
      await request(app.getHttpServer())
        .post('/auth/verify-login')
        .send({
          email: adminEmail,
          otp: '00000',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('/auth/me (GET) - should fail without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });
});
