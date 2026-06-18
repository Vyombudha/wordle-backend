export class AppError extends Error {
    constructor(message, statusCode, props = {}) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        Object.assign(this, props);
    }
}