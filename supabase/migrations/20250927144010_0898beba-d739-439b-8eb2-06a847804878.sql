-- Create user tokens table for storing Google OAuth tokens
CREATE TABLE public.user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_access_token TEXT,
  google_refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'active' CHECK (sync_status IN ('active', 'expired', 'error', 'disabled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS for user_tokens
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for user_tokens
CREATE POLICY "Users can view their own tokens" 
ON public.user_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens" 
ON public.user_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens" 
ON public.user_tokens 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create email sync logs table for monitoring
CREATE TABLE public.email_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sync_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sync_completed_at TIMESTAMP WITH TIME ZONE,
  emails_processed INTEGER DEFAULT 0,
  transactions_created INTEGER DEFAULT 0,
  error_message TEXT,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for email_sync_logs
ALTER TABLE public.email_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for email_sync_logs
CREATE POLICY "Users can view their own sync logs" 
ON public.email_sync_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Service role can insert and update sync logs (for automated sync)
CREATE POLICY "Service role can manage sync logs" 
ON public.email_sync_logs 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create function to update timestamps
CREATE TRIGGER update_user_tokens_updated_at
BEFORE UPDATE ON public.user_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_user_tokens_user_id ON public.user_tokens(user_id);
CREATE INDEX idx_user_tokens_sync_status ON public.user_tokens(sync_status);
CREATE INDEX idx_user_tokens_expires_at ON public.user_tokens(token_expires_at);
CREATE INDEX idx_email_sync_logs_user_id ON public.email_sync_logs(user_id);
CREATE INDEX idx_email_sync_logs_status ON public.email_sync_logs(status);
CREATE INDEX idx_email_sync_logs_started_at ON public.email_sync_logs(sync_started_at);

-- Function to clean up old sync logs (keep last 100 per user)
CREATE OR REPLACE FUNCTION public.cleanup_old_sync_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.email_sync_logs
  WHERE id IN (
    SELECT id
    FROM (
      SELECT id,
             ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY sync_started_at DESC) as rn
      FROM public.email_sync_logs
    ) t
    WHERE t.rn > 100
  );
END;
$$;