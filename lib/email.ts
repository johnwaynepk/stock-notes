import nodemailer from "nodemailer";

/**
 * Sends a password-reset email via SMTP.
 * Configure with env vars:
 *   SMTP_HOST, SMTP_PORT (default 587), SMTP_SECURE (true|false),
 *   SMTP_USER, SMTP_PASS, SMTP_FROM (optional, falls back to SMTP_USER)
 *
 * Returns true if sent, false if SMTP is not configured.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<boolean> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return false; // email not configured — caller shows link on screen
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Reset your password — Stock Watchlist",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Reset your password</h2>
        <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#22c55e;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Reset Password</a>
        <p style="margin-top:24px;color:#666;font-size:13px">If you didn't request a password reset, you can safely ignore this email.</p>
        <p style="color:#666;font-size:13px">Or copy this link: ${resetUrl}</p>
      </div>
    `,
  });

  return true;
}
