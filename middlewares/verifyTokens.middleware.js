import { verifyAccessToken } from '../utils/jwt.utils.js';
import * as TokenError from '../errors/token.errors.js';

export async function validateUserToken(req, res, next) {
    const { accessToken } = req.cookies;

    if (!accessToken) {
        return next(new TokenError.Invalid());
    }

    const result = verifyAccessToken(accessToken);

    if (!result.valid) {

        if (result.error === "TOKEN_EXPIRED") {
            return next(new TokenError.Expired());
        }
        return next(new TokenError.Invalid());
    }
    req.user = {
        email: result.decoded.email,
        id: result.decoded.id
    }
    next();
}
