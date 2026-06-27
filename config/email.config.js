import 'dotenv/config';
import nodemailer from 'nodemailer';

export const FROM = process.env.SMTP_FROM;


export const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,          // true for port 465
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        from: FROM
    },
});