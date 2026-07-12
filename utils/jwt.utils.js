import jwt from 'jsonwebtoken';
import crypto from 'crypto';
const { TokenExpiredError } = jwt;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

export function getAccessToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email },
        accessTokenSecret,
        { expiresIn: '1h' }
    );
}

export function getRefreshToken(user) {
    return jwt.sign(
        // jti makes every refresh token unique even if issued for the same
        // user within the same second (e.g. double-submitted login/verify),
        // which previously produced byte-identical tokens and tripped the
        // DB's unique constraint on RefreshToken.token.
        { id: user.id, email: user.email, jti: crypto.randomUUID() },
        refreshTokenSecret,
        { expiresIn: '7d' }
    );
}

export function verifyAccessToken(accessToken) {
    try {
        const decoded = jwt.verify(accessToken, accessTokenSecret);
        return {
            valid: true,
            decoded
        };
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            return {
                valid: false,
                error: 'TOKEN_EXPIRED',
                message: 'Access Token Expired'
            };
        }
        return {
            valid: false,
            error: 'INVALID_TOKEN',
            message: 'Token Verification Failed'
        }

    }
}

export function verifyRefreshToken(refreshToken) {
    try {
        const decoded = jwt.verify(refreshToken, refreshTokenSecret);
        return {
            valid: true,
            decoded
        };
    } catch (error) {
        if (error instanceof TokenExpiredError) {
            return {
                valid: false,
                error: 'TOKEN_EXPIRED',
                message: 'Access Token Expired'
            };
        }
        return {
            valid: false,
            error: 'INVALID_TOKEN',
            message: 'Token Verification Failed'
        }

    }
}