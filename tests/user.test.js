import { test, expect, beforeEach, vi } from 'vitest';
import * as UserService from '../services/user.service.js';
import * as EmailService from '../services/email.service.js';
import prisma from '../db/prisma.js';
import * as UserError from '../errors/user.errors.js';
import * as RegistrationError from '../errors/registration.errors.js';


// intercept the email, grab the code instead
let capturedCode;
vi.spyOn(EmailService, 'sendRegistrationEmail').mockImplementation(async (email, code) => {
    capturedCode = code;
});

const testEmail = 'vyombudha700@gmail.com';
const testPassword = 'safepassword@34';

beforeEach(async () => {
    capturedCode = null;
    await prisma.pendingUserRegistrations.deleteMany({ where: { email: testEmail } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
});

test("INITIATE USER : should initiate registration", async () => {
    await UserService.initiateUser(testEmail, testPassword);
    expect(capturedCode).toBeDefined();
    expect(capturedCode).toHaveLength(6);
});

test("VERIFY USER: should verify and create user", async () => {
    await UserService.initiateUser(testEmail, testPassword);

    const user = await UserService.verifyAndCreateUser(capturedCode, testEmail);
    expect(user.email).toBe(testEmail);
});



test("LOGIN USER: should login successfully", async () => {
    await UserService.initiateUser(testEmail, testPassword);
    await UserService.verifyAndCreateUser(capturedCode, testEmail);

    const result = await UserService.login(testEmail, testPassword);
    expect(result.success).toBe(true);
    expect(result.user.email).toBe(testEmail);
    expect(result.user.passwordHash).toBeUndefined(); // make sure hash is stripped
});




test("WRONG CREDENTIALS ON VERIFY: should throw RegistrationError.NotFound()", async () => {


    await UserService.initiateUser(testEmail, testPassword);
    await expect(
        UserService.verifyAndCreateUser(capturedCode, 'justsomerandomEmail')
    ).rejects.toThrow(RegistrationError.NotFound);

})


test("EXPIRED VERIFICATION CODE: should throw RegistrationError.Expired()", async () => {


    await UserService.initiateUser(testEmail, testPassword);

    await prisma.pendingUserRegistrations.update({
        where: { email: testEmail },
        data: { expiresAt: new Date(Date.now() - 1000) } // 1 second in the past
    });


    await expect(
        UserService.verifyAndCreateUser(capturedCode, testEmail)
    ).rejects.toThrow(RegistrationError.Expired);
});



test("INVALID VERIFICATION CODE: should throw RegistrationError.CodeInvalid()", async () => {
    await UserService.initiateUser(testEmail, testPassword);
    await expect(
        UserService.verifyAndCreateUser('wrongCode', testEmail)
    ).rejects.toThrow(RegistrationError.CodeInvalid);
});


test("TRYING TO REGISTER AS VERIFIED USER: should throw UserError.AlreadyExists()", async () => {

    await UserService.initiateUser(testEmail, testPassword);
    await UserService.verifyAndCreateUser(capturedCode, testEmail);

    await UserService.login(testEmail, testPassword);


    await expect(
        UserService.initiateUser(testEmail, testPassword)
    ).rejects.toThrow(UserError.AlreadyExists);
});

test("TRYING TO LOGIN AS INVALID EMAIL: should throw UserError.NotFound()", async () => {

    await expect(
        UserService.login('invalidEmail', 'randompassword')
    ).rejects.toThrow(UserError.NotFound);
})


test("TRYING TO LOGIN WITH WRONG PASSWORD: should throw UserError.InvalidCredentials()", async () => {

    await UserService.initiateUser(testEmail, testPassword);
    await UserService.verifyAndCreateUser(capturedCode, testEmail);


    await expect(
        UserService.login(testEmail, 'wrongPassword')
    ).rejects.toThrow(UserError.InvalidCredentials);
})