-- Musimo Database Schema for Supabase
-- Execute these queries in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(12) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- OTP verification table
CREATE TABLE IF NOT EXISTS otp_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    expire_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_otp_email ON otp_verification(email);
CREATE INDEX idx_otp_expire ON otp_verification(expire_at);

-- Auto-delete expired OTPs (cleanup function)
CREATE OR REPLACE FUNCTION delete_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM otp_verification WHERE expire_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(12) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('emotion_detection', 'instrument_classification')),
    audio_path TEXT NOT NULL,
    melspectrogram_path TEXT NOT NULL,
    output JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_model_type ON transactions(model_type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Logs table
CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(12) REFERENCES users(id) ON DELETE SET NULL,
    transaction_id VARCHAR(50) REFERENCES transactions(transaction_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    model_type VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logs_user_id ON logs(user_id);
CREATE INDEX idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX idx_logs_status ON logs(status);

-- Update updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verification ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid()::text = id);

-- Transactions policies
CREATE POLICY "Users can view own transactions"
    ON transactions FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own transactions"
    ON transactions FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own transactions"
    ON transactions FOR DELETE
    USING (auth.uid()::text = user_id);

-- Logs policies (users can only read their own logs)
CREATE POLICY "Users can view own logs"
    ON logs FOR SELECT
    USING (auth.uid()::text = user_id);

-- Service role can access all data (for API operations)
CREATE POLICY "Service role can access all users"
    ON users FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all transactions"
    ON transactions FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all logs"
    ON logs FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all otp_verification"
    ON otp_verification FOR ALL
    USING (auth.role() = 'service_role');

-- Create a view for user statistics
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(t.transaction_id) as total_transactions,
    COUNT(CASE WHEN t.model_type = 'emotion_detection' THEN 1 END) as emotion_detections,
    COUNT(CASE WHEN t.model_type = 'instrument_classification' THEN 1 END) as instrument_classifications,
    MIN(t.created_at) as first_transaction,
    MAX(t.created_at) as last_transaction
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id
GROUP BY u.id, u.name, u.email;

-- Grant permissions on the view
GRANT SELECT ON user_statistics TO authenticated;
GRANT SELECT ON user_statistics TO service_role;
