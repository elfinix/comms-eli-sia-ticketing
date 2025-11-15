-- ============================================
-- LPU-Cavite IT Helpdesk System - Database Schema
-- ============================================
-- Project: Lyceum of the Philippines University – Cavite
-- Database: Supabase PostgreSQL
-- Schema: public
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE 1: users
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'faculty', 'ict', 'admin')),
    department TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    joined_date DATE DEFAULT CURRENT_DATE,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ============================================
-- TABLE 2: tickets
-- ============================================
CREATE TABLE tickets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Hardware', 'Software', 'Network', 'Account')),
    urgency TEXT NOT NULL CHECK (urgency IN ('Low', 'Medium', 'High')),
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ
);

-- Indexes for tickets
CREATE INDEX idx_tickets_submitted_by ON tickets(submitted_by);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_category ON tickets(category);
CREATE INDEX idx_tickets_urgency ON tickets(urgency);

-- ============================================
-- TABLE 3: ticket_notes
-- ============================================
CREATE TABLE ticket_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for ticket_notes
CREATE INDEX idx_ticket_notes_ticket_id ON ticket_notes(ticket_id);
CREATE INDEX idx_ticket_notes_created_at ON ticket_notes(created_at DESC);

-- ============================================
-- TABLE 4: ticket_attachments
-- ============================================
CREATE TABLE ticket_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL CHECK (file_size <= 10485760), -- 10MB limit
    mime_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for ticket_attachments
CREATE INDEX idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);

-- ============================================
-- TABLE 5: chat_messages
-- ============================================
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id TEXT NOT NULL,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    ticket_id TEXT REFERENCES tickets(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for chat_messages
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_receiver_id ON chat_messages(receiver_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- ============================================
-- TABLE 6: notifications
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    ticket_id TEXT REFERENCES tickets(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- TABLE 7: activity_logs
-- ============================================
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    ip_address TEXT,
    device TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for activity_logs
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- ============================================
-- TABLE 8: system_settings
-- ============================================
CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- FUNCTION: Auto-generate Ticket ID (TKT-YYMM-NNN)
-- ============================================
CREATE OR REPLACE FUNCTION generate_ticket_id()
RETURNS TEXT AS $$
DECLARE
    year_month TEXT;
    next_number INTEGER;
    new_ticket_id TEXT;
BEGIN
    -- Get current year and month (YYMM format)
    year_month := TO_CHAR(NOW(), 'YYMM');
    
    -- Find the highest ticket number for this month
    SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 10) AS INTEGER)), 0) + 1
    INTO next_number
    FROM tickets
    WHERE id LIKE 'TKT-' || year_month || '-%';
    
    -- Format as TKT-YYMM-NNN (with leading zeros)
    new_ticket_id := 'TKT-' || year_month || '-' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN new_ticket_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Auto-set ticket ID on INSERT
-- ============================================
CREATE OR REPLACE FUNCTION set_ticket_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        NEW.id := generate_ticket_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_id
BEFORE INSERT ON tickets
FOR EACH ROW
EXECUTE FUNCTION set_ticket_id();

-- ============================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Enable Row Level Security (RLS) on all tables
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: users table
-- ============================================
-- Allow authenticated users to read user data
CREATE POLICY "Authenticated users can read users" ON users
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- RLS POLICIES: tickets table
-- ============================================
-- All authenticated users can read tickets
CREATE POLICY "Users can read tickets" ON tickets
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can create tickets
CREATE POLICY "Users can create tickets" ON tickets
    FOR INSERT WITH CHECK (auth.uid() = submitted_by);

-- Users can update tickets
CREATE POLICY "Users can update tickets" ON tickets
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================
-- RLS POLICIES: ticket_notes table
-- ============================================
CREATE POLICY "Users can read ticket notes" ON ticket_notes
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create notes" ON ticket_notes
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- ============================================
-- RLS POLICIES: ticket_attachments table
-- ============================================
CREATE POLICY "Users can read attachments" ON ticket_attachments
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create attachments" ON ticket_attachments
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- ============================================
-- RLS POLICIES: chat_messages table
-- ============================================
CREATE POLICY "Users can read chat" ON chat_messages
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create chat" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- ============================================
-- RLS POLICIES: notifications table
-- ============================================
CREATE POLICY "Users can read own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow notification creation" ON notifications
    FOR INSERT WITH CHECK (true);

-- ============================================
-- RLS POLICIES: activity_logs table
-- ============================================
CREATE POLICY "Users can read own activity" ON activity_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activity" ON activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES: system_settings table
-- ============================================
CREATE POLICY "Anyone can read settings" ON system_settings
    FOR SELECT USING (true);

CREATE POLICY "Authenticated can update settings" ON system_settings
    FOR UPDATE USING (auth.uid() IS NOT NULL);
