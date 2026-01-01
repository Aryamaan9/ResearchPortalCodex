import type { Express, Request, Response } from "express";
import { and, eq, ilike, or, sql, inArray } from "drizzle-orm";

import { db } from "../db";
import {
  categories,
  companies,
  companyCategories,
  companyDocuments,
  companyMetrics,
  documents,
  industries,
  industryDocuments,
  researchItems,
  researchSources,
  tasks,
  sourceSnippets,
} from "@shared/schema";

const ALLOWED_RESEARCH_SECTIONS = new Set([
  "financials",
  "valuation",
  "management",
  "risk",
  "concall",
  "other",
]);

const PIPELINE_STAGES = [
  "watchlist",
  "researching",
  "ic_ready",
  "invested",
  "exit_watch",
];

export function registerEntityRoutes(app: Express) {
  // Global search
  app.get("/api/search", async (req: Request, res: Response) => {
    try {
      const q = String(req.query.q || "").trim();
      if (!q) {
        return res.json({ companies: [], industries: [], research: [], documents: [] });
      }

      const companiesResults = await db
        .select({
          id: companies.id,
          name: companies.name,
          ticker: companies.ticker,
          industryName: industries.name,
        })
        .from(companies)
        .leftJoin(industries, eq(companies.industryId, industries.id))
        .where(or(ilike(companies.name, `%${q}%`), ilike(companies.ticker, `%${q}%`)))
        .limit(10);

      const industriesResults = await db
        .select({ id: industries.id, name: industries.name })
        .from(industries)
        .where(ilike(industries.name, `%${q}%`))
        .limit(10);

      const researchResults = await db
        .select({
          id: researchItems.id,
          title: researchItems.title,
          section: researchItems.section,
          entityType: researchItems.entityType,
          entityId: researchItems.entityId,
          createdAt: researchItems.createdAt,
        })
        .from(researchItems)
        .where(or(ilike(researchItems.title, `%${q}%`), ilike(researchItems.content, `%${q}%`)))
        .limit(10);

      const documentResults = await db
        .select({
          id: documents.id,
          title: documents.title,
          fileType: documents.fileType,
          uploadDate: documents.uploadDate,
        })
        .from(documents)
        .where(ilike(documents.title, `%${q}%`))
        .limit(10);

      res.json({
        companies: companiesResults,
        industries: industriesResults,
        research: researchResults,
        documents: documentResults,
      });
    } catch (error) {
      console.error("Error performing search:", error);
      res.status(500).json({ error: "Failed to search" });
    }
  });

  // Industries
  app.get("/api/industries", async (_req: Request, res: Response) => {
    try {
      const rows = await db
        .select({
          id: industries.id,
          name: industries.name,
          createdAt: industries.createdAt,
          companyCount: sql<number>`COUNT(${companies.id})`,
          totalRevenue: sql<number>`SUM(${companies.revenue})`,
        })
        .from(industries)
        .leftJoin(companies, eq(industries.id, companies.industryId))
        .groupBy(industries.id)
        .orderBy(industries.name);

      res.json(rows);
    } catch (error) {
      console.error("Error fetching industries:", error);
      res.status(500).json({ error: "Failed to fetch industries" });
    }
  });

  app.post("/api/industries", async (req: Request, res: Response) => {
    try {
      const { name } = req.body || {};
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Name is required" });
      }

      const [created] = await db
        .insert(industries)
        .values({ name: name.trim() })
        .returning();

      res.status(201).json(created);
    } catch (error: any) {
      if (error?.code === "23505") {
        return res.status(409).json({ error: "Industry already exists" });
      }

      console.error("Error creating industry:", error);
      res.status(500).json({ error: "Failed to create industry" });
    }
  });

  app.post("/api/industries/:id/documents", async (req: Request, res: Response) => {
    try {
      const industryId = Number(req.params.id);
      const { documentId } = req.body || {};

      if (Number.isNaN(industryId)) {
        return res.status(400).json({ error: "Invalid industry id" });
      }

      const parsedDocumentId = Number(documentId);
      if (Number.isNaN(parsedDocumentId)) {
        return res.status(400).json({ error: "documentId is required" });
      }

      const [industry] = await db
        .select({ id: industries.id })
        .from(industries)
        .where(eq(industries.id, industryId));
      if (!industry) {
        return res.status(404).json({ error: "Industry not found" });
      }

      const [document] = await db
        .select({ id: documents.id })
        .from(documents)
        .where(eq(documents.id, parsedDocumentId));
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      await db
        .insert(industryDocuments)
        .values({ industryId, documentId: parsedDocumentId })
        .onConflictDoNothing();

      res.status(201).json({ industryId, documentId: parsedDocumentId });
    } catch (error) {
      console.error("Error linking document to industry:", error);
      res.status(500).json({ error: "Failed to link document" });
    }
  });

  app.delete("/api/industries/:id/documents/:documentId", async (req: Request, res: Response) => {
    try {
      const industryId = Number(req.params.id);
      const documentId = Number(req.params.documentId);

      if (Number.isNaN(industryId) || Number.isNaN(documentId)) {
        return res.status(400).json({ error: "Invalid ids" });
      }

      const [removed] = await db
        .delete(industryDocuments)
        .where(
          and(
            eq(industryDocuments.industryId, industryId),
            eq(industryDocuments.documentId, documentId)
          )
        )
        .returning();

      if (!removed) {
        return res.status(404).json({ error: "Link not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error unlinking industry document:", error);
      res.status(500).json({ error: "Failed to unlink document" });
    }
  });

  app.get("/api/industries/:id", async (req: Request, res: Response) => {
    try {
      const industryId = Number(req.params.id);
      if (Number.isNaN(industryId)) {
        return res.status(400).json({ error: "Invalid industry id" });
      }

      const [industry] = await db
        .select()
        .from(industries)
        .where(eq(industries.id, industryId));

      if (!industry) {
        return res.status(404).json({ error: "Industry not found" });
      }

      const industryCompanies = await db
        .select()
        .from(companies)
        .where(eq(companies.industryId, industryId))
        .orderBy(companies.name);

      const companyIds = industryCompanies.map((c) => c.id);
      const metrics = companyIds.length
        ? await db
            .select()
            .from(companyMetrics)
            .where(inArray(companyMetrics.companyId, companyIds))
        : [];

      const linkedDocuments = await db
        .select({
          id: documents.id,
          title: documents.title,
          fileType: documents.fileType,
          createdAt: documents.uploadDate,
          linkedAt: industryDocuments.createdAt,
        })
        .from(industryDocuments)
        .innerJoin(documents, eq(industryDocuments.documentId, documents.id))
        .where(eq(industryDocuments.industryId, industryId))
        .orderBy(documents.uploadDate);

      const totalRevenue = industryCompanies.reduce((sum, c) => sum + (c.revenue || 0), 0);

      res.json({
        ...industry,
        companies: industryCompanies,
        companyMetrics: metrics,
        documents: linkedDocuments,
        totalRevenue,
      });
    } catch (error) {
      console.error("Error fetching industry:", error);
      res.status(500).json({ error: "Failed to fetch industry" });
    }
  });

  app.put("/api/industries/:id", async (req: Request, res: Response) => {
    try {
      const industryId = Number(req.params.id);
      if (Number.isNaN(industryId)) {
        return res.status(400).json({ error: "Invalid industry id" });
      }

      const updates: Record<string, unknown> = { updatedAt: sql`CURRENT_TIMESTAMP` };
      const allowed = [
        "name",
        "demandDrivers",
        "supplyDrivers",
        "costDrivers",
        "riskFactors",
        "regulations",
      ];

      for (const key of allowed) {
        if (key in req.body) {
          const value = req.body[key];
          updates[key as keyof typeof updates] = typeof value === "string" ? value : value ?? null;
        }
      }

      if (Object.keys(updates).length === 1) {
        return res.status(400).json({ error: "No updates provided" });
      }

      const [updated] = await db
        .update(industries)
        .set(updates)
        .where(eq(industries.id, industryId))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Industry not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating industry:", error);
      res.status(500).json({ error: "Failed to update industry" });
    }
  });

  // Companies
  app.get("/api/companies", async (req: Request, res: Response) => {
    try {
      const { industryId, q, categoryId, pipelineStage, hasLatestConcall, missingValuation, sort } = req.query as Record<string, string | undefined>;
      const conditions = [] as any[];

      if (industryId) {
        const parsedId = Number(industryId);
        if (Number.isNaN(parsedId)) {
          return res.status(400).json({ error: "Invalid industry id" });
        }
        conditions.push(eq(companies.industryId, parsedId));
      }

      if (q) {
        const term = String(q);
        conditions.push(
          or(
            ilike(companies.name, `%${term}%`),
            ilike(companies.ticker, `%${term}%`)
          )
        );
      }

      if (categoryId) {
        const parsed = Number(categoryId);
        if (Number.isNaN(parsed)) {
          return res.status(400).json({ error: "Invalid categoryId" });
        }
        conditions.push(
          sql`EXISTS (SELECT 1 FROM ${companyCategories} cc WHERE cc.company_id = ${companies.id} AND cc.category_id = ${parsed})`
        );
      }

      if (pipelineStage) {
        conditions.push(eq(companies.pipelineStage, pipelineStage));
      }

      if (hasLatestConcall === "true") {
        conditions.push(
          sql`EXISTS (SELECT 1 FROM ${companyDocuments} cd INNER JOIN ${documents} d ON cd.document_id = d.id WHERE cd.company_id = ${companies.id} AND d.document_type = 'concall_transcript')`
        );
      }

      if (missingValuation === "true") {
        conditions.push(
          sql`NOT EXISTS (SELECT 1 FROM ${researchItems} ri WHERE ri.entity_type = 'company' AND ri.entity_id = ${companies.id} AND ri.section = 'valuation')`
        );
      }

      const query = db
        .select({
          id: companies.id,
          name: companies.name,
          ticker: companies.ticker,
          description: companies.description,
          createdAt: companies.createdAt,
          industryId: companies.industryId,
          industryName: industries.name,
          pipelineStage: companies.pipelineStage,
          revenue: companies.revenue,
        })
        .from(companies)
        .leftJoin(industries, eq(companies.industryId, industries.id));

      if (conditions.length > 0) {
        const results = await query
          .where(and(...conditions))
          .orderBy(sort === "createdAt" ? companies.createdAt : companies.name);
        res.json(results);
      } else {
        const results = await query.orderBy(sort === "createdAt" ? companies.createdAt : companies.name);
        res.json(results);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ error: "Failed to fetch companies" });
    }
  });

  app.post("/api/companies", async (req: Request, res: Response) => {
    try {
      const { name, ticker, industryId, description, revenue } = req.body || {};

      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Name is required" });
      }

      const parsedIndustryId = Number(industryId);
      if (Number.isNaN(parsedIndustryId)) {
        return res.status(400).json({ error: "industryId is required" });
      }

      const [industry] = await db
        .select({ id: industries.id })
        .from(industries)
        .where(eq(industries.id, parsedIndustryId));

      if (!industry) {
        return res.status(404).json({ error: "Industry not found" });
      }

      const [created] = await db
        .insert(companies)
        .values({
          name: name.trim(),
          ticker: ticker?.trim() || null,
          industryId: parsedIndustryId,
          description: description?.trim() || null,
          revenue: revenue ? Number(revenue) : null,
        })
        .returning();

      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ error: "Failed to create company" });
    }
  });

  app.get("/api/companies/:id", async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.params.id);
      if (Number.isNaN(companyId)) {
        return res.status(400).json({ error: "Invalid company id" });
      }

      const [company] = await db
        .select({
          id: companies.id,
          name: companies.name,
          ticker: companies.ticker,
          description: companies.description,
          revenue: companies.revenue,
          createdAt: companies.createdAt,
          industryId: companies.industryId,
          industryName: industries.name,
          pipelineStage: companies.pipelineStage,
        })
        .from(companies)
        .leftJoin(industries, eq(companies.industryId, industries.id))
        .where(eq(companies.id, companyId));

      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const linkedDocuments = await db
        .select({
          id: documents.id,
          title: documents.title,
          fileType: documents.fileType,
          createdAt: documents.uploadDate,
          linkedAt: companyDocuments.createdAt,
        })
        .from(companyDocuments)
        .innerJoin(documents, eq(companyDocuments.documentId, documents.id))
        .where(eq(companyDocuments.companyId, companyId))
        .orderBy(documents.uploadDate);

      const assignedCategories = await db
        .select({
          id: categories.id,
          name: categories.name,
          type: categories.type,
        })
        .from(companyCategories)
        .innerJoin(categories, eq(companyCategories.categoryId, categories.id))
        .where(eq(companyCategories.companyId, companyId));

      const metrics = await db
        .select()
        .from(companyMetrics)
        .where(eq(companyMetrics.companyId, companyId))
        .orderBy(companyMetrics.createdAt);

      const research = await db
        .select()
        .from(researchItems)
        .where(
          and(
            eq(researchItems.entityType, "company"),
            eq(researchItems.entityId, companyId)
          )
        )
        .orderBy(researchItems.createdAt);

      const researchIds = research.map((r) => r.id);
      const sources = researchIds.length
        ? await db
            .select()
            .from(researchSources)
            .where(inArray(researchSources.researchItemId, researchIds))
        : [];

      const researchWithSources = research.map((item) => ({
        ...item,
        sources: sources.filter((s) => s.researchItemId === item.id),
      }));

      res.json({
        company: {
          id: company.id,
          name: company.name,
          ticker: company.ticker,
          description: company.description,
          revenue: company.revenue,
          createdAt: company.createdAt,
          industryId: company.industryId,
          pipelineStage: company.pipelineStage,
        },
        industry: company.industryName
          ? { id: company.industryId, name: company.industryName }
          : null,
        documents: linkedDocuments,
        categories: assignedCategories,
        metrics,
        research: researchWithSources,
      });
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ error: "Failed to fetch company" });
    }
  });

  app.put("/api/companies/:id", async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.params.id);
      if (Number.isNaN(companyId)) {
        return res.status(400).json({ error: "Invalid company id" });
      }

      const { name, ticker, industryId, description } = req.body || {};
      const updates: Record<string, unknown> = {};

      if (typeof name === "string" && name.trim()) updates.name = name.trim();
      if (typeof ticker === "string") updates.ticker = ticker.trim() || null;
      if (typeof description === "string") updates.description = description.trim() || null;

      if (industryId !== undefined) {
        const parsedIndustryId = Number(industryId);
        if (Number.isNaN(parsedIndustryId)) {
          return res.status(400).json({ error: "Invalid industry id" });
        }
        const [industry] = await db
          .select({ id: industries.id })
          .from(industries)
          .where(eq(industries.id, parsedIndustryId));
        if (!industry) {
          return res.status(404).json({ error: "Industry not found" });
        }
        updates.industryId = parsedIndustryId;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No updates provided" });
      }

      const [updated] = await db
        .update(companies)
        .set(updates)
        .where(eq(companies.id, companyId))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Company not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ error: "Failed to update company" });
    }
  });

  app.patch("/api/companies/:id/pipeline", async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.params.id);
      const { stage } = req.body || {};
      if (Number.isNaN(companyId)) {
        return res.status(400).json({ error: "Invalid company id" });
      }

      if (stage && !PIPELINE_STAGES.includes(stage)) {
        return res.status(400).json({ error: "Invalid pipeline stage" });
      }

      const [updated] = await db
        .update(companies)
        .set({ pipelineStage: stage || null, pipelineUpdatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(companies.id, companyId))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Company not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating pipeline stage:", error);
      res.status(500).json({ error: "Failed to update pipeline stage" });
    }
  });

  app.delete("/api/companies/:id", async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.params.id);
      if (Number.isNaN(companyId)) {
        return res.status(400).json({ error: "Invalid company id" });
      }

      await db
        .delete(companyDocuments)
        .where(eq(companyDocuments.companyId, companyId));

      const [deleted] = await db
        .delete(companies)
        .where(eq(companies.id, companyId))
        .returning({ id: companies.id });

      if (!deleted) {
        return res.status(404).json({ error: "Company not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting company:", error);
      res.status(500).json({ error: "Failed to delete company" });
    }
  });

  // Company documents
  app.post("/api/companies/:id/documents", async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.params.id);
      const { documentId } = req.body || {};

      if (Number.isNaN(companyId)) {
        return res.status(400).json({ error: "Invalid company id" });
      }

      const parsedDocumentId = Number(documentId);
      if (Number.isNaN(parsedDocumentId)) {
        return res.status(400).json({ error: "documentId is required" });
      }

      const [company] = await db
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.id, companyId));
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }

      const [document] = await db
        .select({ id: documents.id })
        .from(documents)
        .where(eq(documents.id, parsedDocumentId));
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      await db
        .insert(companyDocuments)
        .values({ companyId, documentId: parsedDocumentId })
        .onConflictDoNothing();

      res.status(201).json({ companyId, documentId: parsedDocumentId });
    } catch (error) {
      console.error("Error linking document:", error);
      res.status(500).json({ error: "Failed to link document" });
    }
  });

  app.delete("/api/companies/:id/documents/:documentId", async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.params.id);
      const documentId = Number(req.params.documentId);

      if (Number.isNaN(companyId) || Number.isNaN(documentId)) {
        return res.status(400).json({ error: "Invalid ids" });
      }

      const [removed] = await db
        .delete(companyDocuments)
        .where(
          and(
            eq(companyDocuments.companyId, companyId),
            eq(companyDocuments.documentId, documentId)
          )
        )
        .returning({ companyId: companyDocuments.companyId });

      if (!removed) {
        return res.status(404).json({ error: "Link not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error unlinking document:", error);
      res.status(500).json({ error: "Failed to unlink document" });
    }
  });

  // Categories
  app.get("/api/categories", async (_req: Request, res: Response) => {
    try {
      const results = await db.select().from(categories).orderBy(categories.name);
      res.json(results);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req: Request, res: Response) => {
    try {
      const { name, type } = req.body || {};
      if (!name || !type || typeof name !== "string" || typeof type !== "string") {
        return res.status(400).json({ error: "name and type are required" });
      }

      const [created] = await db
        .insert(categories)
        .values({ name: name.trim(), type: type.trim() })
        .onConflictDoNothing()
        .returning();

      if (!created) {
        return res.status(409).json({ error: "Category already exists" });
      }

      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.post("/api/companies/:id/categories", async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.params.id);
      const { categoryId } = req.body || {};

      if (Number.isNaN(companyId)) {
        return res.status(400).json({ error: "Invalid company id" });
      }

      const parsedCategoryId = Number(categoryId);
      if (Number.isNaN(parsedCategoryId)) {
        return res.status(400).json({ error: "categoryId is required" });
      }

      await db.insert(companyCategories).values({ companyId, categoryId: parsedCategoryId }).onConflictDoNothing();
      res.status(201).json({ companyId, categoryId: parsedCategoryId });
    } catch (error) {
      console.error("Error assigning category:", error);
      res.status(500).json({ error: "Failed to assign category" });
    }
  });

  app.delete("/api/companies/:id/categories/:categoryId", async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.params.id);
      const categoryId = Number(req.params.categoryId);

      if (Number.isNaN(companyId) || Number.isNaN(categoryId)) {
        return res.status(400).json({ error: "Invalid ids" });
      }

      await db
        .delete(companyCategories)
        .where(and(eq(companyCategories.companyId, companyId), eq(companyCategories.categoryId, categoryId)));

      res.status(204).end();
    } catch (error) {
      console.error("Error removing category:", error);
      res.status(500).json({ error: "Failed to remove category" });
    }
  });

  // Company metrics
  app.get("/api/companies/:id/metrics", async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.params.id);
      if (Number.isNaN(companyId)) {
        return res.status(400).json({ error: "Invalid company id" });
      }

      const metrics = await db
        .select()
        .from(companyMetrics)
        .where(eq(companyMetrics.companyId, companyId))
        .orderBy(companyMetrics.createdAt);

      res.json(metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  app.post("/api/companies/:id/metrics", async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.params.id);
      const { key, valueText, valueNumber, valueUnit, period } = req.body || {};

      if (Number.isNaN(companyId)) {
        return res.status(400).json({ error: "Invalid company id" });
      }

      if (!key || typeof key !== "string") {
        return res.status(400).json({ error: "key is required" });
      }

      const metricValueNumber = valueNumber !== undefined && valueNumber !== null ? Number(valueNumber) : null;

      const [upserted] = await db
        .insert(companyMetrics)
        .values({
          companyId,
          key: key.trim(),
          valueText: typeof valueText === "string" ? valueText : null,
          valueNumber: Number.isNaN(metricValueNumber) ? null : metricValueNumber,
          valueUnit: typeof valueUnit === "string" ? valueUnit : null,
          period: typeof period === "string" ? period : null,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .onConflictDoUpdate({
          target: [companyMetrics.companyId, companyMetrics.key, companyMetrics.period],
          set: {
            valueText: typeof valueText === "string" ? valueText : null,
            valueNumber: Number.isNaN(metricValueNumber) ? null : metricValueNumber,
            valueUnit: typeof valueUnit === "string" ? valueUnit : null,
            period: typeof period === "string" ? period : null,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          },
        })
        .returning();

      res.status(201).json(upserted);
    } catch (error) {
      console.error("Error saving metric:", error);
      res.status(500).json({ error: "Failed to save metric" });
    }
  });

  app.delete("/api/companies/:id/metrics/:metricId", async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.params.id);
      const metricId = Number(req.params.metricId);

      if (Number.isNaN(companyId) || Number.isNaN(metricId)) {
        return res.status(400).json({ error: "Invalid ids" });
      }

      await db
        .delete(companyMetrics)
        .where(and(eq(companyMetrics.companyId, companyId), eq(companyMetrics.id, metricId)));

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting metric:", error);
      res.status(500).json({ error: "Failed to delete metric" });
    }
  });

  // Research items and sources
  app.get("/api/research", async (req: Request, res: Response) => {
    try {
      const { entityType, entityId } = req.query;

      if (!entityType || !entityId) {
        return res.status(400).json({ error: "entityType and entityId are required" });
      }

      const parsedId = Number(entityId);
      if (Number.isNaN(parsedId)) {
        return res.status(400).json({ error: "Invalid entity id" });
      }

      const items = await db
        .select()
        .from(researchItems)
        .where(and(eq(researchItems.entityType, String(entityType)), eq(researchItems.entityId, parsedId)))
        .orderBy(researchItems.createdAt);

      const ids = items.map((i) => i.id);
      const sources = ids.length
        ? await db
            .select()
            .from(researchSources)
            .where(inArray(researchSources.researchItemId, ids))
        : [];

      const withSources = items.map((item) => ({
        ...item,
        sources: sources.filter((s) => s.researchItemId === item.id),
      }));

      res.json(withSources);
    } catch (error) {
      console.error("Error fetching research items:", error);
      res.status(500).json({ error: "Failed to fetch research items" });
    }
  });

  app.post("/api/research", async (req: Request, res: Response) => {
    try {
      const { entityType, entityId, section, title, content } = req.body || {};

      if (!entityType || !entityId || !section || !title) {
        return res.status(400).json({ error: "entityType, entityId, section, and title are required" });
      }

      if (!ALLOWED_RESEARCH_SECTIONS.has(String(section))) {
        return res.status(400).json({ error: "Invalid section" });
      }

      const parsedId = Number(entityId);
      if (Number.isNaN(parsedId)) {
        return res.status(400).json({ error: "Invalid entity id" });
      }

      const [created] = await db
        .insert(researchItems)
        .values({
          entityType: String(entityType),
          entityId: parsedId,
          section: String(section),
          title: String(title),
          content: typeof content === "string" ? content : null,
        })
        .returning();

      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating research item:", error);
      res.status(500).json({ error: "Failed to create research item" });
    }
  });

  app.patch("/api/research/:id", async (req: Request, res: Response) => {
    try {
      const researchId = Number(req.params.id);
      if (Number.isNaN(researchId)) {
        return res.status(400).json({ error: "Invalid research id" });
      }

      const { pinned, title, content, section } = req.body || {};
      const updates: Record<string, unknown> = { updatedAt: sql`CURRENT_TIMESTAMP` };

      if (section !== undefined) {
        if (!ALLOWED_RESEARCH_SECTIONS.has(String(section))) {
          return res.status(400).json({ error: "Invalid section" });
        }
        updates.section = section;
      }

      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (pinned !== undefined) updates.pinned = !!pinned;

      const [updated] = await db
        .update(researchItems)
        .set(updates)
        .where(eq(researchItems.id, researchId))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Research item not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating research item:", error);
      res.status(500).json({ error: "Failed to update research item" });
    }
  });

  app.post("/api/research/:id/sources", async (req: Request, res: Response) => {
    try {
      const researchId = Number(req.params.id);
      const { sourceType, documentId, pageNumber, excerpt, url, snippetId } = req.body || {};

      if (Number.isNaN(researchId)) {
        return res.status(400).json({ error: "Invalid research id" });
      }

      if (!sourceType || typeof sourceType !== "string") {
        return res.status(400).json({ error: "sourceType is required" });
      }

      if (sourceType === "document") {
        if (documentId === undefined || documentId === null || Number.isNaN(Number(documentId))) {
          return res.status(400).json({ error: "documentId is required for document sources" });
        }
      } else if (sourceType === "url") {
        if (!url || typeof url !== "string") {
          return res.status(400).json({ error: "url is required for url sources" });
        }
      } else {
        return res.status(400).json({ error: "Invalid sourceType" });
      }

      if (snippetId !== undefined && snippetId !== null) {
        const parsedSnippet = Number(snippetId);
        if (Number.isNaN(parsedSnippet)) {
          return res.status(400).json({ error: "Invalid snippetId" });
        }
        const [snippet] = await db.select().from(sourceSnippets).where(eq(sourceSnippets.id, parsedSnippet));
        if (!snippet) {
          return res.status(404).json({ error: "Snippet not found" });
        }
      }

      const [created] = await db
        .insert(researchSources)
        .values({
          researchItemId: researchId,
          sourceType,
          documentId: documentId ? Number(documentId) : null,
          pageNumber: pageNumber ? Number(pageNumber) : null,
          excerpt: typeof excerpt === "string" ? excerpt : null,
          url: typeof url === "string" ? url : null,
          snippetId: snippetId ? Number(snippetId) : null,
        })
        .returning();

      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating research source:", error);
      res.status(500).json({ error: "Failed to create research source" });
    }
  });

  app.delete("/api/research/:id", async (req: Request, res: Response) => {
    try {
      const researchId = Number(req.params.id);
      if (Number.isNaN(researchId)) {
        return res.status(400).json({ error: "Invalid research id" });
      }

      await db.delete(researchItems).where(eq(researchItems.id, researchId));
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting research item:", error);
      res.status(500).json({ error: "Failed to delete research item" });
    }
  });

  app.delete("/api/sources/:id", async (req: Request, res: Response) => {
    try {
      const sourceId = Number(req.params.id);
      if (Number.isNaN(sourceId)) {
        return res.status(400).json({ error: "Invalid source id" });
      }

      await db.delete(researchSources).where(eq(researchSources.id, sourceId));
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting research source:", error);
      res.status(500).json({ error: "Failed to delete research source" });
    }
  });

  // Tasks
  app.get("/api/tasks", async (req: Request, res: Response) => {
    try {
      const { entityType, entityId } = req.query;
      if (!entityType || !entityId) {
        return res.status(400).json({ error: "entityType and entityId are required" });
      }
      const parsedId = Number(entityId);
      if (Number.isNaN(parsedId)) {
        return res.status(400).json({ error: "Invalid entity id" });
      }
      const results = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.entityType, String(entityType)), eq(tasks.entityId, parsedId)))
        .orderBy(tasks.updatedAt);
      res.json(results);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req: Request, res: Response) => {
    try {
      const { entityType, entityId, title, description, status, priority, dueDate, assignedTo } = req.body || {};

      if (!entityType || !entityId || !title || !status) {
        return res.status(400).json({ error: "entityType, entityId, title, and status are required" });
      }

      const parsedId = Number(entityId);
      if (Number.isNaN(parsedId)) {
        return res.status(400).json({ error: "Invalid entity id" });
      }

      const [created] = await db
        .insert(tasks)
        .values({
          entityType: String(entityType),
          entityId: parsedId,
          title: String(title),
          description: typeof description === "string" ? description : null,
          status: String(status),
          priority: typeof priority === "string" ? priority : null,
          dueDate: dueDate ? String(dueDate) : null,
          assignedTo: typeof assignedTo === "string" ? assignedTo : null,
        })
        .returning();

      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const taskId = Number(req.params.id);
      if (Number.isNaN(taskId)) {
        return res.status(400).json({ error: "Invalid task id" });
      }

      const updates: Record<string, unknown> = { updatedAt: sql`CURRENT_TIMESTAMP` };
      const allowed = ["title", "description", "status", "priority", "dueDate", "assignedTo"] as const;
      for (const key of allowed) {
        if (key in req.body) {
          const value = req.body[key];
          updates[key as keyof typeof updates] = value ?? null;
        }
      }

      const [updated] = await db.update(tasks).set(updates).where(eq(tasks.id, taskId)).returning();
      if (!updated) {
        return res.status(404).json({ error: "Task not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const taskId = Number(req.params.id);
      if (Number.isNaN(taskId)) {
        return res.status(400).json({ error: "Invalid task id" });
      }

      await db.delete(tasks).where(eq(tasks.id, taskId));
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  // Snippets
  app.post("/api/snippets", async (req: Request, res: Response) => {
    try {
      const { documentId, pageNumber, excerpt, title } = req.body || {};
      if (!documentId || Number.isNaN(Number(documentId)) || !excerpt) {
        return res.status(400).json({ error: "documentId and excerpt are required" });
      }
      const [created] = await db
        .insert(sourceSnippets)
        .values({
          documentId: Number(documentId),
          pageNumber: pageNumber ? Number(pageNumber) : null,
          excerpt: String(excerpt),
          title: title ? String(title) : null,
        })
        .returning();
      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating snippet:", error);
      res.status(500).json({ error: "Failed to create snippet" });
    }
  });

  app.get("/api/snippets", async (req: Request, res: Response) => {
    try {
      const { documentId } = req.query;
      const conditions = [] as any[];
      if (documentId) {
        const parsed = Number(documentId);
        if (Number.isNaN(parsed)) {
          return res.status(400).json({ error: "Invalid documentId" });
        }
        conditions.push(eq(sourceSnippets.documentId, parsed));
      }
      const query = db.select().from(sourceSnippets);
      const results = conditions.length ? await query.where(and(...conditions)) : await query;
      res.json(results);
    } catch (error) {
      console.error("Error fetching snippets:", error);
      res.status(500).json({ error: "Failed to fetch snippets" });
    }
  });

  // Document taxonomy update
  app.patch("/api/documents/:id", async (req: Request, res: Response) => {
    try {
      const documentId = Number(req.params.id);
      if (Number.isNaN(documentId)) {
        return res.status(400).json({ error: "Invalid document id" });
      }
      const { docType, tags } = req.body || {};
      const updates: Record<string, unknown> = {};
      if (docType !== undefined) updates.docType = docType || null;
      if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : null;
      const [updated] = await db.update(documents).set(updates).where(eq(documents.id, documentId)).returning();
      if (!updated) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ error: "Failed to update document" });
    }
  });

  // Activity feed
  app.get("/api/companies/:id/activity", async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.params.id);
      if (Number.isNaN(companyId)) {
        return res.status(400).json({ error: "Invalid company id" });
      }

      const researchEvents = await db
        .select({
          type: sql`'research'`,
          id: researchItems.id,
          title: researchItems.title,
          section: researchItems.section,
          createdAt: researchItems.updatedAt,
        })
        .from(researchItems)
        .where(and(eq(researchItems.entityType, "company"), eq(researchItems.entityId, companyId)));

      const metricEvents = await db
        .select({
          type: sql`'metric'`,
          id: companyMetrics.id,
          title: companyMetrics.key,
          section: sql<string>`COALESCE(${companyMetrics.period}, 'Metric')`,
          createdAt: companyMetrics.updatedAt,
        })
        .from(companyMetrics)
        .where(eq(companyMetrics.companyId, companyId));

      const documentEvents = await db
        .select({
          type: sql`'document'`,
          id: documents.id,
          title: documents.title,
          section: documents.docType,
          createdAt: companyDocuments.createdAt,
        })
        .from(companyDocuments)
        .innerJoin(documents, eq(companyDocuments.documentId, documents.id))
        .where(eq(companyDocuments.companyId, companyId));

      const taskEvents = await db
        .select({
          type: sql`'task'`,
          id: tasks.id,
          title: tasks.title,
          section: tasks.status,
          createdAt: tasks.updatedAt,
        })
        .from(tasks)
        .where(and(eq(tasks.entityType, "company"), eq(tasks.entityId, companyId)));

      const combined = [...researchEvents, ...metricEvents, ...documentEvents, ...taskEvents]
        .sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime())
        .slice(0, 20);

      res.json(combined);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  // Memo + snapshot endpoints
  app.get("/api/companies/:id/memo", async (req: Request, res: Response) => {
    try {
      const companyId = Number(req.params.id);
      if (Number.isNaN(companyId)) return res.status(400).json({ error: "Invalid company id" });

      const [company] = await db
        .select({
          id: companies.id,
          name: companies.name,
          ticker: companies.ticker,
          description: companies.description,
          pipelineStage: companies.pipelineStage,
        })
        .from(companies)
        .where(eq(companies.id, companyId));
      if (!company) return res.status(404).json({ error: "Company not found" });

      const categoriesList = await db
        .select({ id: categories.id, name: categories.name, type: categories.type })
        .from(companyCategories)
        .innerJoin(categories, eq(companyCategories.categoryId, categories.id))
        .where(eq(companyCategories.companyId, companyId));

      const metrics = await db
        .select()
        .from(companyMetrics)
        .where(eq(companyMetrics.companyId, companyId))
        .orderBy(companyMetrics.updatedAt);

      const pinnedResearch = await db
        .select()
        .from(researchItems)
        .where(and(eq(researchItems.entityType, "company"), eq(researchItems.entityId, companyId), eq(researchItems.pinned, true)));

      const documentsList = await db
        .select({ id: documents.id, title: documents.title, docType: documents.docType })
        .from(companyDocuments)
        .innerJoin(documents, eq(companyDocuments.documentId, documents.id))
        .where(eq(companyDocuments.companyId, companyId));

      const openTasks = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.entityType, "company"), eq(tasks.entityId, companyId)));

      res.json({
        company,
        categories: categoriesList,
        metrics,
        pinnedResearch,
        documents: documentsList,
        tasks: openTasks,
      });
    } catch (error) {
      console.error("Error building memo:", error);
      res.status(500).json({ error: "Failed to build memo" });
    }
  });

  app.get("/api/industries/:id/snapshot", async (req: Request, res: Response) => {
    try {
      const industryId = Number(req.params.id);
      if (Number.isNaN(industryId)) return res.status(400).json({ error: "Invalid industry id" });

      const [industry] = await db.select().from(industries).where(eq(industries.id, industryId));
      if (!industry) return res.status(404).json({ error: "Industry not found" });

      const industryCompanies = await db
        .select({ id: companies.id, name: companies.name, ticker: companies.ticker })
        .from(companies)
        .where(eq(companies.industryId, industryId));

      const companyIds = industryCompanies.map((c) => c.id);
      const metrics = companyIds.length
        ? await db
            .select()
            .from(companyMetrics)
            .where(inArray(companyMetrics.companyId, companyIds))
        : [];

      const documentsList = await db
        .select({ id: documents.id, title: documents.title, docType: documents.docType })
        .from(industryDocuments)
        .innerJoin(documents, eq(industryDocuments.documentId, documents.id))
        .where(eq(industryDocuments.industryId, industryId));

      const industryTasks = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.entityType, "industry"), eq(tasks.entityId, industryId)));

      res.json({ industry, companies: industryCompanies, metrics, documents: documentsList, tasks: industryTasks });
    } catch (error) {
      console.error("Error building snapshot:", error);
      res.status(500).json({ error: "Failed to build snapshot" });
    }
  });

  app.get("/api/industries/:id/activity", async (req: Request, res: Response) => {
    try {
      const industryId = Number(req.params.id);
      if (Number.isNaN(industryId)) {
        return res.status(400).json({ error: "Invalid industry id" });
      }

      const researchEvents = await db
        .select({
          type: sql`'research'`,
          id: researchItems.id,
          title: researchItems.title,
          section: researchItems.section,
          createdAt: researchItems.updatedAt,
        })
        .from(researchItems)
        .where(and(eq(researchItems.entityType, "industry"), eq(researchItems.entityId, industryId)));

      const documentEvents = await db
        .select({
          type: sql`'document'`,
          id: documents.id,
          title: documents.title,
          section: documents.docType,
          createdAt: industryDocuments.createdAt,
        })
        .from(industryDocuments)
        .innerJoin(documents, eq(industryDocuments.documentId, documents.id))
        .where(eq(industryDocuments.industryId, industryId));

      const taskEvents = await db
        .select({
          type: sql`'task'`,
          id: tasks.id,
          title: tasks.title,
          section: tasks.status,
          createdAt: tasks.updatedAt,
        })
        .from(tasks)
        .where(and(eq(tasks.entityType, "industry"), eq(tasks.entityId, industryId)));

      const combined = [...researchEvents, ...documentEvents, ...taskEvents]
        .sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime())
        .slice(0, 20);

      res.json(combined);
    } catch (error) {
      console.error("Error fetching activity:", error);
      res.status(500).json({ error: "Failed to fetch activity" });
    }
  });

  app.delete("/api/industries/:id", async (req: Request, res: Response) => {
    try {
      const industryId = Number(req.params.id);
      if (Number.isNaN(industryId)) {
        return res.status(400).json({ error: "Invalid industry id" });
      }

      // Check if there are companies linked to this industry
      const linkedCompanies = await db
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.industryId, industryId));

      if (linkedCompanies.length > 0) {
        return res.status(400).json({
          error: `Cannot delete industry with ${linkedCompanies.length} linked companies. Please reassign or delete companies first.`
        });
      }

      // Delete related records first
      await db.delete(industryDocuments).where(eq(industryDocuments.industryId, industryId));
      await db.delete(researchItems).where(and(eq(researchItems.entityType, "industry"), eq(researchItems.entityId, industryId)));
      await db.delete(tasks).where(and(eq(tasks.entityType, "industry"), eq(tasks.entityId, industryId)));

      // Delete the industry
      await db.delete(industries).where(eq(industries.id, industryId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting industry:", error);
      res.status(500).json({ error: "Failed to delete industry" });
    }
  });
}
