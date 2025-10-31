import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(message: string, errorCode?: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        errorCode: errorCode || 'BUSINESS_ERROR',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
