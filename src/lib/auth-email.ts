import crypto from 'node:crypto';
import dbConnect from '@/lib/db';
import AuthToken from '@/models/AuthToken';
import User from '@/models/User';
import { Resend } from 'resend';

type AuthTokenType = 'verify_email' | 'reset_password';

function escapeHtml(value: string) {
        return value
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
}

function buildStuddyEmailTemplate(params: {
        title: string;
        subtitle: string;
        ctaLabel: string;
        ctaUrl: string;
        footerNote: string;
        greeting?: string;
}) {
        const { title, subtitle, ctaLabel, ctaUrl, footerNote, greeting } = params;
        const safeGreeting = greeting ? escapeHtml(greeting) : 'Hi there,';
        const safeTitle = escapeHtml(title);
        const safeSubtitle = escapeHtml(subtitle);
        const safeCtaLabel = escapeHtml(ctaLabel);
        const safeFooterNote = escapeHtml(footerNote);

        return `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${safeTitle}</title>
    </head>
    <body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1F2937;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F3F4F6;padding:24px 12px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #E5E7EB;border-radius:24px;overflow:hidden;">
                        <tr>
                            <td style="padding:28px 28px 12px 28px;text-align:center;">
                                <div style="display:inline-flex;align-items:center;gap:10px;">
                                    <span style="display:inline-block;width:36px;height:36px;line-height:36px;border-radius:10px;background:#4C8233;color:#ffffff;font-weight:800;font-size:18px;text-align:center;">S</span>
                                    <span style="font-size:22px;font-weight:800;color:#2F4F2F;letter-spacing:0.2px;">studdy</span>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:10px 28px 28px 28px;">
                                <p style="margin:0 0 14px 0;font-size:15px;line-height:1.5;color:#4B5563;">${safeGreeting}</p>
                                <h1 style="margin:0 0 10px 0;font-size:24px;line-height:1.2;color:#1F2937;font-weight:800;">${safeTitle}</h1>
                                <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#4B5563;">${safeSubtitle}</p>

                                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 18px 0;">
                                    <tr>
                                        <td style="border-radius:14px;background:#4C8233;">
                                            <a href="${ctaUrl}" style="display:inline-block;padding:12px 18px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">${safeCtaLabel}</a>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin:0 0 10px 0;font-size:12px;line-height:1.6;color:#6B7280;">If the button doesn’t work, copy and paste this URL into your browser:</p>
                                <p style="margin:0 0 18px 0;font-size:12px;line-height:1.6;word-break:break-all;"><a href="${ctaUrl}" style="color:#4C8233;text-decoration:underline;">${ctaUrl}</a></p>
                                <p style="margin:0;font-size:12px;line-height:1.6;color:#6B7280;">${safeFooterNote}</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>`;
}

function buildStuddyEmailText(params: {
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaUrl: string;
    footerNote: string;
    greeting?: string;
}) {
    const { title, subtitle, ctaLabel, ctaUrl, footerNote, greeting } = params;
    return [
        'studdy',
        '',
        greeting || 'Hi there,',
        '',
        title,
        subtitle,
        '',
        `${ctaLabel}: ${ctaUrl}`,
        '',
        footerNote
    ].join('\n');
}

function getBaseUrl() {
    return process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

function getResendClient() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return null;
    return new Resend(apiKey);
}

export function hashRawToken(rawToken: string) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export async function createAuthToken(userId: string, type: AuthTokenType, ttlMinutes: number) {
    await dbConnect();

    await AuthToken.deleteMany({ userId, type, usedAt: { $exists: false } });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashRawToken(rawToken);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await AuthToken.create({
        userId,
        type,
        tokenHash,
        expiresAt
    });

    return rawToken;
}

export async function verifyAuthToken(rawToken: string, type: AuthTokenType) {
    await dbConnect();
    const tokenHash = hashRawToken(rawToken);

    const tokenDoc = await AuthToken.findOne({
        tokenHash,
        type,
        usedAt: { $exists: false },
        expiresAt: { $gt: new Date() }
    });

    if (!tokenDoc) return null;

    tokenDoc.usedAt = new Date();
    await tokenDoc.save();

    return tokenDoc;
}

export async function sendVerificationEmail(userId: string) {
    await dbConnect();
    const user = await User.findById(userId).lean();
    if (!user?.email) return;

    const rawToken = await createAuthToken(userId, 'verify_email', 60 * 24);
    const verifyUrl = `${getBaseUrl()}/verify-email?token=${rawToken}`;

    const resend = getResendClient();
    if (!resend) {
        console.warn('RESEND_API_KEY missing: verification email not sent.');
        return;
    }

    const from = process.env.EMAIL_FROM || 'Studdy <onboarding@resend.dev>';
    const payload = {
        greeting: `Hi ${user.name || 'there'},`,
        title: 'Verify your email',
        subtitle: 'Welcome to Studdy. Confirm your email to activate your account and start studying.',
        ctaLabel: 'Verify my email',
        ctaUrl: verifyUrl,
        footerNote: 'This verification link expires in 24 hours. If you did not create this account, you can ignore this email.'
    };

    await resend.emails.send({
        from,
        to: user.email,
        subject: 'Verify your Studdy email',
        html: buildStuddyEmailTemplate(payload),
        text: buildStuddyEmailText(payload)
    });
}

export async function sendResetPasswordEmail(email: string) {
    await dbConnect();
    const user = await User.findOne({ email }).lean();
    if (!user) return;

    const rawToken = await createAuthToken(user._id.toString(), 'reset_password', 30);
    const resetUrl = `${getBaseUrl()}/reset-password?token=${rawToken}`;

    const resend = getResendClient();
    if (!resend) {
        console.warn('RESEND_API_KEY missing: reset email not sent.');
        return;
    }

    const from = process.env.EMAIL_FROM || 'Studdy <onboarding@resend.dev>';
    const payload = {
        greeting: `Hi ${user.name || 'there'},`,
        title: 'Reset your password',
        subtitle: 'We received a request to reset your Studdy password. Use the button below to set a new one.',
        ctaLabel: 'Reset password',
        ctaUrl: resetUrl,
        footerNote: 'This reset link expires in 30 minutes. If you did not request this, you can safely ignore this email.'
    };

    await resend.emails.send({
        from,
        to: email,
        subject: 'Reset your Studdy password',
        html: buildStuddyEmailTemplate(payload),
        text: buildStuddyEmailText(payload)
    });
}
