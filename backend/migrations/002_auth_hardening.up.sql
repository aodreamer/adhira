-- Account lockout tracking and email uniqueness

ALTER TABLE mst_user ADD COLUMN IF NOT EXISTS failed_attempts SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE mst_user ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE mst_user ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Multiple users may have a blank email (from legacy imports), so only enforce
-- uniqueness for non-empty values.
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email_unique ON mst_user (LOWER(email)) WHERE email <> '';
