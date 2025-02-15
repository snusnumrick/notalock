-- Drop existing policies
DROP POLICY IF EXISTS "Allow full access for admins" ON categories;
DROP POLICY IF EXISTS "Allow viewing visible categories for all users" ON categories;

-- Create new policies that check roles in the profiles table
CREATE POLICY "Allow full access for admins"
ON categories
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

CREATE POLICY "Allow viewing visible categories for all users"
ON categories
FOR SELECT
USING (is_visible = true);