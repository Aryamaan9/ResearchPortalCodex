import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { CollapsibleSection } from "./CollapsibleSection";
import { ChangeLog, Company, DocumentRecord, EventRecord, Industry, Note, Thesis } from "@/types/research";
import { cn } from "@/lib/utils";
import { Sparkles, StickyNote } from "lucide-react";
import { Link } from "wouter";

interface CompanyDossierProps {
  company: Company;
  industry?: Industry;
  thesis?: Thesis;
  notes: Note[];
  changeLogs: ChangeLog[];
  events: EventRecord[];
  documents: DocumentRecord[];
  onAddNote: (note: Omit<Note, "id">) => void;
  onOpenSources: () => void;
}

export function CompanyDossier({ company, industry, thesis, notes, changeLogs, events, documents, onAddNote, onOpenSources }: CompanyDossierProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [draftNote, setDraftNote] = useState({ title: "", body: "" });
  const [editingDecision, setEditingDecision] = useState(false);
  const [localThesis, setLocalThesis] = useState(thesis);

  const companyDocs = useMemo(() => documents.filter((doc) => doc.companyId === company.id), [documents, company.id]);

  const handleAddNote = () => {
    if (!draftNote.title || !draftNote.body) return;
    onAddNote({
      companyId: company.id,
      type: "insight",
      title: draftNote.title,
      body: draftNote.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setDraftNote({ title: "", body: "" });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col gap-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/research/companies">Companies</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>{company.name}</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase text-muted-foreground">Company Dossier</p>
            <h1 className="text-2xl font-semibold">{company.name}</h1>
            <p className="text-muted-foreground">{company.summary}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary">{company.stage}</Badge>
            <Badge variant="outline">{industry?.name}</Badge>
            <Button variant="outline" onClick={onOpenSources}>Sources</Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[3fr,1.2fr] gap-4 items-start">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex flex-wrap gap-2">
                {[
                  "overview",
                  "story",
                  "economics",
                  "numbers",
                  "valuation",
                  "mgmt",
                  "risks",
                  "events",
                  "docs",
                ].map((tab) => (
                  <TabsTrigger key={tab} value={tab} className="capitalize">
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="overview" className="space-y-3">
                <CollapsibleSection title="Snapshot" defaultOpen>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="space-y-2">
                      {company.metrics &&
                        Object.entries(company.metrics).map(([label, value]) => (
                          <div key={label} className="flex items-center justify-between rounded-md border p-2">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-semibold">{value}</span>
                          </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                      <div className="rounded-md border p-3 bg-muted/40">
                        <p className="text-sm font-semibold">Thesis</p>
                        <p className="text-xs text-muted-foreground">{thesis?.intent || "Decision pending"}</p>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">IRR</p>
                          <Badge variant="secondary">{thesis?.expectedIRR || "TBD"}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Updated {thesis?.updatedAt}</p>
                      </div>
                    </div>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Key Drivers" defaultOpen>
                  <div className="flex flex-wrap gap-2 text-sm">
                    {(company.categories || []).map((cat) => (
                      <Badge key={cat} variant="secondary">{cat}</Badge>
                    ))}
                    <Badge variant="outline">Pricing power</Badge>
                    <Badge variant="outline">Retention</Badge>
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Notes" defaultOpen>
                  <div className="grid md:grid-cols-2 gap-3">
                    {notes.map((note) => (
                      <Card key={note.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <StickyNote className="h-4 w-4" /> {note.title}
                          </CardTitle>
                          <CardDescription className="text-xs">{note.createdAt}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{note.body}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="rounded-md border p-3 space-y-2">
                    <p className="text-sm font-semibold">Add note</p>
                    <Input
                      placeholder="Title"
                      value={draftNote.title}
                      onChange={(e) => setDraftNote((prev) => ({ ...prev, title: e.target.value }))}
                    />
                    <Textarea
                      placeholder="What did we learn?"
                      value={draftNote.body}
                      onChange={(e) => setDraftNote((prev) => ({ ...prev, body: e.target.value }))}
                    />
                    <Button onClick={handleAddNote} size="sm">Save</Button>
                  </div>
                </CollapsibleSection>
              </TabsContent>

              <TabsContent value="story" className="space-y-3">
                <CollapsibleSection title="Narrative" defaultOpen>
                  <p className="text-sm text-muted-foreground">{company.summary}</p>
                  <Button variant="outline" size="sm" onClick={onOpenSources}>
                    <Sparkles className="h-4 w-4 mr-2" /> Sources
                  </Button>
                </CollapsibleSection>
                <CollapsibleSection title="Change Log">
                  <div className="space-y-2 text-sm">
                    {changeLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between border rounded-md p-2">
                        <div>
                          <p className="font-semibold">{log.type}</p>
                          <p className="text-muted-foreground text-xs">{log.text}</p>
                        </div>
                        <Badge variant="secondary">{log.date}</Badge>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              </TabsContent>

              <TabsContent value="economics" className="space-y-3">
                <CollapsibleSection title="Unit Economics" defaultOpen>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-md border p-3">
                      <p className="font-semibold">Gross Margin</p>
                      <p className="text-muted-foreground">{company.metrics?.["Gross Margin"]}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="font-semibold">Net Revenue Retention</p>
                      <p className="text-muted-foreground">{company.metrics?.["Net Revenue Retention"]}</p>
                    </div>
                  </div>
                </CollapsibleSection>
              </TabsContent>

              <TabsContent value="numbers" className="space-y-3">
                <CollapsibleSection title="KPIs" defaultOpen>
                  <div className="grid md:grid-cols-3 gap-3 text-sm">
                    <div className="rounded-md border p-3">
                      <p className="font-semibold">Revenue run-rate</p>
                      <p className="text-muted-foreground">{company.metrics?.["Revenue Run-Rate"]}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="font-semibold">Customers</p>
                      <p className="text-muted-foreground">{company.metrics?.["Customers"]}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <p className="font-semibold">CMP / PE</p>
                      <p className="text-muted-foreground">{company.cmp} / {company.pe}</p>
                    </div>
                  </div>
                </CollapsibleSection>
              </TabsContent>

              <TabsContent value="valuation" className="space-y-3">
                <CollapsibleSection title="Cases" defaultOpen>
                  <div className="grid md:grid-cols-3 gap-3 text-sm">
                    <CaseCard label="Bear" value={localThesis?.bearCase || "TBD"} />
                    <CaseCard label="Base" value={localThesis?.baseCase || "TBD"} highlight />
                    <CaseCard label="Bull" value={localThesis?.bullCase || "TBD"} />
                  </div>
                </CollapsibleSection>
              </TabsContent>

              <TabsContent value="mgmt" className="space-y-3">
                <CollapsibleSection title="Management" defaultOpen>
                  <p className="text-sm text-muted-foreground">Operator bench and incentives will be layered here.</p>
                </CollapsibleSection>
              </TabsContent>

              <TabsContent value="risks" className="space-y-3">
                <CollapsibleSection title="Risks" defaultOpen>
                  <div className="space-y-2 text-sm">
                    {notes
                      .filter((note) => note.type === "risk")
                      .map((note) => (
                        <div key={note.id} className="border rounded-md p-3">
                          <p className="font-semibold">{note.title}</p>
                          <p className="text-muted-foreground">{note.body}</p>
                        </div>
                      ))}
                  </div>
                </CollapsibleSection>
              </TabsContent>

              <TabsContent value="events" className="space-y-3">
                <CollapsibleSection title="Events" defaultOpen>
                  <div className="space-y-2 text-sm">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-center justify-between border rounded-md p-3">
                        <div>
                          <p className="font-semibold">{event.kind} — {event.period}</p>
                          <p className="text-muted-foreground">{event.notes}</p>
                        </div>
                        <Badge variant="secondary">{event.date}</Badge>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              </TabsContent>

              <TabsContent value="docs" className="space-y-3">
                <CollapsibleSection title="Documents" defaultOpen>
                  <div className="space-y-2 text-sm">
                    {companyDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between border rounded-md p-3">
                        <div>
                          <p className="font-semibold">{doc.filename}</p>
                          <p className="text-muted-foreground text-xs">{doc.uploadedAt}</p>
                        </div>
                        <Badge variant="outline" className="capitalize">{doc.type.replace("_", " ")}</Badge>
                      </div>
                    ))}
                    {companyDocs.length === 0 && <p className="text-muted-foreground">No company documents yet.</p>}
                  </div>
                </CollapsibleSection>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-3 sticky top-20">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Decision</CardTitle>
              <CardDescription>Conviction and guardrails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{localThesis?.status || "Pending"}</Badge>
                <Button variant="ghost" size="sm" onClick={() => setEditingDecision((prev) => !prev)}>
                  {editingDecision ? "Done" : "Edit"}
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <label className="flex items-center justify-between">
                  <span>Conviction</span>
                  {editingDecision ? (
                    <Input
                      value={localThesis?.conviction || ""}
                      onChange={(e) => setLocalThesis((prev) => prev ? { ...prev, conviction: e.target.value } : undefined)}
                      className="h-9 w-32"
                    />
                  ) : (
                    <span className="font-semibold">{localThesis?.conviction || "TBD"}</span>
                  )}
                </label>
                <label className="flex items-center justify-between">
                  <span>Position</span>
                  {editingDecision ? (
                    <Input
                      value={localThesis?.positionSizePct ?? ""}
                      onChange={(e) =>
                        setLocalThesis((prev) => (prev ? { ...prev, positionSizePct: Number(e.target.value) || 0 } : undefined))
                      }
                      className="h-9 w-20"
                    />
                  ) : (
                    <span className="font-semibold">{localThesis?.positionSizePct ?? "-"}%</span>
                  )}
                </label>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Sell triggers</p>
                  <div className="flex flex-wrap gap-2">
                    {(localThesis?.sellTriggers || []).map((trigger) => (
                      <Badge key={trigger} variant="outline">{trigger}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Q&A Ready</CardTitle>
              <CardDescription>Use documents and notes for fast responses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">Select a doc in Documents to start a chat session.</p>
              <Button variant="outline" className="w-full" onClick={onOpenSources}>
                Show sources
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CaseCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-md border p-3 h-full", highlight && "border-primary/60 bg-primary/5")}>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold leading-relaxed">{value}</p>
    </div>
  );
}
