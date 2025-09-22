-- Create table for storing user banks
CREATE TABLE public.user_banks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bank_name TEXT NOT NULL,
  card_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, bank_name, card_number)
);

-- Enable Row Level Security
ALTER TABLE public.user_banks ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own banks" 
ON public.user_banks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own banks" 
ON public.user_banks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own banks" 
ON public.user_banks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own banks" 
ON public.user_banks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_banks_updated_at
BEFORE UPDATE ON public.user_banks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();