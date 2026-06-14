export class InvalidTokenError extends Error {
    constructor() {
        super(`Invalid Token Sent From User`);
        this.name = 'InvalidTokenError';
        this.statusCode = 401; // 401 cause the token is invalid, and we don't know who the user is
    }
}

export class TokenExpiredError extends Error {
    constructor() {
        super(`Invalid Token Sent`);
        this.name = 'TokenExpiredError';
        this.statusCode = 401; // 401 cause the token is invalid, and we don't know who the user is
    }
}
