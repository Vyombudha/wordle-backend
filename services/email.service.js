import 'dotenv/config';
import { Resend } from 'resend';
import crypto from 'crypto';



const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * This send a registration verficiatin email to the user
 * @param {string} email 
 * @param {string} verificationCode 
 * @returns {undefined}
 */
export async function sendRegistrationEmail(email, verificationCode) {

    const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: "Verify Your Registration For The Wordle DLC platform",
        html: `<h2>Your Verification Code is ${verificationCode}. Please, do not share with others</h2>`
    });
}
