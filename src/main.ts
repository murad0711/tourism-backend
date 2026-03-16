import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const formatErrorsRecursive = (validationErrors: any[]) => {
          const result: Record<string, any> = {};
          validationErrors.forEach((error) => {
            if (error.constraints) {
              result[error.property] = Object.values(error.constraints)[0];
            }
            if (error.children && error.children.length > 0) {
              const childrenErrors = formatErrorsRecursive(error.children);
              if (Object.keys(childrenErrors).length > 0) {
                result[error.property] = childrenErrors;
              }
            }
          });
          return result;
        };

        throw new BadRequestException({
          message: 'Validation Failed',
          errors: formatErrorsRecursive(errors),
        });
      },
    }),
  );

  // Global response interceptor
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new ResponseInterceptor(reflector));

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Set global prefix
  app.setGlobalPrefix('api');

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Tourism Backend API')
    .setDescription('The Aliv Digital backend API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
  console.log(`Swagger documentation: http://localhost:${port}/docs`);
}
bootstrap();
