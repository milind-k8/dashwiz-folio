-- Create transaction type enum
CREATE TYPE public.transaction_type AS ENUM ('debit', 'credit', 'balance');

-- Create merchants table (independent, survives user/bank deletion)
CREATE TABLE public.merchants (
    merchant_name TEXT PRIMARY KEY,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table (linked to banks with cascade delete)
CREATE TABLE public.transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    mail_id TEXT NOT NULL,
    mail_time TIMESTAMP WITH TIME ZONE NOT NULL,
    transaction_type public.transaction_type NOT NULL,
    snippet TEXT,
    amount INTEGER NOT NULL,
    merchant TEXT,
    bank_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Foreign key to user_banks with cascade delete
    CONSTRAINT fk_transactions_bank FOREIGN KEY (bank_id) 
        REFERENCES public.user_banks(id) ON DELETE CASCADE,
        
    -- Unique constraint on mail_id to prevent duplicate transactions
    CONSTRAINT unique_mail_id UNIQUE (mail_id)
);

-- Enable RLS on both tables
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for merchants (public read access for authenticated users)
CREATE POLICY "Authenticated users can view all merchants" 
ON public.merchants 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert merchants" 
ON public.merchants 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update merchants" 
ON public.merchants 
FOR UPDATE 
TO authenticated
USING (true);

-- RLS policies for transactions (users can only access transactions for their banks)
CREATE POLICY "Users can view their own bank transactions" 
ON public.transactions 
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_banks 
        WHERE user_banks.id = transactions.bank_id 
        AND user_banks.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert transactions for their banks" 
ON public.transactions 
FOR INSERT 
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_banks 
        WHERE user_banks.id = transactions.bank_id 
        AND user_banks.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own bank transactions" 
ON public.transactions 
FOR UPDATE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_banks 
        WHERE user_banks.id = transactions.bank_id 
        AND user_banks.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their own bank transactions" 
ON public.transactions 
FOR DELETE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_banks 
        WHERE user_banks.id = transactions.bank_id 
        AND user_banks.user_id = auth.uid()
    )
);

-- Create indexes for better performance
CREATE INDEX idx_transactions_bank_id ON public.transactions(bank_id);
CREATE INDEX idx_transactions_mail_time ON public.transactions(mail_time);
CREATE INDEX idx_transactions_transaction_type ON public.transactions(transaction_type);
CREATE INDEX idx_transactions_merchant ON public.transactions(merchant);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_merchants_updated_at
    BEFORE UPDATE ON public.merchants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();