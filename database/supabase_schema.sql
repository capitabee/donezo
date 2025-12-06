-- Donezo Database Schema for Supabase
-- Run these commands in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  tier VARCHAR(50) DEFAULT 'Basic' CHECK (tier IN ('Basic', 'Professional', 'Expert')),
  earnings DECIMAL(10, 2) DEFAULT 0.00,
  quality_score INTEGER DEFAULT 100 CHECK (quality_score >= 0 AND quality_score <= 100),
  completed_tasks INTEGER DEFAULT 0,
  mandate_active BOOLEAN DEFAULT false,
  stripe_customer_id VARCHAR(255),
  signup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('TikTok', 'YouTube', 'Instagram')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('Day', 'Night')),
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  payout DECIMAL(10, 2) NOT NULL DEFAULT 0.20,
  target_users TEXT DEFAULT 'all', -- 'all' or JSON array of user IDs
  published_by VARCHAR(255),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User task completions (join table)
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'failed', 'needs_review')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_spent_seconds INTEGER,
  payout_amount DECIMAL(10, 2),
  ai_verification_status VARCHAR(50),
  ai_confidence_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- Transactions / Earnings table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('task_earning', 'payout', 'upgrade_fee', 'bonus', 'adjustment')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  task_completion_id UUID REFERENCES task_completions(id),
  stripe_payment_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin messages / Broadcasts
CREATE TABLE IF NOT EXISTS admin_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('GENERAL', 'PROMOTIONAL', 'ALERT')),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  target_users TEXT DEFAULT 'all', -- 'all' or JSON array of user IDs
  is_read BOOLEAN DEFAULT false,
  sent_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User message read status
CREATE TABLE IF NOT EXISTS user_message_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message_id UUID REFERENCES admin_messages(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bonus_paid BOOLEAN DEFAULT false,
  bonus_amount DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- Chat memory table for AI conversation history
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add upgrade_deadline column to users if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS upgrade_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_earnings DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS signup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Index for chat messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_tasks_platform ON tasks(platform);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_task_completions_user ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_status ON task_completions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_admin_messages_type ON admin_messages(type);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_message_reads ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read/update their own data
CREATE POLICY users_self_policy ON users
  FOR ALL
  USING (auth.uid() = id);

-- RLS Policy: Service role can access all user data
CREATE POLICY users_service_role ON users
  FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policy: Users can only see their own sessions
CREATE POLICY sessions_self_policy ON user_sessions
  FOR ALL
  USING (user_id = auth.uid());

-- RLS Policy: Users can only see their own task completions
CREATE POLICY completions_self_policy ON task_completions
  FOR ALL
  USING (user_id = auth.uid());

-- RLS Policy: Users can only see their own transactions
CREATE POLICY transactions_self_policy ON transactions
  FOR ALL
  USING (user_id = auth.uid());

-- RLS Policy: Tasks are readable by all authenticated users
CREATE POLICY tasks_read_policy ON tasks
  FOR SELECT
  USING (is_active = true);

-- RLS Policy: Admin messages are readable by all
CREATE POLICY messages_read_policy ON admin_messages
  FOR SELECT
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at for users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update user earnings when task is completed
CREATE OR REPLACE FUNCTION update_user_earnings_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE users 
    SET 
      earnings = earnings + NEW.payout_amount,
      completed_tasks = completed_tasks + 1
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-updating earnings
CREATE TRIGGER update_earnings_on_task_complete
  AFTER UPDATE ON task_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_earnings_on_completion();

-- Insert some sample tasks
INSERT INTO tasks (platform, category, title, url, payout, target_users, published_by) VALUES
('TikTok', 'Day', 'Watch and Engage - Dance Video', 'https://www.tiktok.com/@example/video/123', 0.20, 'all', 'system'),
('TikTok', 'Day', 'Like and Comment - Cooking Tutorial', 'https://www.tiktok.com/@example/video/124', 0.25, 'all', 'system'),
('Instagram', 'Day', 'Follow and Like - Travel Post', 'https://www.instagram.com/p/example', 0.15, 'all', 'system'),
('Instagram', 'Day', 'View Story and React', 'https://www.instagram.com/stories/example', 0.10, 'all', 'system'),
('YouTube', 'Night', 'Watch Full Video - Documentary', 'https://www.youtube.com/watch?v=example1', 1.50, 'all', 'system'),
('YouTube', 'Night', 'Watch and Subscribe - Tech Review', 'https://www.youtube.com/watch?v=example2', 2.00, 'all', 'system'),
('YouTube', 'Night', 'Background Play - Music Mix', 'https://www.youtube.com/watch?v=example3', 2.50, 'all', 'system'),
('TikTok', 'Day', 'View and Share - Viral Clip', 'https://www.tiktok.com/@example/video/125', 0.30, 'all', 'system'),
('Instagram', 'Day', 'Engage with Reel', 'https://www.instagram.com/reel/example', 0.20, 'all', 'system'),
('TikTok', 'Day', 'Complete Survey Interaction', 'https://www.tiktok.com/@example/video/126', 0.35, 'all', 'system')
ON CONFLICT DO NOTHING;

-- Grant appropriate permissions to authenticated users
GRANT SELECT ON tasks TO authenticated;
GRANT SELECT, INSERT ON task_completions TO authenticated;
GRANT SELECT ON transactions TO authenticated;
GRANT SELECT ON admin_messages TO authenticated;
GRANT SELECT, INSERT ON user_message_reads TO authenticated;
