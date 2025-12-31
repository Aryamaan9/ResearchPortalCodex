-- Add document taxonomy fields
ALTER TABLE documents ADD COLUMN IF NOT EXISTS doc_type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags TEXT[];
CREATE INDEX IF NOT EXISTS documents_doc_type_idx ON documents(doc_type);

-- Track industry updates
ALTER TABLE industries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Company pipeline fields
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pipeline_stage TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pipeline_updated_at TIMESTAMP;

-- Metric and research timestamps
ALTER TABLE company_metrics ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE research_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE research_items ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE;

-- Research sources snippet + FK
ALTER TABLE research_sources ADD COLUMN IF NOT EXISTS snippet_id INTEGER;
ALTER TABLE research_sources ADD CONSTRAINT research_sources_document_fk FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS research_sources_snippet_idx ON research_sources(snippet_id);

-- Snippets table
CREATE TABLE IF NOT EXISTS source_snippets (
  id SERIAL PRIMARY KEY,
  document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
  page_number INTEGER,
  title TEXT,
  excerpt TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL,
  priority TEXT,
  due_date DATE,
  assigned_to TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
