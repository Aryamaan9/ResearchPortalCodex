import { useMemo, useState } from "react";
import { Route, Switch, useRoute } from "wouter";
import {
  changeLogs as mockChangeLogs,
  companies as mockCompanies,
  documents as mockDocuments,
  events as mockEvents,
  getCompany,
  getIndustry,
  industries as mockIndustries,
  notes as mockNotes,
  pipeline as mockPipeline,
  sources as mockSources,
  theses as mockTheses,
} from "@/lib/mockResearchData";
import { ResearchSidebarNav } from "@/components/research/ResearchSidebarNav";
import { HomeDashboard } from "@/components/research/HomeDashboard";
import { DocumentsModule } from "@/components/research/DocumentsModule";
import { IndustriesList } from "@/components/research/IndustriesList";
import { IndustryDossier } from "@/components/research/IndustryDossier";
import { CompaniesList } from "@/components/research/CompaniesList";
import { CompanyDossier } from "@/components/research/CompanyDossier";
import { PipelineBoard } from "@/components/research/PipelineBoard";
import { ScreenerView } from "@/components/research/ScreenerView";
import { TasksTracker } from "@/components/research/TasksTracker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Source } from "@/types/research";

export default function ResearchPlatformPage() {
  const [documents, setDocuments] = useState(mockDocuments);
  const [selectedDoc, setSelectedDoc] = useState<typeof documents[number] | undefined>();
  const [notes, setNotes] = useState(mockNotes);
  const [sources] = useState(mockSources);
  const [showSources, setShowSources] = useState(false);
  const [currentSources, setCurrentSources] = useState<Source[]>([]);

  const [, paramsCompany] = useRoute("/research/companies/:companyId");
  const [, paramsIndustry] = useRoute("/research/industries/:industryId");

  const company = useMemo(() => getCompany(paramsCompany?.companyId), [paramsCompany?.companyId]);
  const industry = useMemo(() => getIndustry(paramsIndustry?.industryId), [paramsIndustry?.industryId]);

  const handleUpload = (file: File) => {
    const newDoc = {
      id: `doc-${documents.length + 1}`,
      filename: file.name,
      type: "upload",
      uploadedAt: new Date().toISOString().slice(0, 10),
      summary: "Uploaded file ready for processing.",
      pages: 0,
      tags: ["upload"],
    };
    setDocuments((prev) => [newDoc, ...prev]);
    setSelectedDoc(newDoc);
  };

  const handleAddNote = (note: Omit<typeof notes[number], "id">) => {
    const newNote = { ...note, id: `note-${notes.length + 1}` };
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleOpenSources = (sourceList?: Source[]) => {
    setCurrentSources(sourceList || sources);
    setShowSources(true);
  };

  return (
    <div className="flex min-h-screen">
      <ResearchSidebarNav />
      <div className="flex-1">
        <Switch>
          <Route path="/research">
            <HomeDashboard companies={mockCompanies} pipeline={mockPipeline} />
          </Route>
          <Route path="/research/documents">
            <DocumentsModule
              documents={documents}
              onUpload={handleUpload}
              onSelect={(doc) => setSelectedDoc(doc)}
              selected={selectedDoc}
            />
          </Route>
          <Route path="/research/industries/:industryId">
            {industry ? (
              <IndustryDossier
                industry={industry}
                companies={mockCompanies}
                documents={documents}
                sources={sources}
              />
            ) : null}
          </Route>
          <Route path="/research/industries">
            <IndustriesList industries={mockIndustries} />
          </Route>
          <Route path="/research/companies/:companyId">
            {company ? (
              <CompanyDossier
                company={company}
                industry={getIndustry(company.industryId)}
                thesis={mockTheses.find((t) => t.companyId === company.id)}
                notes={notes.filter((note) => note.companyId === company.id)}
                changeLogs={mockChangeLogs.filter((c) => c.companyId === company.id)}
                events={mockEvents.filter((e) => e.companyId === company.id)}
                documents={documents}
                onAddNote={handleAddNote}
                onOpenSources={() => handleOpenSources()}
              />
            ) : null}
          </Route>
          <Route path="/research/companies">
            <CompaniesList companies={mockCompanies} industries={mockIndustries} />
          </Route>
          <Route path="/research/pipeline">
            <PipelineBoard items={mockPipeline} companies={mockCompanies} />
          </Route>
          <Route path="/research/screener">
            <ScreenerView companies={mockCompanies} />
          </Route>
          <Route path="/research/tasks">
            <TasksTracker />
          </Route>
        </Switch>
      </div>

      <Dialog open={showSources} onOpenChange={setShowSources}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sources</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {currentSources.map((src) => (
              <div key={src.id} className="border rounded-md p-3">
                <p className="font-semibold">{src.label}</p>
                <p className="text-muted-foreground text-xs">{src.ref}</p>
                {src.url && (
                  <a href={src.url} target="_blank" rel="noreferrer" className="text-primary text-xs">
                    Open link
                  </a>
                )}
              </div>
            ))}
            {currentSources.length === 0 && <p className="text-muted-foreground">No sources tracked yet.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
