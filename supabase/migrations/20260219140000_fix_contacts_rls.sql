-- Enable RLS on emergency_contacts if not already enabled
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own contacts
DROP POLICY IF EXISTS "Users can insert their own emergency contacts" ON emergency_contacts;
CREATE POLICY "Users can insert their own emergency contacts"
ON emergency_contacts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own contacts
DROP POLICY IF EXISTS "Users can view their own emergency contacts" ON emergency_contacts;
CREATE POLICY "Users can view their own emergency contacts"
ON emergency_contacts FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can update their own contacts
DROP POLICY IF EXISTS "Users can update their own emergency contacts" ON emergency_contacts;
CREATE POLICY "Users can update their own emergency contacts"
ON emergency_contacts FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own contacts
DROP POLICY IF EXISTS "Users can delete their own emergency contacts" ON emergency_contacts;
CREATE POLICY "Users can delete their own emergency contacts"
ON emergency_contacts FOR DELETE
USING (auth.uid() = user_id);
