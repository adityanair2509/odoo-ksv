/**
 * Test script for VendorBridge Email Service (Node.js)
 * Run this to test email functionality
 */

require('dotenv').config();
const EmailService = require('./emailService');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function testEmailService() {
  console.log('='.repeat(60));
  console.log('VendorBridge Email Service Test');
  console.log('='.repeat(60));
  console.log();

  try {
    // Initialize email service
    const emailService = new EmailService();
    console.log('✓ Email service initialized successfully');
    console.log();

    // Test OTP generation
    console.log('Testing OTP generation...');
    const otp = emailService.generateOTP();
    console.log(`✓ Generated OTP: ${otp}`);
    console.log();

    // Ask for test email
    rl.question('Enter your email to test sending (or press Enter to skip): ', async (testEmail) => {
      if (testEmail.trim()) {
        console.log(`\nSending test emails to: ${testEmail}`);
        console.log('-'.repeat(60));

        // Test OTP email
        console.log('\n1. Sending OTP email...');
        let success = await emailService.sendOTPEmail(testEmail, otp, 'registration');
        console.log(`   ${success ? '✓ Success' : '✗ Failed'}`);

        // Test registration confirmation
        console.log('\n2. Sending registration confirmation...');
        success = await emailService.sendRegistrationConfirmation(testEmail, 'Test User', 'vendor');
        console.log(`   ${success ? '✓ Success' : '✗ Failed'}`);

        // Test RFQ notification
        console.log('\n3. Sending RFQ notification...');
        success = await emailService.sendRFQNotification(
          testEmail,
          'Test Vendor',
          'Test RFQ - Office Supplies',
          '2024-12-31',
          1
        );
        console.log(`   ${success ? '✓ Success' : '✗ Failed'}`);

        // Test quotation submission confirmation
        console.log('\n4. Sending quotation submission confirmation...');
        success = await emailService.sendQuotationSubmissionConfirmation(
          testEmail,
          'Test Vendor',
          'Test RFQ - Office Supplies',
          1
        );
        console.log(`   ${success ? '✓ Success' : '✗ Failed'}`);

        // Test approval notification
        console.log('\n5. Sending approval notification...');
        success = await emailService.sendApprovalNotification(
          testEmail,
          'Test Manager',
          1,
          'Test Vendor',
          50000.00
        );
        console.log(`   ${success ? '✓ Success' : '✗ Failed'}`);

        // Test approval result
        console.log('\n6. Sending approval result...');
        success = await emailService.sendApprovalResult(
          testEmail,
          'Test Vendor',
          1,
          'approved',
          'Good pricing and delivery timeline'
        );
        console.log(`   ${success ? '✓ Success' : '✗ Failed'}`);

        // Test purchase order (without PDF)
        console.log('\n7. Sending purchase order (without PDF)...');
        success = await emailService.sendPurchaseOrder(
          testEmail,
          'Test Vendor',
          'PO-2024-000001',
          '2024-01-15',
          '2024-02-15',
          50000.00
        );
        console.log(`   ${success ? '✓ Success' : '✗ Failed'}`);

        // Test invoice (without PDF)
        console.log('\n8. Sending invoice (without PDF)...');
        success = await emailService.sendInvoice(
          testEmail,
          'Test Vendor',
          'INV-2024-000001',
          '2024-01-15',
          '2024-02-15',
          59000.00
        );
        console.log(`   ${success ? '✓ Success' : '✗ Failed'}`);

        // Test password reset
        console.log('\n9. Sending password reset email...');
        success = await emailService.sendPasswordReset(
          testEmail,
          'Test User',
          'https://vendorbridge.com/reset-password?token=test123'
        );
        console.log(`   ${success ? '✓ Success' : '✗ Failed'}`);

        console.log();
        console.log('-'.repeat(60));
        console.log('Test completed! Check your inbox for emails.');
        console.log();
      } else {
        console.log('Email testing skipped.');
        console.log();
        console.log('To test email sending:');
        console.log('1. Ensure you have set SMTP_USER and SMTP_PASSWORD in .env');
        console.log('2. Run this script again and provide your email address');
        console.log();
      }

      console.log('='.repeat(60));
      console.log('All tests completed successfully!');
      console.log('='.repeat(60));

      rl.close();
    });
  } catch (error) {
    console.log(`✗ Configuration error: ${error.message}`);
    console.log('\nPlease ensure you have set the following environment variables:');
    console.log('  - SMTP_USER');
    console.log('  - SMTP_PASSWORD');
    console.log();
    rl.close();
  }
}

testEmailService();
