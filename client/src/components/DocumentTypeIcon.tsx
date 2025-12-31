import { 
  FileText, 
  BarChart3, 
  FileSpreadsheet, 
  Presentation,
  FileSearch,
  Building2,
  File,
  Mic
} from "lucide-react";
import type { DocumentType } from "@shared/schema";

interface DocumentTypeIconProps {
  type: DocumentType | string | null;
  className?: string;
}

const iconMap: Record<string, typeof FileText> = {
  annual_report: FileText,
  quarterly_earnings: BarChart3,
  concall_transcript: Mic,
  industry_report: FileSearch,
  research_note: FileSpreadsheet,
  investor_presentation: Presentation,
  regulatory_filing: Building2,
  other: File,
};

export function DocumentTypeIcon({ type, className = "h-4 w-4" }: DocumentTypeIconProps) {
  const Icon = type ? iconMap[type] || File : File;
  return <Icon className={className} />;
}

export function getDocumentTypeLabel(type: DocumentType | string | null): string {
  const labels: Record<string, string> = {
    annual_report: "Annual Report",
    quarterly_earnings: "Quarterly Earnings",
    concall_transcript: "Concall Transcript",
    industry_report: "Industry Report",
    research_note: "Research Note",
    investor_presentation: "Investor Presentation",
    regulatory_filing: "Regulatory Filing",
    other: "Other",
  };
  return type ? labels[type] || "Unknown" : "Unclassified";
}
