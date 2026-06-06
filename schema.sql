-- VendorBridge ERP Database Schema
-- PostgreSQL Database Schema
-- Version 2.0 — Updated with all critical fixes and missing tables

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS ai_summaries;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS vendor_ratings;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS approvals;
DROP TABLE IF EXISTS quotation_items;
DROP TABLE IF EXISTS quotations;
DROP TABLE IF EXISTS rfq_vendors;
DROP TABLE IF EXISTS rfq_items;
DROP TABLE IF EXISTS rfqs;
DROP TABLE IF EXISTS vendors;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS org_profile;

-- ============================================================
-- Org Profile Table
-- Stores organization details printed on POs and invoices
-- ============================================================
CREATE TABLE org_profile (
    id          SERIAL PRIMARY KEY,
    org_name    VARCHAR(255) NOT NULL,
    org_address TEXT,
    org_gstin   VARCHAR(15),
    org_email   VARCHAR(255),
    org_phone   VARCHAR(20),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Users Table
-- ============================================================
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(50)  NOT NULL CHECK (role IN ('admin', 'procurement_officer', 'manager', 'vendor')),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Vendors Table
-- ============================================================
CREATE TABLE vendors (
    id                  SERIAL PRIMARY KEY,
    -- user_id is nullable: admin creates vendor record first, user account linked later
    user_id             INTEGER REFERENCES users(id) ON DELETE SET NULL DEFAULT NULL,
    company_name        VARCHAR(255) NOT NULL,
    -- UNIQUE enforces fake-vendor prevention; GSTIN must be globally unique
    gstin               VARCHAR(15) UNIQUE,
    gstin_verified      BOOLEAN DEFAULT FALSE,
    category            VARCHAR(100),
    contact_person      VARCHAR(255),                   -- Contact person name from Add Vendor form
    contact_no          VARCHAR(20),
    email               VARCHAR(255),                   -- Vendor email for invite and communication
    address             TEXT,
    state               VARCHAR(100),                   -- Auto-filled from GSTIN first 2 digits
    state_code          VARCHAR(2),                     -- For CGST vs IGST determination
    status              VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'blocked')),
    rating              DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    -- Vendor invite flow columns
    vendor_invite_token VARCHAR(255),
    invite_sent_at      TIMESTAMP,
    invite_accepted_at  TIMESTAMP,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- RFQs Table
-- ============================================================
CREATE TABLE rfqs (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    category    VARCHAR(100),
    deadline    TIMESTAMP NOT NULL,
    description TEXT,
    -- Priority from RFQ creation Step 1 in UI
    priority    VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    -- Budget for overspend warning on quotation comparison
    budget      DECIMAL(12,2),
    created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status      VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'closed')),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- RFQ Items Table
-- ============================================================
CREATE TABLE rfq_items (
    id         SERIAL PRIMARY KEY,
    rfq_id     INTEGER REFERENCES rfqs(id) ON DELETE CASCADE,
    item_name  VARCHAR(255) NOT NULL,
    quantity   DECIMAL(10,2) NOT NULL,   -- using "quantity" consistently
    unit       VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- RFQ Vendors Table
-- ============================================================
CREATE TABLE rfq_vendors (
    rfq_id      INTEGER REFERENCES rfqs(id) ON DELETE CASCADE,
    vendor_id   INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (rfq_id, vendor_id)
);

-- ============================================================
-- Quotations Table
-- ============================================================
CREATE TABLE quotations (
    id            SERIAL PRIMARY KEY,
    rfq_id        INTEGER REFERENCES rfqs(id) ON DELETE CASCADE,
    vendor_id     INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
    subtotal      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    gst_percent   DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
    grand_total   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    delivery_days INTEGER,
    payment_terms TEXT,
    notes         TEXT,
    status        VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'selected', 'rejected')),
    -- Audit trail: when and by whom this quotation was selected for approval
    selected_at   TIMESTAMP,
    selected_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- One quotation per vendor per RFQ; for re-submissions add a version column instead
    UNIQUE (rfq_id, vendor_id)
);

-- ============================================================
-- Quotation Items Table
-- ============================================================
CREATE TABLE quotation_items (
    id           SERIAL PRIMARY KEY,
    quotation_id INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
    -- rfq_item_id links vendor's line item back to the original RFQ line item
    rfq_item_id  INTEGER REFERENCES rfq_items(id) ON DELETE SET NULL,
    item_name    VARCHAR(255) NOT NULL,
    -- renamed from "qty" to "quantity" for consistency with rfq_items
    quantity     DECIMAL(10,2) NOT NULL,
    unit_price   DECIMAL(12,2) NOT NULL,
    total        DECIMAL(12,2) NOT NULL,
    delivery_days INTEGER,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Approvals Table
-- ============================================================
CREATE TABLE approvals (
    id            SERIAL PRIMARY KEY,
    quotation_id  INTEGER REFERENCES quotations(id) ON DELETE CASCADE,
    -- rfq_id denormalized here for direct access without double join
    rfq_id        INTEGER REFERENCES rfqs(id) ON DELETE CASCADE,
    approver_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    -- INTEGER level is more flexible for multi-level workflows (L3, L4, etc.)
    level         INTEGER NOT NULL DEFAULT 1,
    status        VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    remarks       TEXT,
    actioned_at   TIMESTAMP,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Purchase Orders Table
-- ============================================================
CREATE TABLE purchase_orders (
    id           SERIAL PRIMARY KEY,
    po_number    VARCHAR(50) UNIQUE NOT NULL,
    quotation_id INTEGER REFERENCES quotations(id) ON DELETE SET NULL,
    -- Enforce: one approved quotation = one PO, always
    UNIQUE (quotation_id),
    vendor_id    INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
    -- Org details copied at PO creation time (org_profile may change later)
    org_name     VARCHAR(255),
    org_address  TEXT,
    org_gstin    VARCHAR(15),
    subtotal     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    cgst         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    sgst         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    igst         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    grand_total  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status       VARCHAR(30) DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'paid', 'overdue')),
    po_date      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date     TIMESTAMP,
    -- Audit trail: who approved this PO
    approved_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Invoices Table
-- ============================================================
CREATE TABLE invoices (
    id             SERIAL PRIMARY KEY,
    po_id          INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
    -- Enforce: one invoice per PO
    UNIQUE (po_id),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Invoices have their own due date (separate from PO due_date)
    due_date       TIMESTAMP,
    pdf_url        TEXT,
    status         VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('sent', 'pending', 'paid')),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Activity Logs Table (immutable — no update/delete)
-- ============================================================
CREATE TABLE activity_logs (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50)  NOT NULL,
    entity_id   INTEGER      NOT NULL,
    description TEXT,
    -- IP address for security audit trail
    ip_address  INET,
    -- Extra context stored as JSON (e.g. old/new status transitions)
    metadata    JSONB,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Vendor Ratings Table
-- ============================================================
CREATE TABLE vendor_ratings (
    id         SERIAL PRIMARY KEY,
    vendor_id  INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
    po_id      INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
    -- Raw input: INTEGER 1-5
    rating     INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review     TEXT,
    rated_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- vendors.rating stores the computed DECIMAL(3,2) average via trigger (e.g. 4.5)

-- ============================================================
-- AI Summaries Table
-- Caches Claude AI comparison summaries — avoids re-calling API
-- ============================================================
CREATE TABLE ai_summaries (
    id                   SERIAL PRIMARY KEY,
    rfq_id               INTEGER REFERENCES rfqs(id) ON DELETE CASCADE,
    summary              TEXT NOT NULL,          -- AI-generated summary text
    recommended_vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
    reasoning            TEXT,                   -- Why this vendor was recommended
    generated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by         INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- Notifications Table
-- PS Screen 9: RFQ notifications, approval alerts, invoice updates
-- ============================================================
CREATE TABLE notifications (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    message     TEXT,
    type        VARCHAR(30),    -- 'rfq' | 'approval' | 'invoice' | 'vendor'
    entity_type VARCHAR(50),    -- e.g. 'rfq', 'quotation', 'purchase_order'
    entity_id   INTEGER,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Password Reset Tokens Table
-- Supports "Forgot Password" flow from Login screen
-- ============================================================
CREATE TABLE password_reset_tokens (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used       BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_role     ON users(role);

CREATE INDEX idx_vendors_user_id  ON vendors(user_id);
CREATE INDEX idx_vendors_status   ON vendors(status);
CREATE INDEX idx_vendors_category ON vendors(category);
CREATE INDEX idx_vendors_gstin    ON vendors(gstin);

CREATE INDEX idx_rfqs_created_by ON rfqs(created_by);
CREATE INDEX idx_rfqs_status     ON rfqs(status);
CREATE INDEX idx_rfqs_deadline   ON rfqs(deadline);
CREATE INDEX idx_rfqs_priority   ON rfqs(priority);

CREATE INDEX idx_rfq_items_rfq_id ON rfq_items(rfq_id);

CREATE INDEX idx_rfq_vendors_rfq_id    ON rfq_vendors(rfq_id);
CREATE INDEX idx_rfq_vendors_vendor_id ON rfq_vendors(vendor_id);

CREATE INDEX idx_quotations_rfq_id    ON quotations(rfq_id);
CREATE INDEX idx_quotations_vendor_id ON quotations(vendor_id);
CREATE INDEX idx_quotations_status    ON quotations(status);

CREATE INDEX idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX idx_quotation_items_rfq_item_id  ON quotation_items(rfq_item_id);

CREATE INDEX idx_approvals_quotation_id ON approvals(quotation_id);
CREATE INDEX idx_approvals_rfq_id       ON approvals(rfq_id);
CREATE INDEX idx_approvals_approver_id  ON approvals(approver_id);
CREATE INDEX idx_approvals_status       ON approvals(status);

CREATE INDEX idx_purchase_orders_vendor_id    ON purchase_orders(vendor_id);
CREATE INDEX idx_purchase_orders_status       ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_po_number    ON purchase_orders(po_number);
CREATE INDEX idx_purchase_orders_approved_by  ON purchase_orders(approved_by);

CREATE INDEX idx_invoices_po_id  ON invoices(po_id);
CREATE INDEX idx_invoices_status ON invoices(status);

CREATE INDEX idx_activity_logs_user_id    ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity     ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

CREATE INDEX idx_vendor_ratings_vendor_id ON vendor_ratings(vendor_id);
CREATE INDEX idx_vendor_ratings_po_id     ON vendor_ratings(po_id);

CREATE INDEX idx_ai_summaries_rfq_id   ON ai_summaries(rfq_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token   ON password_reset_tokens(token);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-generate PO numbers: PO-YYYY-NNNNNN
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    prefix       VARCHAR(10) := 'PO';
    year_part    VARCHAR(4)  := TO_CHAR(CURRENT_DATE, 'YYYY');
    sequence_num INTEGER;
    po_num       VARCHAR(50);
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 8 FOR 6) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM purchase_orders
    WHERE po_number LIKE prefix || '-' || year_part || '-%';

    po_num := prefix || '-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
    RETURN po_num;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_po_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.po_number IS NULL OR NEW.po_number = '' THEN
        NEW.po_number := generate_po_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_po_number
    BEFORE INSERT ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION set_po_number();

-- Auto-generate invoice numbers: INV-YYYY-NNNNNN
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    prefix       VARCHAR(10) := 'INV';
    year_part    VARCHAR(4)  := TO_CHAR(CURRENT_DATE, 'YYYY');
    sequence_num INTEGER;
    inv_num      VARCHAR(50);
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 9 FOR 6) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM invoices
    WHERE invoice_number LIKE prefix || '-' || year_part || '-%';

    inv_num := prefix || '-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
    RETURN inv_num;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();

-- Update vendor.rating (DECIMAL avg) after each new vendor_rating (INTEGER raw)
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating DECIMAL(3,2);
BEGIN
    SELECT COALESCE(AVG(rating::DECIMAL), 0)
    INTO avg_rating
    FROM vendor_ratings
    WHERE vendor_id = NEW.vendor_id;

    UPDATE vendors
    SET rating = avg_rating
    WHERE id = NEW.vendor_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vendor_rating
    AFTER INSERT ON vendor_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_vendor_rating();

-- Auto-populate approvals.rfq_id from the linked quotation on insert
CREATE OR REPLACE FUNCTION set_approval_rfq_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rfq_id IS NULL THEN
        SELECT rfq_id INTO NEW.rfq_id
        FROM quotations
        WHERE id = NEW.quotation_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_approval_rfq_id
    BEFORE INSERT ON approvals
    FOR EACH ROW
    EXECUTE FUNCTION set_approval_rfq_id();

-- Generic activity log stub (customized per table at application layer)
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SAMPLE / SEED DATA
-- ============================================================

-- Org profile (Bill-To details shown on invoices)
INSERT INTO org_profile (org_name, org_address, org_gstin, org_email, org_phone) VALUES
('Your Organization Name', '123 Business Park, Ahmedabad, Gujarat - 380015', '24ABCDE1234F1Z5', 'procurement@yourorg.com', '+91-9876500000');

-- Sample Users
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin User',          'admin@vendorbridge.com',       '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7bGJdZqE6e', 'admin'),
('Procurement Officer', 'procurement@vendorbridge.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7bGJdZqE6e', 'procurement_officer'),
('Manager',             'manager@vendorbridge.com',     '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7bGJdZqE6e', 'manager'),
('Vendor User',         'vendor@vendorbridge.com',      '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7bGJdZqE6e', 'vendor');

-- Sample Vendors (user_id linked after account creation)
INSERT INTO vendors (user_id, company_name, gstin, gstin_verified, category, contact_person, contact_no, email, address, state, state_code, status, rating) VALUES
(4, 'Tech Supplies Ltd',    '29ABCDE1234F1Z5', TRUE, 'Electronics',    'Rahul Sharma',  '+91-9876543210', 'rahul@techsupplies.com', '123 Tech Park, Bangalore',    'Karnataka',   '29', 'active', 4.50),
(4, 'Office Essentials Co', '27ABCDE5678F1Z9', TRUE, 'Office Supplies', 'Priya Mehta',   '+91-9876543211', 'priya@officeessentials.com', '456 Business Hub, Mumbai', 'Maharashtra', '27', 'active', 4.20);

-- Sample RFQ
INSERT INTO rfqs (title, category, deadline, description, priority, budget, created_by, status) VALUES
('Office Laptops Procurement', 'Electronics', CURRENT_TIMESTAMP + INTERVAL '10 days', 'Need 20 laptops for office use', 'high', 900000.00, 2, 'sent');

-- Sample RFQ Items
INSERT INTO rfq_items (rfq_id, item_name, quantity, unit) VALUES
(1, 'Laptop - 16GB RAM, 512GB SSD', 20, 'pieces');

-- Assign vendors to RFQ
INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES
(1, 1),
(1, 2);

-- Sample Quotation
INSERT INTO quotations (rfq_id, vendor_id, subtotal, gst_percent, grand_total, delivery_days, payment_terms, notes, status) VALUES
(1, 1, 800000.00, 18.00, 944000.00, 7, 'Net 30 days', 'Includes 1-year warranty', 'submitted');

-- Sample Quotation Items (linked back to rfq_item id=1)
INSERT INTO quotation_items (quotation_id, rfq_item_id, item_name, quantity, unit_price, total, delivery_days) VALUES
(1, 1, 'Laptop - 16GB RAM, 512GB SSD', 20, 40000.00, 800000.00, 7);
