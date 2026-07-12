import 'dotenv/config';
import { describe, it, expect, vi, afterAll } from 'vitest';
import request from 'supertest';

// Same mock as the other e2e suites: no real SMTP egress, no inbox to read
// the code from. Everything else here is real DB, real JWTs.
vi.mock('../services/email.service.js', () => ({
    sendRegistrationEmail: vi.fn().mockResolvedValue('fake-message-id'),
}));

import app from '../app.js';
import prisma from '../config/prisma.config.js';
import { sendRegistrationEmail } from '../services/email.service.js';

const PASSWORD = 'correct-horse-battery-staple';
const TEST_EMAIL = `collision-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

function extractCookie(res, name) {
    const raw = res.headers['set-cookie']?.find((c) => c.startsWith(`${name}=`));
    return raw ? raw.split(';')[0] : undefined;
}

afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } }).catch(() => { });
    await prisma.$disconnect();
});

describe('regression: refresh tokens must never collide, even when issued in the same instant', () => {
    it('verify immediately followed by login succeeds for the same user (no 500 from a duplicate token)', async () => {
        const registerRes = await request(app)
            .post('/api/user/register')
            .send({ email: TEST_EMAIL, password: PASSWORD });
        expect(registerRes.status).toBe(200);

        const code = sendRegistrationEmail.mock.calls.at(-1)[1];

        // This is the exact original repro: verify's session-issuing call and
        // login's session-issuing call, back-to-back, same user, same tick —
        // previously produced byte-identical refresh tokens.
        const verifyRes = await request(app)
            .post('/api/user/register/verify')
            .send({ email: TEST_EMAIL, verificationCode: code });
        const loginRes = await request(app)
            .post('/api/user/login')
            .send({ email: TEST_EMAIL, password: PASSWORD });

        expect(verifyRes.status).toBe(200);
        expect(loginRes.status).toBe(200); // previously: 500, unique constraint violation

        const verifyRefreshToken = extractCookie(verifyRes, 'refreshToken');
        const loginRefreshToken = extractCookie(loginRes, 'refreshToken');
        expect(verifyRefreshToken).toBeDefined();
        expect(loginRefreshToken).toBeDefined();
        expect(verifyRefreshToken).not.toBe(loginRefreshToken);
    });

    it('two logins fired concurrently for the same user both succeed with distinct tokens', async () => {
        const [resA, resB] = await Promise.all([
            request(app).post('/api/user/login').send({ email: TEST_EMAIL, password: PASSWORD }),
            request(app).post('/api/user/login').send({ email: TEST_EMAIL, password: PASSWORD }),
        ]);

        expect(resA.status).toBe(200);
        expect(resB.status).toBe(200);

        const tokenA = extractCookie(resA, 'refreshToken');
        const tokenB = extractCookie(resB, 'refreshToken');
        expect(tokenA).toBeDefined();
        expect(tokenB).toBeDefined();
        expect(tokenA).not.toBe(tokenB);

        const dbUser = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
        const tokenCount = await prisma.refreshToken.count({ where: { userId: dbUser.id } });
        // 1 from verify + 1 from the earlier sequential login + these 2 concurrent ones
        expect(tokenCount).toBe(4);
    });
});