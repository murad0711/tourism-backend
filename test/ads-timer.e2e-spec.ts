import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import {
  AdsTimerStatus,
  AdsTimerType,
} from '../src/ads-timer/entities/ads-timer.entity';
import { AppModule } from '../src/app.module';
import { EmailService } from '../src/email/email.service';

describe('AdsTimerModule (e2e)', () => {
  let app: INestApplication;
  const adminEmail = 'admin@tourism.com';
  const adminPassword = 'Admin@123';
  const testOtp = '12345';
  let accessToken: string;

  const mockEmailService = {
    sendLoginOtpEmail: jest.fn().mockResolvedValue(undefined),
  };

  jest.setTimeout(30000);

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

  describe('/ads-timer (POST)', () => {
    it('should create a new ads timer', async () => {
      const adsTimerData = {
        title: 'E2E Test Ads Timer',
        type: AdsTimerType.PREPAID,
        addedOn: new Date().toISOString(),
        expireOn: new Date(Date.now() + 86400000).toISOString(),
        status: AdsTimerStatus.ACTIVE,
      };

      const response = await request(app.getHttpServer())
        .post('/ads-timer')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(adsTimerData)
        .expect(HttpStatus.CREATED);

      expect(response.body.title).toBe(adsTimerData.title);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('addedById');
    });

    it('should fail with validation error', async () => {
      await request(app.getHttpServer())
        .post('/ads-timer')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: '' }) // Missing type and other required fields if any
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/ads-timer/active (GET)', () => {
    it('should return active ads timers without authentication', async () => {
      // First create an active one (requires auth)
      await request(app.getHttpServer())
        .post('/ads-timer')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Public Active Timer',
          type: AdsTimerType.PREPAID,
          addedOn: new Date().toISOString(),
          expireOn: new Date(Date.now() + 86400000).toISOString(),
          status: AdsTimerStatus.ACTIVE,
        });

      // Now fetch it without auth
      const response = await request(app.getHttpServer())
        .get('/ads-timer/active')
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        response.body.forEach((timer: any) => {
          expect(timer.status).toBe(AdsTimerStatus.ACTIVE);
        });
      }
    });
  });

  describe('/ads-timer (GET)', () => {
    it('should return paginated ads timers', async () => {
      const response = await request(app.getHttpServer())
        .get('/ads-timer')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should filter ads timers by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/ads-timer?status=active')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      response.body.results.forEach((timer: any) => {
        expect(timer.status).toBe(AdsTimerStatus.ACTIVE);
      });
    });
  });

  describe('/ads-timer/:id (GET)', () => {
    it('should return a single ads timer', async () => {
      // First create one
      const createRes = await request(app.getHttpServer())
        .post('/ads-timer')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Single Timer',
          type: AdsTimerType.POSTPAID,
          addedOn: new Date().toISOString(),
          expireOn: new Date().toISOString(),
        });

      const id = createRes.body.id;

      const response = await request(app.getHttpServer())
        .get(`/ads-timer/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(id);
      expect(response.body).toHaveProperty('addedBy');
    });

    it('should return 404 for non-existent ads timer', async () => {
      await request(app.getHttpServer())
        .get('/ads-timer/99999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('/ads-timer/:id (PATCH)', () => {
    it('should update an ads timer', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/ads-timer')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'To Update',
          type: AdsTimerType.PREPAID,
          addedOn: new Date().toISOString(),
          expireOn: new Date().toISOString(),
        });

      const id = createRes.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/ads-timer/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated Title' })
        .expect(HttpStatus.OK);

      expect(response.body.title).toBe('Updated Title');
    });
  });

  describe('/ads-timer/:id (DELETE)', () => {
    it('should delete an ads timer', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/ads-timer')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'To Delete',
          type: AdsTimerType.PREPAID,
          addedOn: new Date().toISOString(),
          expireOn: new Date().toISOString(),
        });

      const id = createRes.body.id;

      await request(app.getHttpServer())
        .delete(`/ads-timer/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .get(`/ads-timer/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
