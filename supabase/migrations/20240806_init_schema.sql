-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- 1. ORGANIZATIONS & TENANT PROFILES
-- ============================================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    settings JSONB NOT NULL DEFAULT '{
        "bot_name": "AskBot",
        "tone": "friendly",
        "primary_color": "#6366f1",
        "greeting_message": "Hi! How can I help you today?"
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles extend Supabase auth.users
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2. DOCUMENTS & VECTOR CHUNKS
-- ============================================================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('file', 'url')),
    source_url TEXT,
    storage_path TEXT,
    file_size INTEGER,
    mime_type TEXT,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
    error_message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. CHAT SESSIONS & MESSAGES
-- ============================================================================

CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'escalated', 'resolved')),
    topic TEXT,
    sentiment TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    feedback INTEGER CHECK (feedback IN (-1, 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. USAGE & PLAN METERING
-- ============================================================================

CREATE TABLE usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    documents_count INTEGER NOT NULL DEFAULT 0,
    messages_count INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organization_id, period_start)
);

-- Multi-Tenant Filter Indexes (B-Tree)
CREATE INDEX idx_profiles_org ON profiles(organization_id);
CREATE INDEX idx_documents_org_status ON documents(organization_id, status);
CREATE INDEX idx_document_chunks_doc_chunk ON document_chunks(document_id, chunk_index);
CREATE INDEX idx_document_chunks_org ON document_chunks(organization_id);
CREATE INDEX idx_chat_sessions_org ON chat_sessions(organization_id, status);
CREATE INDEX idx_chat_messages_session ON chat_messages(chat_session_id, created_at);
CREATE INDEX idx_usage_records_org_period ON usage_records(organization_id, period_start);

-- Vector Similarity Search Index (HNSW)
CREATE INDEX idx_document_chunks_embedding
ON document_chunks
USING hnsw (embedding vector_cosine_ops);

-- ============================================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- Helper function to retrieve current user's organization ID safely without RLS recursion
CREATE OR REPLACE FUNCTION get_auth_user_org_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Organization policies: Users can only access their own organization's data
CREATE POLICY "Organizations are viewable by members of the organization"
ON organizations FOR SELECT
USING (id = get_auth_user_org_id());

CREATE POLICY "Organizations are insertable by organization owners"
ON organizations FOR INSERT
WITH CHECK (true); -- Initially allow inserts, will be restricted by profile creation

CREATE POLICY "Organizations are updatable by organization owners"
ON organizations FOR UPDATE
USING (id = get_auth_user_org_id() AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
));

CREATE POLICY "Organizations are deletable by organization owners"
ON organizations FOR DELETE
USING (id = get_auth_user_org_id() AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'
));

-- Profile policies: Users can only access profiles in their own organization
CREATE POLICY "Profiles are viewable by members of the same organization"
ON profiles FOR SELECT
USING (id = auth.uid() OR organization_id = get_auth_user_org_id());

CREATE POLICY "Profiles are insertable for own user ID"
ON profiles FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY "Profiles are updatable by organization members"
ON profiles FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Profiles are deletable by own user ID"
ON profiles FOR DELETE
USING (id = auth.uid());

-- Document policies: Users can only access documents in their own organization
CREATE POLICY "Documents are viewable by members of the organization"
ON documents FOR SELECT
USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Documents are insertable by organization members"
ON documents FOR INSERT
WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Documents are updatable by organization members"
ON documents FOR UPDATE
USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Documents are deletable by organization members"
ON documents FOR DELETE
USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
));

-- Document chunk policies: Users can only access chunks from their organization's documents
CREATE POLICY "Document chunks are viewable by members of the organization"
ON document_chunks FOR SELECT
USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Document chunks are insertable for organization documents"
ON document_chunks FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND
    document_id IN (
        SELECT id FROM documents WHERE organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    )
);

CREATE POLICY "Document chunks are updatable for organization documents"
ON document_chunks FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND
    document_id IN (
        SELECT id FROM documents WHERE organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    )
);

CREATE POLICY "Document chunks are deletable for organization documents"
ON document_chunks FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND
    document_id IN (
        SELECT id FROM documents WHERE organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    )
);

-- Chat session policies: Users can only access sessions from their organization
CREATE POLICY "Chat sessions are viewable by members of the organization"
ON chat_sessions FOR SELECT
USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Chat sessions are insertable by organization members"
ON chat_sessions FOR INSERT
WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Chat sessions are updatable by organization members"
ON chat_sessions FOR UPDATE
USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Chat sessions are deletable by organization members"
ON chat_sessions FOR DELETE
USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
));

-- Chat message policies: Users can only access messages from their organization
CREATE POLICY "Chat messages are viewable by members of the organization"
ON chat_messages FOR SELECT
USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Chat messages are insertable by organization members"
ON chat_messages FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND
    chat_session_id IN (
        SELECT id FROM chat_sessions WHERE organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    )
);

CREATE POLICY "Chat messages are updatable by organization members"
ON chat_messages FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND
    chat_session_id IN (
        SELECT id FROM chat_sessions WHERE organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    )
);

CREATE POLICY "Chat messages are deletable by organization members"
ON chat_messages FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) AND
    chat_session_id IN (
        SELECT id FROM chat_sessions WHERE organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    )
);

-- Usage record policies: Users can only access usage records from their organization
CREATE POLICY "Usage records are viewable by members of the organization"
ON usage_records FOR SELECT
USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Usage records are insertable by organization members"
ON usage_records FOR INSERT
WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Usage records are updatable by organization members"
ON usage_records FOR UPDATE
USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Usage records are deletable by organization members"
ON usage_records FOR DELETE
USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
));