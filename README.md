# VendorBridge - Procurement & Vendor Management ERP

A comprehensive ERP platform for managing procurement operations, vendor relationships, RFQs, quotations, approvals, purchase orders, and invoices.

## Database Setup

### Prerequisites
- PostgreSQL 14 or higher
- psql command-line tool

### Setup Instructions

1. **Create the database:**
   ```bash
   psql -U postgres
   ```
   Then run:
   ```sql
   CREATE DATABASE vendorbridge;
   \q
   ```

2. **Run the schema:**
   ```bash
   psql -U postgres -d vendorbridge -f schema.sql
   ```

3. **Verify the setup:**
   ```bash
   psql -U postgres -d vendorbridge -c "\dt"
   ```

### Database Schema

The database consists of the following tables:

- **users** - User authentication and role management
- **vendors** - Vendor registration and details
- **rfqs** - Request for Quotations
- **rfq_items** - Line items for RFQs
- **rfq_vendors** - RFQ to vendor assignments
- **quotations** - Vendor quotations
- **quotation_items** - Line items for quotations
- **approvals** - Approval workflow
- **purchase_orders** - Purchase order management
- **invoices** - Invoice generation
- **activity_logs** - Activity tracking (immutable)
- **vendor_ratings** - Vendor performance ratings

### Auto-Generated Fields

- **PO Numbers**: Auto-generated in format `PO-YYYY-NNNNNN` (e.g., `PO-2026-000001`)
- **Invoice Numbers**: Auto-generated in format `INV-YYYY-NNNNNN` (e.g., `INV-2026-000001`)
- **Vendor Ratings**: Automatically updated when new ratings are submitted

### Sample Data

The schema includes sample data for testing:
- 4 users (Admin, Procurement Officer, Manager, Vendor)
- 2 vendors
- 1 RFQ with items
- 1 quotation with items

### Database Triggers

1. **trigger_set_po_number** - Auto-generates PO numbers on insert
2. **trigger_set_invoice_number** - Auto-generates invoice numbers on insert
3. **trigger_update_vendor_rating** - Updates vendor rating when new rating is added

### Indexes

All foreign keys and frequently queried fields are indexed for optimal performance.

## User Roles

- **Admin** - Manage users, vendors, view analytics
- **Procurement Officer** - Create RFQs, compare quotations, generate POs and invoices
- **Manager/Approver** - Approve/reject procurement requests
- **Vendor** - Submit quotations, track RFQ status, view POs

## Workflow

1. Procurement Officer creates RFQ
2. Vendors receive invitations and submit quotations
3. Procurement team compares quotations
4. Approval workflow is initiated
5. Approved quotations generate Purchase Orders
6. Invoice is generated from Purchase Order
7. Invoice can be printed or emailed
8. Activities tracked through logs and analytics

## Email Service

VendorBridge includes a comprehensive email service for:
- OTPs for registration and verification
- Registration confirmations
- RFQ notifications to vendors
- Quotation submission confirmations
- Approval notifications to managers
- Approval results to vendors
- Purchase orders with PDF attachments
- Invoices with PDF attachments
- Password reset emails

### Setup

1. Generate a Gmail App Password (see EMAIL_SERVICE.md for detailed instructions)
2. Configure environment variables in `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_16_char_app_password_here
   SMTP_FROM=VendorBridge <noreply@vendorbridge.com>
   SMTP_FROM_NAME=VendorBridge
   ```

### Implementation

Two implementations are available:
- **Python**: `backend-python/email_service.py`
- **Node.js**: `backend-nodejs/emailService.js`

See `EMAIL_SERVICE.md` for detailed documentation and usage examples.

### Testing

- Python: `cd backend-python && python test_email.py`
- Node.js: `cd backend-nodejs && node testEmail.js`

## Next Steps

- Choose backend technology (Node.js/Express or Python/Flask)
- Set up backend API
- Implement authentication system
- Build frontend UI (React, Vue, etc.)
- Add PDF generation for invoices
- Set up reporting and analytics
