import 'dotenv/config';
import { transporter, FROM } from '../config/email.config.js';
import { parseUserName } from '../utils/email.utils.js';


const htmlTemplate = (name, verificationCode) => {
    return `<table border="0" cellpadding="0" cellspacing="0" width="100%"
        style="max-width: 500px; font-family: Arial, sans-serif; color: #333333; font-size: 16px; line-height: 1.5;">
        <tr>
            <td style="padding-bottom: 15px;">
                Hi ${name},
            </td>
        </tr>
        <tr>
            <td style="padding-bottom: 15px;">
                This is your one time verification code:
            </td>
        </tr>
        <tr>
            <td align="center" style="padding: 15px 0 30px 0;">
                <table border="0" cellpadding="0" cellspacing="0" width="260"
                    style="background-color: #cac8c8; border-radius: 4px;">
                    <tr>
                        <td align="center"
                            style="padding: 12px; font-size: 22px; font-weight: bold; color: #111111; letter-spacing: 2px;">
                            ${verificationCode}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom: 30px;">
                This code is only active for 60 minutes. Once the code expires or you enter the wrong code on the
                verification screen, you will have to resubmit registration.
            </td>
        </tr>
        <tr>
            <td style="padding-bottom: 5px;">
                Hope you like the game!
            </td>
        </tr>
        <tr>
            <td style="font-weight: bold;">
                Boardy
            </td>
        </tr>
    </table>`;
};




/**
 * This send a registration verficiatin email to the user
 * @param {string} email 
 * @param {string} verificationCode 
 * @returns {undefined}
 */
export async function sendRegistrationEmail(email, verificationCode) {
    const info = await transporter.sendMail({
        from: FROM,
        to: email,
        subject: 'Verify Your Email',
        text: `Your verification code is ${verificationCode}. Do not share it with anyone.`,
        html: htmlTemplate(parseUserName(email), verificationCode)
    });
    return info.messageId;
}


