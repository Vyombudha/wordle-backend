import { AppError } from './base.errors.js';

export class InvalidCredentials extends AppError {
    constructor() {
        super(`Invalid Email or Password`, 401);
    }
}

export class NotFound extends AppError {
    constructor() {
        super(`User Not Found DB`, 404);
    }
}


export class AlreadyExists extends AppError {
    constructor(email) {
        super(`User Already Exists In DB`, 409, { email });
    }
}