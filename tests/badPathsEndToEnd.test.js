import 'dotenv/config';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';

// Same single mock as the happy-path e2e suite, for the same reason: no real
// SMTP egress here, and no inbox to read a verification code from. Everything
// else — Prisma, JWTs, rate limiters, ownership checks — is real.
vi.mock('../services/email.service.js', () => ({
    sendRegistrationEmail: vi.fn().mockResolvedValue('fake-message-id'),
}));

import app from '../app.js';
import prisma from '../config/prisma.config.js';
import { sendRegistrationEmail } from '../services/email.service.js';

const PASSWORD = 'correct-horse-battery-staple';
const testEmails = [];

function uniqueEmail(tag) {
    const email = `bad-path-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
    testEmails.push(email);
    return email;
}

function extractCookie(res, name) {
    const raw = res.headers['set-cookie']?.find((c) => c.startsWith(`${name}=`));
    return raw ? raw.split(';')[0] : undefined;
}

// Runs the real register -> verify -> login flow through actual HTTP calls,
// same as prod, and hands back a ready-to-use session.
async function registerAndLogin(email, password) {
    const registerRes = await request(app).post('/api/user/register').send({ email, password });
    if (registerRes.status !== 200) {
        throw new Error(`setup: register failed for ${email}: ${JSON.stringify(registerRes.body)}`);
    }

    const call = sendRegistrationEmail.mock.calls.find(([calledEmail]) => calledEmail === email);
    const verificationCode = call[1];

    const verifyRes = await request(app)
        .post('/api/user/register/verify')
        .send({ email, verificationCode });
    if (verifyRes.status !== 200) {
        throw new Error(`setup: verify failed for ${email}: ${JSON.stringify(verifyRes.body)}`);
    }

    const loginRes = await request(app).post('/api/user/login').send({ email, password });
    if (loginRes.status !== 200) {
        throw new Error(`setup: login failed for ${email}: ${JSON.stringify(loginRes.body)}`);
    }

    const accessTokenCookie = extractCookie(loginRes, 'accessToken');
    const dbUser = await prisma.user.findUnique({ where: { email } });

    return { email, accessTokenCookie, userId: dbUser.id };
}

afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: testEmails } } }).catch(() => { });
    await prisma.$disconnect();
});

describe('IDOR: user B cannot act on user A\'s game', () => {
    let userA;
    let userB;
    let gameId;

    beforeAll(async () => {
        userA = await registerAndLogin(uniqueEmail('idor-a'), PASSWORD);
        userB = await registerAndLogin(uniqueEmail('idor-b'), PASSWORD);

        const startRes = await request(app).post('/api/games').set('Cookie', userA.accessTokenCookie);
        gameId = startRes.body.gameID;
    });

    it('blocks GET on another user\'s game', async () => {
        const res = await request(app).get(`/api/games/${gameId}`).set('Cookie', userB.accessTokenCookie);

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ success: false, message: `Game ID:${gameId} not found!` });
    });

    it('blocks guessing on another user\'s game', async () => {
        const res = await request(app)
            .post(`/api/games/${gameId}/guess`)
            .set('Cookie', userB.accessTokenCookie)
            .send({ guess: 'about' });

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ success: false, message: `Game ID:${gameId} not found!` });
    });

    it('blocks skipping another user\'s game', async () => {
        const res = await request(app)
            .post(`/api/games/${gameId}/skip`)
            .set('Cookie', userB.accessTokenCookie);

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ success: false, message: `Game ID:${gameId} not found!` });
    });

    it('blocks deleting another user\'s game, and leaves it untouched', async () => {
        const res = await request(app).delete(`/api/games/${gameId}`).set('Cookie', userB.accessTokenCookie);

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ success: false, message: `Game ID:${gameId} not found!` });

        // Confirm the attempted attack didn't mutate/delete anything.
        const stillThere = await prisma.game.findUnique({ where: { id: gameId } });
        expect(stillThere).not.toBeNull();
        expect(stillThere.userId).toBe(userA.userId);

        const ownerCanStillSeeIt = await request(app)
            .get(`/api/games/${gameId}`)
            .set('Cookie', userA.accessTokenCookie);
        expect(ownerCanStillSeeIt.status).toBe(200);
    });
});

describe('guessing on an already-completed game', () => {
    let user;
    let gameId;

    beforeAll(async () => {
        user = await registerAndLogin(uniqueEmail('completed'), PASSWORD);

        const startRes = await request(app).post('/api/games').set('Cookie', user.accessTokenCookie);
        gameId = startRes.body.gameID;

        // Force completion directly via Prisma rather than playing to a real
        // win, so this test doesn't depend on the streak-creation bug being
        // fixed first — it's testing a different code path entirely.
        await prisma.game.update({
            where: { id: gameId },
            data: { isCompleted: true, isWinner: false },
        });
    });

    it('rejects the guess with a 422 instead of processing it', async () => {
        const res = await request(app)
            .post(`/api/games/${gameId}/guess`)
            .set('Cookie', user.accessTokenCookie)
            .send({ guess: 'about' });

        expect(res.status).toBe(422);
        expect(res.body).toEqual({ success: false, message: 'Invalid Game state: game already completed' });
    });
});

describe('acting on a well-formed but nonexistent gameID', () => {
    let user;
    let fakeId;

    beforeAll(async () => {
        user = await registerAndLogin(uniqueEmail('nonexistent'), PASSWORD);
        fakeId = uuidv4(); // valid UUID shape, guaranteed not to be in the DB
    });

    it('GET returns 404', async () => {
        const res = await request(app).get(`/api/games/${fakeId}`).set('Cookie', user.accessTokenCookie);
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ success: false, message: `Game ID:${fakeId} not found!` });
    });

    it('guess returns 404', async () => {
        const res = await request(app)
            .post(`/api/games/${fakeId}/guess`)
            .set('Cookie', user.accessTokenCookie)
            .send({ guess: 'about' });
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ success: false, message: `Game ID:${fakeId} not found!` });
    });

    it('skip returns 404', async () => {
        const res = await request(app)
            .post(`/api/games/${fakeId}/skip`)
            .set('Cookie', user.accessTokenCookie);
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ success: false, message: `Game ID:${fakeId} not found!` });
    });

    it('delete returns 404', async () => {
        const res = await request(app).delete(`/api/games/${fakeId}`).set('Cookie', user.accessTokenCookie);
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ success: false, message: `Game ID:${fakeId} not found!` });
    });
});

describe('login with an email that was never registered', () => {
    it('returns 404 UserError.NotFound, distinct from a wrong-password 401', async () => {
        const res = await request(app)
            .post('/api/user/login')
            .send({ email: uniqueEmail('never-registered'), password: PASSWORD });

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ success: false, message: 'User Not Found DB' });
    });
});