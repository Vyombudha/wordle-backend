import validator from 'validator';
const { isEmail } = validator;
import * as User from '../errors/user.errors.js';
import * as Registration from '../errors/registration.errors.js';
const MAX_PASSWORD_LENGTH = 72;
const LEAST_PASSWORD_LENGTH = 8;



export function validateUserVerificationRequest(req, _res, next) {
    const { verificationCode, email } = req.body;


    if (typeof email !== "string" || !isEmail(email) || typeof verificationCode !== "string" || verificationCode.length !== 6) {
        return next(new Registration.CodeInvalid());
    }

    req.validatedBody = {
        verificationCode,
        email: email.trim(),
    };
    next();
}




export function validateUserRequest(req, _res, next) {
    const { email, password } = req.body;


    if (typeof email !== "string" || !isEmail(email) || typeof password !== "string" || password.length === 0) {
        return next(new User.InvalidCredentials());
    }

    if (password.length < LEAST_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
        return next(new Registration.InvalidPasswordLength());
    }

    req.validatedBody = {
        email: email.trim(),
        password
    };

    next();
}

