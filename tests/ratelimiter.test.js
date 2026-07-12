// tests/rateLimiter.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// mock controllers so no real DB calls happen — we only care about the limiter
vi.mock('../controllers/games.controller.js', () => ({
    getAll: (req, res) => res.status(200).json({ success: true }),
    start: (req, res) => res.status(201).json({ success: true }),
    getGame: (req, res) => res.status(200).json({ success: true }),
    guess: (req, res) => res.status(200).json({ success: true }),
    skip: (req, res) => res.status(200).json({ success: true }),
    remove: (req, res) => res.status(200).json({ success: true }),
}));

vi.mock('../controllers/user.controller.js', () => ({
    initiateUserRegistration: (req, res) => res.status(201).json({ success: true }),
    verifyRegistration: (req, res) => res.status(200).json({ success: true }),
    login: (req, res) => res.status(200).json({ success: true }),
    logout: (req, res) => res.status(200).json({ success: true }),
    logoutAllDevices: (req, res) => res.status(200).json({ success: true }),
    rotateTokens: (req, res) => res.status(200).json({ success: true }),
}));

// stub auth so req.user gets populated like the real middleware would
vi.mock('../middlewares/verifyTokens.middleware.js', () => ({
    validateUserToken: (req, res, next) => {
        req.user = { id: 'test-user-id' };
        next();
    },
}));

// validateUser middleware just passes through
vi.mock('../middlewares/validateUser.middleware.js', () => ({
    validateUserRequest: (req, res, next) => next(),
    validateUserVerificationRequest: (req, res, next) => next(),
}));

const { default: gamesRouter } = await import('../routes/games.route.js');
const { default: userRouter } = await import('../routes/user.route.js');

function buildApp() {
    const app = express();
    app.use(express.json());
    // fake auth injection for game routes — real app presumably does this via middleware upstream
    app.use((req, res, next) => {
        req.user = { id: 'test-user-id' };
        next();
    });
    app.use('/api/games', gamesRouter);
    app.use('/api/user', userRouter);
    return app;
}

describe('guessLimiter (30/min, per user+game)', () => {
    const app = buildApp();

    it('allows requests under the limit', async () => {
        const res = await request(app).post('/api/games/game-A/guess').send({ guess: 'crane' });
        expect(res.status).not.toBe(429);
    });

    it('blocks after exceeding the limit', async () => {
        for (let i = 0; i < 30; i++) {
            await request(app).post('/api/games/game-B/guess').send({ guess: 'crane' });
        }
        const res = await request(app).post('/api/games/game-B/guess').send({ guess: 'crane' });
        expect(res.status).toBe(429);
        expect(res.body.message).toMatch(/slow down/i);
    });

    it('scopes limits per gameID (different game = fresh limit)', async () => {
        for (let i = 0; i < 30; i++) {
            await request(app).post('/api/games/game-C/guess').send({ guess: 'crane' });
        }
        const res = await request(app).post('/api/games/game-D/guess').send({ guess: 'crane' });
        expect(res.status).not.toBe(429);
    });
});

describe('startGameLimiter (10/min, per user)', () => {
    const app = buildApp();

    it('blocks after 10 game starts', async () => {
        for (let i = 0; i < 10; i++) {
            await request(app).post('/api/games');
        }
        const res = await request(app).post('/api/games');
        expect(res.status).toBe(429);
    });
});

describe('authLimiter (10/15min, keyed by email)', () => {
    const app = buildApp();

    it('scopes limits per email — different emails stay independent', async () => {
        for (let i = 0; i < 10; i++) {
            await request(app).post('/api/user/login').send({ email: 'a@test.com', password: 'x' });
        }
        const blocked = await request(app).post('/api/user/login').send({ email: 'a@test.com', password: 'x' });
        expect(blocked.status).toBe(429);

        const stillOk = await request(app).post('/api/user/login').send({ email: 'b@test.com', password: 'x' });
        expect(stillOk.status).not.toBe(429);
    });

    it('shares the limit across register + login + verify (same limiter instance)', async () => {
        // authLimiter is reused across 3 routes — burning it on one should affect the others
        for (let i = 0; i < 10; i++) {
            await request(app).post('/api/user/register').send({ email: 'c@test.com', password: 'x' });
        }
        const res = await request(app).post('/api/user/login').send({ email: 'c@test.com', password: 'x' });
        expect(res.status).toBe(429);
    });
});