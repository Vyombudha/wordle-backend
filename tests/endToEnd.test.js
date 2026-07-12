import 'dotenv/config';
import { describe, it, expect, vi, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// The ONLY mock in this suite: outbound email. Sending a real email needs
// SMTP egress this environment doesn't have, and even locally there's no
// inbox for us to read the verification code from. Everything downstream —
// real JWT signing/verification, real Postgres via your actual Prisma
// client, real bcrypt hashing, real rate limiters, real Wordle logic — runs
// exactly as it would in prod.
vi.mock('../services/email.service.js', () => ({
    sendRegistrationEmail: vi.fn().mockResolvedValue('fake-message-id'),
}));

import app from '../app.js';
import prisma from '../config/prisma.config.js';
import { sendRegistrationEmail } from '../services/email.service.js';

const TEST_EMAIL = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
const TEST_PASSWORD = 'correct-horse-battery-staple';
const WRONG_PASSWORD = 'definitely-not-the-password';

function extractCookie(res, name) {
    const raw = res.headers['set-cookie']?.find((c) => c.startsWith(`${name}=`));
    return raw ? raw.split(';')[0] : undefined;
}

afterAll(async () => {
    // Best-effort cleanup so repeated runs don't pile up test users.
    // Deleting the User row cascades Game / RefreshToken / Streak per schema.prisma.
    await prisma.pendingUserRegistrations.deleteMany({ where: { email: TEST_EMAIL } }).catch(() => { });
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } }).catch(() => { });
    await prisma.$disconnect();
});

describe('Real workflow: register -> verify -> login -> play -> logout', () => {
    let capturedCode;
    let accessTokenCookie;
    let refreshTokenCookie;
    let gameId;
    let targetWord;

    it('registers a new user (real bcrypt hash, real DB row, email send mocked)', async () => {
        const res = await request(app)
            .post('/api/user/register')
            .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, message: 'Verify your email' });
        expect(sendRegistrationEmail).toHaveBeenCalledTimes(1);

        capturedCode = sendRegistrationEmail.mock.calls[0][1];
        expect(capturedCode).toMatch(/^[A-Z0-9]{6}$/);

        const pending = await prisma.pendingUserRegistrations.findUnique({ where: { email: TEST_EMAIL } });
        expect(pending).not.toBeNull();
        expect(pending.passwordHash).not.toBe(TEST_PASSWORD);
        expect(await bcrypt.compare(TEST_PASSWORD, pending.passwordHash)).toBe(true);
    });

    it('rejects verification with the wrong code', async () => {
        const res = await request(app)
            .post('/api/user/register/verify')
            .send({ email: TEST_EMAIL, verificationCode: '000000' });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({
            success: false,
            message: 'Pending Registration Verification Code or Email Is Invalid',
        });
    });

    it('verifies with the real code, creates the User row, and issues real JWT cookies', async () => {
        const res = await request(app)
            .post('/api/user/register/verify')
            .send({ email: TEST_EMAIL, verificationCode: capturedCode });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Registration Complete');
        expect(res.body.user.email).toBe(TEST_EMAIL);
        expect(res.body.user.passwordHash).toBeUndefined(); // omitted from response

        accessTokenCookie = extractCookie(res, 'accessToken');
        refreshTokenCookie = extractCookie(res, 'refreshToken');
        expect(accessTokenCookie).toBeDefined();
        expect(refreshTokenCookie).toBeDefined();

        // real jwt.verify against the real secret, not a mock
        const rawAccessToken = accessTokenCookie.split('=')[1];
        const decoded = jwt.verify(rawAccessToken, process.env.ACCESS_TOKEN_SECRET);
        expect(decoded.email).toBe(TEST_EMAIL);

        const dbUser = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
        expect(dbUser).not.toBeNull();

        const pending = await prisma.pendingUserRegistrations.findUnique({ where: { email: TEST_EMAIL } });
        expect(pending).toBeNull(); // consumed by the transaction
    });

    it('refuses to register the same email again now that a real User exists', async () => {
        const res = await request(app)
            .post('/api/user/register')
            .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

        expect(res.status).toBe(409);
        expect(res.body).toEqual({ success: false, message: 'User Already Exists In DB' });
    });

    it('rejects login with the wrong password', async () => {
        const res = await request(app)
            .post('/api/user/login')
            .send({ email: TEST_EMAIL, password: WRONG_PASSWORD });

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ success: false, message: 'Invalid Email or Password' });
    });

    it('logs in with the real password and issues a fresh real RefreshToken row', async () => {
        const before = await prisma.refreshToken.count({
            where: { user: { email: TEST_EMAIL } },
        });

        const res = await request(app)
            .post('/api/user/login')
            .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Login Successful');

        accessTokenCookie = extractCookie(res, 'accessToken');
        refreshTokenCookie = extractCookie(res, 'refreshToken');

        const after = await prisma.refreshToken.count({
            where: { user: { email: TEST_EMAIL } },
        });
        expect(after).toBe(before + 1);
    });

    it('rejects a protected route with no token at all', async () => {
        const res = await request(app).get('/api/games');
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ success: false, message: 'Invalid Token Sent From User' });
    });

    it('rejects a protected route with a signature that does not match the real secret', async () => {
        const tampered = jwt.sign({ id: 'fake', email: 'fake@example.com' }, 'wrong-secret-entirely', {
            expiresIn: '1h',
        });

        const res = await request(app).get('/api/games').set('Cookie', `accessToken=${tampered}`);

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ success: false, message: 'Invalid Token Sent From User' });
    });

    it('rejects a protected route with a genuinely expired token (real secret, real expiry check)', async () => {
        const expired = jwt.sign(
            { id: 'fake', email: 'fake@example.com' },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '-10s' },
        );

        const res = await request(app).get('/api/games').set('Cookie', `accessToken=${expired}`);

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ success: false, message: 'Invalid Token Sent' });
    });

    it('starts a real game for the authenticated user', async () => {
        const res = await request(app).post('/api/games').set('Cookie', accessTokenCookie);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        gameId = res.body.gameID;
        expect(gameId).toBeTruthy();

        // Read the real target word straight out of the DB instead of relying
        // on the (huge) real word list files — this keeps the win-path test
        // deterministic without us having to know what's actually in them.
        const dbGame = await prisma.game.findUnique({ where: { id: gameId } });
        expect(dbGame.userId).toBeDefined();
        targetWord = dbGame.targetWord;
        expect(typeof targetWord).toBe('string');
    });

    it('rejects a guess that is not a real dictionary word', async () => {
        const res = await request(app)
            .post(`/api/games/${gameId}/guess`)
            .set('Cookie', accessTokenCookie)
            .send({ guess: 'zzzzz' });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/isn't a valid guess/);
    });

    it('wins the game by guessing the real target word (exercises the streak transaction)', async () => {
        const res = await request(app)
            .post(`/api/games/${gameId}/guess`)
            .set('Cookie', accessTokenCookie)
            .send({ guess: targetWord });

        // NOTE: as of this schema, we expect this to currently FAIL with a 404
        // "User Streak Not Found!, Try Re-Logging" — registration never creates
        // a Streak row for the user, but makeGuess() requires one to exist the
        // moment a game is won. That's a real bug this test is designed to surface.
        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            success: true,
            result: Array(targetWord.length).fill('green'),
            isGameOver: true,
            isWinner: true,
        });

        const streak = await prisma.streak.findUnique({ where: { userId: (await prisma.user.findUnique({ where: { email: TEST_EMAIL } })).id } });
        expect(streak).not.toBeNull();
    });

    it('lists the completed game in the user\'s history', async () => {
        const res = await request(app).get('/api/games').set('Cookie', accessTokenCookie);

        expect(res.status).toBe(200);
        const listed = res.body.games.find((g) => g.id === gameId);
        expect(listed).toBeDefined();
        expect(listed.isCompleted).toBe(true);
    });

    it('deletes the game and confirms it is actually gone from the DB', async () => {
        const res = await request(app).delete(`/api/games/${gameId}`).set('Cookie', accessTokenCookie);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, message: 'Game Deleted Successfully' });

        const dbGame = await prisma.game.findUnique({ where: { id: gameId } });
        expect(dbGame).toBeNull();
    });

    it('logs out, revoking the real refresh token from the DB', async () => {
        const rawRefreshToken = refreshTokenCookie.split('=')[1];

        const res = await request(app)
            .post('/api/user/logout')
            .set('Cookie', [accessTokenCookie, refreshTokenCookie]);

        expect(res.status).toBe(200);

        const stillExists = await prisma.refreshToken.findUnique({ where: { token: rawRefreshToken } });
        expect(stillExists).toBeNull();
    });

    it('detects refresh-token reuse after logout as a leak and wipes all sessions', async () => {
        const res = await request(app)
            .post('/api/user/token/rotate')
            .set('Cookie', refreshTokenCookie);

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ success: false, message: 'Invalid Token Sent From User' });

        const remaining = await prisma.refreshToken.count({
            where: { user: { email: TEST_EMAIL } },
        });
        expect(remaining).toBe(0);
    });
});