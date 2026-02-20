-- Add zone_type to trusted_zones
ALTER TABLE trusted_zones ADD COLUMN IF NOT EXISTS zone_type text DEFAULT 'safe';

-- Update RLS to allow viewing all active zones (public/shared) if we want "public" zones?
-- For now, keep it user-scoped as per original design, but maybe "public" means "everyone sees it"?
-- "add danger zone,medium,safe,public"
-- If "public" means shared, we need RLS update.
-- Let's update RLS to allow reading any zone where zone_type = 'public' OR user_id = auth.uid()

DROP POLICY IF EXISTS "Users can view own zones" ON trusted_zones;

CREATE POLICY "Users can view own and public zones"
  ON trusted_zones FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR zone_type = 'public');

-- Insert allow stays same (users create their own)
