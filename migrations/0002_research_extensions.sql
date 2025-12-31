-- Extend industries with research fields
ALTER TABLE industries
  ADD COLUMN demand_drivers TEXT,
  ADD COLUMN supply_drivers TEXT,
  ADD COLUMN cost_drivers TEXT,
  ADD COLUMN risk_factors TEXT,
  ADD COLUMN regulations TEXT;

-- Industry documents join table
CREATE TABLE IF NOT EXISTS industry_documents (
  industry_id INTEGER NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (industry_id, document_id)
);
CREATE INDEX IF NOT EXISTS industry_documents_industry_id_idx ON industry_documents (industry_id);
CREATE INDEX IF NOT EXISTS industry_documents_document_id_idx ON industry_documents (document_id);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Company categories join table
CREATE TABLE IF NOT EXISTS company_categories (
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (company_id, category_id)
);
CREATE INDEX IF NOT EXISTS company_categories_company_id_idx ON company_categories (company_id);
CREATE INDEX IF NOT EXISTS company_categories_category_id_idx ON company_categories (category_id);

-- Company metrics
CREATE TABLE IF NOT EXISTS company_metrics (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value_text TEXT,
  value_number REAL,
  value_unit TEXT,
  period TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT company_metrics_company_key_period_unique UNIQUE (company_id, key, period)
);
CREATE INDEX IF NOT EXISTS company_metrics_company_id_idx ON company_metrics (company_id);
CREATE INDEX IF NOT EXISTS company_metrics_company_key_idx ON company_metrics (company_id, key);

-- Research items
CREATE TABLE IF NOT EXISTS research_items (
  id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  section TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Research sources
CREATE TABLE IF NOT EXISTS research_sources (
  id SERIAL PRIMARY KEY,
  research_item_id INTEGER NOT NULL REFERENCES research_items(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  document_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
  page_number INTEGER,
  excerpt TEXT,
  url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS research_sources_item_id_idx ON research_sources (research_item_id);
CREATE INDEX IF NOT EXISTS research_sources_document_id_idx ON research_sources (document_id);
