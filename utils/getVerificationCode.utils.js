import crypto from 'crypto';

/**
 * Returns a 6 character long alphanumeric code; excluding ['0','1','L','I']
 * @returns {string} 
 */
export function getVerificationCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[crypto.randomInt(0, chars.length)];
    }
    return code;
}