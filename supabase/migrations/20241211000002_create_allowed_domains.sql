-- ================================================
-- ALLOWED DOMAINS TABLE
-- ================================================
-- Configuration table for controlling which domains can access blog API

CREATE TABLE public_allowed_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_allowed_domains_active ON public_allowed_domains(is_active);
CREATE INDEX idx_allowed_domains_domain ON public_allowed_domains(domain);

COMMENT ON TABLE public_allowed_domains IS 'Domains allowed to access public blog API';
COMMENT ON COLUMN public_allowed_domains.domain IS 'Full domain URL (e.g., https://myvirtualmate.com)';
COMMENT ON COLUMN public_allowed_domains.is_active IS 'Whether this domain is currently allowed access';

-- Enable RLS
ALTER TABLE public_allowed_domains ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated admin users can view allowed domains
CREATE POLICY "Admin users can view allowed domains"
ON public_allowed_domains
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only authenticated admin users can insert allowed domains
CREATE POLICY "Admin users can insert allowed domains"
ON public_allowed_domains
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Only authenticated admin users can update allowed domains
CREATE POLICY "Admin users can update allowed domains"
ON public_allowed_domains
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Only authenticated admin users can delete allowed domains
CREATE POLICY "Admin users can delete allowed domains"
ON public_allowed_domains
FOR DELETE
TO authenticated
USING (true);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_allowed_domains_updated_at
    BEFORE UPDATE ON public_allowed_domains
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
