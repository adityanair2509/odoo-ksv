# VendorBridge Email Service Documentation

## Overview

The VendorBridge Email Service handles all email communications including:
- OTPs for registration and verification
- Registration confirmations
- RFQ notifications to vendors
- Quotation submission confirmations
- Approval notifications to managers
- Approval results to vendors
- Purchase orders with PDF attachments
- Invoices with PDF attachments
- Password reset emails

## Prerequisites

### Gmail App Password Setup

Before using the email service, you must generate a Google App Password:

1. Go to your Google Account Settings
2. Click Security in the left menu
3. Ensure 2-Step Verification is turned ON (mandatory)
4. Click on 2-Step Verification
5. Scroll to the bottom and select App passwords
6. Enter a custom name (e.g., "VendorBridge Email Service")
7. Click Create
8. Copy the 16-character code (do not include spaces)

**Important:** 
- Personal Gmail accounts: 500 emails/day limit
- Google Workspace accounts: 2,000 emails/day limit
- Never hardcode the app password in your code - use environment variables

## Configuration

Add the following to your `.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_16_char_app_password_here
SMTP_FROM=VendorBridge <noreply@vendorbridge.com>
SMTP_FROM_NAME=VendorBridge

# OTP Configuration
OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10

# Password Reset Configuration
RESET_TOKEN_EXPIRY_HOURS=1
```

## Python Implementation

### Installation

```bash
cd backend-python
pip install -r requirements.txt
```

### Usage

```python
from email_service import EmailService

# Initialize the email service
email_service = EmailService()

# Generate and send OTP
otp = email_service.generate_otp()
email_service.send_otp_email("user@example.com", otp, "registration")

# Send registration confirmation
email_service.send_registration_confirmation("user@example.com", "John Doe", "vendor")

# Send RFQ notification
email_service.send_rfq_notification(
    to_email="vendor@example.com",
    vendor_name="Tech Supplies Ltd",
    rfq_title="Office Laptops Procurement",
    deadline="2024-12-31",
    rfq_id=1
)

# Send quotation submission confirmation
email_service.send_quotation_submission_confirmation(
    to_email="vendor@example.com",
    vendor_name="Tech Supplies Ltd",
    rfq_title="Office Laptops Procurement",
    quotation_id=1
)

# Send approval notification to manager
email_service.send_approval_notification(
    to_email="manager@example.com",
    approver_name="Manager Name",
    quotation_id=1,
    vendor_name="Tech Supplies Ltd",
    amount=50000.00
)

# Send approval result to vendor
email_service.send_approval_result(
    to_email="vendor@example.com",
    vendor_name="Tech Supplies Ltd",
    quotation_id=1,
    status="approved",
    remarks="Quotation approved. Good pricing and delivery timeline."
)

# Send purchase order with PDF
email_service.send_purchase_order(
    to_email="vendor@example.com",
    vendor_name="Tech Supplies Ltd",
    po_number="PO-2024-000001",
    po_date="2024-01-15",
    due_date="2024-02-15",
    amount=50000.00,
    pdf_path="./pdfs/PO-2024-000001.pdf"
)

# Send invoice with PDF
email_service.send_invoice(
    to_email="vendor@example.com",
    vendor_name="Tech Supplies Ltd",
    invoice_number="INV-2024-000001",
    invoice_date="2024-01-15",
    due_date="2024-02-15",
    amount=59000.00,
    pdf_path="./pdfs/INV-2024-000001.pdf"
)

# Send password reset
email_service.send_password_reset(
    to_email="user@example.com",
    user_name="John Doe",
    reset_link="https://vendorbridge.com/reset-password?token=abc123"
)
```

## Node.js Implementation

### Installation

```bash
cd backend-nodejs
npm install
```

### Usage

```javascript
const EmailService = require('./emailService');

// Initialize the email service
const emailService = new EmailService();

// Generate and send OTP
const otp = emailService.generateOTP();
await emailService.sendOTPEmail('user@example.com', otp, 'registration');

// Send registration confirmation
await emailService.sendRegistrationConfirmation('user@example.com', 'John Doe', 'vendor');

// Send RFQ notification
await emailService.sendRFQNotification(
    'vendor@example.com',
    'Tech Supplies Ltd',
    'Office Laptops Procurement',
    '2024-12-31',
    1
);

// Send quotation submission confirmation
await emailService.sendQuotationSubmissionConfirmation(
    'vendor@example.com',
    'Tech Supplies Ltd',
    'Office Laptops Procurement',
    1
);

// Send approval notification to manager
await emailService.sendApprovalNotification(
    'manager@example.com',
    'Manager Name',
    1,
    'Tech Supplies Ltd',
    50000.00
);

// Send approval result to vendor
await emailService.sendApprovalResult(
    'vendor@example.com',
    'Tech Supplies Ltd',
    1,
    'approved',
    'Quotation approved. Good pricing and delivery timeline.'
);

// Send purchase order with PDF
await emailService.sendPurchaseOrder(
    'vendor@example.com',
    'Tech Supplies Ltd',
    'PO-2024-000001',
    '2024-01-15',
    '2024-02-15',
    50000.00,
    './pdfs/PO-2024-000001.pdf'
);

// Send invoice with PDF
await emailService.sendInvoice(
    'vendor@example.com',
    'Tech Supplies Ltd',
    'INV-2024-000001',
    '2024-01-15',
    '2024-02-15',
    59000.00,
    './pdfs/INV-2024-000001.pdf'
);

// Send password reset
await emailService.sendPasswordReset(
    'user@example.com',
    'John Doe',
    'https://vendorbridge.com/reset-password?token=abc123'
);
```

## Email Types

### 1. OTP Emails
- **Purpose:** Registration, email verification, password reset
- **Validity:** 10 minutes (configurable)
- **Format:** 6-digit numeric code

### 2. Registration Confirmation
- **Purpose:** Confirm successful account creation
- **Sent to:** New users after registration
- **Includes:** User role, next steps

### 3. RFQ Notifications
- **Purpose:** Notify vendors of new RFQ invitations
- **Sent to:** Assigned vendors
- **Includes:** RFQ title, ID, deadline

### 4. Quotation Submission Confirmation
- **Purpose:** Confirm successful quotation submission
- **Sent to:** Vendors after submitting quotation
- **Includes:** Quotation ID, submission timestamp

### 5. Approval Notifications
- **Purpose:** Notify managers of pending approvals
- **Sent to:** Managers/Approvers
- **Includes:** Quotation ID, vendor name, amount

### 6. Approval Results
- **Purpose:** Notify vendors of approval/rejection
- **Sent to:** Vendors
- **Includes:** Status, remarks (if any)

### 7. Purchase Orders
- **Purpose:** Send approved purchase orders
- **Sent to:** Vendors
- **Includes:** PO number, dates, amount, PDF attachment

### 8. Invoices
- **Purpose:** Send generated invoices
- **Sent to:** Vendors
- **Includes:** Invoice number, dates, amount, PDF attachment

### 9. Password Reset
- **Purpose:** Allow users to reset passwords
- **Sent to:** Users requesting reset
- **Includes:** Reset link (valid for 1 hour)

## Email Templates

All emails use professional HTML templates with:
- Responsive design
- Brand colors (purple gradient)
- Clear call-to-action buttons
- Professional formatting
- Alternative plain text versions

## Error Handling

Both implementations return `true` on success and `false` on failure. Errors are logged to the console.

### Python Error Handling
```python
success = email_service.send_email(to_email, subject, html_content, text_content)
if not success:
    # Handle failure
    print("Failed to send email")
```

### Node.js Error Handling
```javascript
const success = await emailService.sendEmail(toEmail, subject, htmlContent, textContent);
if (!success) {
    // Handle failure
    console.log('Failed to send email');
}
```

## Security Best Practices

1. **Never hardcode credentials** - Always use environment variables
2. **Use HTTPS** for all reset links and application URLs
3. **Validate email addresses** before sending
4. **Rate limit OTP requests** to prevent abuse
5. **Log all email attempts** for audit purposes
6. **Use secure SMTP** (SSL/TLS) - port 465 for SSL
7. **Set reasonable expiry times** for OTPs and reset links
8. **Monitor sending limits** to avoid hitting Gmail caps

## Testing

### Python Test
```python
from email_service import EmailService

email_service = EmailService()
otp = email_service.generate_otp()
print(f"Generated OTP: {otp}")
# Uncomment to test actual email sending
# email_service.send_otp_email("your-test-email@gmail.com", otp, "test")
```

### Node.js Test
```javascript
const EmailService = require('./emailService');

const emailService = new EmailService();
const otp = emailService.generateOTP();
console.log(`Generated OTP: ${otp}`);
// Uncomment to test actual email sending
// emailService.sendOTPEmail('your-test-email@gmail.com', otp, 'test');
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify 2-Step Verification is enabled
   - Ensure App Password is correct (16 characters, no spaces)
   - Check SMTP_USER and SMTP_PASSWORD in .env

2. **Connection Timeout**
   - Check SMTP_HOST and SMTP_PORT
   - Verify network connectivity
   - Check firewall settings

3. **Email Not Received**
   - Check spam/junk folder
   - Verify recipient email address
   - Check Gmail sending limits

4. **PDF Attachment Issues**
   - Verify file path is correct
   - Ensure file exists and is readable
   - Check file size limits

## Integration with Backend

### Python Flask Integration
```python
from flask import Flask
from email_service import EmailService

app = Flask(__name__)
email_service = EmailService()

@app.route('/api/send-otp', methods=['POST'])
def send_otp():
    data = request.json
    otp = email_service.generate_otp()
    # Store OTP in database/cache with expiry
    email_service.send_otp_email(data['email'], otp, 'registration')
    return jsonify({'success': True})
```

### Node.js Express Integration
```javascript
const express = require('express');
const EmailService = require('./emailService');

const app = express();
const emailService = new EmailService();

app.post('/api/send-otp', async (req, res) => {
    const { email } = req.body;
    const otp = emailService.generateOTP();
    // Store OTP in database/cache with expiry
    await emailService.sendOTPEmail(email, otp, 'registration');
    res.json({ success: true });
});
```

## Rate Limiting

To prevent abuse, implement rate limiting for email-sending endpoints:

- OTP requests: 3 per 10 minutes per email
- Password reset: 3 per hour per email
- General emails: 100 per 15 minutes per IP

## Monitoring

Monitor the following metrics:
- Email send success rate
- Email delivery failures
- OTP generation rate
- SMTP connection errors
- Sending limit usage

## Next Steps

1. Set up your Gmail App Password
2. Configure environment variables
3. Test email sending with a test account
4. Integrate with your authentication system
5. Set up PDF generation for POs and invoices
6. Implement rate limiting
7. Add monitoring and logging
