-- VendorBridge - Common SQL Queries
-- Version 2.0 — Updated to reflect schema v2 changes

-- ============================================================
-- USER MANAGEMENT
-- ============================================================

-- Get all users by role
SELECT * FROM users WHERE role = 'procurement_officer';

-- Get user with vendor details
SELECT u.*, v.company_name, v.status AS vendor_status
FROM users u
LEFT JOIN vendors v ON u.id = v.user_id
WHERE u.id = :user_id;

-- ============================================================
-- AUTH — PASSWORD RESET
-- ============================================================

-- Create a password reset token
INSERT INTO password_reset_tokens (user_id, token, expires_at)
VALUES (:user_id, :token, NOW() + INTERVAL '1 hour');

-- Validate a reset token (must be unused and not expired)
SELECT prt.*, u.email
FROM password_reset_tokens prt
JOIN users u ON prt.user_id = u.id
WHERE prt.token = :token
  AND prt.used = FALSE
  AND prt.expires_at > NOW();

-- Mark token as used after password reset
UPDATE password_reset_tokens
SET used = TRUE
WHERE token = :token;

-- ============================================================
-- VENDOR MANAGEMENT
-- ============================================================

-- Get all active vendors
SELECT * FROM vendors WHERE status = 'active' ORDER BY rating DESC;

-- Get vendor by category
SELECT * FROM vendors WHERE category = :category AND status = 'active';

-- Get vendor performance summary
SELECT
    v.id,
    v.company_name,
    v.category,
    v.contact_person,
    v.email,
    v.rating,
    COUNT(DISTINCT po.id)       AS total_orders,
    COALESCE(SUM(po.grand_total), 0) AS total_value,
    AVG(vr.rating::DECIMAL)     AS avg_rating
FROM vendors v
LEFT JOIN purchase_orders po ON v.id = po.vendor_id
LEFT JOIN vendor_ratings vr  ON v.id = vr.vendor_id
WHERE v.status = 'active'
GROUP BY v.id, v.company_name, v.category, v.contact_person, v.email, v.rating
ORDER BY v.rating DESC;

-- Search vendors by name, GSTIN, contact person, or email
SELECT * FROM vendors
WHERE company_name   ILIKE :search_term
   OR gstin          ILIKE :search_term
   OR contact_no     ILIKE :search_term
   OR contact_person ILIKE :search_term
   OR email          ILIKE :search_term;

-- Check if a GSTIN is already registered (prevents duplicate vendor)
SELECT id, company_name FROM vendors WHERE gstin = :gstin;

-- ============================================================
-- RFQ MANAGEMENT
-- ============================================================

-- Get all RFQs with status, priority, and budget
SELECT
    r.*,
    u.name AS created_by_name,
    COUNT(DISTINCT rv.vendor_id) AS vendor_count
FROM rfqs r
LEFT JOIN users u        ON r.created_by = u.id
LEFT JOIN rfq_vendors rv ON r.id = rv.rfq_id
WHERE r.status = :status
GROUP BY r.id, u.name
ORDER BY r.created_at DESC;

-- Get RFQ with items and assigned vendors
SELECT
    r.*,
    u.name AS created_by_name,
    json_agg(DISTINCT jsonb_build_object(
        'item_name', ri.item_name,
        'quantity',  ri.quantity,
        'unit',      ri.unit,
        'id',        ri.id
    )) AS items,
    json_agg(DISTINCT jsonb_build_object(
        'vendor_id',    v.id,
        'company_name', v.company_name,
        'status',       v.status
    )) AS vendors
FROM rfqs r
LEFT JOIN users u        ON r.created_by = u.id
LEFT JOIN rfq_items ri   ON r.id = ri.rfq_id
LEFT JOIN rfq_vendors rv ON r.id = rv.rfq_id
LEFT JOIN vendors v      ON rv.vendor_id = v.id
WHERE r.id = :rfq_id
GROUP BY r.id, u.name;

-- Get RFQs assigned to a specific vendor
SELECT
    r.*,
    ri.item_name,
    ri.quantity,
    ri.unit
FROM rfqs r
JOIN rfq_vendors rv ON r.id = rv.rfq_id
JOIN rfq_items ri   ON r.id = ri.rfq_id
WHERE rv.vendor_id = :vendor_id
  AND r.status = 'sent'
ORDER BY r.deadline ASC;

-- ============================================================
-- QUOTATION MANAGEMENT
-- ============================================================

-- Get quotations for an RFQ with vendor details
-- Includes overspend warning using rfq.budget
SELECT
    q.*,
    v.company_name,
    v.rating AS vendor_rating,
    COUNT(qi.id) AS item_count,
    CASE WHEN r.budget IS NOT NULL AND q.grand_total > r.budget
         THEN TRUE ELSE FALSE END AS exceeds_budget
FROM quotations q
JOIN vendors v       ON q.vendor_id = v.id
JOIN rfqs r          ON q.rfq_id = r.id
LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
WHERE q.rfq_id = :rfq_id
GROUP BY q.id, v.company_name, v.rating, r.budget
ORDER BY q.grand_total ASC;

-- Get quotation with items (quantity column consistent)
SELECT
    q.*,
    v.company_name,
    json_agg(jsonb_build_object(
        'item_name',    qi.item_name,
        'rfq_item_id',  qi.rfq_item_id,
        'quantity',     qi.quantity,
        'unit_price',   qi.unit_price,
        'total',        qi.total,
        'delivery_days',qi.delivery_days
    )) AS items
FROM quotations q
JOIN vendors v               ON q.vendor_id = v.id
LEFT JOIN quotation_items qi ON q.id = qi.quotation_id
WHERE q.id = :quotation_id
GROUP BY q.id, v.company_name;

-- Get submitted quotations pending approval
SELECT
    q.*,
    v.company_name,
    r.title    AS rfq_title,
    r.deadline AS rfq_deadline
FROM quotations q
JOIN vendors v ON q.vendor_id = v.id
JOIN rfqs r    ON q.rfq_id = r.id
WHERE q.status = 'submitted'
  AND NOT EXISTS (
      SELECT 1 FROM approvals a
      WHERE a.quotation_id = q.id AND a.status = 'approved'
  )
ORDER BY q.created_at DESC;

-- Compare quotations for an RFQ (side-by-side comparison screen)
SELECT
    q.id,
    v.company_name,
    v.rating AS vendor_rating,
    q.subtotal,
    q.gst_percent,
    q.grand_total,
    q.delivery_days,
    q.payment_terms,
    r.budget,
    CASE WHEN r.budget IS NOT NULL AND q.grand_total > r.budget
         THEN TRUE ELSE FALSE END AS exceeds_budget,
    RANK() OVER (ORDER BY q.grand_total ASC) AS price_rank
FROM quotations q
JOIN vendors v ON q.vendor_id = v.id
JOIN rfqs r    ON q.rfq_id = r.id
WHERE q.rfq_id = :rfq_id AND q.status = 'submitted'
ORDER BY q.grand_total ASC;

-- ============================================================
-- AI SUMMARIES
-- ============================================================

-- Check if an AI summary already exists for an RFQ (avoid re-calling API)
SELECT * FROM ai_summaries
WHERE rfq_id = :rfq_id
ORDER BY generated_at DESC
LIMIT 1;

-- Store a new AI summary
INSERT INTO ai_summaries (rfq_id, summary, recommended_vendor_id, reasoning, generated_by)
VALUES (:rfq_id, :summary, :recommended_vendor_id, :reasoning, :generated_by);

-- ============================================================
-- APPROVAL WORKFLOW
-- ============================================================

-- Get pending approvals for a manager (direct rfq_id access — no extra join needed)
SELECT
    a.*,
    q.grand_total,
    v.company_name,
    r.title       AS rfq_title,
    r.priority    AS rfq_priority,
    u.name        AS approver_name
FROM approvals a
JOIN quotations q ON a.quotation_id = q.id
JOIN vendors v    ON q.vendor_id = v.id
JOIN rfqs r       ON a.rfq_id = r.id          -- direct access via denormalized rfq_id
LEFT JOIN users u ON a.approver_id = u.id
WHERE a.status = 'pending'
  AND a.approver_id = :manager_id
ORDER BY a.created_at ASC;

-- Get approval history for a quotation
SELECT
    a.*,
    u.name AS approver_name
FROM approvals a
LEFT JOIN users u ON a.approver_id = u.id
WHERE a.quotation_id = :quotation_id
ORDER BY a.level, a.created_at;

-- Check if quotation is fully approved
SELECT
    q.id,
    q.status,
    COUNT(CASE WHEN a.status = 'approved' THEN 1 END)  AS approved_count,
    COUNT(a.id)                                         AS total_approvals,
    CASE WHEN COUNT(CASE WHEN a.status = 'approved' THEN 1 END) = COUNT(a.id)
         THEN TRUE ELSE FALSE END                       AS fully_approved
FROM quotations q
LEFT JOIN approvals a ON q.id = a.quotation_id
WHERE q.id = :quotation_id
GROUP BY q.id, q.status;

-- ============================================================
-- PURCHASE ORDER MANAGEMENT
-- ============================================================

-- Get all purchase orders
SELECT
    po.*,
    v.company_name,
    q.id   AS quotation_id,
    u.name AS approved_by_name
FROM purchase_orders po
JOIN vendors v          ON po.vendor_id = v.id
LEFT JOIN quotations q  ON po.quotation_id = q.id
LEFT JOIN users u       ON po.approved_by = u.id
ORDER BY po.created_at DESC;

-- Get purchase orders by status with invoice status
SELECT
    po.*,
    v.company_name,
    i.invoice_number,
    i.status AS invoice_status
FROM purchase_orders po
JOIN vendors v      ON po.vendor_id = v.id
LEFT JOIN invoices i ON po.id = i.po_id
WHERE po.status = :status
ORDER BY po.created_at DESC;

-- Get overdue purchase orders
SELECT
    po.*,
    v.company_name,
    v.contact_no,
    CURRENT_DATE - po.due_date::DATE AS days_overdue
FROM purchase_orders po
JOIN vendors v ON po.vendor_id = v.id
WHERE po.status = 'pending_payment'
  AND po.due_date < CURRENT_DATE
ORDER BY po.due_date ASC;

-- ============================================================
-- INVOICE MANAGEMENT
-- ============================================================

-- Get all invoices
SELECT
    i.*,
    po.po_number,
    po.due_date    AS po_due_date,
    po.grand_total AS po_grand_total,
    v.company_name,
    v.gstin
FROM invoices i
JOIN purchase_orders po ON i.po_id = po.id
JOIN vendors v          ON po.vendor_id = v.id
ORDER BY i.created_at DESC;

-- Get invoice with full details for PDF generation (includes org Bill-To data)
SELECT
    i.*,
    po.po_number,
    po.po_date,
    po.subtotal,
    po.cgst,
    po.sgst,
    po.igst,
    po.grand_total,
    po.org_name,
    po.org_address,
    po.org_gstin,
    v.company_name,
    v.gstin        AS vendor_gstin,
    v.address      AS vendor_address,
    v.contact_no,
    qi.item_name,
    qi.quantity,
    qi.unit_price,
    qi.total
FROM invoices i
JOIN purchase_orders po  ON i.po_id = po.id
JOIN vendors v           ON po.vendor_id = v.id
JOIN quotations q        ON po.quotation_id = q.id
JOIN quotation_items qi  ON q.id = qi.quotation_id
WHERE i.id = :invoice_id;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

-- Get unread notifications for a user
SELECT * FROM notifications
WHERE user_id = :user_id AND is_read = FALSE
ORDER BY created_at DESC;

-- Mark a notification as read
UPDATE notifications SET is_read = TRUE
WHERE id = :notification_id AND user_id = :user_id;

-- Mark all notifications as read for a user
UPDATE notifications SET is_read = TRUE
WHERE user_id = :user_id AND is_read = FALSE;

-- Insert a notification
INSERT INTO notifications (user_id, title, message, type, entity_type, entity_id)
VALUES (:user_id, :title, :message, :type, :entity_type, :entity_id);

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================

-- Get recent activity (with metadata)
SELECT
    al.*,
    u.name AS user_name
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 50;

-- Get activity for a specific entity
SELECT
    al.*,
    u.name AS user_name
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.entity_type = :entity_type
  AND al.entity_id   = :entity_id
ORDER BY al.created_at DESC;

-- Get activity by user
SELECT
    al.*,
    u.name AS user_name
FROM activity_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.user_id = :user_id
ORDER BY al.created_at DESC;

-- Insert activity log (use from application layer, pass IP and metadata)
INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address, metadata)
VALUES (:user_id, :action, :entity_type, :entity_id, :description, :ip_address::INET, :metadata::JSONB);

-- ============================================================
-- ANALYTICS & REPORTS
-- ============================================================

-- Monthly procurement trends
SELECT
    DATE_TRUNC('month', po.created_at) AS month,
    COUNT(*)                           AS total_orders,
    SUM(po.grand_total)                AS total_value,
    AVG(po.grand_total)                AS avg_order_value
FROM purchase_orders po
WHERE po.created_at >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY DATE_TRUNC('month', po.created_at)
ORDER BY month DESC;

-- Vendor performance analytics
SELECT
    v.company_name,
    v.category,
    v.contact_person,
    v.rating,
    COUNT(DISTINCT po.id)     AS total_orders,
    SUM(po.grand_total)       AS total_spend,
    AVG(po.grand_total)       AS avg_order_value,
    COUNT(DISTINCT vr.id)     AS rating_count,
    AVG(vr.rating::DECIMAL)   AS avg_customer_rating
FROM vendors v
LEFT JOIN purchase_orders po ON v.id = po.vendor_id
LEFT JOIN vendor_ratings vr  ON v.id = vr.vendor_id
WHERE v.status = 'active'
GROUP BY v.id, v.company_name, v.category, v.contact_person, v.rating
ORDER BY total_spend DESC;

-- RFQ to PO conversion rate
SELECT
    COUNT(DISTINCT r.id)                                              AS total_rfqs,
    COUNT(DISTINCT CASE WHEN po.id IS NOT NULL THEN r.id END)         AS converted_rfqs,
    ROUND(
        (COUNT(DISTINCT CASE WHEN po.id IS NOT NULL THEN r.id END)::FLOAT /
         NULLIF(COUNT(DISTINCT r.id)::FLOAT, 0)) * 100, 2
    )                                                                  AS conversion_rate
FROM rfqs r
LEFT JOIN quotations q   ON r.id = q.rfq_id
LEFT JOIN approvals a    ON q.id = a.quotation_id AND a.status = 'approved'
LEFT JOIN purchase_orders po ON q.id = po.quotation_id
WHERE r.created_at >= DATE_TRUNC('year', CURRENT_DATE);

-- Spending by category
SELECT
    COALESCE(r.category, 'Uncategorized') AS category,
    COUNT(DISTINCT po.id)                 AS order_count,
    SUM(po.grand_total)                   AS total_spend
FROM purchase_orders po
LEFT JOIN quotations q ON po.quotation_id = q.id
LEFT JOIN rfqs r       ON q.rfq_id = r.id
WHERE po.created_at >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY COALESCE(r.category, 'Uncategorized')
ORDER BY total_spend DESC;

-- Priority breakdown of open RFQs
SELECT priority, COUNT(*) AS rfq_count
FROM rfqs
WHERE status IN ('draft', 'sent')
GROUP BY priority
ORDER BY rfq_count DESC;

-- ============================================================
-- MAINTENANCE QUERIES
-- ============================================================

-- Mark overdue purchase orders
UPDATE purchase_orders
SET status = 'overdue'
WHERE status = 'pending_payment'
  AND due_date < CURRENT_DATE;

-- Expire unused password reset tokens
UPDATE password_reset_tokens
SET used = TRUE
WHERE expires_at < NOW() AND used = FALSE;

-- Recalculate all vendor ratings (DECIMAL AVG of INTEGER inputs)
UPDATE vendors v
SET rating = (
    SELECT COALESCE(AVG(rating::DECIMAL), 0)
    FROM vendor_ratings vr
    WHERE vr.vendor_id = v.id
);

-- Clean up old activity logs (older than 1 year)
-- WARNING: This deletes audit data — use with caution
-- DELETE FROM activity_logs WHERE created_at < CURRENT_DATE - INTERVAL '1 year';

-- Get database size
SELECT pg_size_pretty(pg_database_size('vendorbridge')) AS database_size;

-- Get table sizes
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;
