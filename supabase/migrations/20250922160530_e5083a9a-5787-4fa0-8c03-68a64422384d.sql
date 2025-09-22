-- Make mail_id unique in transactions table
ALTER TABLE public.transactions ADD CONSTRAINT transactions_mail_id_unique UNIQUE (mail_id);