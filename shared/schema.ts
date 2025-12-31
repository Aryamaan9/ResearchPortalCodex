import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean, serial, real, index, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Document types enum
export const documentTypes = [
  "annual_report",
  "quarterly_earnings", 
  "concall_transcript",
  "industry_report",
  "research_note",
  "investor_presentation",
  "regulatory_filing",
  "other"
] as const;

export type DocumentType = typeof documentTypes[number];

// Processing status enum
export const processingStatuses = [
  "pending",
  "processing",
  "completed",
  "failed"
] as const;

export type ProcessingStatus = typeof processingStatuses[number];

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Documents table - main document metadata
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  originalFilename: text("original_filename").notNull(),
  filePath: text("file_path").notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull(),
  fileType: text("file_type").notNull(),
  uploadDate: timestamp("upload_date").default(sql`CURRENT_TIMESTAMP`).notNull(),
  processedDate: timestamp("processed_date"),
  processingStatus: text("processing_status").notNull().default("pending"),
  errorMessage: text("error_message"),
  documentType: text("document_type"),
  fullText: text("full_text"),
  pageCount: integer("page_count"),
  author: text("author"),
  publicationDate: text("publication_date"),
  source: text("source"),
  aiSummary: text("ai_summary"),
  keyTopics: jsonb("key_topics").$type<string[]>(),
  sentiment: text("sentiment"),
  classificationData: jsonb("classification_data").$type<Record<string, unknown>>(),
}, (table) => [
  index("documents_processing_status_idx").on(table.processingStatus),
  index("documents_document_type_idx").on(table.documentType),
  index("documents_upload_date_idx").on(table.uploadDate),
]);

// Document pages table - per-page text and summaries
export const documentPages = pgTable("document_pages", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number").notNull(),
  pageText: text("page_text"),
  pageSummary: text("page_summary"),
}, (table) => [
  index("document_pages_document_id_idx").on(table.documentId),
]);

// Embeddings table - chunked text with vectors
export const embeddings = pgTable("embeddings", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  pageNumber: integer("page_number"),
  chunkText: text("chunk_text").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  tokenCount: integer("token_count"),
  embedding: jsonb("embedding").$type<number[]>(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  index("embeddings_document_id_idx").on(table.documentId),
]);

// Entities table - extracted entities (companies, people, etc.)
export const entities = pgTable("entities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  entityType: text("entity_type").notNull(),
  normalizedName: text("normalized_name"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
});

// Document entities junction table
export const documentEntities = pgTable("document_entities", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  entityId: integer("entity_id").notNull().references(() => entities.id, { onDelete: "cascade" }),
  mentionCount: integer("mention_count").default(1),
  relevanceScore: real("relevance_score"),
  sentiment: text("sentiment"),
  keyQuotes: jsonb("key_quotes").$type<string[]>(),
});

// Q&A History table
export const qaHistory = pgTable("qa_history", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  citations: jsonb("citations").$type<Array<{ documentId: number; documentTitle: string; pageNumber?: number; excerpt: string }>>(),
  documentIds: jsonb("document_ids").$type<number[]>(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Chat conversations table (from integration)
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Chat messages table (from integration)
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Industries table
export const industries = pgTable("industries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  uniqueIndex("industries_name_unique").on(table.name),
]);

// Companies table
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ticker: text("ticker"),
  industryId: integer("industry_id").notNull().references(() => industries.id, { onDelete: "cascade" }),
  description: text("description"),
  revenue: real("revenue"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  index("companies_industry_id_idx").on(table.industryId),
]);

// Company documents junction table
export const companyDocuments = pgTable("company_documents", {
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  documentId: integer("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  primaryKey({ columns: [table.companyId, table.documentId] }),
  index("company_documents_company_id_idx").on(table.companyId),
  index("company_documents_document_id_idx").on(table.documentId),
]);

// Relations
export const documentsRelations = relations(documents, ({ many }) => ({
  pages: many(documentPages),
  embeddings: many(embeddings),
  documentEntities: many(documentEntities),
}));

export const documentPagesRelations = relations(documentPages, ({ one }) => ({
  document: one(documents, {
    fields: [documentPages.documentId],
    references: [documents.id],
  }),
}));

export const embeddingsRelations = relations(embeddings, ({ one }) => ({
  document: one(documents, {
    fields: [embeddings.documentId],
    references: [documents.id],
  }),
}));

export const entitiesRelations = relations(entities, ({ many }) => ({
  documentEntities: many(documentEntities),
}));

export const documentEntitiesRelations = relations(documentEntities, ({ one }) => ({
  document: one(documents, {
    fields: [documentEntities.documentId],
    references: [documents.id],
  }),
  entity: one(entities, {
    fields: [documentEntities.entityId],
    references: [entities.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const industriesRelations = relations(industries, ({ many }) => ({
  companies: many(companies),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  industry: one(industries, {
    fields: [companies.industryId],
    references: [industries.id],
  }),
  companyDocuments: many(companyDocuments),
}));

export const companyDocumentsRelations = relations(companyDocuments, ({ one }) => ({
  company: one(companies, {
    fields: [companyDocuments.companyId],
    references: [companies.id],
  }),
  document: one(documents, {
    fields: [companyDocuments.documentId],
    references: [documents.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadDate: true,
  processedDate: true,
});

export const insertDocumentPageSchema = createInsertSchema(documentPages).omit({
  id: true,
});

export const insertEmbeddingSchema = createInsertSchema(embeddings).omit({
  id: true,
  createdAt: true,
});

export const insertEntitySchema = createInsertSchema(entities).omit({
  id: true,
});

export const insertDocumentEntitySchema = createInsertSchema(documentEntities).omit({
  id: true,
});

export const insertQaHistorySchema = createInsertSchema(qaHistory).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertIndustrySchema = createInsertSchema(industries).omit({
  id: true,
  createdAt: true,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
});

export const insertCompanyDocumentSchema = createInsertSchema(companyDocuments).omit({
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertDocumentPage = z.infer<typeof insertDocumentPageSchema>;
export type DocumentPage = typeof documentPages.$inferSelect;

export type InsertEmbedding = z.infer<typeof insertEmbeddingSchema>;
export type Embedding = typeof embeddings.$inferSelect;

export type InsertEntity = z.infer<typeof insertEntitySchema>;
export type Entity = typeof entities.$inferSelect;

export type InsertDocumentEntity = z.infer<typeof insertDocumentEntitySchema>;
export type DocumentEntity = typeof documentEntities.$inferSelect;

export type InsertQaHistory = z.infer<typeof insertQaHistorySchema>;
export type QaHistory = typeof qaHistory.$inferSelect;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Industry = typeof industries.$inferSelect;
export type InsertIndustry = z.infer<typeof insertIndustrySchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type CompanyDocument = typeof companyDocuments.$inferSelect;
export type InsertCompanyDocument = z.infer<typeof insertCompanyDocumentSchema>;
