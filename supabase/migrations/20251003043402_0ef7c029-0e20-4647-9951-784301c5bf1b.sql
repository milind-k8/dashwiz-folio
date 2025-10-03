-- Seed default categories for all existing users
INSERT INTO categories (user_id, name, is_default)
SELECT 
  u.id,
  category_name,
  true
FROM auth.users u
CROSS JOIN (
  VALUES 
    ('Food Delivery'),
    ('Online Shopping'),
    ('Groceries'),
    ('Travel'),
    ('Transportation'),
    ('Entertainment'),
    ('Banking'),
    ('Healthcare'),
    ('Education'),
    ('Fashion'),
    ('Utilities'),
    ('Other')
) AS default_categories(category_name)
ON CONFLICT (user_id, name) DO NOTHING;