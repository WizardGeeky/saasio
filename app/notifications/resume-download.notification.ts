import { sendEmail } from "./email.notification";

export interface ResumeDownloadEmailData {
    userEmail: string;
    userName: string;
    resumeName: string;
    resumeTitle: string;
    templateName: string;
    fileName: string;
    pdfBuffer: Buffer;
}

export async function sendResumeDownloadEmail(data: ResumeDownloadEmailData): Promise<void> {
    const fmtDate = new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    await sendEmail({
        to: data.userEmail,
        subject: `Your Resume is Ready — ${data.resumeName || "Resume"}`,
        attachments: [
            {
                filename: data.fileName,
                content: data.pdfBuffer,
                contentType: "application/pdf",
            },
        ],
        html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Resume Download</title>
</head>
<body style="margin:0;padding:0;background:#f0f9ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(79,70,229,0.10);overflow:hidden;max-width:520px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
                <tr>
                  <td style="background:rgba(255,255,255,0.18);border-radius:14px;padding:10px 14px;">
                    <span style="font-size:28px;">&#9649;</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">SAASIO</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Your Resume is Attached</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 6px;color:#111827;font-size:16px;font-weight:600;">Hi ${data.userName || "there"},</p>
              <p style="margin:0 0 28px;color:#4b5563;font-size:15px;line-height:1.6;">
                Your resume has been successfully generated and is attached to this email.
                You can find the PDF attached below.
              </p>

              <!-- Resume Summary Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border:1.5px solid #c4b5fd;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;font-weight:500;">Name</td>
                        <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;">${data.resumeName || "—"}</td>
                      </tr>
                      ${data.resumeTitle ? `
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;font-weight:500;">Title</td>
                        <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;">${data.resumeTitle}</td>
                      </tr>` : ""}
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;font-weight:500;">Template</td>
                        <td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;">${data.templateName}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="border-top:1px solid #ddd6fe;padding:0 0 6px;"></td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;font-weight:500;">Generated On</td>
                        <td style="padding:6px 0;color:#111827;font-size:13px;text-align:right;">${fmtDate}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;font-weight:500;">File</td>
                        <td style="padding:6px 0;color:#4f46e5;font-size:12px;text-align:right;font-family:monospace;">${data.fileName}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Status Badge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" style="background:#ecfdf5;border:1.5px solid #6ee7b7;border-radius:8px;padding:10px 24px;">
                      <tr>
                        <td style="color:#065f46;font-size:14px;font-weight:700;">&#10003;&nbsp; Resume PDF Attached</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;border-top:1px solid #e5e7eb;padding-top:20px;">
                Keep this email as a backup copy of your resume. You can download additional
                copies anytime from your SAASIO dashboard.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                &copy; ${new Date().getFullYear()} SAASIO. All rights reserved.
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
