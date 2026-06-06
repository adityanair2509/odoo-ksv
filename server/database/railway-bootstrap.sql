-- Railway bootstrap: persistent app state for VendorBridge API
-- Full ERP schema lives in schema.sql (future migration)

CREATE TABLE IF NOT EXISTS app_store (
    id         INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    payload    JSONB NOT NULL DEFAULT '{}'::jsonb,
    saved_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
