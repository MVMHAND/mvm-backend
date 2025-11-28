-- Fix prevent_super_admin_modification trigger so deletes return the OLD row
CREATE OR REPLACE FUNCTION prevent_super_admin_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_super_admin = TRUE THEN
        RAISE EXCEPTION 'Cannot modify or delete Super Admin role';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
