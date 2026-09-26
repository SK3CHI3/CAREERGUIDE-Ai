-- Migration: Create anonymous tracking tables for public platform
-- This enables usage tracking without requiring user authentication

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: anonymous_sessions
-- Tracks unique visitor sessions (no login required)
-- ============================================================================
CREATE TABLE IF NOT EXISTS anonymous_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL UNIQUE, -- Browser-generated session ID (stored in localStorage)
    first_visit TIMESTAMPTZ DEFAULT NOW(),
    last_visit TIMESTAMPTZ DEFAULT NOW(),
    visit_count INTEGER DEFAULT 1,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: page_visits
-- Tracks page visits with session context
-- ============================================================================
CREATE TABLE IF NOT EXISTS page_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL, -- References anonymous_sessions.session_id
    page_path TEXT NOT NULL,
    page_title TEXT,
    visited_at TIMESTAMPTZ DEFAULT NOW(),
    referrer TEXT,
    duration_seconds INTEGER
);

CREATE INDEX idx_page_visits_session ON page_visits(session_id);
CREATE INDEX idx_page_visits_path ON page_visits(page_path);
CREATE INDEX idx_page_visits_visited_at ON page_visits(visited_at);

-- ============================================================================
-- TABLE: quick_assessment_completions
-- Tracks completed Quick Assessments (anonymous)
-- ============================================================================
CREATE TABLE IF NOT EXISTS quick_assessment_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT, -- Optional: link to anonymous session
    assessment_id TEXT NOT NULL, -- Unique identifier for this assessment
    grade TEXT,
    pathway TEXT,
    target_career TEXT,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    duration_seconds INTEGER,
    career_fields_generated INTEGER DEFAULT 3,
    user_agent TEXT
);

CREATE INDEX idx_qa_completions_session ON quick_assessment_completions(session_id);
CREATE INDEX idx_qa_completions_completed_at ON quick_assessment_completions(completed_at);
CREATE INDEX idx_qa_completions_grade ON quick_assessment_completions(grade);
CREATE INDEX idx_qa_completions_target_career ON quick_assessment_completions(target_career);

-- ============================================================================
-- TABLE: ai_chat_interactions
-- Tracks AI chat sessions and messages (anonymous)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_chat_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT, -- Optional: link to anonymous session
    chat_session_id TEXT NOT NULL, -- Unique identifier for this chat session
    message_count INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    user_agent TEXT
);

CREATE INDEX idx_chat_interactions_session ON ai_chat_interactions(session_id);
CREATE INDEX idx_chat_interactions_started_at ON ai_chat_interactions(started_at);

-- ============================================================================
-- TABLE: ai_chat_messages
-- Stores individual chat messages (anonymous)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_session_id TEXT NOT NULL, -- References ai_chat_interactions.chat_session_id
    message_role TEXT NOT NULL CHECK (message_role IN ('user', 'assistant')),
    message_content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON ai_chat_messages(chat_session_id);
CREATE INDEX idx_chat_messages_created_at ON ai_chat_messages(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Allow anonymous inserts but restrict reads to authenticated admin only
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE anonymous_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_assessment_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (no auth required)
CREATE POLICY "Allow anonymous inserts on anonymous_sessions"
    ON anonymous_sessions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts on page_visits"
    ON page_visits FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts on quick_assessment_completions"
    ON quick_assessment_completions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts on ai_chat_interactions"
    ON ai_chat_interactions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts on ai_chat_messages"
    ON ai_chat_messages FOR INSERT
    WITH CHECK (true);

-- Policy: Allow anonymous updates to sessions (for last_visit, visit_count)
CREATE POLICY "Allow anonymous updates on anonymous_sessions"
    ON anonymous_sessions FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow anonymous updates on ai_chat_interactions"
    ON ai_chat_interactions FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Policy: Only authenticated admin can read data
CREATE POLICY "Admin can read anonymous_sessions"
    ON anonymous_sessions FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can read page_visits"
    ON page_visits FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can read quick_assessment_completions"
    ON quick_assessment_completions FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can read ai_chat_interactions"
    ON ai_chat_interactions FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can read ai_chat_messages"
    ON ai_chat_messages FOR SELECT
    USING (auth.role() = 'authenticated');

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant insert to anon role (unauthenticated users)
GRANT INSERT ON anonymous_sessions TO anon;
GRANT INSERT ON page_visits TO anon;
GRANT INSERT ON quick_assessment_completions TO anon;
GRANT INSERT ON ai_chat_interactions TO anon;
GRANT INSERT ON ai_chat_messages TO anon;

-- Grant update to anon role (for session updates)
GRANT UPDATE ON anonymous_sessions TO anon;
GRANT UPDATE ON ai_chat_interactions TO anon;

-- Grant select to authenticated role (admin dashboard)
GRANT SELECT ON anonymous_sessions TO authenticated;
GRANT SELECT ON page_visits TO authenticated;
GRANT SELECT ON quick_assessment_completions TO authenticated;
GRANT SELECT ON ai_chat_interactions TO authenticated;
GRANT SELECT ON ai_chat_messages TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE anonymous_sessions IS 'Tracks unique visitor sessions without requiring login';
COMMENT ON TABLE page_visits IS 'Tracks page visits with session context';
COMMENT ON TABLE quick_assessment_completions IS 'Tracks completed Quick Assessments anonymously';
COMMENT ON TABLE ai_chat_interactions IS 'Tracks AI chat sessions anonymously';
COMMENT ON TABLE ai_chat_messages IS 'Stores individual chat messages anonymously';
