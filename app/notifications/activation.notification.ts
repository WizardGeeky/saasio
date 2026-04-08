import { sendEmail } from "./email.notification";

interface ActivationPayload {
    to: string;        // plain-text email address
    fullname: string;
    activationUrl: string;
}

export async function sendActivationEmail(payload: ActivationPayload): Promise<void> {
    const { to, fullname, activationUrl } = payload;
    const firstName = fullname.split(" ")[0];

    await sendEmail({
        to,
        subject: "Activate your SAASIO account",
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Activate your SAASIO account</title>
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
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">SAASIO</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Almost there!</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 6px;color:#111827;font-size:18px;font-weight:700;">
                Hi ${firstName}! 👋
              </p>
              <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.7;">
                Thank you for signing up for SAASIO. To complete your registration and activate your account, please click the button below.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${activationUrl}"
                      style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:12px;letter-spacing:0.2px;">
                      Activate My Account →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;border-top:1px solid #e5e7eb;padding-top:20px;">
                If the button above doesn't work, copy and paste this link into your browser:
                <br/>
                <a href="${activationUrl}" style="color:#10b981;">${activationUrl}</a>
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
