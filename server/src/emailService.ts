/**
 * VendorBridge Email Service (TypeScript port from beta-2 backend-nodejs/emailService.js)
 * Handles OTP, registration, RFQ, approval, PO, and invoice notifications.
 */

import nodemailer from 'nodemailer'
import type Transporter from 'nodemailer/lib/mailer/index.js'
import type { Attachment } from 'nodemailer/lib/mailer/index.js'
import { env } from './env.js'

export type OtpPurpose = 'registration' | 'password_reset' | 'login' | 'verification'

export class EmailService {
    private transporter: Transporter | null = null

    constructor() {
        if (env.SMTP_USER && env.SMTP_PASSWORD) {
            this.transporter = nodemailer.createTransport({
                host: env.SMTP_HOST,
                port: env.SMTP_PORT,
                secure: env.SMTP_PORT === 465,
                auth: {
                    user: env.SMTP_USER,
                    pass: env.SMTP_PASSWORD,
                },
            })
        }
    }

    get isConfigured(): boolean {
        return this.transporter !== null
    }

    generateOTP(length = env.OTP_LENGTH): string {
        const digits = '0123456789'
        let otp = ''
        for (let i = 0; i < length; i++) {
            otp += digits.charAt(Math.floor(Math.random() * digits.length))
        }
        return otp
    }

    async sendEmail(
        toEmail: string,
        subject: string,
        htmlContent: string,
        textContent?: string,
        attachments?: Attachment[],
    ): Promise<boolean> {
        if (!this.transporter) {
            // eslint-disable-next-line no-console
            console.log(`[email:dev] To: ${toEmail} | Subject: ${subject}`)
            if (textContent) {
                // eslint-disable-next-line no-console
                console.log(`[email:dev] Body:\n${textContent}`)
            }
            if (attachments?.length) {
                // eslint-disable-next-line no-console
                console.log(`[email:dev] Attachments: ${attachments.map((a) => a.filename).join(', ')}`)
            }
            return true
        }

        try {
            const info = await this.transporter.sendMail({
                from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_USER}>`,
                to: toEmail,
                subject,
                text: textContent,
                html: htmlContent,
                attachments,
            })
            // eslint-disable-next-line no-console
            console.log(`Email sent to ${toEmail}. Message ID: ${info.messageId}`)
            return true
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error(`Error sending email to ${toEmail}:`, err)
            return false
        }
    }

    async sendOTPEmail(toEmail: string, otp: string, purpose: OtpPurpose = 'registration'): Promise<boolean> {
        const label = purpose.replace(/_/g, ' ')
        const subject = `Your VendorBridge ${label.charAt(0).toUpperCase() + label.slice(1)} OTP`
        const currentYear = new Date().getFullYear()

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
             color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .otp-box { background: white; border: 2px dashed #667eea; padding: 20px;
               text-align: center; font-size: 32px; font-weight: bold;
               letter-spacing: 5px; margin: 20px 0; color: #667eea; }
    .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>VendorBridge</h1>
      <p>Secure ${label.charAt(0).toUpperCase() + label.slice(1)}</p>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Your One-Time Password (OTP) for <strong>${label}</strong> is:</p>
      <div class="otp-box">${otp}</div>
      <p><strong>This OTP is valid for ${env.OTP_EXPIRY_MINUTES} minutes only.</strong></p>
      <p>If you didn't request this OTP, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>© ${currentYear} VendorBridge. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`

        const textContent = `
Your VendorBridge ${label} OTP: ${otp}

This OTP is valid for ${env.OTP_EXPIRY_MINUTES} minutes only.
If you didn't request this OTP, please ignore this email.

© ${currentYear} VendorBridge
`

        return this.sendEmail(toEmail, subject, htmlContent, textContent)
    }

    async sendRFQNotification(
        toEmail: string,
        vendorName: string,
        rfqTitle: string,
        deadline: string,
        rfqId: string,
    ): Promise<boolean> {
        const subject = `New RFQ: ${rfqTitle}`
        const htmlContent = `
<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;color:#333;">
  <h2>New RFQ Invitation</h2>
  <p>Dear <strong>${vendorName}</strong>,</p>
  <p>You have been invited to submit a quotation for:</p>
  <p><strong>${rfqTitle}</strong> (ID: ${rfqId})</p>
  <p><strong>Deadline:</strong> ${deadline}</p>
  <p>Log in to VendorBridge to view details and submit your quotation.</p>
</body></html>`
        const textContent = `New RFQ: ${rfqTitle}\nDeadline: ${deadline}\nRFQ ID: ${rfqId}`
        return this.sendEmail(toEmail, subject, htmlContent, textContent)
    }

    async sendApprovalNotification(
        toEmail: string,
        managerName: string,
        rfqTitle: string,
        vendorName: string,
        amount: number,
    ): Promise<boolean> {
        const subject = `Approval Required: ${rfqTitle}`
        const htmlContent = `
<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;color:#333;">
  <h2>Approval Required</h2>
  <p>Dear <strong>${managerName}</strong>,</p>
  <p>A quotation from <strong>${vendorName}</strong> for <strong>${rfqTitle}</strong> requires your approval.</p>
  <p><strong>Amount:</strong> ₹${amount.toLocaleString('en-IN')}</p>
  <p>Please log in to VendorBridge to review and decide.</p>
</body></html>`
        const textContent = `Approval required for ${rfqTitle} — ${vendorName} — ₹${amount.toLocaleString('en-IN')}`
        return this.sendEmail(toEmail, subject, htmlContent, textContent)
    }

    async sendApprovalResult(
        toEmail: string,
        vendorName: string,
        rfqTitle: string,
        status: 'approved' | 'rejected',
        remarks?: string,
    ): Promise<boolean> {
        const subject = `Quotation ${status === 'approved' ? 'Approved' : 'Rejected'}: ${rfqTitle}`
        const htmlContent = `
<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;color:#333;">
  <h2>Quotation ${status === 'approved' ? 'Approved' : 'Rejected'}</h2>
  <p>Dear <strong>${vendorName}</strong>,</p>
  <p>Your quotation for <strong>${rfqTitle}</strong> has been <strong>${status}</strong>.</p>
  ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ''}
</body></html>`
        const textContent = `Quotation for ${rfqTitle} ${status}.${remarks ? ` Remarks: ${remarks}` : ''}`
        return this.sendEmail(toEmail, subject, htmlContent, textContent)
    }

    async sendRegistrationPendingToAdmin(
        adminEmail: string,
        firstName: string,
        lastName: string,
        role: string,
        userEmail: string,
        registrationId: string,
    ): Promise<boolean> {
        const reviewUrl = `${env.APP_URL}/registrations`
        const subject = `Action Required: New registration — ${firstName} ${lastName}`
        const htmlContent = `
<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;color:#333;">
  <h2>New Registration Pending Approval</h2>
  <p><strong>${firstName} ${lastName}</strong> has verified their email and is waiting for admin approval.</p>
  <ul>
    <li><strong>Email:</strong> ${userEmail}</li>
    <li><strong>Role:</strong> ${role.replace(/_/g, ' ')}</li>
    <li><strong>Request ID:</strong> ${registrationId}</li>
  </ul>
  <p><a href="${reviewUrl}" style="display:inline-block;background:#667eea;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;">Review Registrations</a></p>
  <p>Or sign in as admin and open <strong>Registrations</strong> in the sidebar.</p>
</body></html>`
        const textContent = `New registration pending: ${firstName} ${lastName} (${userEmail}) as ${role}. Review at ${reviewUrl}`
        return this.sendEmail(adminEmail, subject, htmlContent, textContent)
    }

    async sendRegistrationApproved(toEmail: string, name: string): Promise<boolean> {
        const subject = 'Your VendorBridge account has been approved'
        const htmlContent = `
<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;color:#333;">
  <h2>Account Approved</h2>
  <p>Dear <strong>${name}</strong>,</p>
  <p>Your VendorBridge registration has been approved. You can now sign in using the email and password you chose during registration.</p>
  <p><a href="${env.APP_URL}/login">Sign in to VendorBridge</a></p>
</body></html>`
        const textContent = `Your VendorBridge account has been approved. Sign in at ${env.APP_URL}/login with your registered email and password.`
        return this.sendEmail(toEmail, subject, htmlContent, textContent)
    }

    async sendInvoice(
        toEmail: string,
        vendorName: string,
        invoiceNumber: string,
        invoiceDate: string,
        dueDate: string,
        amount: number,
        pdfBuffer?: Buffer,
    ): Promise<boolean> {
        const subject = `Invoice ${invoiceNumber}`
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
             color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .invoice-box { background: white; border: 2px solid #667eea; padding: 20px;
                   margin: 20px 0; border-radius: 5px; }
    .amount { font-size: 28px; font-weight: bold; color: #667eea; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Invoice Generated</h1></div>
    <div class="content">
      <p>Dear <strong>${vendorName}</strong>,</p>
      <p>An invoice has been generated for your approved quotation.</p>
      <div class="invoice-box">
        <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
        <p><strong>Invoice Date:</strong> ${invoiceDate}</p>
        <p><strong>Due Date:</strong> ${dueDate}</p>
        <p class="amount">₹${amount.toLocaleString('en-IN')}</p>
      </div>
      ${pdfBuffer ? '<p>Please find the invoice PDF attached to this email.</p>' : '<p>Log in to VendorBridge to view and download the invoice.</p>'}
    </div>
  </div>
</body>
</html>`
        const textContent = `Invoice ${invoiceNumber} — ₹${amount.toLocaleString('en-IN')}. Due: ${dueDate}`
        const attachments = pdfBuffer
            ? [{ filename: `${invoiceNumber}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
            : undefined
        return this.sendEmail(toEmail, subject, htmlContent, textContent, attachments)
    }
}

let _instance: EmailService | null = null

export function getEmailService(): EmailService {
    if (!_instance) _instance = new EmailService()
    return _instance
}
