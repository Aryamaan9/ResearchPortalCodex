CREATE TABLE IF NOT EXISTS "industries" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "industries_name_unique" ON "industries" ("name");

CREATE TABLE IF NOT EXISTS "companies" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "ticker" text,
    "industry_id" integer NOT NULL REFERENCES "industries"("id") ON DELETE cascade,
    "description" text,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "companies_industry_id_idx" ON "companies" ("industry_id");

CREATE TABLE IF NOT EXISTS "company_documents" (
    "company_id" integer NOT NULL REFERENCES "companies"("id") ON DELETE cascade,
    "document_id" integer NOT NULL REFERENCES "documents"("id") ON DELETE cascade,
    "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT company_documents_pk PRIMARY KEY("company_id","document_id")
);

CREATE INDEX IF NOT EXISTS "company_documents_company_id_idx" ON "company_documents" ("company_id");
CREATE INDEX IF NOT EXISTS "company_documents_document_id_idx" ON "company_documents" ("document_id");
