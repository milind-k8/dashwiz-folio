-- Change amount column from integer to numeric to handle decimal values
ALTER TABLE transactions ALTER COLUMN amount TYPE NUMERIC(10,2) USING amount::NUMERIC(10,2);