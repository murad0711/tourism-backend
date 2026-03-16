import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import { join } from 'path';
import * as request from 'supertest';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { AppModule } from './../src/app.module';

describe('Media (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    const reflector = app.get(Reflector);
    app.useGlobalInterceptors(new ResponseInterceptor(reflector));
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    app.setGlobalPrefix('api');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/media/upload (POST)', async () => {
    const filePath = join(__dirname, 'test-image.png');
    fs.writeFileSync(filePath, 'fake image content');

    const response = await request(app.getHttpServer())
      .post('/api/media/upload')
      .attach('file', filePath)
      .expect(201);

    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('filename');
    expect(response.body.data).toHaveProperty('fullUrl');
    expect(response.body.data.path).toContain('media/');

    // Cleanup
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  it('/media (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/media')
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
    if (response.body.data.length > 0) {
      expect(response.body.data[0]).toHaveProperty('fullUrl');
    }
  });
});
