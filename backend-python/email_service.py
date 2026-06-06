"""
VendorBridge Email Service
Handles all email communications including invoices, orders, confirmations, requests, and OTPs
"""

import smtplib
import os
import random
import string
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional, List, Dict
from datetime import datetime
from jinja2 import Template


class EmailService:
    """Email service for VendorBridge ERP"""
    
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '465'))
        self.sender_email = os.getenv('SMTP_USER')
        self.sender_password = os.getenv('SMTP_PASSWORD')
        self.sender_name = os.getenv('SMTP_FROM_NAME', 'VendorBridge')
        
        if not all([self.sender_email, self.sender_password]):
            raise ValueError("SMTP credentials not configured. Set SMTP_USER and SMTP_PASSWORD environment variables.")
    
    def _create_message(self, to_email: str, subject: str, html_content: str, 
                       text_content: Optional[str] = None, attachments: Optional[List[str]] = None) -> MIMEMultipart:
        """Create email message with HTML and optional attachments"""
        msg = MIMEMultipart('mixed')
        msg['From'] = f"{self.sender_name} <{self.sender_email}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Create alternative part for text and HTML
        alt_part = MIMEMultipart('alternative')
        msg.attach(alt_part)
        
        # Attach plain text version
        if text_content:
            alt_part.attach(MIMEText(text_content, 'plain'))
        
        # Attach HTML version
        alt_part.attach(MIMEText(html_content, 'html'))
        
        # Attach files if provided
        if attachments:
            for file_path in attachments:
                self._attach_file(msg, file_path)
        
        return msg
    
    def _attach_file(self, msg: MIMEMultipart, file_path: str):
        """Attach a file to the email"""
        with open(file_path, 'rb') as f:
            part = MIMEApplication(f.read(), Name=os.path.basename(file_path))
        
        part['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
        msg.attach(part)
    
    def send_email(self, to_email: str, subject: str, html_content: str, 
                   text_content: Optional[str] = None, attachments: Optional[List[str]] = None) -> bool:
        """Send email via SMTP"""
        try:
            msg = self._create_message(to_email, subject, html_content, text_content, attachments)
            
            with smtplib.SMTP_SSL(self.smtp_server, self.smtp_port) as server:
                server.login(self.sender_email, self.sender_password)
                server.sendmail(self.sender_email, to_email, msg.as_string())
            
            return True
        except Exception as e:
            print(f"Error sending email to {to_email}: {e}")
            return False
    
    def generate_otp(self, length: int = 6) -> str:
        """Generate a random OTP"""
        return ''.join(random.choices(string.digits, k=length))
    
    # ==================== EMAIL TEMPLATES ====================
    
    def send_otp_email(self, to_email: str, otp: str, purpose: str = "registration") -> bool:
        """Send OTP for registration, password reset, or verification"""
        subject = f"Your VendorBridge {purpose.title()} OTP"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                         color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .otp-box {{ background: white; border: 2px dashed #667eea; padding: 20px; 
                           text-align: center; font-size: 32px; font-weight: bold; 
                           letter-spacing: 5px; margin: 20px 0; color: #667eea; }}
                .footer {{ text-align: center; padding: 20px; color: #777; font-size: 12px; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #667eea; 
                          color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔐 VendorBridge</h1>
                    <p>Secure {purpose.title()}</p>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>Your One-Time Password (OTP) for <strong>{purpose}</strong> is:</p>
                    <div class="otp-box">{otp}</div>
                    <p><strong>This OTP is valid for 10 minutes only.</strong></p>
                    <p>If you didn't request this OTP, please ignore this email.</p>
                    <p>For security reasons, never share your OTP with anyone.</p>
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} VendorBridge. All rights reserved.</p>
                    <p>This is an automated email. Please do not reply.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Your VendorBridge {purpose.title()} OTP: {otp}
        
        This OTP is valid for 10 minutes only.
        If you didn't request this OTP, please ignore this email.
        
        © {datetime.now().year} VendorBridge
        """
        
        return self.send_email(to_email, subject, html_content, text_content)
    
    def send_registration_confirmation(self, to_email: str, user_name: str, role: str) -> bool:
        """Send registration confirmation email"""
        subject = "Welcome to VendorBridge - Registration Successful"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                         color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .success {{ color: #4CAF50; font-size: 48px; text-align: center; }}
                .footer {{ text-align: center; padding: 20px; color: #777; font-size: 12px; }}
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
                    <p>Dear <strong>{user_name}</strong>,</p>
                    <p>Your account has been successfully created with the role of <strong>{role}</strong>.</p>
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
                    <p>© {datetime.now().year} VendorBridge. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Welcome to VendorBridge!
        
        Dear {user_name},
        
        Your account has been successfully created with the role of {role}.
        
        You can now log in to your account and start using VendorBridge.
        
        © {datetime.now().year} VendorBridge
        """
        
        return self.send_email(to_email, subject, html_content, text_content)
    
    def send_rfq_notification(self, to_email: str, vendor_name: str, rfq_title: str, 
                             deadline: str, rfq_id: int) -> bool:
        """Send RFQ notification to vendor"""
        subject = f"New RFQ: {rfq_title}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                         color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .rfq-box {{ background: white; border-left: 4px solid #667eea; 
                           padding: 20px; margin: 20px 0; }}
                .deadline {{ background: #fff3cd; padding: 15px; border-radius: 5px; 
                           margin: 20px 0; border: 1px solid #ffc107; }}
                .footer {{ text-align: center; padding: 20px; color: #777; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📋 New RFQ Invitation</h1>
                </div>
                <div class="content">
                    <p>Dear <strong>{vendor_name}</strong>,</p>
                    <p>You have been invited to submit a quotation for a new Request for Quotation (RFQ).</p>
                    
                    <div class="rfq-box">
                        <h3>{rfq_title}</h3>
                        <p><strong>RFQ ID:</strong> {rfq_id}</p>
                    </div>
                    
                    <div class="deadline">
                        <strong>⚠️ Submission Deadline:</strong> {deadline}
                    </div>
                    
                    <p>Please log in to your VendorBridge account to view the full RFQ details and submit your quotation.</p>
                    <p>Make sure to submit your quotation before the deadline to be considered.</p>
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} VendorBridge. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        New RFQ Invitation
        
        Dear {vendor_name},
        
        You have been invited to submit a quotation for: {rfq_title}
        
        RFQ ID: {rfq_id}
        Deadline: {deadline}
        
        Please log in to your VendorBridge account to view details and submit your quotation.
        
        © {datetime.now().year} VendorBridge
        """
        
        return self.send_email(to_email, subject, html_content, text_content)
    
    def send_quotation_submission_confirmation(self, to_email: str, vendor_name: str, 
                                               rfq_title: str, quotation_id: int) -> bool:
        """Send confirmation when vendor submits quotation"""
        subject = f"Quotation Submitted Successfully - {rfq_title}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                         color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .success {{ color: #4CAF50; font-size: 48px; text-align: center; }}
                .details {{ background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }}
                .footer {{ text-align: center; padding: 20px; color: #777; font-size: 12px; }}
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
                    <p>Dear <strong>{vendor_name}</strong>,</p>
                    <p>Your quotation has been successfully submitted for:</p>
                    
                    <div class="details">
                        <p><strong>RFQ Title:</strong> {rfq_title}</p>
                        <p><strong>Quotation ID:</strong> {quotation_id}</p>
                        <p><strong>Submitted On:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                    </div>
                    
                    <p>Your quotation is now under review. You will be notified once the approval process is complete.</p>
                    <p>You can track the status of your quotation from your dashboard.</p>
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} VendorBridge. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Quotation Submitted Successfully
        
        Dear {vendor_name},
        
        Your quotation has been successfully submitted for: {rfq_title}
        
        Quotation ID: {quotation_id}
        Submitted On: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        
        Your quotation is now under review. You will be notified once the approval process is complete.
        
        © {datetime.now().year} VendorBridge
        """
        
        return self.send_email(to_email, subject, html_content, text_content)
    
    def send_approval_notification(self, to_email: str, approver_name: str, 
                                   quotation_id: int, vendor_name: str, amount: float) -> bool:
        """Send approval request to manager"""
        subject = f"Approval Required - Quotation #{quotation_id}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                         color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .approval-box {{ background: white; border-left: 4px solid #ffc107; 
                               padding: 20px; margin: 20px 0; }}
                .amount {{ font-size: 24px; font-weight: bold; color: #667eea; }}
                .footer {{ text-align: center; padding: 20px; color: #777; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚠️ Approval Required</h1>
                </div>
                <div class="content">
                    <p>Dear <strong>{approver_name}</strong>,</p>
                    <p>A quotation requires your approval:</p>
                    
                    <div class="approval-box">
                        <p><strong>Quotation ID:</strong> #{quotation_id}</p>
                        <p><strong>Vendor:</strong> {vendor_name}</p>
                        <p><strong>Total Amount:</strong> <span class="amount">₹{amount:,.2f}</span></p>
                    </div>
                    
                    <p>Please log in to your VendorBridge account to review and approve or reject this quotation.</p>
                    <p>Your timely action is appreciated.</p>
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} VendorBridge. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Approval Required
        
        Dear {approver_name},
        
        A quotation requires your approval:
        
        Quotation ID: #{quotation_id}
        Vendor: {vendor_name}
        Total Amount: ₹{amount:,.2f}
        
        Please log in to your VendorBridge account to review and approve or reject this quotation.
        
        © {datetime.now().year} VendorBridge
        """
        
        return self.send_email(to_email, subject, html_content, text_content)
    
    def send_approval_result(self, to_email: str, vendor_name: str, quotation_id: int, 
                            status: str, remarks: Optional[str] = None) -> bool:
        """Send approval result to vendor"""
        subject = f"Quotation {status.title()} - #{quotation_id}"
        
        status_color = "#4CAF50" if status == "approved" else "#f44336"
        status_icon = "✓" if status == "approved" else "✗"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: {status_color}; color: white; padding: 30px; 
                         text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .status {{ font-size: 48px; text-align: center; }}
                .details {{ background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }}
                .remarks {{ background: #fff3cd; padding: 15px; border-radius: 5px; 
                           margin: 20px 0; border: 1px solid #ffc107; }}
                .footer {{ text-align: center; padding: 20px; color: #777; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{status_icon} Quotation {status.title()}</h1>
                </div>
                <div class="content">
                    <p>Dear <strong>{vendor_name}</strong>,</p>
                    <p>Your quotation has been <strong>{status}</strong>.</p>
                    
                    <div class="details">
                        <p><strong>Quotation ID:</strong> #{quotation_id}</p>
                        <p><strong>Status:</strong> {status.title()}</p>
                        <p><strong>Notification Date:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                    </div>
                    
                    {f'<div class="remarks"><strong>Remarks:</strong> {remarks}</div>' if remarks else ''}
                    
                    {'<p>A Purchase Order will be generated shortly. You will receive another notification with the PO details.</p>' if status == 'approved' else '<p>Please review the remarks and contact us if you have any questions.</p>'}
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} VendorBridge. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Quotation {status.title()}
        
        Dear {vendor_name},
        
        Your quotation has been {status}.
        
        Quotation ID: #{quotation_id}
        Status: {status.title()}
        Notification Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        
        {f'Remarks: {remarks}' if remarks else ''}
        
        {'A Purchase Order will be generated shortly.' if status == 'approved' else 'Please review the remarks and contact us if you have any questions.'}
        
        © {datetime.now().year} VendorBridge
        """
        
        return self.send_email(to_email, subject, html_content, text_content)
    
    def send_purchase_order(self, to_email: str, vendor_name: str, po_number: str, 
                           po_date: str, due_date: str, amount: float, 
                           pdf_path: Optional[str] = None) -> bool:
        """Send purchase order email with PDF attachment"""
        subject = f"Purchase Order {po_number}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                         color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .po-box {{ background: white; border: 2px solid #667eea; padding: 20px; 
                         margin: 20px 0; border-radius: 5px; }}
                .amount {{ font-size: 28px; font-weight: bold; color: #667eea; }}
                .footer {{ text-align: center; padding: 20px; color: #777; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📄 Purchase Order</h1>
                </div>
                <div class="content">
                    <p>Dear <strong>{vendor_name}</strong>,</p>
                    <p>A new Purchase Order has been generated for your approved quotation.</p>
                    
                    <div class="po-box">
                        <p><strong>PO Number:</strong> {po_number}</p>
                        <p><strong>PO Date:</strong> {po_date}</p>
                        <p><strong>Due Date:</strong> {due_date}</p>
                        <p><strong>Total Amount:</strong> <span class="amount">₹{amount:,.2f}</span></p>
                    </div>
                    
                    <p>Please find the detailed Purchase Order attached as a PDF.</p>
                    <p>Review the document and ensure you can meet the delivery timeline.</p>
                    <p>If you have any questions or concerns, please contact us immediately.</p>
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} VendorBridge. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Purchase Order {po_number}
        
        Dear {vendor_name},
        
        A new Purchase Order has been generated for your approved quotation.
        
        PO Number: {po_number}
        PO Date: {po_date}
        Due Date: {due_date}
        Total Amount: ₹{amount:,.2f}
        
        Please find the detailed Purchase Order attached as a PDF.
        
        © {datetime.now().year} VendorBridge
        """
        
        attachments = [pdf_path] if pdf_path else None
        return self.send_email(to_email, subject, html_content, text_content, attachments)
    
    def send_invoice(self, to_email: str, vendor_name: str, invoice_number: str, 
                    invoice_date: str, due_date: str, amount: float, 
                    pdf_path: Optional[str] = None) -> bool:
        """Send invoice email with PDF attachment"""
        subject = f"Invoice {invoice_number}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                         color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .invoice-box {{ background: white; border: 2px solid #667eea; padding: 20px; 
                              margin: 20px 0; border-radius: 5px; }}
                .amount {{ font-size: 28px; font-weight: bold; color: #667eea; }}
                .payment-info {{ background: #e8f5e9; padding: 15px; border-radius: 5px; 
                               margin: 20px 0; border: 1px solid #4CAF50; }}
                .footer {{ text-align: center; padding: 20px; color: #777; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🧾 Invoice Generated</h1>
                </div>
                <div class="content">
                    <p>Dear <strong>{vendor_name}</strong>,</p>
                    <p>An invoice has been generated for the Purchase Order.</p>
                    
                    <div class="invoice-box">
                        <p><strong>Invoice Number:</strong> {invoice_number}</p>
                        <p><strong>Invoice Date:</strong> {invoice_date}</p>
                        <p><strong>Due Date:</strong> {due_date}</p>
                        <p><strong>Total Amount:</strong> <span class="amount">₹{amount:,.2f}</span></p>
                    </div>
                    
                    <div class="payment-info">
                        <strong>💳 Payment Information:</strong>
                        <p>Please ensure payment is made by the due date to avoid any late fees.</p>
                    </div>
                    
                    <p>Please find the detailed invoice attached as a PDF.</p>
                    <p>If you have any questions, please contact our accounts department.</p>
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} VendorBridge. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Invoice {invoice_number}
        
        Dear {vendor_name},
        
        An invoice has been generated for the Purchase Order.
        
        Invoice Number: {invoice_number}
        Invoice Date: {invoice_date}
        Due Date: {due_date}
        Total Amount: ₹{amount:,.2f}
        
        Please ensure payment is made by the due date.
        
        Please find the detailed invoice attached as a PDF.
        
        © {datetime.now().year} VendorBridge
        """
        
        attachments = [pdf_path] if pdf_path else None
        return self.send_email(to_email, subject, html_content, text_content, attachments)
    
    def send_password_reset(self, to_email: str, user_name: str, reset_link: str) -> bool:
        """Send password reset email"""
        subject = "Password Reset Request - VendorBridge"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                         color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
                .reset-button {{ display: inline-block; padding: 15px 30px; background: #667eea; 
                               color: white; text-decoration: none; border-radius: 5px; 
                               margin: 20px 0; font-size: 16px; }}
                .warning {{ background: #fff3cd; padding: 15px; border-radius: 5px; 
                           margin: 20px 0; border: 1px solid #ffc107; }}
                .footer {{ text-align: center; padding: 20px; color: #777; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔑 Password Reset</h1>
                </div>
                <div class="content">
                    <p>Dear <strong>{user_name}</strong>,</p>
                    <p>We received a request to reset your password for your VendorBridge account.</p>
                    <p>Click the button below to reset your password:</p>
                    <div style="text-align: center;">
                        <a href="{reset_link}" class="reset-button">Reset Password</a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #667eea;">{reset_link}</p>
                    
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
                    <p>© {datetime.now().year} VendorBridge. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Password Reset Request
        
        Dear {user_name},
        
        We received a request to reset your password for your VendorBridge account.
        
        Click the link below to reset your password:
        {reset_link}
        
        This link is valid for 1 hour only.
        If you didn't request this reset, please ignore this email.
        
        © {datetime.now().year} VendorBridge
        """
        
        return self.send_email(to_email, subject, html_content, text_content)


# Example usage
if __name__ == "__main__":
    # Initialize email service
    email_service = EmailService()
    
    # Test OTP email
    otp = email_service.generate_otp()
    print(f"Generated OTP: {otp}")
    # email_service.send_otp_email("test@example.com", otp, "registration")
    
    # Test other email types
    # email_service.send_registration_confirmation("test@example.com", "John Doe", "vendor")
    # email_service.send_rfq_notification("vendor@example.com", "Tech Supplies", "Office Laptops", "2024-12-31", 1)
    # email_service.send_purchase_order("vendor@example.com", "Tech Supplies", "PO-2024-000001", "2024-01-15", "2024-02-15", 50000.00, "po.pdf")
