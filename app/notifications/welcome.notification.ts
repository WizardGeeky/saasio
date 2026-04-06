import { sendEmail } from "./email.notification";

interface WelcomePayload {
    to: string;        // plain-text email address
    fullname: string;
    role: string;
    loginUrl: string;
}

export async function sendWelcomeEmail(payload: WelcomePayload): Promise<void> {
    const { to, fullname, role, loginUrl } = payload;
    const firstName = fullname.split(" ")[0];

    await sendEmail({
        to,
        subject: "Welcome to SAASIO — Your account is ready",
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to SAASIO</title>
</head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(16,185,129,0.10);overflow:hidden;max-width:520px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#10b981,#059669);padding:36px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 14px;">
                <tr>
                  <td style="background:rgba(255,255,255,0.18);border-radius:14px;padding:10px 14px;">
                    <span style="font-size:28px;">⬡</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">SAASIO</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">You're officially in.</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">

              <p style="margin:0 0 6px;color:#111827;font-size:18px;font-weight:700;">
                Welcome, ${firstName}! 👋
              </p>
              <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.7;">
                Your SAASIO account has been created by an administrator. You can now sign in and start using the platform.
              </p>

              <!-- Account details card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f0fdf4;border:1px solid #a7f3d0;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:1px;">
                      Your Account Details
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#6b7280;width:80px;">Name</td>
                        <td style="padding:5px 0;font-size:13px;font-weight:600;color:#111827;">${fullname}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#6b7280;">Email</td>
                        <td style="padding:5px 0;font-size:13px;font-weight:600;color:#111827;">${to}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#6b7280;">Role</td>
                        <td style="padding:5px 0;">
                          <span style="font-size:12px;font-weight:700;background:#d1fae5;color:#065f46;padding:2px 10px;border-radius:20px;">
                            ${role}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- How to sign in -->
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">
                How to sign in
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                ${["Enter your registered email address on the login page.", "You will receive a one-time password (OTP) on this email.", "Enter the OTP to access your dashboard."].map((step, i) => `
                <tr>
                  <td style="padding:6px 0;vertical-align:top;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:12px;vertical-align:top;padding-top:1px;">
                          <div style="width:22px;height:22px;background:#10b981;border-radius:50%;text-align:center;line-height:22px;font-size:11px;font-weight:800;color:#fff;">${i + 1}</div>
                        </td>
                        <td style="font-size:13px;color:#4b5563;line-height:1.5;">${step}</td>
                      </tr>
                    </table>
                  </td>
                </tr>`).join("")}
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}"
                      style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:12px;letter-spacing:0.2px;">
                      Sign In to SAASIO →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;border-top:1px solid #e5e7eb;padding-top:20px;">
                This email was sent because an administrator created an account for you on SAASIO.
                If you did not expect this, please contact your administrator.
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
