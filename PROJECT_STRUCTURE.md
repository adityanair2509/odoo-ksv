# VendorBridge - Project Structure

## Current Database Files

```
VendorBridge/
├── schema.sql              # Complete database schema with tables, indexes, triggers
├── queries.sql             # Common SQL queries for operations
├── DATABASE.md             # Detailed database documentation
├── README.md               # Project overview and setup instructions
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── init-db.bat             # Windows database initialization script
└── init-db.sh              # Linux/Mac database initialization script
```

## Recommended Backend Structure

```
VendorBridge/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js      # Database connection configuration
│   │   │   └── config.js        # General configuration
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Vendor.js
│   │   │   ├── RFQ.js
│   │   │   ├── Quotation.js
│   │   │   ├── Approval.js
│   │   │   ├── PurchaseOrder.js
│   │   │   ├── Invoice.js
│   │   │   ├── ActivityLog.js
│   │   │   └── VendorRating.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── vendorController.js
│   │   │   ├── rfqController.js
│   │   │   ├── quotationController.js
│   │   │   ├── approvalController.js
│   │   │   ├── purchaseOrderController.js
│   │   │   ├── invoiceController.js
│   │   │   └── analyticsController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── vendorRoutes.js
│   │   │   ├── rfqRoutes.js
│   │   │   ├── quotationRoutes.js
│   │   │   ├── approvalRoutes.js
│   │   │   ├── purchaseOrderRoutes.js
│   │   │   ├── invoiceRoutes.js
│   │   │   └── analyticsRoutes.js
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT authentication
│   │   │   ├── rbac.js           # Role-based access control
│   │   │   ├── validation.js     # Request validation
│   │   │   └── errorHandler.js   # Error handling
│   │   ├── services/
│   │   │   ├── emailService.js   # Email functionality
│   │   │   ├── pdfService.js     # PDF generation
│   │   │   └── activityService.js # Activity logging
│   │   ├── utils/
│   │   │   ├── helpers.js        # Utility functions
│   │   │   └── constants.js      # Constants
│   │   └── app.js                # Express app setup
│   ├── package.json
│   └── .env
```

## Recommended Frontend Structure

```
VendorBridge/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   └── Table.jsx
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Layout.jsx
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Signup.jsx
│   │   │   │   └── ForgotPassword.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── StatsCard.jsx
│   │   │   │   └── RecentActivity.jsx
│   │   │   ├── vendors/
│   │   │   │   ├── VendorList.jsx
│   │   │   │   ├── VendorForm.jsx
│   │   │   │   └── VendorDetails.jsx
│   │   │   ├── rfq/
│   │   │   │   ├── RFQList.jsx
│   │   │   │   ├── RFQForm.jsx
│   │   │   │   └── RFQDetails.jsx
│   │   │   ├── quotations/
│   │   │   │   ├── QuotationList.jsx
│   │   │   │   ├── QuotationForm.jsx
│   │   │   │   └── QuotationComparison.jsx
│   │   │   ├── approvals/
│   │   │   │   ├── ApprovalList.jsx
│   │   │   │   └── ApprovalDetails.jsx
│   │   │   ├── purchaseOrders/
│   │   │   │   ├── POList.jsx
│   │   │   │   └── PODetails.jsx
│   │   │   ├── invoices/
│   │   │   │   ├── InvoiceList.jsx
│   │   │   │   ├── InvoiceDetails.jsx
│   │   │   │   └── InvoicePreview.jsx
│   │   │   └── analytics/
│   │   │       ├── Analytics.jsx
│   │   │       ├── Reports.jsx
│   │   │       └── Charts.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── VendorsPage.jsx
│   │   │   ├── RFQsPage.jsx
│   │   │   ├── QuotationsPage.jsx
│   │   │   ├── ApprovalsPage.jsx
│   │   │   ├── PurchaseOrdersPage.jsx
│   │   │   ├── InvoicesPage.jsx
│   │   │   └── AnalyticsPage.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useAPI.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── package.json
│   └── .env
```

## API Endpoints Structure

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List all users (Admin only)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Vendors
- `GET /api/vendors` - List all vendors
- `POST /api/vendors` - Register new vendor
- `GET /api/vendors/:id` - Get vendor details
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor
- `GET /api/vendors/:id/ratings` - Get vendor ratings
- `POST /api/vendors/:id/ratings` - Submit vendor rating

### RFQs
- `GET /api/rfqs` - List all RFQs
- `POST /api/rfqs` - Create new RFQ
- `GET /api/rfqs/:id` - Get RFQ details
- `PUT /api/rfqs/:id` - Update RFQ
- `DELETE /api/rfqs/:id` - Delete RFQ
- `POST /api/rfqs/:id/vendors` - Assign vendors to RFQ
- `POST /api/rfqs/:id/send` - Send RFQ to vendors

### Quotations
- `GET /api/quotations` - List all quotations
- `POST /api/quotations` - Submit quotation
- `GET /api/quotations/:id` - Get quotation details
- `PUT /api/quotations/:id` - Update quotation
- `GET /api/rfqs/:rfqId/quotations` - Get quotations for RFQ
- `GET /api/rfqs/:rfqId/compare` - Compare quotations

### Approvals
- `GET /api/approvals` - List pending approvals
- `GET /api/approvals/:id` - Get approval details
- `POST /api/approvals/:id/approve` - Approve quotation
- `POST /api/approvals/:id/reject` - Reject quotation
- `GET /api/quotations/:quotationId/approvals` - Get approval history

### Purchase Orders
- `GET /api/purchase-orders` - List all POs
- `POST /api/purchase-orders` - Create PO from quotation
- `GET /api/purchase-orders/:id` - Get PO details
- `PUT /api/purchase-orders/:id` - Update PO
- `GET /api/purchase-orders/:po-number` - Get PO by number

### Invoices
- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Generate invoice from PO
- `GET /api/invoices/:id` - Get invoice details
- `GET /api/invoices/:id/pdf` - Download invoice PDF
- `POST /api/invoices/:id/send` - Send invoice via email
- `PUT /api/invoices/:id/status` - Update invoice status

### Activity Logs
- `GET /api/activity-logs` - List activity logs
- `GET /api/activity-logs/:entityType/:entityId` - Get logs for entity

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/vendor-performance` - Vendor performance
- `GET /api/analytics/spending-trends` - Spending trends
- `GET /api/analytics/reports` - Generate reports

## Technology Stack Recommendations

### Backend
- **Runtime:** Node.js 18+ or Python 3.11+
- **Framework:** Express.js (Node) or FastAPI (Python)
- **Database:** PostgreSQL 14+
- **ORM:** Prisma (Node) or SQLAlchemy (Python)
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Joi (Node) or Pydantic (Python)
- **Email:** Nodemailer (Node) or SendGrid
- **PDF:** PDFKit (Node) or ReportLab (Python)

### Frontend
- **Framework:** React 18+ with Vite
- **UI Library:** shadcn/ui or Material-UI
- **Styling:** TailwindCSS
- **State Management:** React Context or Zustand
- **Routing:** React Router
- **Charts:** Recharts or Chart.js
- **Forms:** React Hook Form
- **HTTP Client:** Axios or Fetch API

## Development Workflow

1. **Database Setup**
   - Run `init-db.bat` (Windows) or `init-db.sh` (Linux/Mac)
   - Verify schema with `psql -U postgres -d vendorbridge -c "\dt"`

2. **Backend Development**
   - Set up Express/FastAPI server
   - Implement authentication middleware
   - Create models and controllers
   - Implement role-based access control
   - Add API endpoints

3. **Frontend Development**
   - Set up React with Vite
   - Implement authentication flow
   - Build dashboard and screens
   - Integrate with backend API
   - Add responsive design

4. **Testing**
   - Unit tests for business logic
   - Integration tests for API
   - E2E tests with Playwright

5. **Deployment**
   - Set up CI/CD pipeline
   - Deploy backend to cloud (AWS/GCP/Azure)
   - Deploy frontend to Vercel/Netlify
   - Configure production database

## Security Considerations

1. **Authentication**
   - Use bcrypt for password hashing (12+ rounds)
   - Implement JWT with short expiration
   - Use secure HTTP-only cookies for tokens

2. **Authorization**
   - Role-based access control (RBAC)
   - Check permissions on every protected route
   - Implement resource-level permissions

3. **Data Protection**
   - Validate all input data
   - Use parameterized queries
   - Sanitize user-generated content
   - Encrypt sensitive data at rest

4. **API Security**
   - Rate limiting
   - CORS configuration
   - Request size limits
   - SQL injection prevention

5. **Audit Trail**
   - Log all user actions
   - Immutable activity logs
   - Regular security audits

## Next Steps

1. Choose backend technology stack (Node.js/Express or Python/FastAPI)
2. Set up backend project structure
3. Implement database connection and models
4. Build authentication system
5. Create API endpoints for each module
6. Set up frontend project
7. Build UI components
8. Integrate frontend with backend
9. Add email and PDF generation
10. Implement analytics and reporting
11. Add testing
12. Deploy to production
