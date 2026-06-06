/**
 * VendorBridge Email Service
 * Handles all email communications including invoices, orders, confirmations, requests, and OTPs
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

class EmailService {
  constructor() {
    this.smtpServer = process.env.SMTP_HOST || 'smtp.gmail.com';
    this.smtpPort = parseInt(process.env.SMTP_PORT) || 465;
    this.senderEmail = process.env.SMTP_USER;
    this.senderPassword = process.env.SMTP_PASSWORD;
    this.senderName = process.env.SMTP_FROM_NAME || 'VendorBridge';

    if (!this.senderEmail || !this.senderPassword) {
      throw new Error('SMTP credentials not configured. Set SMTP_USER and SMTP_PASSWORD environment variables.');
    }

    this.transporter = nodemailer.createTransport({
      host: this.smtpServer,
      port: this.smtpPort,
      secure: true, // true for 465 SSL
      auth: {
        user: this.senderEmail,
        pass: this.senderPassword,
      },
    });
  }

  /**
   * Generate a random OTP
   * @param {number} length - Length of OTP (default: 6)
   * @returns {string} Random OTP
   */
  generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return otp;
  }

  /**
   * Send email via SMTP
   * @param {string} toEmail - Recipient email
   * @param {string} subject - Email subject
   * @param {string} htmlContent - HTML content
   * @param {string} textContent - Plain text content (optional)
   * @param {Array} attachments - Array of file paths (optional)
   * @returns {Promise<boolean>} Success status
   */
  async sendEmail(toEmail, subject, htmlContent, textContent = null, attachments = null) {
    try {
      const mailOptions = {
        from: `"${this.senderName}" <${this.senderEmail}>`,
        to: toEmail,
        subject: subject,
        text: textContent,
        html: htmlContent,
        attachments: attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${toEmail}. Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error(`Error sending email to ${toEmail}:`, error);
      return false;
    }
  }

  /**
   * Send OTP email for registration, password reset, or verification
   * @param {string} toEmail - Recipient email
   * @param {string} otp - OTP code
   * @param {string} purpose - Purpose of OTP (registration, password_reset, etc.)
   * @returns {Promise<boolean>} Success status
   */
  async sendOTPEmail(toEmail, otp, purpose = 'registration') {
    const subject = `Your VendorBridge ${purpose.charAt(0).toUpperCase() + purpose.slice(1)} OTP`;
    const currentYear = new Date().getFullYear();

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
      <h1>🔐 VendorBridge</h1>
      <p>Secure ${purpose.charAt(0).toUpperCase() + purpose.slice(1).replace('_', ' ')}</p>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Your One-Time Password (OTP) for <strong>${purpose.replace('_', ' ')}</strong> is:</p>
      <div class="otp-box">${otp}</div>
      <p><strong>This OTP is valid for 10 minutes only.</strong></p>
      <p>If you didn't request this OTP, please ignore this email.</p>
      <p>For security reasons, never share your OTP with anyone.</p>
    </div>
    <div class="footer">
      <p>© ${currentYear} VendorBridge. All rights reserved.</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>`;

    const textContent = `
Your VendorBridge ${purpose.charAt(0).toUpperCase() + purpose.slice(1).replace('_', ' ')} OTP: ${otp}

This OTP is valid for 10 minutes only.
If you didn't request this OTP, please ignore this email.

© ${currentYear} VendorBridge
`;

    return this.sendEmail(toEmail, subject, htmlContent, textContent);
  }

  /**
   * Send registration confirmation email
   * @param {string} toEmail - Recipient email
   * @param {string} userName - User's name
   * @param {string} role - User's role
   * @returns {Promise<boolean>} Success status
   */
  async sendRegistrationConfirmation(toEmail, userName, role) {
    const subject = 'Welcome to VendorBridge - Registration Successful';
    const currentYear = new Date().getFullYear();

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
    .success { color: #4CAF50; font-size: 48px; text-align: center; }
    .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to VendorBridge!</h1>
    </div>
    <div class="content">
      <div class="success">✓</div>
      <h2 style="text-align: center;">Registration Successful</h2>
      <p>Dear <strong>${userName}</strong>,</p>
      <p>Your account has been successfully created with the role of <strong>${role}</strong>.</p>
      <p>You can now log in to your account and start using VendorBridge.</p>
      <h3>What's Next?</h3>
      <ul>
        <li>Complete your profile setup</li>
        <li>Explore the dashboard</li>
        <li>Start creating RFQs (if you're a Procurement Officer)</li>
        <li>Wait for RFQ invitations (if you're a Vendor)</li>
      </ul>
      <p>If you have any questions, please contact our support team.</p>
    </div>
    <div class="footer">
      <p>© ${currentYear} VendorBridge. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    const textContent = `
Welcome to VendorBridge!

Dear ${userName},

Your account has been successfully created with the role of ${role}.

You can now log in to your account and start using VendorBridge.

© ${currentYear} VendorBridge
`;

    return this.sendEmail(toEmail, subject, htmlContent, textContent);
  }

  /**
   * Send RFQ notification to vendor
   * @param {string} toEmail - Recipient email
   * @param {string} vendorName - Vendor's name
   * @param {string} rfqTitle - RFQ title
   * @param {string} deadline - Submission deadline
   * @param {number} rfqId - RFQ ID
   * @returns {Promise<boolean>} Success status
   */
  async sendRFQNotification(toEmail, vendorName, rfqTitle, deadline, rfqId) {
    const subject = `New RFQ: ${rfqTitle}`;

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
    .rfq-box { background: white; border-left: 4px solid #667eea; 
               padding: 20px; margin: 20px 0; }
    .deadline { background: #fff3cd; padding: 15px; border-radius: 5px; 
               margin: 20px 0; border: 1px solid #ffc107; }
    .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 New RFQ Invitation</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${vendorName}</strong>,</p>
      <p>You have been invited to submit a quotation for a new Request for Quotation (RFQ).</p>
      
      <div class="rfq-box">
        <h3>${rfqTitle}</h3>
        <p><strong>RFQ ID:</strong> ${rfqId}</p>
      </div>
      
      <div class="deadline">
        <strong>⚠️ Submission Deadline:</strong> ${deadline}
      </div>
      
      <p>Please log in to your VendorBridge account to view the full RFQ details and submit your quotation.</p>
      <p>Make sure to submit your quotation before the deadline to be considered.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} VendorBridge. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    const textContent = `
New RFQ Invitation

Dear ${vendorName},

You have been invited to submit a quotation for: ${rfqTitle}

RFQ ID: ${rfqId}
Deadline: ${deadline}

Please log in to your VendorBridge account to view details and submit your quotation.

© ${new Date().getFullYear()} VendorBridge
`;

    return this.sendEmail(toEmail, subject, htmlContent, textContent);
  }

  /**
   * Send quotation submission confirmation
   * @param {string} toEmail - Recipient email
   * @param {string} vendorName - Vendor's name
   * @param {string} rfqTitle - RFQ title
   * @param {number} quotationId - Quotation ID
   * @returns {Promise<boolean>} Success status
   */
  async sendQuotationSubmissionConfirmation(toEmail, vendorName, rfqTitle, quotationId) {
    const subject = `Quotation Submitted Successfully - ${rfqTitle}`;
    const currentYear = new Date().getFullYear();
    const submittedOn = new Date().toLocaleString();

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
    .success { color: #4CAF50; font-size: 48px; text-align: center; }
    .details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ Quotation Submitted</h1>
    </div>
    <div class="content">
      <div class="success">✓</div>
      <h2 style="text-align: center;">Submission Successful</h2>
      <p>Dear <strong>${vendorName}</strong>,</p>
      <p>Your quotation has been successfully submitted for:</p>
      
      <div class="details">
        <p><strong>RFQ Title:</strong> ${rfqTitle}</p>
        <p><strong>Quotation ID:</strong> ${quotationId}</p>
        <p><strong>Submitted On:</strong> ${submittedOn}</p>
      </div>
      
      <p>Your quotation is now under review. You will be notified once the approval process is complete.</p>
      <p>You can track the status of your quotation from your dashboard.</p>
    </div>
    <div class="footer">
      <p>© ${currentYear} VendorBridge. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    const textContent = `
Quotation Submitted Successfully

Dear ${vendorName},

Your quotation has been successfully submitted for: ${rfqTitle}

Quotation ID: ${quotationId}
Submitted On: ${submittedOn}

Your quotation is now under review. You will be notified once the approval process is complete.

© ${currentYear} VendorBridge
`;

    return this.sendEmail(toEmail, subject, htmlContent, textContent);
  }

  /**
   * Send approval notification to manager
   * @param {string} toEmail - Recipient email
   * @param {string} approverName - Approver's name
   * @param {number} quotationId - Quotation ID
   * @param {string} vendorName - Vendor's name
   * @param {number} amount - Quotation amount
   * @returns {Promise<boolean>} Success status
   */
  async sendApprovalNotification(toEmail, approverName, quotationId, vendorName, amount) {
    const subject = `Approval Required - Quotation #${quotationId}`;

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
    .approval-box { background: white; border-left: 4px solid #ffc107; 
                   padding: 20px; margin: 20px 0; }
    .amount { font-size: 24px; font-weight: bold; color: #667eea; }
    .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Approval Required</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${approverName}</strong>,</p>
      <p>A quotation requires your approval:</p>
      
      <div class="approval-box">
        <p><strong>Quotation ID:</strong> #${quotationId}</p>
        <p><strong>Vendor:</strong> ${vendorName}</p>
        <p><strong>Total Amount:</strong> <span class="amount">₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
      </div>
      
      <p>Please log in to your VendorBridge account to review and approve or reject this quotation.</p>
      <p>Your timely action is appreciated.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} VendorBridge. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    const textContent = `
Approval Required

Dear ${approverName},

A quotation requires your approval:

Quotation ID: #${quotationId}
Vendor: ${vendorName}
Total Amount: ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Please log in to your VendorBridge account to review and approve or reject this quotation.

© ${new Date().getFullYear()} VendorBridge
`;

    return this.sendEmail(toEmail, subject, htmlContent, textContent);
  }

  /**
   * Send approval result to vendor
   * @param {string} toEmail - Recipient email
   * @param {string} vendorName - Vendor's name
   * @param {number} quotationId - Quotation ID
   * @param {string} status - Approval status (approved/rejected)
   * @param {string} remarks - Approval remarks (optional)
   * @returns {Promise<boolean>} Success status
   */
  async sendApprovalResult(toEmail, vendorName, quotationId, status, remarks = null) {
    const subject = `Quotation ${status.charAt(0).toUpperCase() + status.slice(1)} - #${quotationId}`;
    const statusColor = status === 'approved' ? '#4CAF50' : '#f44336';
    const statusIcon = status === 'approved' ? '✓' : '✗';
    const currentYear = new Date().getFullYear();
    const notificationDate = new Date().toLocaleString();

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${statusColor}; color: white; padding: 30px; 
             text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .status { font-size: 48px; text-align: center; }
    .details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
    .remarks { background: #fff3cd; padding: 15px; border-radius: 5px; 
               margin: 20px 0; border: 1px solid #ffc107; }
    .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${statusIcon} Quotation ${status.charAt(0).toUpperCase() + status.slice(1)}</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${vendorName}</strong>,</p>
      <p>Your quotation has been <strong>${status}</strong>.</p>
      
      <div class="details">
        <p><strong>Quotation ID:</strong> #${quotationId}</p>
        <p><strong>Status:</strong> ${status.charAt(0).toUpperCase() + status.slice(1)}</p>
        <p><strong>Notification Date:</strong> ${notificationDate}</p>
      </div>
      
      ${remarks ? `<div class="remarks"><strong>Remarks:</strong> ${remarks}</div>` : ''}
      
      ${status === 'approved' 
        ? '<p>A Purchase Order will be generated shortly. You will receive another notification with the PO details.</p>'
        : '<p>Please review the remarks and contact us if you have any questions.</p>'}
    </div>
    <div class="footer">
      <p>© ${currentYear} VendorBridge. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    const textContent = `
Quotation ${status.charAt(0).toUpperCase() + status.slice(1)}

Dear ${vendorName},

Your quotation has been ${status}.

Quotation ID: #${quotationId}
Status: ${status.charAt(0).toUpperCase() + status.slice(1)}
Notification Date: ${notificationDate}

${remarks ? `Remarks: ${remarks}` : ''}

${status === 'approved' 
  ? 'A Purchase Order will be generated shortly.'
  : 'Please review the remarks and contact us if you have any questions.'}

© ${currentYear} VendorBridge
`;

    return this.sendEmail(toEmail, subject, htmlContent, textContent);
  }

  /**
   * Send purchase order email with PDF attachment
   * @param {string} toEmail - Recipient email
   * @param {string} vendorName - Vendor's name
   * @param {string} poNumber - PO number
   * @param {string} poDate - PO date
   * @param {string} dueDate - Due date
   * @param {number} amount - Total amount
   * @param {string} pdfPath - Path to PDF file (optional)
   * @returns {Promise<boolean>} Success status
   */
  async sendPurchaseOrder(toEmail, vendorName, poNumber, poDate, dueDate, amount, pdfPath = null) {
    const subject = `Purchase Order ${poNumber}`;

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
    .po-box { background: white; border: 2px solid #667eea; padding: 20px; 
             margin: 20px 0; border-radius: 5px; }
    .amount { font-size: 28px; font-weight: bold; color: #667eea; }
    .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📄 Purchase Order</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${vendorName}</strong>,</p>
      <p>A new Purchase Order has been generated for your approved quotation.</p>
      
      <div class="po-box">
        <p><strong>PO Number:</strong> ${poNumber}</p>
        <p><strong>PO Date:</strong> ${poDate}</p>
        <p><strong>Due Date:</strong> ${dueDate}</p>
        <p><strong>Total Amount:</strong> <span class="amount">₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
      </div>
      
      <p>Please find the detailed Purchase Order attached as a PDF.</p>
      <p>Review the document and ensure you can meet the delivery timeline.</p>
      <p>If you have any questions or concerns, please contact us immediately.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} VendorBridge. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    const textContent = `
Purchase Order ${poNumber}

Dear ${vendorName},

A new Purchase Order has been generated for your approved quotation.

PO Number: ${poNumber}
PO Date: ${poDate}
Due Date: ${dueDate}
Total Amount: ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Please find the detailed Purchase Order attached as a PDF.

© ${new Date().getFullYear()} VendorBridge
`;

    const attachments = pdfPath ? [{ filename: path.basename(pdfPath), path: pdfPath }] : null;
    return this.sendEmail(toEmail, subject, htmlContent, textContent, attachments);
  }

  /**
   * Send invoice email with PDF attachment
   * @param {string} toEmail - Recipient email
   * @param {string} vendorName - Vendor's name
   * @param {string} invoiceNumber - Invoice number
   * @param {string} invoiceDate - Invoice date
   * @param {string} dueDate - Due date
   * @param {number} amount - Total amount
   * @param {string} pdfPath - Path to PDF file (optional)
   * @returns {Promise<boolean>} Success status
   */
  async sendInvoice(toEmail, vendorName, invoiceNumber, invoiceDate, dueDate, amount, pdfPath = null) {
    const subject = `Invoice ${invoiceNumber}`;

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
    .payment-info { background: #e8f5e9; padding: 15px; border-radius: 5px; 
                   margin: 20px 0; border: 1px solid #4CAF50; }
    .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🧾 Invoice Generated</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${vendorName}</strong>,</p>
      <p>An invoice has been generated for the Purchase Order.</p>
      
      <div class="invoice-box">
        <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
        <p><strong>Invoice Date:</strong> ${invoiceDate}</p>
        <p><strong>Due Date:</strong> ${dueDate}</p>
        <p><strong>Total Amount:</strong> <span class="amount">₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
      </div>
      
      <div class="payment-info">
        <strong>💳 Payment Information:</strong>
        <p>Please ensure payment is made by the due date to avoid any late fees.</p>
      </div>
      
      <p>Please find the detailed invoice attached as a PDF.</p>
      <p>If you have any questions, please contact our accounts department.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} VendorBridge. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    const textContent = `
Invoice ${invoiceNumber}

Dear ${vendorName},

An invoice has been generated for the Purchase Order.

Invoice Number: ${invoiceNumber}
Invoice Date: ${invoiceDate}
Due Date: ${dueDate}
Total Amount: ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Please ensure payment is made by the due date.

Please find the detailed invoice attached as a PDF.

© ${new Date().getFullYear()} VendorBridge
`;

    const attachments = pdfPath ? [{ filename: path.basename(pdfPath), path: pdfPath }] : null;
    return this.sendEmail(toEmail, subject, htmlContent, textContent, attachments);
  }

  /**
   * Send password reset email
   * @param {string} toEmail - Recipient email
   * @param {string} userName - User's name
   * @param {string} resetLink - Password reset link
   * @returns {Promise<boolean>} Success status
   */
  async sendPasswordReset(toEmail, userName, resetLink) {
    const subject = 'Password Reset Request - VendorBridge';
    const currentYear = new Date().getFullYear();

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
    .reset-button { display: inline-block; padding: 15px 30px; background: #667eea; 
                   color: white; text-decoration: none; border-radius: 5px; 
                   margin: 20px 0; font-size: 16px; }
    .warning { background: #fff3cd; padding: 15px; border-radius: 5px; 
               margin: 20px 0; border: 1px solid #ffc107; }
    .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔑 Password Reset</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${userName}</strong>,</p>
      <p>We received a request to reset your password for your VendorBridge account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center;">
        <a href="${resetLink}" class="reset-button">Reset Password</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #667eea;">${resetLink}</p>
      
      <div class="warning">
        <strong>⚠️ Important:</strong>
        <ul>
          <li>This link is valid for 1 hour only</li>
          <li>If you didn't request this reset, please ignore this email</li>
          <li>Never share your password with anyone</li>
        </ul>
      </div>
    </div>
    <div class="footer">
      <p>© ${currentYear} VendorBridge. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    const textContent = `
Password Reset Request

Dear ${userName},

We received a request to reset your password for your VendorBridge account.

Click the link below to reset your password:
${resetLink}

This link is valid for 1 hour only.
If you didn't request this reset, please ignore this email.

© ${currentYear} VendorBridge
`;

    return this.sendEmail(toEmail, subject, htmlContent, textContent);
  }
}

module.exports = EmailService;

// Example usage
if (require.main === module) {
  const emailService = new EmailService();
  
  // Test OTP generation
  const otp = emailService.generateOTP();
  console.log(`Generated OTP: ${otp}`);
  
  // Test email sending (uncomment to test)
  // emailService.sendOTPEmail('test@example.com', otp, 'registration');
  // emailService.sendRegistrationConfirmation('test@example.com', 'John Doe', 'vendor');
  // emailService.sendPurchaseOrder('vendor@example.com', 'Tech Supplies', 'PO-2024-000001', '2024-01-15', '2024-02-15', 50000.00, 'po.pdf');
}
