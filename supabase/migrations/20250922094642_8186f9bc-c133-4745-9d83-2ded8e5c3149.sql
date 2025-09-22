-- Rename card_number column to bank_account_no in user_banks table
ALTER TABLE public.user_banks 
RENAME COLUMN card_number TO bank_account_no;