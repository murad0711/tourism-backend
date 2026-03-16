import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { EmailService } from '../src/email/email.service';
import { PlanStatus, PlanType } from '../src/plan/entities/plan.entity';

describe('PlanModule (e2e)', () => {
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

  describe('/plans (POST)', () => {
    it('should create a new plan', async () => {
      const planData = {
        planName: 'E2E Test Plan',
        price: 19.99,
        type: PlanType.PREPAID,
        startFrom: new Date().toISOString(),
        expireOn: new Date(Date.now() + 86400000).toISOString(),
        status: PlanStatus.ACTIVE,
      };

      const response = await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(planData)
        .expect(HttpStatus.CREATED);

      expect(response.body.planName).toBe(planData.planName);
      expect(response.body).toHaveProperty('id');
    });

    it('should fail with validation error', async () => {
      await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ planName: '' })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('/plans (GET)', () => {
    it('should return paginated plans', async () => {
      const response = await request(app.getHttpServer())
        .get('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should filter plans by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/plans?type=prepaid')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      response.body.results.forEach((plan: any) => {
        expect(plan.type).toBe(PlanType.PREPAID);
      });
    });
  });

  describe('/plans/:id (GET)', () => {
    it('should return a single plan', async () => {
      // First create one
      const createRes = await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          planName: 'Single Plan',
          price: 5,
          type: PlanType.POSTPAID,
          startFrom: new Date().toISOString(),
          expireOn: new Date().toISOString(),
        });

      const id = createRes.body.id;

      const response = await request(app.getHttpServer())
        .get(`/plans/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(id);
    });

    it('should return 404 for non-existent plan', async () => {
      await request(app.getHttpServer())
        .get('/plans/99999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('/plans/:id (PATCH)', () => {
    it('should update a plan', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          planName: 'To Update',
          price: 1,
          type: PlanType.PREPAID,
          startFrom: new Date().toISOString(),
          expireOn: new Date().toISOString(),
        });

      const id = createRes.body.id;

      const response = await request(app.getHttpServer())
        .patch(`/plans/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ planName: 'Updated Name' })
        .expect(HttpStatus.OK);

      expect(response.body.planName).toBe('Updated Name');
    });
  });

  describe('/plans/:id (DELETE)', () => {
    it('should delete a plan', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          planName: 'To Delete',
          price: 1,
          type: PlanType.PREPAID,
          startFrom: new Date().toISOString(),
          expireOn: new Date().toISOString(),
        });

      const id = createRes.body.id;

      await request(app.getHttpServer())
        .delete(`/plans/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      await request(app.getHttpServer())
        .get(`/plans/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
