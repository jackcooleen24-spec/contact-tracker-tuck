-- Create contacts table
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('Connection Request', 'Internal', 'Client', 'Friend', 'Talent Sourcing')),
  importance TEXT NOT NULL CHECK (importance IN ('Low', 'Medium', 'High')),
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_contacts_category_importance ON contacts(category, importance);

-- Enable RLS (Row Level Security) if needed - for this app, we'll keep it open since it's password protected at app level
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Allow all operations since app has its own password protection
CREATE POLICY "Allow all operations" ON contacts
  FOR ALL USING (true) WITH CHECK (true);
