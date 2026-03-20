import { HttpException, HttpStatus } from "@nestjs/common";

export class NotificationError extends HttpException {
    constructor(error: Error) {
        super(
            {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: error.message,
                errorCode: 'NOTIFICATION_FAILURE',
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
}
