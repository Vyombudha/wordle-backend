import jwt, { TokenExpiredError } from 'jsonwebtoken';

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
        { id: user.id, email: user.email },
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