import { AppError } from './base.errors.js';



export class InvalidPasswordLength extends AppError {
    constructor() {
        super(`Password Length Invalid for Registration`, 413);
    }
}


export class NotFound extends AppError {
    constructor(email) {
        super(`Couldn't Find Pending Registration Entry`, 404, { email });
    }
}



export class Expired extends AppError {
    constructor(email) {
        super(`Pending Registration Had Expired`, 409, { email });
    }
}



export class CodeInvalid extends AppError {
    constructor() {
        super(`Pending Registration Verification Code or Email Is Invalid`, 400);
    }
}



