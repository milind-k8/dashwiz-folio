-- Create email monitoring configuration table
CREATE TABLE public.email_monitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bank_patterns JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_processed_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  monitoring_enabled BOOLEAN NOT NULL DEFAULT true,
  gmail_history_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email processing queue table
CREATE TABLE public.email_processing_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_id TEXT NOT NULL,
  gmail_message_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retry')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  error_message TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create processing logs table for detailed history
CREATE TABLE public.processing_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  queue_id UUID,
  log_level TEXT NOT NULL DEFAULT 'info' CHECK (log_level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.email_monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_monitors
CREATE POLICY "Users can manage their own email monitors" 
ON public.email_monitors 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for email_processing_queue
CREATE POLICY "Users can view their own processing queue" 
ON public.email_processing_queue 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage processing queue" 
ON public.email_processing_queue 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create RLS policies for processing_logs
CREATE POLICY "Users can view their own processing logs" 
ON public.processing_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert processing logs" 
ON public.processing_logs 
FOR INSERT 
WITH CHECK (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_email_monitors_updated_at
BEFORE UPDATE ON public.email_monitors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_processing_queue_updated_at
BEFORE UPDATE ON public.email_processing_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_email_monitors_user_id ON public.email_monitors(user_id);
CREATE INDEX idx_email_monitors_enabled ON public.email_monitors(monitoring_enabled) WHERE monitoring_enabled = true;
CREATE INDEX idx_email_processing_queue_user_id ON public.email_processing_queue(user_id);
CREATE INDEX idx_email_processing_queue_status ON public.email_processing_queue(status);
CREATE INDEX idx_email_processing_queue_scheduled ON public.email_processing_queue(scheduled_at) WHERE status IN ('pending', 'retry');
CREATE INDEX idx_processing_logs_user_id ON public.processing_logs(user_id);
CREATE INDEX idx_processing_logs_created_at ON public.processing_logs(created_at DESC);

-- Enable realtime for processing queue and logs
ALTER TABLE public.email_processing_queue REPLICA IDENTITY FULL;
ALTER TABLE public.processing_logs REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_processing_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE public.processing_logs;