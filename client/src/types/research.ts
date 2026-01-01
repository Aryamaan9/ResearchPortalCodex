export interface Industry {
  id: string;
  name: string;
  size?: string;
  growth?: string;
  pe?: string;
  metadata?: Record<string, unknown>;
  drivers?: string[];
  themes?: string[];
}

export interface Company {
  id: string;
  name: string;
  industryId: string;
  mcap?: string;
  cmp?: string;
  pe?: string;
  stage?: string;
  categories?: string[];
  summary?: string;
  metrics?: Record<string, string | number>;
}

export interface DocumentRecord {
  id: string;
  filename: string;
  type: string;
  companyId?: string | null;
  industryId?: string | null;
  uploadedAt: string;
  pages?: number;
  summary?: string;
  storageUrl?: string;
  extractedText?: string;
  tags?: string[];
}

export interface Note {
  id: string;
  companyId: string;
  type: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface Source {
  id: string;
  entityType: string;
  entityId: string;
  label: string;
  ref: string;
  url?: string;
  pageRange?: string;
  createdAt: string;
}

export interface Thesis {
  id: string;
  companyId: string;
  status: string;
  conviction: string;
  intent: string;
  positionSizePct: number;
  expectedIRR: string;
  baseCase: string;
  bullCase: string;
  bearCase: string;
  sellTriggers: string[];
  updatedAt: string;
}

export interface ChangeLog {
  id: string;
  companyId: string;
  date: string;
  type: string;
  impact: string;
  text: string;
}

export interface EventRecord {
  id: string;
  companyId: string;
  period: string;
  date: string;
  kind: string;
  theme?: string;
  notes: string;
  sources?: string[];
}

export interface PipelineItem {
  id: string;
  stage: string;
  companyId: string;
  summary: string;
}

export type IndustryMap = Record<string, Industry>;
export type CompanyMap = Record<string, Company>;
