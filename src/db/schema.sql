CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    username VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE email_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    verified BOOLEAN NOT NULL DEFAULT false,
    verification_code VARCHAR(6) NOT NULL,
    verification_attempts INT DEFAULT 0,
    CONSTRAINT verification_check CHECK (
        (verified = false) OR (verified = true AND verification_code IS NOT NULL)
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE securities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    failed_attempts INT DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_failed_at TIMESTAMPTZ,

    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    mfa_secret TEXT, -- should be encrypted at the application level
    CONSTRAINT mfa_check CHECK (
        (mfa_enabled = false) OR (mfa_enabled = true AND mfa_secret IS NOT NULL)
    ),

    recovery_codes TEXT[],
    password_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    reset_token TEXT,
    reset_expires_at TIMESTAMPTZ,
    CONSTRAINT reset_check CHECK (
        (reset_token IS NULL AND reset_expires_at IS NULL) OR 
        (reset_token IS NOT NULL AND reset_expires_at IS NOT NULL)
    ),

    last_login_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()

);

-- This is a function to update the updated_at field when record is changed
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    -- This condition ensures we only update if data actually changed
    IF ROW(NEW.*) IS DISTINCT FROM ROW(OLD.*) THEN
        NEW.updated_at = now();
        RETURN NEW;
    ELSE
        RETURN OLD;
    END IF;
END;
$$ language 'plpgsql';

-- This is a trigger of the update_modified_column for users table
CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- This is a trigger of the update_modified_column for email_addresses table
CREATE TRIGGER update_email_addresses_modtime
    BEFORE UPDATE ON email_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- This is a trigger of the updated_modified_column for securify table
CREATE TRIGGER update_securities_modtime
    BEFORE UPDATE ON securities
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
