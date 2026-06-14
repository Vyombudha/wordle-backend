export class RegistrationPasswordTooLongError extends Error {
    constructor() {
        super(`Password Too Long for Registration`);
        this.name = 'RegistrationPasswordTooLongError';
        this.statusCode = 413;
    }
}

export class UserCredentialsInvalidError extends Error {
    constructor() {
        super(`Email or Password are Empty for Registration`);
        this.name = 'RegistrationCredentialsInvalidError';
        this.statusCode = 400;
    }
}



export class InvalidCredentialsError extends Error {
    constructor() {
        super(`Invalid Email or Password`);
        this.name = 'InvalidCredentialsError';
        this.statusCode = 401;
    }
}

export class PendingRegistrationNotFoundError extends Error {
    constructor(email) {
        super(`Couldn't Find Pending Registration Entry`);
        this.name = 'PendingRegistrationNotFoundError';
        this.statusCode = 404; // 404 as the registration entry itself doesn't exist for this email
        this.email = email; // for login 
    }
}

export class PendingRegistrationExpiredError extends Error {
    constructor(email) {
        super(`Pending Registration Had Expired`);
        this.name = 'PendingRegistrationExpiredError';
        this.statusCode = 409;
        this.email = email;
    }
}


export class PendingRegistrationCodeInvalidError extends Error {
    constructor() {
        super(`Pending Registration Verification Code or Email Is Invalid`);
        this.name = 'PendingRegistrationCodeInvalidError';
        this.statusCode = 400;
    }
}

export class UserNotFoundError extends Error {
    constructor() {
        super(`User Not Found DB`);
        this.name = "UserNotFoundError";
        this.statusCode = 404;
    }
}


export class UserAlreadyExistsError extends Error {
    constructor(email) {
        super(`User Already Exists In DB`);
        this.name = "UserAlreadyExistsError";
        this.statusCode = 409;
        this.email = email
    }
}