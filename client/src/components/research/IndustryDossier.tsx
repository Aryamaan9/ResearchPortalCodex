import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Industry, Company, DocumentRecord, Source } from "@/types/research";
import { CollapsibleSection } from "./CollapsibleSection";
import { Link } from "wouter";
import { ExternalLink, NotebookPen } from "lucide-react";

interface IndustryDossierProps {
  industry: Industry;
  companies: Company[];
  documents: DocumentRecord[];
  sources: Source[];
}

export function IndustryDossier({ industry, companies, documents, sources }: IndustryDossierProps) {
  const [showSources, setShowSources] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    mcap: true,
    cmp: true,
    pe: true,
    stage: true,
  });

  const industryCompanies = useMemo(() => companies.filter((c) => c.industryId === industry.id), [companies, industry.id]);
  const industryDocs = useMemo(() => documents.filter((doc) => doc.industryId === industry.id), [documents, industry.id]);

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Industry Dossier</p>
          <h1 className="text-2xl font-semibold">{industry.name}</h1>
        </div>
        <Button variant="outline" onClick={() => setShowSources(true)}>
          Sources
        </Button>
      </div>

      <CollapsibleSection title="Drivers" defaultOpen description="Demand, supply, and risk">
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Demand</CardTitle>
              <CardDescription>Signals driving adoption</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {industry.drivers?.slice(0, 2).map((item) => (
                <Badge key={item} variant="secondary">{item}</Badge>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Supply</CardTitle>
              <CardDescription>Vendors and capacity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="secondary">New issuers</Badge>
              <Badge variant="secondary">Processor competition</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Risk</CardTitle>
              <CardDescription>Constraints and shocks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge variant="secondary">Reg shifts</Badge>
              <Badge variant="secondary">Pricing pressure</Badge>
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Companies" defaultOpen description="Toggle columns to focus">
        <div className="flex flex-wrap gap-4 mb-3 text-sm">
          {Object.keys(visibleColumns).map((key) => (
            <label key={key} className="flex items-center gap-2 capitalize">
              <Checkbox checked={visibleColumns[key as keyof typeof visibleColumns]} onCheckedChange={() => toggleColumn(key as keyof typeof visibleColumns)} />
              {key}
            </label>
          ))}
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                {visibleColumns.mcap && <TableHead>MCAP</TableHead>}
                {visibleColumns.cmp && <TableHead>Price</TableHead>}
                {visibleColumns.pe && <TableHead>PE</TableHead>}
                {visibleColumns.stage && <TableHead>Stage</TableHead>}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {industryCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-semibold">{company.name}</TableCell>
                  {visibleColumns.mcap && <TableCell>{company.mcap}</TableCell>}
                  {visibleColumns.cmp && <TableCell>{company.cmp}</TableCell>}
                  {visibleColumns.pe && <TableCell>{company.pe}</TableCell>}
                  {visibleColumns.stage && <TableCell>{company.stage}</TableCell>}
                  <TableCell>
                    <Link href={`/research/companies/${company.id}`}>
                      <Button variant="ghost" size="sm">Open</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CollapsibleSection>

      <div className="grid md:grid-cols-2 gap-4">
        <CollapsibleSection title="Associations" defaultOpen description="Industry maps and actors">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Payment processors, issuer banks, fraud networks, compliance vendors.</p>
            <div className="flex flex-wrap gap-2">
              {industry.themes?.map((theme) => (
                <Badge key={theme} variant="secondary">{theme}</Badge>
              ))}
              <Badge variant="outline">Interchange</Badge>
              <Badge variant="outline">Networks</Badge>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Industry Docs" defaultOpen description="Saved research and memos">
          <div className="space-y-3">
            {industryDocs.map((doc) => (
              <div key={doc.id} className="flex items-start justify-between border rounded-md p-3">
                <div>
                  <p className="font-semibold">{doc.filename}</p>
                  <p className="text-xs text-muted-foreground">{doc.uploadedAt}</p>
                  <p className="text-sm text-muted-foreground">{doc.summary}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {industryDocs.length === 0 && <p className="text-sm text-muted-foreground">No documents yet.</p>}
          </div>
        </CollapsibleSection>
      </div>

      <Dialog open={showSources} onOpenChange={setShowSources}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sources</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {sources.map((src) => (
              <div key={src.id} className="border rounded-md p-3">
                <p className="font-semibold">{src.label}</p>
                <p className="text-muted-foreground text-xs">{src.ref}</p>
                {src.url && (
                  <a href={src.url} className="text-primary inline-flex items-center gap-1 text-xs" target="_blank" rel="noreferrer">
                    <NotebookPen className="h-3 w-3" /> Open link
                  </a>
                )}
              </div>
            ))}
            {sources.length === 0 && <p className="text-muted-foreground">No sources yet.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
