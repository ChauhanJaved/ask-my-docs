# AskMyDocs — Database Architecture & Multi-Tenant Schema Design (Day 7)

## Overview
This document outlines the multi-tenant PostgreSQL database architecture designed for AskMyDocs during Day 7 of the SaaS learning roadmap. 

The schema is architected to support:
- Multi-tenancy with strict organization isolation.
- Integration with Supabase Auth (`auth.users`).
- RAG (Retrieval-Augmented Generation) document chunks and high-dimensional vector embeddings via `pgvector`.
- Conversational chat session logging, message history, and feedback.
- Quota metering and usage tracking per subscription tier.

---

## 1. Multi-Tenant Isolation Strategy

We adopt a **Shared Database, Shared Schema** multi-tenancy model. Every tenant table explicitly stores an `organization_id` foreign key referencing the `organizations` table.

### Denormalization for RLS Query Speed
In a standard 3NF schema, `chat_messages` would only reference `chat_session_id`, and `chat_sessions` would reference `organization_id`. However, PostgreSQL Row Level Security (RLS) policies evaluate permissions on every single row touch. Requiring a `JOIN` from `chat_messages` to `chat_sessions` on every write or read introduces significant query overhead under load. 

By denormalizing `organization_id` directly onto `chat_messages` and `document_chunks`, RLS policies can evaluate directly against indexed columns on the target table without performing multi-table `JOIN` operations.

---

## 2. Vector Search Architecture (`pgvector`)

- **Extension**: `pgvector`
- **Embedding Column**: `document_chunks.embedding vector(1536)` (aligned with models like OpenAI `text-embedding-3-small`).
- **Indexing Algorithm**: **HNSW (Hierarchical Navigable Small World)** with `vector_cosine_ops`.
- **Why HNSW**: Unlike IVFFlat, HNSW does not require data pre-clustering or a list build step, offering superior query recall performance and sub-millisecond similarity lookups as document volume scales.

---

## 3. PostgreSQL SQL Schema Blueprint

```sql
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
```

---

## 4. Performance & Indexing Strategy

```sql
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
```

---

## 5. Summary of Choices & Trade-Offs

| Decision | Rationale | Trade-off |
| :--- | :--- | :--- |
| **Shared DB / Shared Schema** | Easy maintenance, cost-efficient scaling across hundreds of tenants. | Requires bulletproof RLS policies to prevent data leakage. |
| **Denormalized `organization_id`** | Eliminates JOIN overhead in RLS policies for child tables. | Slight increase in storage and potential risk of inconsistent `org_id` if populated manually. |
| **HNSW Indexing for pgvector** | Excellent search accuracy and fast retrieval speed without clustering training steps. | Consumes more RAM during index builds compared to IVFFlat. |
