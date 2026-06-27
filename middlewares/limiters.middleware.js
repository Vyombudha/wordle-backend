// middlewares/rateLimiter.middleware.js
import rateLimit from 'express-rate-limit';

// Strict limiter for sensitive auth actions
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                   // 10 attempts per window
    keyGenerator: (req) => req.body.email ?? req.ip,
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


// Prevent guess spamming — most important one
export const guessLimiter = rateLimit({
    windowMs: 60 * 1000,   // 1 minute
    max: 30,               // 30 guesses/min is already generous
    keyGenerator: (req) => `${req.user?.id}:${req.params.gameID}`, // per user per game
    message: { success: false, message: 'Slow down — too many guesses.' },
    standardHeaders: true,
    legacyHeaders: false
});


// Prevent farming new games
export const startGameLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.user?.id,
    message: { success: false, message: 'Too many games started.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Read endpoints — loose limit just to prevent scraping
export const readLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    keyGenerator: (req) => req.user?.id,
    standardHeaders: true,
    legacyHeaders: false
});
