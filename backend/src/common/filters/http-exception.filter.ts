import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: any = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
      },
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as any;
        if (resp.success === false && resp.error) {
          errorResponse = exceptionResponse;
        } else {
          errorResponse = {
            success: false,
            error: {
              code: resp.code || resp.error?.code || 'VALIDATION_ERROR',
              message:
                resp.message || resp.error?.message || exception.message,
            },
          };
        }
      } else {
        errorResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: exception.message,
          },
        };
      }
    } else if (exception instanceof Error) {
      console.error('Unhandled error:', exception.message, exception.stack);
    }

    response.status(status).json(errorResponse);
  }
}
