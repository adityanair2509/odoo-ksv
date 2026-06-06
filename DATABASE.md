# VendorBridge Database Documentation
## Version 2.0

## Overview

Detailed reference for the VendorBridge schema — tables, columns, constraints, relationships, triggers, and common queries.

---

## Changelog v2.0

| # | Issue | Fix |
|---|-------|-----|
| 1 | `vendors.gstin` had no uniqueness constraint | Added `UNIQUE` — prevents two vendors with same GSTIN |
| 2 | `quotations` allowed same vendor to submit multiple quotes per RFQ | Added `UNIQUE (rfq_id, vendor_id)` |
| 3 | `approvals` required 2 joins to get RFQ title | Added denormalized `rfq_id` column + auto-populate trigger |
| 4 | `purchase_orders` had no org billing details for invoice | Added `org_name`, `org_address`, `org_gstin`; new `org_profile` table |
| 5 | `invoices` had no `due_date` | Added `due_date TIMESTAMP` column |
| 6 | Missing `ai_summaries` table | Added — caches AI comparison results, avoids repeat API calls |
| 7 | Missing `notifications` table | Added — supports PS Screen 9 (RFQ, approval, invoice alerts) |
| 8 | Missing `password_reset_tokens` table | Added — supports Forgot Password from Login screen |
| 9 | `rfqs` missing `priority` column | Added `priority VARCHAR(10) CHECK (low/medium/high)` |
| 10 | `rfqs` missing `budget` column | Added `budget DECIMAL(12,2)` — enables overspend warning |
| 11 | `vendors` missing `contact_person` and `email` | Added both columns |
| 12 | `vendors` missing `state` / `state_code` | Added — for CGST vs IGST determination |
| 13 | `quotations` missing `selected_at` / `selected_by` | Added — approval timeline display |
| 14 | `purchase_orders` missing `approved_by` | Added FK → users — audit trail for PO footer |
| 15 | `activity_logs` missing `ip_address` and `metadata` | Added `ip_address INET` and `metadata JSONB` |
| 16 | `vendor_ratings.rating` vs `vendors.rating` inconsistency | Clarified: raw INTEGER input vs DECIMAL(3,2) computed avg; trigger uses DECIMAL cast |
| 17 | `quotation_items.qty` naming inconsistency with `rfq_items.quantity` | Renamed to `quantity`; added `rfq_item_id` FK for item mapping |
| 18 | `approvals.level` too restrictive (`L1`/`L2` CHECK) | Changed to `INTEGER DEFAULT 1` — supports multi-level workflows |
| 19 | `purchase_orders` could have two POs per quotation | Added `UNIQUE (quotation_id)` |
| 20 | `invoices` could have multiple invoices per PO | Added `UNIQUE (po_id)` |
| 21 | `vendors.user_id` ON DELETE CASCADE was too aggressive | Changed to `ON DELETE SET NULL DEFAULT NULL` — supports deferred user linking |
| 22 | No vendor invite flow | Added `vendor_invite_token`, `invite_sent_at`, `invite_accepted_at` |
| 23 | `purchase_orders` missing `igst` column | Added — required when vendor and org are in different states |

---

## Entity Relationship Diagram

```
org_profile (standalone settings table)

users (1) ----< (0..1) vendors              [user linked after invite accepted]
users (1) ----< (N) rfqs                    [created_by]
users (1) ----< (N) approvals               [approver_id]
users (1) ----< (N) activity_logs
users (1) ----< (N) vendor_ratings          [rated_by]
users (1) ----< (N) notifications
users (1) ----< (N) quotations              [selected_by]
users (1) ----< (N) purchase_orders         [approved_by]
users (1) ----< (N) ai_summaries            [generated_by]
users (1) ----< (N) password_reset_tokens

vendors (1) ----< (N) rfq_vendors
vendors (1) ----< (N) quotations
vendors (1) ----< (N) purchase_orders
vendors (1) ----< (N) vendor_ratings
vendors (0..1) ----< (N) ai_summaries       [recommended_vendor_id]

rfqs (1) ----< (N) rfq_items
rfqs (1) ----< (N) rfq_vendors
rfqs (1) ----< (N) quotations
rfqs (1) ----< (N) approvals               [denormalized rfq_id]
rfqs (1) ----< (N) ai_summaries

rfq_items (1) ----< (N) quotation_items    [rfq_item_id — item mapping]

quotations (1) ----< (N) quotation_items
quotations (1) ----< (N) approvals
quotations (1) ----< (0..1) purchase_orders  [UNIQUE constraint]

purchase_orders (1) ----< (0..1) invoices  [UNIQUE constraint]
purchase_orders (1) ----< (N) vendor_ratings
```

---

## Table Details

### org_profile

Stores the buying organization's details for printing on POs and invoices ("Bill To" section).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| org_name | VARCHAR(255) | NOT NULL | Organization legal name |
| org_address | TEXT | | Full billing address |
| org_gstin | VARCHAR(15) | | Organization GSTIN |
| org_email | VARCHAR(255) | | Procurement email |
| org_phone | VARCHAR(20) | | Contact phone |
| created_at | TIMESTAMP | DEFAULT NOW | |
| updated_at | TIMESTAMP | DEFAULT NOW | |

---

### users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| name | VARCHAR(255) | NOT NULL | Full name |
| email | VARCHAR(255) | UNIQUE NOT NULL | Login identifier |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash (12+ rounds) |
| role | VARCHAR(50) | CHECK | admin, procurement_officer, manager, vendor |
| created_at | TIMESTAMP | DEFAULT NOW | |

**Indexes:** `idx_users_email`, `idx_users_role`

---

### vendors

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| user_id | INTEGER | FK → users, ON DELETE SET NULL, DEFAULT NULL | Linked after invite accepted |
| company_name | VARCHAR(255) | NOT NULL | |
| gstin | VARCHAR(15) | **UNIQUE** | GSTIN — uniqueness prevents fake/duplicate vendors |
| gstin_verified | BOOLEAN | DEFAULT FALSE | |
| category | VARCHAR(100) | | |
| contact_person | VARCHAR(255) | | Contact person name (from Add Vendor form) |
| contact_no | VARCHAR(20) | | |
| email | VARCHAR(255) | | Vendor email for invite and communication |
| address | TEXT | | |
| state | VARCHAR(100) | | Auto-fillable from GSTIN first 2 digits |
| state_code | VARCHAR(2) | | For CGST vs IGST determination |
| status | VARCHAR(20) | CHECK | active, pending, blocked |
| rating | DECIMAL(3,2) | CHECK (0-5) | Computed average from vendor_ratings (trigger) |
| vendor_invite_token | VARCHAR(255) | | One-time token for email invite link |
| invite_sent_at | TIMESTAMP | | When invite was sent |
| invite_accepted_at | TIMESTAMP | | When vendor completed onboarding |
| created_at | TIMESTAMP | DEFAULT NOW | |

**Indexes:** `idx_vendors_user_id`, `idx_vendors_status`, `idx_vendors_category`, `idx_vendors_gstin`

---

### rfqs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| title | VARCHAR(255) | NOT NULL | |
| category | VARCHAR(100) | | |
| deadline | TIMESTAMP | NOT NULL | |
| description | TEXT | | |
| priority | VARCHAR(10) | CHECK (low/medium/high) DEFAULT 'medium' | From RFQ creation Step 1 |
| budget | DECIMAL(12,2) | | Budget cap — used for overspend warning on comparison screen |
| created_by | INTEGER | FK → users, ON DELETE SET NULL | |
| status | VARCHAR(20) | CHECK (draft/sent/closed) DEFAULT 'draft' | |
| created_at | TIMESTAMP | DEFAULT NOW | |

**Indexes:** `idx_rfqs_created_by`, `idx_rfqs_status`, `idx_rfqs_deadline`, `idx_rfqs_priority`

---

### rfq_items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| rfq_id | INTEGER | FK → rfqs, CASCADE | |
| item_name | VARCHAR(255) | NOT NULL | |
| quantity | DECIMAL(10,2) | NOT NULL | Standardized name (matches quotation_items) |
| unit | VARCHAR(50) | NOT NULL | |
| created_at | TIMESTAMP | DEFAULT NOW | |

**Indexes:** `idx_rfq_items_rfq_id`

---

### rfq_vendors

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| rfq_id | INTEGER | FK → rfqs, CASCADE, PK | |
| vendor_id | INTEGER | FK → vendors, CASCADE, PK | |
| assigned_at | TIMESTAMP | DEFAULT NOW | |

> Note: Active-vendor enforcement (`status = 'active'`) should be done at the application layer before inserting into this table.

---

### quotations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| rfq_id | INTEGER | FK → rfqs, CASCADE | |
| vendor_id | INTEGER | FK → vendors, CASCADE | |
| subtotal | DECIMAL(12,2) | NOT NULL DEFAULT 0 | |
| gst_percent | DECIMAL(5,2) | NOT NULL DEFAULT 0 | |
| grand_total | DECIMAL(12,2) | NOT NULL DEFAULT 0 | |
| delivery_days | INTEGER | | |
| payment_terms | TEXT | | |
| notes | TEXT | | |
| status | VARCHAR(20) | CHECK (draft/submitted/selected/rejected) | |
| selected_at | TIMESTAMP | | When this quotation was selected for approval |
| selected_by | INTEGER | FK → users, ON DELETE SET NULL | Who selected it |
| created_at | TIMESTAMP | DEFAULT NOW | |
| updated_at | TIMESTAMP | DEFAULT NOW | |
| | | **UNIQUE (rfq_id, vendor_id)** | One quote per vendor per RFQ |

**Indexes:** `idx_quotations_rfq_id`, `idx_quotations_vendor_id`, `idx_quotations_status`

---

### quotation_items

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| quotation_id | INTEGER | FK → quotations, CASCADE | |
| rfq_item_id | INTEGER | FK → rfq_items, ON DELETE SET NULL | Maps vendor item → original RFQ item |
| item_name | VARCHAR(255) | NOT NULL | |
| quantity | DECIMAL(10,2) | NOT NULL | Standardized from `qty` |
| unit_price | DECIMAL(12,2) | NOT NULL | |
| total | DECIMAL(12,2) | NOT NULL | |
| delivery_days | INTEGER | | |
| created_at | TIMESTAMP | DEFAULT NOW | |

**Indexes:** `idx_quotation_items_quotation_id`, `idx_quotation_items_rfq_item_id`

---

### approvals

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| quotation_id | INTEGER | FK → quotations, CASCADE | |
| rfq_id | INTEGER | FK → rfqs, CASCADE | Denormalized for direct RFQ lookup without extra join |
| approver_id | INTEGER | FK → users, ON DELETE SET NULL | |
| level | INTEGER | NOT NULL DEFAULT 1 | 1, 2, 3… supports multi-level workflow |
| status | VARCHAR(20) | CHECK (pending/approved/rejected) | |
| remarks | TEXT | | |
| actioned_at | TIMESTAMP | | When action was taken |
| created_at | TIMESTAMP | DEFAULT NOW | |

> `rfq_id` is auto-populated by `trigger_set_approval_rfq_id` — no manual input needed.

**Indexes:** `idx_approvals_quotation_id`, `idx_approvals_rfq_id`, `idx_approvals_approver_id`, `idx_approvals_status`

---

### purchase_orders

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| po_number | VARCHAR(50) | UNIQUE NOT NULL | Auto-generated PO-YYYY-NNNNNN |
| quotation_id | INTEGER | FK → quotations, ON DELETE SET NULL, **UNIQUE** | One PO per approved quotation |
| vendor_id | INTEGER | FK → vendors, ON DELETE SET NULL | |
| org_name | VARCHAR(255) | | Organization name (copied from org_profile at PO time) |
| org_address | TEXT | | Billing address |
| org_gstin | VARCHAR(15) | | Org GSTIN for invoice Bill-To section |
| subtotal | DECIMAL(12,2) | NOT NULL DEFAULT 0 | |
| cgst | DECIMAL(12,2) | NOT NULL DEFAULT 0 | Used when vendor state = org state |
| sgst | DECIMAL(12,2) | NOT NULL DEFAULT 0 | Used when vendor state = org state |
| igst | DECIMAL(12,2) | NOT NULL DEFAULT 0 | Used when vendor state ≠ org state |
| grand_total | DECIMAL(12,2) | NOT NULL DEFAULT 0 | |
| status | VARCHAR(30) | CHECK (pending_payment/paid/overdue) | |
| po_date | TIMESTAMP | DEFAULT NOW | |
| due_date | TIMESTAMP | | PO payment due date |
| approved_by | INTEGER | FK → users, ON DELETE SET NULL | Who gave final approval — for audit trail |
| created_at | TIMESTAMP | DEFAULT NOW | |

**Triggers:** `trigger_set_po_number`

---

### invoices

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| po_id | INTEGER | FK → purchase_orders, CASCADE, **UNIQUE** | One invoice per PO |
| invoice_number | VARCHAR(50) | UNIQUE NOT NULL | Auto-generated INV-YYYY-NNNNNN |
| invoice_date | TIMESTAMP | DEFAULT NOW | |
| due_date | TIMESTAMP | | Invoice-specific due date (shown in invoice mockup) |
| pdf_url | TEXT | | S3/storage URL of generated PDF |
| status | VARCHAR(20) | CHECK (sent/pending/paid) | |
| created_at | TIMESTAMP | DEFAULT NOW | |

**Triggers:** `trigger_set_invoice_number`

---

### activity_logs

Immutable audit log — no UPDATE or DELETE allowed.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| user_id | INTEGER | FK → users, ON DELETE SET NULL | |
| action | VARCHAR(100) | NOT NULL | e.g. created, updated, approved, rejected |
| entity_type | VARCHAR(50) | NOT NULL | e.g. rfq, quotation, purchase_order |
| entity_id | INTEGER | NOT NULL | |
| description | TEXT | | Human-readable description |
| ip_address | INET | | For security audit trail |
| metadata | JSONB | | Extra context, e.g. `{"old_status":"pending","new_status":"active"}` |
| created_at | TIMESTAMP | DEFAULT NOW | |

---

### vendor_ratings

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| vendor_id | INTEGER | FK → vendors, CASCADE | |
| po_id | INTEGER | FK → purchase_orders, CASCADE | |
| rating | INTEGER | NOT NULL CHECK (1-5) | Raw input (1, 2, 3, 4, 5) |
| review | TEXT | | |
| rated_by | INTEGER | FK → users, ON DELETE SET NULL | |
| created_at | TIMESTAMP | DEFAULT NOW | |

> `vendors.rating` stores `DECIMAL(3,2)` computed average. The `trigger_update_vendor_rating` uses `AVG(rating::DECIMAL)` to ensure correct decimal division.

---

### ai_summaries

Caches Claude/AI quotation comparison summaries. Avoids re-calling the API on every page load.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| rfq_id | INTEGER | FK → rfqs, CASCADE | The RFQ being summarized |
| summary | TEXT | NOT NULL | AI-generated summary output |
| recommended_vendor_id | INTEGER | FK → vendors, ON DELETE SET NULL | Vendor the AI recommends |
| reasoning | TEXT | | Explanation for recommendation |
| generated_at | TIMESTAMP | DEFAULT NOW | |
| generated_by | INTEGER | FK → users, ON DELETE SET NULL | User who triggered the summary |

---

### notifications

Drives PS Screen 9 — RFQ notifications, approval alerts, invoice updates.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| user_id | INTEGER | FK → users, CASCADE | Recipient |
| title | VARCHAR(255) | NOT NULL | Short notification title |
| message | TEXT | | Full notification body |
| type | VARCHAR(30) | | rfq, approval, invoice, vendor |
| entity_type | VARCHAR(50) | | e.g. rfq, quotation, purchase_order |
| entity_id | INTEGER | | ID of the related record |
| is_read | BOOLEAN | DEFAULT FALSE | |
| created_at | TIMESTAMP | DEFAULT NOW | |

**Indexes:** `idx_notifications_user_id`, `idx_notifications_is_read`

---

### password_reset_tokens

Supports the Forgot Password flow on the Login screen.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | |
| user_id | INTEGER | FK → users, CASCADE | |
| token | VARCHAR(255) | UNIQUE NOT NULL | Cryptographically random token (UUID or similar) |
| expires_at | TIMESTAMP | NOT NULL | 1-hour TTL recommended |
| used | BOOLEAN | DEFAULT FALSE | Invalidated after use |
| created_at | TIMESTAMP | DEFAULT NOW | |

---

## Auto-Generated Numbers

| Format | Example | Reset |
|--------|---------|-------|
| `PO-YYYY-NNNNNN` | `PO-2026-000001` | Annually |
| `INV-YYYY-NNNNNN` | `INV-2026-000001` | Annually |

---

## Triggers

| Trigger | Table | Timing | Purpose |
|---------|-------|--------|---------|
| `trigger_set_po_number` | purchase_orders | BEFORE INSERT | Auto-generate PO number |
| `trigger_set_invoice_number` | invoices | BEFORE INSERT | Auto-generate invoice number |
| `trigger_update_vendor_rating` | vendor_ratings | AFTER INSERT | Recompute vendor DECIMAL avg rating |
| `trigger_set_approval_rfq_id` | approvals | BEFORE INSERT | Auto-populate `rfq_id` from linked quotation |

---

## Rating Type Clarification

```
vendor_ratings.rating  → INTEGER CHECK (1-5)     — raw user input (star selection)
vendors.rating         → DECIMAL(3,2) DEFAULT 0   — computed average, e.g. 4.50
```

The trigger uses `AVG(rating::DECIMAL)` to ensure the result is a proper decimal average, not integer division.

---

## Tax Logic (CGST / SGST / IGST)

- If `vendor.state_code = org_profile.org_gstin[0:2]` → intra-state → split into CGST + SGST
- If states differ → inter-state → use IGST only
- Application layer should compute and set the correct columns when creating a PO

---

## Security Considerations

1. **Passwords:** bcrypt, minimum 12 rounds
2. **SQL Injection:** Always use parameterized queries — never string interpolation
3. **RBAC:** Role checks enforced at API middleware layer
4. **Audit Trail:** `activity_logs` is append-only — block UPDATE/DELETE via application policy
5. **Reset Tokens:** Single-use, 1-hour expiry, marked `used = TRUE` immediately after consumption
6. **Immutable Logs:** Never expose raw `metadata` JSONB to the frontend without sanitizing

---

## Performance Notes

1. All foreign keys and high-cardinality filter columns are indexed
2. `UNIQUE (rfq_id, vendor_id)` on quotations doubles as an index for RFQ comparison queries
3. `UNIQUE (po_id)` on invoices prevents duplicate invoice generation
4. `ai_summaries` avoids repeat API calls — always check for existing summary before generating
5. `notifications.is_read` composite index `(user_id, is_read)` optimizes the unread-count query
6. Consider partitioning `activity_logs` by month once it grows large

---

## Full Index Reference

| Index Name | Table | Column(s) | Purpose |
|------------|-------|-----------|---------|
| `idx_users_email` | users | email | Fast login lookup |
| `idx_users_role` | users | role | Filter users by role |
| `idx_vendors_user_id` | vendors | user_id | Join vendors → users |
| `idx_vendors_status` | vendors | status | Filter active/pending/blocked |
| `idx_vendors_category` | vendors | category | Category-based filtering |
| `idx_vendors_gstin` | vendors | gstin | GSTIN uniqueness lookup |
| `idx_rfqs_created_by` | rfqs | created_by | RFQs by officer |
| `idx_rfqs_status` | rfqs | status | Filter by draft/sent/closed |
| `idx_rfqs_deadline` | rfqs | deadline | Deadline-sorted listings |
| `idx_rfqs_priority` | rfqs | priority | Priority breakdown analytics |
| `idx_rfq_items_rfq_id` | rfq_items | rfq_id | Items per RFQ |
| `idx_rfq_vendors_rfq_id` | rfq_vendors | rfq_id | Vendors assigned to RFQ |
| `idx_rfq_vendors_vendor_id` | rfq_vendors | vendor_id | RFQs assigned to vendor |
| `idx_quotations_rfq_id` | quotations | rfq_id | Quotations per RFQ |
| `idx_quotations_vendor_id` | quotations | vendor_id | Quotations by vendor |
| `idx_quotations_status` | quotations | status | Filter submitted/draft |
| `idx_quotation_items_quotation_id` | quotation_items | quotation_id | Items per quotation |
| `idx_quotation_items_rfq_item_id` | quotation_items | rfq_item_id | Vendor item → RFQ item mapping |
| `idx_approvals_quotation_id` | approvals | quotation_id | Approvals per quotation |
| `idx_approvals_rfq_id` | approvals | rfq_id | Direct RFQ lookup on approval list |
| `idx_approvals_approver_id` | approvals | approver_id | Pending approvals per manager |
| `idx_approvals_status` | approvals | status | Filter pending/approved/rejected |
| `idx_purchase_orders_vendor_id` | purchase_orders | vendor_id | POs by vendor |
| `idx_purchase_orders_status` | purchase_orders | status | Filter by payment status |
| `idx_purchase_orders_po_number` | purchase_orders | po_number | PO lookup by number |
| `idx_purchase_orders_approved_by` | purchase_orders | approved_by | Audit trail by approver |
| `idx_invoices_po_id` | invoices | po_id | Invoice per PO |
| `idx_invoices_status` | invoices | status | Filter sent/pending/paid |
| `idx_activity_logs_user_id` | activity_logs | user_id | Logs by user |
| `idx_activity_logs_entity` | activity_logs | entity_type, entity_id | Logs per entity (composite) |
| `idx_activity_logs_created_at` | activity_logs | created_at | Timeline queries |
| `idx_vendor_ratings_vendor_id` | vendor_ratings | vendor_id | Ratings per vendor |
| `idx_vendor_ratings_po_id` | vendor_ratings | po_id | Rating per PO |
| `idx_ai_summaries_rfq_id` | ai_summaries | rfq_id | Summary lookup per RFQ |
| `idx_notifications_user_id` | notifications | user_id | Notifications per user |
| `idx_notifications_is_read` | notifications | user_id, is_read | Unread count (composite) |
| `idx_password_reset_tokens_user_id` | password_reset_tokens | user_id | Tokens per user |
| `idx_password_reset_tokens_token` | password_reset_tokens | token | Token validation lookup |

---

## Seed Data

The schema ships with sample data for local development. All password hashes use bcrypt (12 rounds) for the password `password123`.

| Role | Email |
|------|-------|
| admin | admin@vendorbridge.com |
| procurement_officer | procurement@vendorbridge.com |
| manager | manager@vendorbridge.com |
| vendor | vendor@vendorbridge.com |

Two sample vendors (`Tech Supplies Ltd`, `Office Essentials Co`), one RFQ (`Office Laptops Procurement`), and one submitted quotation are included to verify joins and triggers immediately after `init-db` runs.
