/*
  # Add Missing Security App Features
  
  1. New Tables
    - `incident_reports`: Track incidents with details and media
    - `trusted_zones`: Safe locations users can configure
    - `activity_log`: Audit trail of user actions
    - `app_settings`: User preferences and configurations
  
  2. Modified Tables
    - Add verification status and fields to users
    - Add media support to sos_events
  
  3. Security
    - Enable RLS on all tables
    - Add comprehensive policies for data access
    - Ensure user isolation
*/

-- Add verification fields to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN phone_verified boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'profile_picture'
  ) THEN
    ALTER TABLE users ADD COLUMN profile_picture text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'emergency_mode_active'
  ) THEN
    ALTER TABLE users ADD COLUMN emergency_mode_active boolean DEFAULT false;
  END IF;
END $$;

-- Add media fields to sos_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sos_events' AND column_name = 'audio_url'
  ) THEN
    ALTER TABLE sos_events ADD COLUMN audio_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sos_events' AND column_name = 'photo_urls'
  ) THEN
    ALTER TABLE sos_events ADD COLUMN photo_urls text[];
  END IF;
END $$;

-- Create incident_reports table
CREATE TABLE IF NOT EXISTS incident_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sos_event_id uuid REFERENCES sos_events(id) ON DELETE SET NULL,
  incident_type text NOT NULL,
  severity text NOT NULL,
  description text NOT NULL,
  location_latitude double precision,
  location_longitude double precision,
  witnesses text[],
  photo_urls text[],
  evidence_notes text,
  status text DEFAULT 'reported',
  assigned_to uuid,
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

-- Create trusted_zones table
CREATE TABLE IF NOT EXISTS trusted_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  zone_name text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  radius_meters integer DEFAULT 1000,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE trusted_zones ENABLE ROW LEVEL SECURITY;

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  emergency_auto_alert boolean DEFAULT true,
  location_tracking_enabled boolean DEFAULT true,
  share_location_with_contacts boolean DEFAULT true,
  sos_sound_enabled boolean DEFAULT true,
  sos_vibration_enabled boolean DEFAULT true,
  emergency_mode_timeout_minutes integer DEFAULT 30,
  preferred_contact_id uuid REFERENCES emergency_contacts(id),
  two_factor_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for incident_reports
CREATE POLICY "Users can view own incidents"
  ON incident_reports FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own incidents"
  ON incident_reports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own incidents"
  ON incident_reports FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for trusted_zones
CREATE POLICY "Users can view own zones"
  ON trusted_zones FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own zones"
  ON trusted_zones FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own zones"
  ON trusted_zones FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own zones"
  ON trusted_zones FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for activity_log
CREATE POLICY "Users can view own activity"
  ON activity_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own activity"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for app_settings
CREATE POLICY "Users can view own settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own settings"
  ON app_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
  ON app_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_incident_reports_user_id ON incident_reports(user_id);
CREATE INDEX idx_incident_reports_status ON incident_reports(status);
CREATE INDEX idx_trusted_zones_user_id ON trusted_zones(user_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);
