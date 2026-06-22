
import * as TokenService from '../services/token.service.js';
import * as UserService from '../services/user.service.js';
import { minutesToMs, daysToMs } from '../utils/timeCalculator.utils.js';

const REFRESH_TOKEN_EXPIRATION = daysToMs(7);
const ACCESS_TOKEN_EXPIRATION = minutesToMs(60);


const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Only true in production (HTTPS)
    sameSite: 'lax'
};


export async function initiateUserRegistration(req, res) {
    const { email, password } = req.validatedBody;
    await UserService.initiateUser(email, password);
    return res.status(200).json({
        success: true,
        message: 'Verify your email'
    });
}


export async function verifyRegistrationAndLoginUser(req, res) {
    const { email, verificationCode } = req.validatedBody;
    const user = await UserService.verifyAndCreateUser(verificationCode, email);
    const { refreshToken, accessToken } = await TokenService.signAndStoreRefreshTokens(user);

    res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_EXPIRATION });
    res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_EXPIRATION });

    return res.status(200).json({
        success: true,
        message: 'Registration complete'
    })

}

export async function loginUser(req, res) {
    const { email, password } = req.validatedBody;
    const data = await UserService.login(email, password);

    const { refreshToken, accessToken } = await TokenService.signAndStoreRefreshTokens(data.user);

    res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_EXPIRATION });
    res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_EXPIRATION });

    res.status(200).json({
        success: true,
        data,
        message: "Login successfull"
    });
}

export async function rotateTokens(req, res) {
    const { refreshToken: oldRefreshToken } = req.cookies;
    const { refreshToken, accessToken } = await TokenService.rotateRefreshToken(oldRefreshToken);


    res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_EXPIRATION });
    res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_EXPIRATION });

    return res.status(200).json({
        success: true,
        message: 'Token rotation complete'
    });
}


export async function logoutUser(req, res) {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
        await TokenService.revokeRefreshToken(refreshToken);
    }

    res.clearCookie('accessToken', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    return res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
}


export async function logoutAllDevices(req, res) {
    const user = req.user;

    await TokenService.revokeAllRefreshTokens(user);

    res.clearCookie('accessToken', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    return res.status(200).json({
        success: true,
        message: "Logged out from all devices successfully"
    });
}