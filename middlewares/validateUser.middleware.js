import { RegistrationPasswordTooLongError, UserCredentialsInvalidError, PendingRegistrationCodeInvalidError } from "../errors/user.errors.js";
import { isEmail } from 'validator';

const MAX_PASSWORD_LENGTH = 72;

export function validateUserRequest(req, res, next) {
    const { email, password } = req.body;


    if (typeof email !== "string" || !isEmail(email) || typeof password !== "string" || password.length === 0) {
        return next(new UserCredentialsInvalidError());
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
        return next(new RegistrationPasswordTooLongError());
    }

    req.validatedBody = {
        email: email.trim(),
        password
    };

    next();
}



export function validateUserVerificationRequest(req, res, next) {
    const { verificationCode, email } = req.body;


    if (typeof email !== "string" || !isEmail(email) || typeof verificationCode !== "string" || verificationCode.length !== 6) {
        return next(new PendingRegistrationCodeInvalidError());
    }

    req.validatedBody = {
        verificationCode,
        email: email.trim(),
    };
    next();
}

