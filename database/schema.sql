-- Theophilus Database Schema
-- Run this file to create all tables

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS workbench_items CASCADE;
DROP TABLE IF EXISTS lab_notes CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    long_description TEXT,
    status VARCHAR(20) DEFAULT 'in-progress' CHECK (status IN ('shipped', 'in-progress', 'archived')),
    year INTEGER,
    featured BOOLEAN DEFAULT FALSE,
    highlight BOOLEAN DEFAULT FALSE,
    github_url VARCHAR(500),
    live_url VARCHAR(500),
    stars INTEGER DEFAULT 0,
    forks INTEGER DEFAULT 0,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog posts table
CREATE TABLE blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    tags TEXT[],
    featured BOOLEAN DEFAULT FALSE,
    author_name VARCHAR(100) DEFAULT 'Theophilus',
    author_role VARCHAR(100) DEFAULT 'Software Engineer',
    read_time VARCHAR(20),
    published BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab notes table
CREATE TABLE lab_notes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    content TEXT,
    link VARCHAR(500),
    icon VARCHAR(50) DEFAULT 'code',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workbench items table
CREATE TABLE workbench_items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_featured ON projects(featured);
CREATE INDEX idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_featured ON blog_posts(featured);
CREATE INDEX idx_blog_posts_published ON blog_posts(published);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lab_notes_updated_at BEFORE UPDATE ON lab_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workbench_items_updated_at BEFORE UPDATE ON workbench_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Documents table for RAG knowledge base
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    category VARCHAR(50) DEFAULT 'general', -- 'resume', 'certification', 'project', 'general'
    description TEXT,
    is_indexed BOOLEAN DEFAULT FALSE,
    index_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'indexed', 'error'
    chunk_count INTEGER DEFAULT 0,
    vector_namespace VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat sessions for conversation history
CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    session_id UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    visitor_id VARCHAR(255), -- anonymous tracking
    user_agent TEXT,
    ip_address INET,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    message_count INTEGER DEFAULT 0
);

-- Chat messages
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB, -- sources used, latency, tokens, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat analytics for dashboard
CREATE TABLE chat_analytics (
    id SERIAL PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    total_sessions INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER,
    top_queries TEXT[], -- common questions
    sources_used JSONB, -- which documents were referenced
    UNIQUE(date)
);

-- Create indexes
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_status ON documents(index_status);
CREATE INDEX idx_chat_sessions_visitor ON chat_sessions(visitor_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

-- Add triggers
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings for chatbot
INSERT INTO settings (key, value) VALUES
('chatbot_enabled', 'true'),
('chatbot_welcome_message', 'Hi! I''m TheoBot. Ask me anything about Theophilus—his skills, projects, experience, or how to get in touch.'),
('chatbot_model', 'llama-3.3-70b-versatile'),
('chatbot_temperature', '0.7'),
('chatbot_max_tokens', '1024'),
('groq_api_key', ''), -- Set via dashboard or env
('pinecone_index_name', 'theophilus-portfolio'),
('pinecone_namespace', 'portfolio-knowledge')
ON CONFLICT (key) DO NOTHING;