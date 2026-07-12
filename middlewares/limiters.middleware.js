// middlewares/rateLimiter.middleware.js
import rateLimit from 'express-rate-limit';
import { ipKeyGenerator } from 'express-rate-limit';

// Strict limiter for sensitive auth actions
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                   // 10 attempts per window
    keyGenerator: (req) => req.body.email ?? ipKeyGenerator(req.ip),
    message: {
        success: false,
        message: 'Too many attempts, please try again later.'
    },
    standardHeaders: true,  // sends RateLimit-* headers
    legacyHeaders: false
});

// Slightly looser for token rotation (called silently by client)
export const tokenLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: {
        success: false,
        message: 'Too many token refresh attempts.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
export const guessLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    keyGenerator: (req) => `${req.user?.id ?? ipKeyGenerator(req.ip)}:${req.params.gameID}`,
    message: { success: false, message: 'Slow down — too many guesses.' },
    standardHeaders: true,
    legacyHeaders: false
});

export const startGameLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip),
    message: { success: false, message: 'Too many games started.' },
    standardHeaders: true,
    legacyHeaders: false
});

export const readLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    keyGenerator: (req) => req.user?.id ?? ipKeyGenerator(req.ip),
    standardHeaders: true,
    legacyHeaders: false
});