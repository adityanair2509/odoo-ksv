"""
Test script for VendorBridge Email Service (Python)
Run this to test email functionality
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from email_service import EmailService


def test_email_service():
    """Test all email service functions"""
    
    print("=" * 60)
    print("VendorBridge Email Service Test")
    print("=" * 60)
    print()
    
    try:
        # Initialize email service
        email_service = EmailService()
        print("✓ Email service initialized successfully")
        print()
        
        # Test OTP generation
        print("Testing OTP generation...")
        otp = email_service.generate_otp()
        print(f"✓ Generated OTP: {otp}")
        print()
        
        # Ask for test email
        test_email = input("Enter your email to test sending (or press Enter to skip): ").strip()
        
        if test_email:
            print(f"\nSending test emails to: {test_email}")
            print("-" * 60)
            
            # Test OTP email
            print("\n1. Sending OTP email...")
            success = email_service.send_otp_email(test_email, otp, "registration")
            print(f"   {'✓ Success' if success else '✗ Failed'}")
            
            # Test registration confirmation
            print("\n2. Sending registration confirmation...")
            success = email_service.send_registration_confirmation(test_email, "Test User", "vendor")
            print(f"   {'✓ Success' if success else '✗ Failed'}")
            
            # Test RFQ notification
            print("\n3. Sending RFQ notification...")
            success = email_service.send_rfq_notification(
                test_email, 
                "Test Vendor", 
                "Test RFQ - Office Supplies", 
                "2024-12-31", 
                1
            )
            print(f"   {'✓ Success' if success else '✗ Failed'}")
            
            # Test quotation submission confirmation
            print("\n4. Sending quotation submission confirmation...")
            success = email_service.send_quotation_submission_confirmation(
                test_email,
                "Test Vendor",
                "Test RFQ - Office Supplies",
                1
            )
            print(f"   {'✓ Success' if success else '✗ Failed'}")
            
            # Test approval notification
            print("\n5. Sending approval notification...")
            success = email_service.send_approval_notification(
                test_email,
                "Test Manager",
                1,
                "Test Vendor",
                50000.00
            )
            print(f"   {'✓ Success' if success else '✗ Failed'}")
            
            # Test approval result
            print("\n6. Sending approval result...")
            success = email_service.send_approval_result(
                test_email,
                "Test Vendor",
                1,
                "approved",
                "Good pricing and delivery timeline"
            )
            print(f"   {'✓ Success' if success else '✗ Failed'}")
            
            # Test purchase order (without PDF)
            print("\n7. Sending purchase order (without PDF)...")
            success = email_service.send_purchase_order(
                test_email,
                "Test Vendor",
                "PO-2024-000001",
                "2024-01-15",
                "2024-02-15",
                50000.00
            )
            print(f"   {'✓ Success' if success else '✗ Failed'}")
            
            # Test invoice (without PDF)
            print("\n8. Sending invoice (without PDF)...")
            success = email_service.send_invoice(
                test_email,
                "Test Vendor",
                "INV-2024-000001",
                "2024-01-15",
                "2024-02-15",
                59000.00
            )
            print(f"   {'✓ Success' if success else '✗ Failed'}")
            
            # Test password reset
            print("\n9. Sending password reset email...")
            success = email_service.send_password_reset(
                test_email,
                "Test User",
                "https://vendorbridge.com/reset-password?token=test123"
            )
            print(f"   {'✓ Success' if success else '✗ Failed'}")
            
            print()
            print("-" * 60)
            print("Test completed! Check your inbox for emails.")
            print()
        else:
            print("Email testing skipped.")
            print()
            print("To test email sending:")
            print("1. Ensure you have set SMTP_USER and SMTP_PASSWORD in .env")
            print("2. Run this script again and provide your email address")
            print()
        
        print("=" * 60)
        print("All tests completed successfully!")
        print("=" * 60)
        
    except ValueError as e:
        print(f"✗ Configuration error: {e}")
        print("\nPlease ensure you have set the following environment variables:")
        print("  - SMTP_USER")
        print("  - SMTP_PASSWORD")
        print()
    except Exception as e:
        print(f"✗ Error: {e}")
        print()


if __name__ == "__main__":
    test_email_service()
