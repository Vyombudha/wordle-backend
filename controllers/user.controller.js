
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

async function issueSessionResponse(res, user, message) {
    const { refreshToken, accessToken } = await TokenService.signAndStoreRefreshTokens(user);

    res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: ACCESS_TOKEN_EXPIRATION });
    res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTIONS, maxAge: REFRESH_TOKEN_EXPIRATION });

    return res.status(200).json({ success: true, user, message });
};

export async function verifyRegistration(req, res) {
    const { email, verificationCode } = req.validatedBody;
    const user = await UserService.verifyAndCreate(verificationCode, email);
    return issueSessionResponse(res, user, 'Registration Complete');
}

export async function login(req, res) {
    const { email, password } = req.validatedBody;
    const { user } = await UserService.login(email, password);
    return issueSessionResponse(res, user, 'Login Successful');
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


export async function logout(req, res) {
    const { refreshToken } = req.cookies;
    const user = req.user;

    if (refreshToken) {
        await TokenService.revokeRefreshToken(user.id, refreshToken);
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

    await TokenService.revokeAllRefreshTokens(user.id);

    res.clearCookie('accessToken', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    return res.status(200).json({
        success: true,
        message: "Logged out from all devices successfully"
    });
}
