import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false, // TLS via STARTTLS on port 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export interface EmailAttachment {
    filename: string;
    content: Buffer | string;
    encoding?: string;
    contentType?: string;
}

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    attachments?: EmailAttachment[];
}

export async function sendEmail(options: EmailOptions): Promise<void> {
    await transporter.sendMail({
        from: `"SAASIO" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        ...(options.attachments?.length ? { attachments: options.attachments } : {}),
    });
}
