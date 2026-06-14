import { verifyAccessToken } from '../utils/jwt.utils.js';
import { InvalidTokenError, TokenExpiredError } from '../errors/token.errors.js';

export async function validateUserToken(req, res, next) {
    const { accessToken } = req.cookies;

    if (!accessToken) {
        return next(InvalidTokenError());
    }

    const result = verifyAccessToken(accessToken);

    if (!result.valid) {

        if (result.error === "TOKEN_EXPIRED") {
            return next(new TokenExpiredError());
        }
        return next(new InvalidTokenError());
    }
    req.user = {
        email: result.decoded.email,
        id: result.decoded.id
    }
    next();
}
