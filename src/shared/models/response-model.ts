import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';

export class SuccessResponse<T> {
  @ApiProperty() info: string;
  @ApiProperty() timestamp: Date;
  @ApiProperty() traceId?: string;
  @ApiProperty() message: string;
  @ApiProperty({ description: 'Response payload data' ,type : T }) responsePayload?: T;

  constructor(payload?: T) {
    this.info = 'Success';
    this.timestamp = new Date();
    this.traceId = ''; // mimic MDC
    if (payload) {
      this.responsePayload = payload;
    }
  }

  addMessage(message: string) {
    this.message = message;
    return this;
  }
}

export class ErrorResponse {
  @ApiProperty() info: string;
  @ApiProperty() timestamp: Date;
  @ApiProperty() traceId?: string;
  @ApiProperty() messages: string[];
  @ApiProperty({ required: false }) stackTrace?: string;
  @ApiProperty({ required: false }) errorCode?: string;

  constructor(err?: Error) {
    this.info = 'Error';
    this.timestamp = new Date();
    this.traceId = ''; // mimic MDC
    this.messages = [];
    if (err) {
      this.messages = [err.message];
      this.stackTrace = err.stack;
      if (err.name) this.messages.push(`Name: ${err.name}`);
      if (err.cause) this.messages.push(`Caused by: ${err.cause as string}`);
    }
  }

  addMessage(message: string) {
    this.messages.unshift(message);
    return this;
  }

  setErrorCode(code: string) {
    this.errorCode = code;
    return this;
  }
}
