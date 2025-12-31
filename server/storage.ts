import { 
  type User, type InsertUser,
  type Document, type InsertDocument,
  type DocumentPage, type InsertDocumentPage,
  type Embedding, type InsertEmbedding,
  type Entity, type InsertEntity,
  type DocumentEntity, type InsertDocumentEntity,
  type QaHistory, type InsertQaHistory,
  type Industry, type InsertIndustry,
  type Company, type InsertCompany,
  type CompanyDocument, type InsertCompanyDocument,
  users, documents, documentPages, embeddings, entities, documentEntities, qaHistory,
  industries, companies, companyDocuments
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, ilike, or, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Documents
  getDocuments(filters?: { type?: string; status?: string; search?: string }): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(doc: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<void>;
  getDocumentStats(): Promise<{
    totalDocuments: number;
    processingDocuments: number;
    completedDocuments: number;
    failedDocuments: number;
    recentDocuments: Document[];
  }>;

  // Document Pages
  getDocumentPages(documentId: number): Promise<DocumentPage[]>;
  getDocumentPage(documentId: number, pageNumber: number): Promise<DocumentPage | undefined>;
  createDocumentPage(page: InsertDocumentPage): Promise<DocumentPage>;
  updateDocumentPage(id: number, updates: Partial<DocumentPage>): Promise<DocumentPage | undefined>;
  deleteDocumentPages(documentId: number): Promise<void>;

  // Embeddings
  getEmbeddings(documentId: number): Promise<Embedding[]>;
  createEmbedding(embedding: InsertEmbedding): Promise<Embedding>;
  searchEmbeddings(query: string, limit?: number): Promise<Embedding[]>;
  deleteDocumentEmbeddings(documentId: number): Promise<void>;

  // Entities
  getEntities(): Promise<Entity[]>;
  getEntity(id: number): Promise<Entity | undefined>;
  createEntity(entity: InsertEntity): Promise<Entity>;
  getDocumentEntities(documentId: number): Promise<(DocumentEntity & { entity: Entity })[]>;

  // Q&A History
  getQaHistory(limit?: number): Promise<QaHistory[]>;
  createQaHistory(qa: InsertQaHistory): Promise<QaHistory>;

  // Industries
  getIndustries(): Promise<Industry[]>;
  getIndustry(id: number): Promise<Industry | undefined>;
  createIndustry(industry: InsertIndustry): Promise<Industry>;

  // Companies
  getCompanies(industryId?: number): Promise<Company[]>;
  getCompany(id: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  getCompanyDocuments(companyId: number): Promise<Document[]>;
  linkCompanyDocument(link: InsertCompanyDocument): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Documents
  async getDocuments(filters?: { type?: string; status?: string; search?: string }): Promise<Document[]> {
    let query = db.select().from(documents);
    
    const conditions = [];
    if (filters?.type && filters.type !== "all") {
      conditions.push(eq(documents.documentType, filters.type));
    }
    if (filters?.status && filters.status !== "all") {
      conditions.push(eq(documents.processingStatus, filters.status));
    }
    if (filters?.search) {
      conditions.push(
        or(
          ilike(documents.title, `%${filters.search}%`),
          ilike(documents.originalFilename, `%${filters.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      return db.select().from(documents).where(and(...conditions)).orderBy(desc(documents.uploadDate));
    }
    
    return db.select().from(documents).orderBy(desc(documents.uploadDate));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc || undefined;
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [document] = await db.insert(documents).values(doc).returning();
    return document;
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined> {
    const [updated] = await db.update(documents).set(updates).where(eq(documents.id, id)).returning();
    return updated || undefined;
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  async getDocumentStats() {
    const allDocs = await db.select().from(documents);
    const recentDocs = await db.select().from(documents).orderBy(desc(documents.uploadDate)).limit(5);
    
    return {
      totalDocuments: allDocs.length,
      processingDocuments: allDocs.filter(d => d.processingStatus === "processing").length,
      completedDocuments: allDocs.filter(d => d.processingStatus === "completed").length,
      failedDocuments: allDocs.filter(d => d.processingStatus === "failed").length,
      recentDocuments: recentDocs,
    };
  }

  // Document Pages
  async getDocumentPages(documentId: number): Promise<DocumentPage[]> {
    return db.select().from(documentPages).where(eq(documentPages.documentId, documentId)).orderBy(documentPages.pageNumber);
  }

  async getDocumentPage(documentId: number, pageNumber: number): Promise<DocumentPage | undefined> {
    const [page] = await db.select().from(documentPages)
      .where(and(eq(documentPages.documentId, documentId), eq(documentPages.pageNumber, pageNumber)));
    return page || undefined;
  }

  async createDocumentPage(page: InsertDocumentPage): Promise<DocumentPage> {
    const [created] = await db.insert(documentPages).values(page).returning();
    return created;
  }

  async updateDocumentPage(id: number, updates: Partial<DocumentPage>): Promise<DocumentPage | undefined> {
    const [updated] = await db.update(documentPages).set(updates).where(eq(documentPages.id, id)).returning();
    return updated || undefined;
  }

  async deleteDocumentPages(documentId: number): Promise<void> {
    await db.delete(documentPages).where(eq(documentPages.documentId, documentId));
  }

  // Embeddings
  async getEmbeddings(documentId: number): Promise<Embedding[]> {
    return db.select().from(embeddings).where(eq(embeddings.documentId, documentId)).orderBy(embeddings.chunkIndex);
  }

  async createEmbedding(embedding: InsertEmbedding): Promise<Embedding> {
    const [created] = await db.insert(embeddings).values(embedding).returning();
    return created;
  }

  async searchEmbeddings(query: string, limit = 10): Promise<Embedding[]> {
    // Try full-text search first
    const results = await db.select().from(embeddings)
      .where(sql`to_tsvector('english', ${embeddings.chunkText}) @@ plainto_tsquery('english', ${query})`)
      .limit(limit);

    if (results.length > 0) return results;

    // Fallback to ILIKE search if no full-text results
    return db.select().from(embeddings)
      .where(ilike(embeddings.chunkText, `%${query}%`))
      .limit(limit);
  }

  async deleteDocumentEmbeddings(documentId: number): Promise<void> {
    await db.delete(embeddings).where(eq(embeddings.documentId, documentId));
  }

  // Entities
  async getEntities(): Promise<Entity[]> {
    return db.select().from(entities);
  }

  async getEntity(id: number): Promise<Entity | undefined> {
    const [entity] = await db.select().from(entities).where(eq(entities.id, id));
    return entity || undefined;
  }

  async createEntity(entity: InsertEntity): Promise<Entity> {
    const [created] = await db.insert(entities).values(entity).returning();
    return created;
  }

  async getDocumentEntities(documentId: number): Promise<(DocumentEntity & { entity: Entity })[]> {
    const results = await db.select({
      id: documentEntities.id,
      documentId: documentEntities.documentId,
      entityId: documentEntities.entityId,
      mentionCount: documentEntities.mentionCount,
      relevanceScore: documentEntities.relevanceScore,
      sentiment: documentEntities.sentiment,
      keyQuotes: documentEntities.keyQuotes,
      entity: entities,
    })
    .from(documentEntities)
    .innerJoin(entities, eq(documentEntities.entityId, entities.id))
    .where(eq(documentEntities.documentId, documentId));
    
    return results.map(r => ({
      ...r,
      entity: r.entity,
    }));
  }

  // Q&A History
  async getQaHistory(limit = 20): Promise<QaHistory[]> {
    return db.select().from(qaHistory).orderBy(desc(qaHistory.createdAt)).limit(limit);
  }

  async createQaHistory(qa: InsertQaHistory): Promise<QaHistory> {
    const [created] = await db.insert(qaHistory).values(qa).returning();
    return created;
  }

  // Industries
  async getIndustries(): Promise<Industry[]> {
    return db.select().from(industries).orderBy(industries.name);
  }

  async getIndustry(id: number): Promise<Industry | undefined> {
    const [industry] = await db.select().from(industries).where(eq(industries.id, id));
    return industry || undefined;
  }

  async createIndustry(industry: InsertIndustry): Promise<Industry> {
    const [created] = await db.insert(industries).values(industry).returning();
    return created;
  }

  // Companies
  async getCompanies(industryId?: number): Promise<Company[]> {
    if (industryId) {
      return db.select().from(companies).where(eq(companies.industryId, industryId)).orderBy(companies.name);
    }
    return db.select().from(companies).orderBy(companies.name);
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [created] = await db.insert(companies).values(company).returning();
    return created;
  }

  async getCompanyDocuments(companyId: number): Promise<Document[]> {
    const results = await db.select({
      document: documents
    })
    .from(companyDocuments)
    .innerJoin(documents, eq(companyDocuments.documentId, documents.id))
    .where(eq(companyDocuments.companyId, companyId));
    
    return results.map(r => r.document);
  }

  async linkCompanyDocument(link: InsertCompanyDocument): Promise<void> {
    await db.insert(companyDocuments).values(link).onConflictDoNothing();
  }
}

export const storage = new DatabaseStorage();
