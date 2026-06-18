import { AppError } from "./base.errors.js";

export class Invalid extends AppError {
    constructor() {
        super(`Invalid Token Sent From User`, 401);
    }
}

export class Expired extends AppError {
    constructor() {
        super(`Invalid Token Sent`, 401);
    }
}
