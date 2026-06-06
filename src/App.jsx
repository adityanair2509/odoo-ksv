import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute, RoleGuard } from './guards'
import AppLayout from './components/layout/AppLayout'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Protected pages
import DashboardPage from './pages/DashboardPage'
import VendorsPage from './pages/vendors/VendorsPage'
import VendorDetailPage from './pages/vendors/VendorDetailPage'
import AddVendorPage from './pages/vendors/AddVendorPage'
import RFQsPage from './pages/rfqs/RFQsPage'
import CreateRFQPage from './pages/rfqs/CreateRFQPage'
import RFQDetailPage from './pages/rfqs/RFQDetailPage'
import QuotationSubmitPage from './pages/quotations/QuotationSubmitPage'
import QuotationComparePage from './pages/quotations/QuotationComparePage'
import QuotationsPage from './pages/quotations/QuotationsPage'
import InvoicesPage from './pages/invoices/InvoicesPage'
import ApprovalsPage from './pages/approvals/ApprovalsPage'
import ApprovalDetailPage from './pages/approvals/ApprovalDetailPage'
import PurchaseOrdersPage from './pages/orders/PurchaseOrdersPage'
import PODetailPage from './pages/orders/PODetailPage'
import InvoiceDetailPage from './pages/invoices/InvoiceDetailPage'
import ActivityPage from './pages/ActivityPage'
import ReportsPage from './pages/ReportsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Vendor-accessible routes */}
              <Route path="/rfqs" element={<RFQsPage />} />
              <Route path="/rfqs/new" element={<CreateRFQPage />} />
              <Route path="/rfqs/:id" element={<RFQDetailPage />} />
              <Route path="/rfqs/:id/compare" element={<QuotationComparePage />} />
              <Route path="/quotations" element={<QuotationsPage />} />
              <Route path="/quotations/:id/submit" element={<QuotationSubmitPage />} />
              <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="/purchase-orders/:id" element={<PODetailPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
              <Route path="/activity" element={<ActivityPage />} />

              {/* Non-vendor restricted routes */}
              <Route element={<RoleGuard allowVendor={false} />}>
                <Route path="/vendors" element={<VendorsPage />} />
                <Route path="/vendors/new" element={<AddVendorPage />} />
                <Route path="/vendors/:id" element={<VendorDetailPage />} />
                <Route path="/approvals" element={<ApprovalsPage />} />
                <Route path="/approvals/:id" element={<ApprovalDetailPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>

              {/* Catch-all inside app */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
