-- Add extended profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS passport_number text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS entry_date date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS exit_date date;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blood_type text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS allergies text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS medical_conditions text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS visa_doc_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS passport_photo_url text;

-- Ensure simple storage policy for avatars/docs if buckets exist (optional/generic)
-- We won't create buckets here as it requires storage extension, but fields are ready.
