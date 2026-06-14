// TODO: remove DEV_EMAIL_RECIPIENT override 
import 'dotenv/config';
import { sendRegistrationEmail } from "./email.service.js";
import { getVerificationCode } from '../utils/getVerificationCode.utils.js';
import { InvalidCredentialsError, PendingRegistrationCodeInvalidError, PendingRegistrationExpiredError, PendingRegistrationNotFoundError, UserAlreadyExistsError, UserCredentialsInvalidError, UserNotFoundError } from "../errors/user.errors.js";
import prisma from "../db/prisma.js";
import * as bcrypt from "bcrypt";

const devEmail = /** @type {string} */(process.env.DEV_EMAIL_RECIPIENT);

const saltRounds = 10;

/**
 * @typedef {object} User 
 * @property  {string} id
 * @property  {string} email
 * @property  {string} passwordHash
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */



/**
 * @typedef {object} UserEntry
 * @property {{
 * email : string,
 * passwordHash : string}} userData
 * @property {string} verificationCode
 * @property {number} expiresAt
 */
/**
 * A Map to track pending email
 * @type {Map<string, UserEntry >} 
 */
const pendingRegistrations = new Map();


/**
 * It initiates the userData onto pendingRegistrations State, sends the verification code to user's email
 * @param {string} email 
 * @param {string} password 
 */
export async function initiateUser(email, password) {


    // initate the user 
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const userData = { email, passwordHash };


    const verificationCode = getVerificationCode();

    // store in temp state 
    pendingRegistrations.set(userData.email, {
        userData,
        verificationCode,
        expiresAt: Date.now() + 10 * 60 * 1000
    });

    // send the verification email too (DEV FOR NOW)
    await sendRegistrationEmail(devEmail, verificationCode);
}


/**
 * verifies the user from verficationCode using pendingRegistrations, and registers them onto DB
 * @param {string} verificationCode - 6 characters long code 
 * @param {string} email - Verification Email
 * @returns {Promise<User>}
 */
export async function verifyAndCreateUser(verificationCode, email) {

    // check if the userEntry is valid or not! 
    if (!pendingRegistrations.has(email)) throw new PendingRegistrationNotFoundError(email);

    const userEntry = /** @type {UserEntry} */ (pendingRegistrations.get(email));

    // check time validity 
    if (Date.now() > userEntry.expiresAt) {
        pendingRegistrations.delete(email); // delete this entry, as it has now expired
        throw new PendingRegistrationExpiredError(email);
    }

    // check the code itself 
    if (verificationCode !== userEntry.verificationCode) {
        throw new PendingRegistrationCodeInvalidError();
    }


    // delete this entry, as it's only one time use
    pendingRegistrations.delete(email);

    // register the user onto DB
    try {
        const newUser = await prisma.user.create({
            data: userEntry.userData
        });
        return newUser;
    }
    catch (error) {
        if (/** @type {any} */ (error).code === 'P2002') throw new UserAlreadyExistsError(email);
        throw error;
    }
}

export async function login(email, password) {

    const user = await prisma.user.findUnique({
        where: {
            email
        },
    })

    if (!user) {
        throw new UserNotFoundError();
    }

    const isCorrectPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isCorrectPassword) {
        throw new InvalidCredentialsError();
    }

    // safely remove passwordHash from obj before sending to frontEnd
    delete user.passwordHash;

    // user's streak 
    const streak = await prisma.streak.findUnique({
        where: { userId: user.id }
    });

    // their game history
    const userGames = await prisma.game.findMany({
        where: { userId: user.id }
    })

    return {
        success: true,
        user,
        streak,
        userGames
    };

}