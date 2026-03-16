import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AppSettingType } from '../src/app-settings/entities/app-setting.entity';
import { EmailService } from '../src/email/email.service';

describe('AppSettingsModule (e2e)', () => {
  let app: INestApplication;
  const adminEmail = 'admin@tourism.com';
  const adminPassword = 'Admin@123';
  const testOtp = '12345';
  let accessToken: string;

  const mockEmailService = {
    sendLoginOtpEmail: jest.fn().mockResolvedValue(undefined),
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

    // Login to get access token
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword });

    const response = await request(app.getHttpServer())
      .post('/auth/verify-login')
      .send({ email: adminEmail, otp: testOtp });

    accessToken = response.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/app-settings (POST) - Protected', () => {
    it('should create a new setting', async () => {
      const data = {
        key: 'e2e-test-key',
        value: 'https://example.com/test.png',
        type: AppSettingType.IMAGE,
        description: 'E2E test setting',
      };

      const response = await request(app.getHttpServer())
        .post('/app-settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(data)
        .expect(HttpStatus.CREATED);

      expect(response.body.key).toBe(data.key);
      expect(response.body.value).toBe(data.value);
      expect(response.body).toHaveProperty('id');
    });

    it('should upsert (update) an existing setting', async () => {
      const data = {
        key: 'e2e-test-key',
        value: 'https://example.com/updated.png',
        type: AppSettingType.IMAGE,
      };

      const response = await request(app.getHttpServer())
        .post('/app-settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(data)
        .expect(HttpStatus.CREATED);

      expect(response.body.key).toBe(data.key);
      expect(response.body.value).toBe(data.value);
    });

    it('should fail without auth', async () => {
      await request(app.getHttpServer())
        .post('/app-settings')
        .send({
          key: 'unauthorized-key',
          value: 'test',
          type: AppSettingType.TEXT,
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should fail with validation error', async () => {
      await request(app.getHttpServer())
        .post('/app-settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ key: '' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/app-settings/:key (GET) - Public', () => {
    it('should return a setting by key (no auth needed)', async () => {
      // First, ensure the setting exists
      await request(app.getHttpServer())
        .post('/app-settings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          key: 'public-test-key',
          value: 'Hello World',
          type: AppSettingType.TEXT,
        });

      const response = await request(app.getHttpServer())
        .get('/app-settings/public-test-key')
        .expect(HttpStatus.OK);

      expect(response.body.key).toBe('public-test-key');
      expect(response.body.value).toBe('Hello World');
    });

    it('should return raw setting value by key (no auth needed)', async () => {
      const response = await request(app.getHttpServer())
        .get('/app-settings/public-test-key/raw')
        .expect(HttpStatus.OK);

      expect(response.text).toBe('Hello World');
    });

    it('should return 404 for non-existent key', async () => {
      await request(app.getHttpServer())
        .get('/app-settings/non-existent-key-xyz')
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
