/**
 * Creates in-app notifications and sends matching email alerts.
 */

import { db } from './db.js'
import { getEmailService } from './emailService.js'
import type { NotificationType, OtpPurpose } from './types.js'

export async function notifyUser(opts: {
    userId: string
    title: string
    message: string
    type: NotificationType
    entityType?: string
    entityId?: string
    email?: string
    emailFn?: () => Promise<boolean>
}): Promise<void> {
    await db.notifications.create({
        userId: opts.userId,
        title: opts.title,
        message: opts.message,
        type: opts.type,
        entityType: opts.entityType,
        entityId: opts.entityId,
    })

    if (opts.email && opts.emailFn) {
        await opts.emailFn()
    }
}

export async function sendOtp(email: string, purpose: OtpPurpose): Promise<{ message: string; devOtp?: string }> {
    const emailService = getEmailService()
    const otp = emailService.generateOTP()
    await db.otps.store(email, otp, purpose)
    await emailService.sendOTPEmail(email, otp, purpose)

    const result: { message: string; devOtp?: string } = {
        message: `OTP sent to ${email}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`,
    }

    if (!emailService.isConfigured) {
        result.devOtp = otp
        result.message += ' (SMTP not configured — check server console for OTP)'
    }

    return result
}

export async function verifyOtp(email: string, otp: string, purpose: OtpPurpose): Promise<boolean> {
    return db.otps.verify(email, otp, purpose)
}
