# Database Schema for Aura Personal Assistant

## Core Tables

### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE,
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    voice_settings JSONB NOT NULL DEFAULT '{}'::jsonb
);
```

### sessions
```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    tools_used JSONB[] NOT NULL DEFAULT '{}',
    system_prompt TEXT
);
```

### operations
```sql
CREATE TABLE operations (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES sessions(id),
    type VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    error TEXT,
    duration INTEGER,
    tool_name VARCHAR(100)
);
```

### messages
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES sessions(id),
    role VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    context_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    tool_calls JSONB[],
    audio_url TEXT,
    transcription TEXT,
    tokens_used INTEGER,
    model_name VARCHAR(100)
);
```

## Memory & Learning

### memory_entries
```sql
CREATE TABLE memory_entries (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    context_id UUID,
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    relevance_score FLOAT,
    last_accessed_at TIMESTAMP WITH TIME ZONE
);
```

### patterns
```sql
CREATE TABLE patterns (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    pattern TEXT NOT NULL,
    confidence FLOAT NOT NULL,
    occurrences INTEGER NOT NULL DEFAULT 1,
    first_observed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_observed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    embedding VECTOR(1536)
);
```

### contexts
```sql
CREATE TABLE contexts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    parent_context_id UUID REFERENCES contexts(id),
    embedding VECTOR(1536)
);
```

### tasks
```sql
CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    schedule JSONB,
    context_id UUID REFERENCES contexts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    priority INTEGER DEFAULT 0,
    dependencies JSONB[]
);
```

## Tools & Resources

### tools
```sql
CREATE TABLE tools (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    version VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    parameters JSONB NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE
);
```

### tool_executions
```sql
CREATE TABLE tool_executions (
    id UUID PRIMARY KEY,
    tool_id UUID REFERENCES tools(id),
    session_id UUID REFERENCES sessions(id),
    parameters JSONB NOT NULL,
    result JSONB,
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    duration INTEGER,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);
```

### file_operations
```sql
CREATE TABLE file_operations (
    id UUID PRIMARY KEY,
    operation_id UUID REFERENCES operations(id),
    path TEXT NOT NULL,
    action VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    size BIGINT,
    checksum VARCHAR(255),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    content_type VARCHAR(100),
    permissions JSONB,
    parent_path TEXT
);
```

### screen_captures
```sql
CREATE TABLE screen_captures (
    id UUID PRIMARY KEY,
    operation_id UUID REFERENCES operations(id),
    format VARCHAR(10) NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    size BIGINT NOT NULL,
    path TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    analysis TEXT,
    embedding VECTOR(1536)
);
```

### voice_recordings
```sql
CREATE TABLE voice_recordings (
    id UUID PRIMARY KEY,
    operation_id UUID REFERENCES operations(id),
    duration INTEGER NOT NULL,
    format VARCHAR(10) NOT NULL,
    size BIGINT NOT NULL,
    path TEXT NOT NULL,
    transcription TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    embedding VECTOR(1536),
    speaker_id VARCHAR(100),
    language VARCHAR(10)
);
```

## Security & Permissions

### permissions
```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    action VARCHAR(50) NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    conditions JSONB,
    granted_by UUID REFERENCES users(id)
);
```

### audit_logs
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    operation_id UUID REFERENCES operations(id),
    action VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    tool_name VARCHAR(100),
    error_details JSONB,
    duration INTEGER
);
```

## Cache & Performance

### embeddings_cache
```sql
CREATE TABLE embeddings_cache (
    id UUID PRIMARY KEY,
    content_hash VARCHAR(64) NOT NULL UNIQUE,
    embedding VECTOR(1536) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE,
    use_count INTEGER DEFAULT 1,
    model_version VARCHAR(50)
);
```

### response_cache
```sql
CREATE TABLE response_cache (
    id UUID PRIMARY KEY,
    query_hash VARCHAR(64) NOT NULL UNIQUE,
    response JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    use_count INTEGER DEFAULT 1,
    model_name VARCHAR(100),
    tokens_used INTEGER
);
```

### tool_results_cache
```sql
CREATE TABLE tool_results_cache (
    id UUID PRIMARY KEY,
    tool_name VARCHAR(100) NOT NULL,
    params_hash VARCHAR(64) NOT NULL,
    result JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    use_count INTEGER DEFAULT 1
);
```

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_operations_session_id ON operations(session_id);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_patterns_user_id ON patterns(user_id);
CREATE INDEX idx_contexts_user_id ON contexts(user_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_permissions_user_id ON permissions(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_tool_executions_session_id ON tool_executions(session_id);
CREATE INDEX idx_memory_entries_user_id ON memory_entries(user_id);
CREATE INDEX idx_memory_entries_context_id ON memory_entries(context_id);

-- Vector similarity indexes
CREATE INDEX idx_memory_entries_embedding ON memory_entries USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_patterns_embedding ON patterns USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_contexts_embedding ON contexts USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_screen_captures_embedding ON screen_captures USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_voice_recordings_embedding ON voice_recordings USING ivfflat (embedding vector_cosine_ops);

-- Cache indexes
CREATE INDEX idx_embeddings_cache_content_hash ON embeddings_cache(content_hash);
CREATE INDEX idx_response_cache_query_hash ON response_cache(query_hash);
CREATE INDEX idx_tool_results_cache_params_hash ON tool_results_cache(params_hash);

-- Search indexes
CREATE INDEX idx_messages_content ON messages USING gin(to_tsvector('english', content));
CREATE INDEX idx_patterns_pattern ON patterns USING gin(to_tsvector('english', pattern));
CREATE INDEX idx_tasks_title ON tasks USING gin(to_tsvector('english', title));
CREATE INDEX idx_memory_entries_content ON memory_entries USING gin(to_tsvector('english', content));

-- JSON indexes
CREATE INDEX idx_users_preferences ON users USING gin(preferences);
CREATE INDEX idx_users_settings ON users USING gin(settings);
CREATE INDEX idx_users_voice_settings ON users USING gin(voice_settings);
CREATE INDEX idx_sessions_context ON sessions USING gin(context);
CREATE INDEX idx_operations_metadata ON operations USING gin(metadata);
CREATE INDEX idx_tools_parameters ON tools USING gin(parameters);
CREATE INDEX idx_tool_executions_parameters ON tool_executions USING gin(parameters);
CREATE INDEX idx_tool_executions_result ON tool_executions USING gin(result);
```

## Views

### active_sessions
```sql
CREATE VIEW active_sessions AS
SELECT s.*, u.name as user_name, COUNT(m.id) as message_count, 
       array_agg(DISTINCT t.name) as tools_used
FROM sessions s
JOIN users u ON s.user_id = u.id
LEFT JOIN messages m ON s.id = m.session_id
LEFT JOIN tool_executions te ON s.id = te.session_id
LEFT JOIN tools t ON te.tool_id = t.id
WHERE s.ended_at IS NULL
GROUP BY s.id, u.name;
```

### memory_insights
```sql
CREATE VIEW memory_insights AS
SELECT 
    me.context_id,
    c.name as context_name,
    COUNT(*) as entry_count,
    AVG(me.relevance_score) as avg_relevance,
    MAX(me.last_accessed_at) as last_accessed,
    array_agg(DISTINCT me.type) as memory_types
FROM memory_entries me
JOIN contexts c ON me.context_id = c.id
GROUP BY me.context_id, c.name;
```

### tool_performance
```sql
CREATE VIEW tool_performance AS
SELECT 
    t.name as tool_name,
    COUNT(te.id) as execution_count,
    AVG(te.duration) as avg_duration,
    COUNT(CASE WHEN te.status = 'error' THEN 1 END) as error_count,
    MAX(te.completed_at) as last_execution
FROM tools t
LEFT JOIN tool_executions te ON t.id = te.tool_id
GROUP BY t.name;
```

### user_patterns
```sql
CREATE VIEW user_patterns AS
SELECT 
    u.name as user_name,
    p.*,
    c.name as context_name,
    COUNT(m.id) as related_messages_count
FROM patterns p
JOIN users u ON p.user_id = u.id
LEFT JOIN contexts c ON c.id = (p.metadata->>'context_id')::uuid
LEFT JOIN messages m ON m.context_id = c.id
GROUP BY u.name, p.id, c.name
ORDER BY p.confidence DESC, p.occurrences DESC;
```

### pending_tasks
```sql
CREATE VIEW pending_tasks AS
SELECT 
    t.*,
    u.name as user_name,
    c.name as context_name,
    array_agg(d.title) as dependencies
FROM tasks t
JOIN users u ON t.user_id = u.id
LEFT JOIN contexts c ON t.context_id = c.id
LEFT JOIN tasks d ON d.id = ANY(SELECT jsonb_array_elements_text(t.dependencies)::uuid)
WHERE t.status = 'pending'
AND (t.schedule->>'next_occurrence')::timestamp > CURRENT_TIMESTAMP
GROUP BY t.id, u.name, c.name;
``` 