-- Add category column to transactions table
ALTER TABLE transactions ADD COLUMN category TEXT;

-- Create categories table for managing available categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Enable RLS on categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for categories
CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id AND is_default = false);

-- Create trigger for updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO categories (user_id, name, is_default) VALUES
    (NEW.id, 'Food Delivery', true),
    (NEW.id, 'Online Shopping', true),
    (NEW.id, 'Groceries', true),
    (NEW.id, 'Travel', true),
    (NEW.id, 'Transportation', true),
    (NEW.id, 'Entertainment', true),
    (NEW.id, 'Banking', true),
    (NEW.id, 'Healthcare', true),
    (NEW.id, 'Education', true),
    (NEW.id, 'Fashion', true),
    (NEW.id, 'Utilities', true),
    (NEW.id, 'Other', true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-create categories on user signup
CREATE TRIGGER on_user_created_create_categories
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_categories();

-- Update existing transactions with categories from merchants
UPDATE transactions t
SET category = COALESCE(m.category, 'Other')
FROM merchants m
WHERE t.merchant = m.merchant_name AND t.category IS NULL;

-- Set remaining NULL categories to 'Other'
UPDATE transactions
SET category = 'Other'
WHERE category IS NULL;

-- Update get_user_transactions_with_details function to return category from transactions
CREATE OR REPLACE FUNCTION public.get_user_transactions_with_details(user_uuid uuid, months_back integer DEFAULT 3)
 RETURNS TABLE(transaction_id uuid, bank_id uuid, bank_name text, bank_account_no text, amount numeric, transaction_type text, mail_time timestamp with time zone, merchant text, snippet text, mail_id text, category text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  date_filter TIMESTAMP WITH TIME ZONE;
BEGIN
  date_filter := NOW() - (months_back || ' months')::INTERVAL;
  
  RETURN QUERY
  SELECT 
    t.id as transaction_id,
    t.bank_id,
    ub.bank_name,
    ub.bank_account_no,
    t.amount,
    t.transaction_type::TEXT,
    t.mail_time,
    t.merchant,
    t.snippet,
    t.mail_id,
    t.category,
    t.created_at,
    t.updated_at
  FROM transactions t
  INNER JOIN user_banks ub ON t.bank_id = ub.id
  WHERE ub.user_id = user_uuid
    AND t.mail_time >= date_filter
  ORDER BY t.mail_time DESC;
END;
$function$;