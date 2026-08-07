-- Seed data for FTChat development
-- This script populates sample data for testing

-- Insert sample organizations
INSERT INTO organizations (id, name, slug, plan, settings) VALUES
('11111111-1111-1111-1111-111111111111', 'Acme Corp', 'acme-corp', 'pro', '{
    "bot_name": "AcmeBot",
    "tone": "professional",
    "primary_color": "#1e40af",
    "greeting_message": "Hello! How can I assist you with Acme products today?"
}'::jsonb),
('22222222-2222-2222-2222-222222222222', 'Tech Startup Inc', 'tech-startup', 'free', '{
    "bot_name": "HelperBot",
    "tone": "friendly",
    "primary_color": "#6366f1",
    "greeting_message": "Hi there! How can I help you?"
}'::jsonb),
('33333333-3333-3333-3333-333333333333', 'Enterprise Solutions', 'enterprise-solutions', 'business', '{
    "bot_name": "EnterpriseAssistant",
    "tone": "formal",
    "primary_color": "#059669",
    "greeting_message": "Good day! How may I be of service?"
}'::jsonb);

-- Note: In a real scenario, we would need actual auth.users entries
-- For seed purposes, we'll insert placeholder profiles that would normally
-- reference real auth.users IDs from Supabase Auth
INSERT INTO profiles (id, organization_id, email, full_name, role) VALUES
('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'owner@acme.com', 'John Doe', 'owner'),
('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'founder@techstartup.com', 'Jane Smith', 'owner'),
('33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'admin@enterprise.com', 'Bob Wilson', 'admin');

-- Insert sample documents
INSERT INTO documents (id, organization_id, name, source_type, status, file_size, mime_type) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'user-guide.md', 'file', 'ready', 4500, 'text/markdown'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'faq-sheet.pdf', 'file', 'ready', 104800, 'application/pdf'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'api-documentation.md', 'file', 'ready', 8500, 'text/markdown'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 'employee-handbook.pdf', 'file', 'ready', 250000, 'application/pdf');

-- Insert sample document chunks (with dummy embeddings for demonstration)
-- In reality, these would have actual vector embeddings from an embedding model
INSERT INTO document_chunks (id, organization_id, document_id, chunk_index, content, token_count, embedding) VALUES
('aaaabbbb-cccc-dddd-eeee-fff000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 0, 'Welcome to the Acme product user guide. This document covers basic setup and usage.', 25, '[0.1,0.2,0.3,0.4,0.5]'::vector), -- Simplified for demo
('aaaabbbb-cccc-dddd-eeee-fff000000002', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'To get started, first install the software using the provided installer.', 20, '[0.2,0.3,0.4,0.5,0.6]'::vector),
('bbbbcccc-dddd-eeee-ffff-ggg000000001', '22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 0, 'Our API provides REST endpoints for integrating with your applications.', 22, '[0.3,0.4,0.5,0.6,0.7]'::vector),
('ccccdddd-eeee-ffff-ggg-hhh000000001', '33333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 0, 'Employee conduct and policies are outlined in this handbook.', 18, '[0.4,0.5,0.6,0.7,0.8]'::vector);

-- Insert sample chat sessions
INSERT INTO chat_sessions (id, organization_id, visitor_id, status, topic, sentiment) VALUES
('session-aaaa-bbbb-cccc-dddd-eeee000001', '11111111-1111-1111-1111-111111111111', 'visitor-001', 'active', 'Product pricing inquiry', 'positive'),
('session-aaaa-bbbb-cccc-dddd-eeee000002', '22222222-2222-2222-2222-222222222222', 'visitor-002', 'active', 'API integration help', 'neutral'),
('session-aaaa-bbbb-cccc-dddd-eeee000003', '33333333-3333-3333-3333-333333333333', 'visitor-003', 'resolved', 'Employee benefits question', 'positive');

-- Insert sample chat messages
INSERT INTO chat_messages (id, chat_session_id, organization_id, sender_type, content, tokens_used, sources, feedback) VALUES
('msg-aaaa-bbbb-cccc-dddd-eeee000001', 'session-aaaa-bbbb-cccc-dddd-eeee000001', '11111111-1111-1111-1111-111111111111', 'user', 'What are your pricing plans for small businesses?', 12, '[{"document": "user-guide.md", "text": "Pricing information can be found in section 3 of the guide"}]'::jsonb, 1),
('msg-aaaa-bbbb-cccc-dddd-eeee000002', 'session-aaaa-bbbb-cccc-dddd-eeee000001', '11111111-1111-1111-1111-111111111111', 'assistant', 'Based on our user guide, we offer flexible pricing plans starting at $49/month for small businesses. Would you like me to detail the features included?', 28, '[{"document": "user-guide.md", "text": "Pro plan includes up to 50 documents and 1,000 AI chats per month"}]'::jsonb, 1),
('msg-aaaa-bbbb-cccc-dddd-eeee000003', 'session-aaaa-bbbb-cccc-dddd-eeee000002', '22222222-2222-2222-2222-222222222222', 'user', 'How do I authenticate with your API?', 8, '[{"document": "api-documentation.md", "text": "API authentication requires a Bearer token in the Authorization header"}]'::jsonb, 1);

-- Insert sample usage records
INSERT INTO usage_records (id, organization_id, period_start, documents_count, messages_count, total_tokens) VALUES
('usage-aaaa-bbbb-cccc-dddd-eeee000001', '11111111-1111-1111-1111-111111111111', '2024-08-01', 2, 12, 2400),
('usage-aaaa-bbbb-cccc-dddd-eeee000002', '22222222-2222-2222-2222-222222222222', '2024-08-01', 1, 8, 1600),
('usage-aaaa-bbbb-cccc-dddd-eeee000003', '33333333-3333-3333-3333-333333333333', '2024-08-01', 1, 5, 1000);