/*
  # Phase 0: Email SOS System Database Schema
  
  1. New Tables
    - `users` - Basic user registration with tourist info
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `phone` (text)
      - `digital_id` (text, unique) - QR-scannable ID
      - `current_latitude` (float)
      - `current_longitude` (float)
      - `last_location_update` (timestamp)
      - `created_at` (timestamp)
    
    - `emergency_contacts` - Contacts to notify during SOS
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `contact_name` (text)
      - `contact_email` (text)
      - `contact_phone` (text)
      - `relationship` (text) - e.g., "family", "friend", "embassy"
      - `created_at` (timestamp)
    
    - `sos_events` - SOS triggers and incidents
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `emergency_type` (text) - e.g., "medical", "crime", "lost", "other"
      - `description` (text)
      - `latitude` (float)
      - `longitude` (float)
      - `device_info` (jsonb) - browser/device details
      - `status` (text) - "triggered", "acknowledged", "resolved"
      - `triggered_at` (timestamp)
      - `resolved_at` (timestamp, nullable)
      - `created_at` (timestamp)
    
    - `email_logs` - Track all email sends
      - `id` (uuid, primary key)
      - `sos_event_id` (uuid, foreign key to sos_events)
      - `recipient_email` (text)
      - `recipient_name` (text)
      - `status` (text) - "sent", "failed", "pending"
      - `error_message` (text, nullable)
      - `retry_count` (integer, default 0)
      - `sent_at` (timestamp, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Users can view/manage own data
    - Service role can access all data for SOS processing

  3. Indexes
    - user_id indexes for faster lookups
    - triggered_at for SOS event querying
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  digital_id text UNIQUE NOT NULL DEFAULT LEFT(encode(gen_random_bytes(8), 'hex'), 12),
  current_latitude float,
  current_longitude float,
  last_location_update timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  relationship text DEFAULT 'other',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sos_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emergency_type text NOT NULL,
  description text,
  latitude float,
  longitude float,
  device_info jsonb,
  status text DEFAULT 'triggered',
  triggered_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sos_event_id uuid NOT NULL REFERENCES sos_events(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  recipient_name text,
  status text DEFAULT 'pending',
  error_message text,
  retry_count integer DEFAULT 0,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_events_user_id ON sos_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_events_triggered_at ON sos_events(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_sos_event_id ON email_logs(sos_event_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can access all users"
  ON users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for emergency_contacts table
CREATE POLICY "Users can view own emergency contacts"
  ON emergency_contacts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own emergency contacts"
  ON emergency_contacts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own emergency contacts"
  ON emergency_contacts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own emergency contacts"
  ON emergency_contacts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can access all emergency contacts"
  ON emergency_contacts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for sos_events table
CREATE POLICY "Users can view own SOS events"
  ON sos_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own SOS events"
  ON sos_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own SOS events"
  ON sos_events FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can access all SOS events"
  ON sos_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for email_logs table
CREATE POLICY "Service role can manage email logs"
  ON email_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
