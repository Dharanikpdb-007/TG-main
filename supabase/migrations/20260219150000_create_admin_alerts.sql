-- Create admin_alerts table
CREATE TABLE IF NOT EXISTS admin_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'warning', -- 'warning', 'info', 'critical'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read active alerts
CREATE POLICY "Everyone can view active alerts" 
ON admin_alerts FOR SELECT 
USING (is_active = true);

-- Policy: Only authenticated (admin context logic handled by app for now or via specific admin role check if implemented) can insert
-- For simplicity in this demo, we allow authenticated users to insert (assuming only admin logs in to /admin)
-- Ideally, you'd check for a specific admin role/claim.
CREATE POLICY "Authenticated users can insert alerts" 
ON admin_alerts FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');
