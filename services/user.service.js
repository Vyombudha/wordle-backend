import 'dotenv/config';
import { sendRegistrationEmail } from "./email.service.js";
import { getVerificationCode } from '../utils/email.utils.js';
import prisma from "../config/prisma.config.js";
import * as bcrypt from "bcrypt";
import { minutesToMs } from '../utils/timeCalculator.utils.js';
import * as UserError from '../errors/user.errors.js';
import * as RegistrationError from '../errors/registration.errors.js';



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
 * It initiates the userData onto pendingRegistrations State, sends the verification code to user's email
 * @param {string} email 
 * @param {string} password 
 */
export async function initiateUser(email, password) {

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new UserError.AlreadyExists(email);


    // initate the user 
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const userData = { email, passwordHash };


    const verificationCode = getVerificationCode();



    // update if double registration click
    await prisma.pendingUserRegistrations.upsert({
        where: { email },
        update: {
            verificationCode,
            expiresAt: new Date(Date.now() + minutesToMs(60))
        },
        create: {
            email: userData.email,
            passwordHash: userData.passwordHash,
            verificationCode,
            expiresAt: new Date(Date.now() + minutesToMs(60))
        }
    })

    // send the verification email 
    await sendRegistrationEmail(email, verificationCode);
}


/**
 * verifies the user from verficationCode using pendingRegistrations, and registers them onto DB
 * @param {string} verificationCode - 6 characters long code 
 * @param {string} email - Verification Email
 * @returns {Promise<User>}
 */
export async function verifyAndCreate(verificationCode, email) {

    const userEntry = await prisma.pendingUserRegistrations.findUnique({
        where: {
            email
        }
    })


    if (!userEntry) throw new RegistrationError.NotFound(email);


    // check time validity 
    if (Date.now() > userEntry.expiresAt.getTime()) {

        await prisma.pendingUserRegistrations.delete({
            where: { email }
        });
        throw new RegistrationError.Expired(email);
    }

    // check the code itself 
    if (verificationCode !== userEntry.verificationCode) {
        throw new RegistrationError.CodeInvalid();
    }


    try {



        // register the user onto DB
        return await prisma.$transaction(async (tx) => {

            // delete this entry, as it's only one time use
            await tx.pendingUserRegistrations.delete({
                where: {
                    email: userEntry.email
                }
            });


            return tx.user.create({
                data: {
                    email: userEntry.email,
                    passwordHash: userEntry.passwordHash,
                    streak: { create: {} }  // all fields default to 0/null per schema
                },
                omit: {
                    passwordHash: true
                }
            });
        });
    }
    catch (error) {
        if (error.code === 'P2002') throw new UserError.AlreadyExists(email);


        // RACE CONDITION
        // If the token is already gone, Request A probably just finished creating the user.
        // Let's just return this error instead of having too many PRISMA errors in Server log
        if (error.code === 'P2025') throw new RegistrationError.NotFound(email);

        throw error;
    }
}

export async function login(email, password) {

    const user = await prisma.user.findUnique({
        where: { email },

    });
    if (!user) {
        throw new UserError.NotFound();
    }

    const isCorrectPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isCorrectPassword) {
        throw new UserError.InvalidCredentials();
    }

    // safely remove passwordHash from obj before sending to frontEnd
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser };
}
