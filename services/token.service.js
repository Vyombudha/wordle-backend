import 'dotenv/config';
import { verifyRefreshToken } from '../utils/jwt.utils.js';
import prisma from '../config/prisma.config.js';
import * as TokenError from '../errors/token.errors.js';
import { getAccessToken, getRefreshToken } from '../utils/jwt.utils.js';
import { daysToMs } from '../utils/timeCalculator.utils.js';

const getExpiryDate = () => new Date(Date.now() + daysToMs(7)); // 7 days


/**  @typedef { import('../services/user.service.js').User } User */


/**
 * 
 * @param {User} user 
 * @returns {Promise<{ refreshToken: string, accessToken: string }>}
 */
export async function signAndStoreRefreshTokens(user) {
    const { id } = user;
    const refreshToken = getRefreshToken(user);
    const accessToken = getAccessToken(user);

    await prisma.refreshToken.create({
        data: {
            userId: id,
            token: refreshToken,
            expiresAt: getExpiryDate()
        }
    });

    return { refreshToken, accessToken };
}

/**
 * 
 * @param {string} oldRefreshToken 
 */
export async function rotateRefreshToken(oldRefreshToken) {
    const result = verifyRefreshToken(oldRefreshToken);

    if (!result.valid) {
        throw new TokenError.Invalid();
    }

    const user = {
        email: result.decoded.email,
        id: result.decoded.id
    }


    // if cryptographically valid, check for in DB
    const token = await prisma.refreshToken.findUnique({
        where: {
            token: oldRefreshToken
        }
    });

    // this token doesn't exist in DB (i.e it has been revoked via logout before) 
    // this a token leak condition, delete all existing tokens for this user and throw error
    if (!token) {
        await prisma.refreshToken.deleteMany({
            where: {
                userId: user.id
            }
        });
        throw new TokenError.Invalid();
    }

    const newRefreshToken = getRefreshToken(user);
    const newAccessToken = getAccessToken(user);

    await prisma.$transaction([
        prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: newRefreshToken,
                expiresAt: getExpiryDate()
            }
        }),
        prisma.refreshToken.delete({
            where: {
                token: oldRefreshToken
            }
        })
    ]);


    return {
        refreshToken: newRefreshToken,
        accessToken: newAccessToken
    }
}


/**
 * Revokes Current Session
 * @param {string} userId
 * @param {string} refreshToken 
 */
export async function revokeRefreshToken(userId, refreshToken) {
    await prisma.refreshToken.deleteMany({
        where: {
            token: refreshToken,
            userId
        }
    });
}


/**
 * Revokes All Sessions accross devices
 * @param {string} userId
 */21
export async function revokeAllRefreshTokens(userId) {
    await prisma.refreshToken.deleteMany({
        where: {
            userId
        }
    });
}

