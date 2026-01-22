-- Credits System SQL
-- Run these in order in Supabase SQL Editor

-- 1. Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 3. Users can only read their own profile
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- 4. Trigger to grant 3 credits on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, credits)
  VALUES (NEW.id, 3)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Generic adjust_credits RPC (extensible for Stripe)
CREATE OR REPLACE FUNCTION adjust_credits(
  p_delta INTEGER,
  p_reason TEXT DEFAULT 'manual',
  p_source TEXT DEFAULT 'system'
)
RETURNS INTEGER AS $$
DECLARE
  new_balance INTEGER;
BEGIN
  -- Ensure user has profile (auto-create with 0 if missing)
  INSERT INTO user_profiles (id, credits)
  VALUES (auth.uid(), 0)
  ON CONFLICT (id) DO NOTHING;

  -- Atomic update with check for negative
  UPDATE user_profiles
  SET 
    credits = credits + p_delta,
    updated_at = NOW()
  WHERE id = auth.uid()
    AND credits + p_delta >= 0
  RETURNING credits INTO new_balance;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Simple get_credits RPC
CREATE OR REPLACE FUNCTION get_credits()
RETURNS INTEGER AS $$
DECLARE
  balance INTEGER;
BEGIN
  SELECT credits INTO balance
  FROM user_profiles
  WHERE id = auth.uid();
  
  -- Return 0 if no profile exists
  RETURN COALESCE(balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
