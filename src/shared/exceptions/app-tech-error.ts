import { ErrorResponse } from "../models/response-model";

export class AppTechnicalError {
    constructor(public error: ErrorResponse | Error) {
    }
}