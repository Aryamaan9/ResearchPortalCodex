import type { Express, Request, Response } from "express";
import { and, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../db";
import { companies, companyDocuments, documents, industries } from "@shared/schema";

export function registerEntityRoutes(app: Express) {
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

      const totalRevenue = industryCompanies.reduce((sum, c) => sum + (c.revenue || 0), 0);

      res.json({ ...industry, companies: industryCompanies, totalRevenue });
    } catch (error) {
      console.error("Error fetching industry:", error);
      res.status(500).json({ error: "Failed to fetch industry" });
    }
  });

  // Companies
  app.get("/api/companies", async (req: Request, res: Response) => {
    try {
      const { industryId, q } = req.query;
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

      const query = db
        .select({
          id: companies.id,
          name: companies.name,
          ticker: companies.ticker,
          description: companies.description,
          createdAt: companies.createdAt,
          industryId: companies.industryId,
          industryName: industries.name,
        })
        .from(companies)
        .leftJoin(industries, eq(companies.industryId, industries.id));

      if (conditions.length > 0) {
        const results = await query.where(and(...conditions)).orderBy(companies.name);
        res.json(results);
      } else {
        const results = await query.orderBy(companies.name);
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

      res.json({
        company: {
          id: company.id,
          name: company.name,
          ticker: company.ticker,
          description: company.description,
          revenue: company.revenue,
          createdAt: company.createdAt,
          industryId: company.industryId,
        },
        industry: company.industryName
          ? { id: company.industryId, name: company.industryName }
          : null,
        documents: linkedDocuments,
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
}
