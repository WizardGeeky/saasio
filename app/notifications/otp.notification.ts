import crypto from "crypto";
import { connectDB } from "@/app/configs/database.config";
import { encrypt } from "@/app/configs/crypto.config";
import { Otp } from "@/models/Otp";
import { sendEmail } from "./email.notification";

function getExpiryMs(): number {
    const minutes = parseInt(process.env.OTP_EXPIRY_MINUTES || "3", 10);
    return minutes * 60 * 1000;
}

export function generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
}

export async function sendOTP(plainEmail: string): Promise<void> {
    await connectDB();

    const otp = generateOTP();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || "3", 10);
    const expiresAt = new Date(Date.now() + getExpiryMs());

    const encryptedEmail = encrypt(plainEmail);
    const encryptedOtp = encrypt(otp);

    // Upsert: replace any existing OTP for this user
    await Otp.findByIdAndUpdate(
        encryptedEmail,
        { _id: encryptedEmail, otp: encryptedOtp, expiresAt },
        { upsert: true, new: true }
    );

    await sendEmail({
        to: plainEmail,
        subject: "Your SAASIO Login OTP",
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SAASIO OTP</title>
</head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(16,185,129,0.10);overflow:hidden;max-width:480px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#10b981,#059669);padding:32px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
                <tr>
                  <td style="background:rgba(255,255,255,0.18);border-radius:14px;padding:10px 14px;">
                    <span style="font-size:28px;">⬡</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">SAASIO</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Secure Login Verification</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 8px;color:#111827;font-size:16px;font-weight:600;">Hello,</p>
              <p style="margin:0 0 28px;color:#4b5563;font-size:15px;line-height:1.6;">
                Use the one-time password below to sign in to your SAASIO account.
                This code is valid for <strong style="color:#059669;">${expiryMinutes} minutes</strong>.
              </p>

              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:2px solid #10b981;border-radius:12px;padding:24px 40px;">
                      <tr>
                        <td style="letter-spacing:16px;font-size:42px;font-weight:800;color:#065f46;font-family:monospace;">
                          ${otp}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;color:#6b7280;font-size:13px;line-height:1.6;border-top:1px solid #e5e7eb;padding-top:20px;">
                If you didn't request this code, you can safely ignore this email.
                Someone may have entered your email by mistake.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © ${new Date().getFullYear()} SAASIO. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
    });
}
