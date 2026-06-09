import { Resend } from 'resend'
import { config } from './config'

const resend = new Resend(config.resend.apiKey)
const FROM = config.resend.from
const APP_URL = config.app.url

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Verify your Indie Film Cinema account',
    html: `
      <h2>Verify your email</h2>
      <p>Click the link below to activate your Indie Film Cinema filmmaker account:</p>
      <a href="${verifyUrl}" style="background:#E63946;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
      <p>If you did not create an account, you can ignore this email.</p>
    `,
  })
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Reset your Indie Film Cinema password',
    html: `
      <h2>Reset your password</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background:#E63946;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
        Reset Password
      </a>
      <p>This link expires in 1 hour.</p>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
    `,
  })
}

export async function sendWelcomeEmail(
  email: string,
  fullName: string
): Promise<void> {
  const dashboardUrl = `${APP_URL}/dashboard`
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Welcome — your Indie Film Cinema account is active',
    html: `
      <h2>Welcome, ${fullName}!</h2>
      <p>Your $6.50/month subscription is now active. You can start submitting your films.</p>
      <a href="${dashboardUrl}" style="background:#E63946;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
        Go to Dashboard
      </a>
    `,
  })
}

export async function sendPaymentFailedEmail(
  email: string,
  fullName: string
): Promise<void> {
  const subscribeUrl = `${APP_URL}/subscribe`
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Action required: payment failed for your subscription',
    html: `
      <h2>Hi ${fullName},</h2>
      <p>Your monthly payment for Indie Film Cinema failed. Your upload access has been paused.</p>
      <p>Please update your billing details to restore access:</p>
      <a href="${subscribeUrl}" style="background:#E63946;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
        Update Billing
      </a>
    `,
  })
}

export async function sendSubscriptionCancelledEmail(
  email: string,
  fullName: string
): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Your Indie Film Cinema subscription has been cancelled',
    html: `
      <h2>Hi ${fullName},</h2>
      <p>Your subscription has been cancelled. Your access will continue until the end of your current billing period.</p>
      <p>You can resubscribe at any time from your account settings.</p>
    `,
  })
}

export async function sendSubmissionConfirmationEmail(
  email: string,
  fullName: string,
  filmTitle: string
): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Film received: ${filmTitle}`,
    html: `
      <h2>Hi ${fullName},</h2>
      <p>We've received your film submission: <strong>${filmTitle}</strong>.</p>
      <p>Our team will review your submission and publish it to the platform. No further action is required from you.</p>
      <p>You can view your submission status in your <a href="${config.app.url}/dashboard">dashboard</a>.</p>
    `,
  })
}
