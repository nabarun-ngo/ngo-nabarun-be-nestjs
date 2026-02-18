import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessException } from '../exceptions/business-exception';
import { ErrorResponse } from '../models/response-model';
import { config } from '../../config/app.config';
import { getTraceId, resolveTraceId } from '../utils/trace-context.util';
import { SlackNotificationRequestEvent } from 'src/modules/shared/correspondence/events/slack-notification-request.event';
import { AppTechnicalError } from '../exceptions/app-tech-error';

/**
 * Global exception filter that handles all exceptions in the application.
 * 
 * Behavior:
 * - Business exceptions: Returns the actual error message
 * - HTTP exceptions (4xx): Returns the error message
 * - Server errors (5xx): Returns generic message in production, detailed error in non-production
 * - Unknown errors: Returns generic message in production, detailed error in non-production
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly eventEmitter: EventEmitter2) { }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine status code and error response
    let status: number;
    let errorResponse: ErrorResponse;

    if (exception instanceof BusinessException) {
      // Handle business exceptions - always show the error message
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as {
        message: string | string[];
        errorCode?: string;
      };

      errorResponse = new ErrorResponse();
      errorResponse.messages = Array.isArray(exceptionResponse.message)
        ? exceptionResponse.message
        : [exceptionResponse.message || 'Business error occurred'];

      // Set error code if available
      if (exceptionResponse.errorCode) {
        errorResponse.setErrorCode(exceptionResponse.errorCode);
      }

      // Include stack trace in non-production
      if (!config.app.isProd && exception.stack) {
        errorResponse.stackTrace = exception.stack;
      }

      this.logger.warn(
        `Business Exception: ${Array.isArray(exceptionResponse.message) ? exceptionResponse.message.join(', ') : exceptionResponse.message}`,
        exception.stack,
      );
    } else if (exception instanceof HttpException) {
      // Handle HTTP exceptions (4xx, etc.)
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      errorResponse = new ErrorResponse();

      if (typeof exceptionResponse === 'string') {
        errorResponse.messages = [exceptionResponse];
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        if (responseObj.message) {
          errorResponse.messages = Array.isArray(responseObj.message)
            ? responseObj.message
            : [responseObj.message];
        } else {
          errorResponse.messages = ['An error occurred'];
        }

        // Set error code if available
        if (responseObj.errorCode) {
          errorResponse.setErrorCode(responseObj.errorCode);
        }
      } else {
        errorResponse.messages = ['An error occurred'];
      }

      // Include stack trace in non-production for server errors
      if (status >= HttpStatus.INTERNAL_SERVER_ERROR && !config.app.isProd && exception.stack) {
        errorResponse.stackTrace = exception.stack;
      }

      if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(
          `HTTP ${status} Error: ${errorResponse.messages.join(', ')}`,
          exception.stack,
        );
      } else if (status === HttpStatus.BAD_REQUEST) {
        this.logger.warn(
          `HTTP ${status} Error: ${errorResponse.messages.join(', ')}`,
          exception.stack,
        );
      }
    } else {
      // Handle unknown errors (500)
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = new ErrorResponse();
      const error = exception as Error;

      if (config.app.isProd) {
        // Production: Generic error message
        errorResponse.messages = [
          'An internal server error occurred. Please try again later.',
        ];
      } else {
        // Non-production: Detailed error information
        errorResponse.messages = [error?.message || 'An unexpected error occurred'];

        if (error?.name) {
          errorResponse.messages.push(`Error Type: ${error.name}`);
        }

        if (error?.stack) {
          errorResponse.stackTrace = error.stack;
        }
      }

      // ALWAYS log the full unhandled exception for all environments
      this.logger.error(
        `Unhandled Exception: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
    }

    // Set trace ID if available (retrieve from context or request headers)
    errorResponse.traceId = getTraceId() || resolveTraceId(request.headers);

    if (status >= 500) {
      this.eventEmitter.emit(AppTechnicalError.name, new AppTechnicalError(errorResponse));
      this.eventEmitter.emit(SlackNotificationRequestEvent.name, {
        message: `HTTP ${status} TraceId: ${errorResponse.traceId} Error: ${errorResponse.messages.join(', ')} \n Stack : ${exception instanceof Error ? exception.stack : (exception as any)?.stack}`,
        type: 'error',
      });
    }

    // Log error details for monitoring
    const logDetails = {
      path: request.url,
      method: request.method,
      statusCode: status,
      traceId: errorResponse.traceId,
      stack: exception instanceof Error ? exception.stack : (exception as any)?.stack,
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Exception caught: ${status} - ${errorResponse.messages.join(', ')}`,
        JSON.stringify(logDetails, null, 2),
      );
    } else if (status === HttpStatus.BAD_REQUEST) {
      this.logger.warn(
        `Exception caught: ${status} - ${errorResponse.messages.join(', ')}`,
        JSON.stringify(logDetails, null, 2),
      );
    }

    response.status(status).json(errorResponse);
  }
}

