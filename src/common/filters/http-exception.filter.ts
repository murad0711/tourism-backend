import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { ApiResponse } from '../interfaces/api-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<ExpressResponse>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const errorResponse = res as any;
        message = errorResponse.message || message;
        // Check if the response has an 'errors' property (custom validation structure)
        if (errorResponse.errors) {
          errors = errorResponse.errors;
          message = errorResponse.message || 'Validation Failed';
        } else if (Array.isArray(errorResponse.message)) {
          // Fallback for standard NestJS validation (if not overridden yet)
          errors = errorResponse.message;
          message = 'Validation Failed';
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const apiResponse: ApiResponse<null> = {
      success: false,
      message,
      data: null,
      errors: errors || null,
    };

    response.status(status).json(apiResponse);
  }
}
