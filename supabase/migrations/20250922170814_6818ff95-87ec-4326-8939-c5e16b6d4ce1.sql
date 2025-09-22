-- Create function to get user transactions with bank and merchant data in single call
CREATE OR REPLACE FUNCTION get_user_transactions_with_details(user_uuid UUID, months_back INTEGER DEFAULT 3)
RETURNS TABLE (
  transaction_id UUID,
  bank_id UUID,
  bank_name TEXT,
  bank_account_no TEXT,
  amount NUMERIC(10,2),
  transaction_type TEXT,
  mail_time TIMESTAMP WITH TIME ZONE,
  merchant TEXT,
  snippet TEXT,
  mail_id TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  date_filter TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate date filter
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
    COALESCE(m.category, 'Other') as category,
    t.created_at,
    t.updated_at
  FROM transactions t
  INNER JOIN user_banks ub ON t.bank_id = ub.id
  LEFT JOIN merchants m ON t.merchant = m.merchant_name
  WHERE ub.user_id = user_uuid
    AND t.mail_time >= date_filter
  ORDER BY t.mail_time DESC;
END;
$$;