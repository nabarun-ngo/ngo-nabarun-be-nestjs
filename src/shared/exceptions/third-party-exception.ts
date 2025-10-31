import { HttpException, HttpStatus } from '@nestjs/common';

export class ThirdPartyException extends HttpException {
  constructor(source: 'auth0', error?: Error) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error?.message,
        errorCode: source || 'THIRD_PARTY_ERROR',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
