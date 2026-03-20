import { ErrorResponse } from "../models/response-model";

export class AppTechnicalError {
    #isNotificationFailure: boolean = false;
    constructor(public error: ErrorResponse | Error, isNotificationFailure?: boolean) {
        this.#isNotificationFailure = isNotificationFailure || false;
    }

    get isNotificationFailure(): boolean {
        return this.#isNotificationFailure;
    }
}