import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import type {
  Category,
  Company,
  CompanyMetric,
  Document,
  Industry,
  ResearchItem,
  ResearchSource,
  Task,
  SourceSnippet,
} from "@shared/schema";

const PIPELINE_STAGES = [
  { value: "watchlist", label: "Watchlist" },
  { value: "researching", label: "Researching" },
  { value: "ic_ready", label: "IC Ready" },
  { value: "invested", label: "Invested" },
  { value: "exit_watch", label: "Exit Watch" },
];

type LinkedDocument = {
  id: number;
  title: string;
  fileType: string | null;
  createdAt: string;
  linkedAt?: string;
};

type CompanyResponse = {
  company: Company & { revenue: number | null };
  industry: Industry | null;
  documents: LinkedDocument[];
  categories: Category[];
  metrics: CompanyMetric[];
  research: (ResearchItem & { sources: ResearchSource[] })[];
};

export default function CompanyProfilePage() {
  const params = useParams<{ id: string }>();
  const [selectedDocument, setSelectedDocument] = useState<string>("");
  const [categoryInput, setCategoryInput] = useState<{ categoryId?: string; name?: string; type?: string }>({});
  const [metricForm, setMetricForm] = useState({ key: "", value: "", unit: "", period: "" });
  const [researchForm, setResearchForm] = useState({ section: "financials", title: "", content: "" });
  const [sourceForm, setSourceForm] = useState<{ [key: number]: { sourceType: "document" | "url"; documentId?: string; pageNumber?: string; excerpt?: string; url?: string; snippetId?: string } }>({});
  const [pipelineStage, setPipelineStage] = useState<string>("");
  const [taskForm, setTaskForm] = useState({ title: "", description: "", status: "todo", priority: "medium", dueDate: "" });

  const { data, isLoading, error, refetch } = useQuery<CompanyResponse>({
    queryKey: ["/api/companies", params.id],
  });

  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/documents", "linkable"],
    queryFn: async () => {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to load documents");
      const payload = await res.json();
      return payload.documents as Document[];
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: snippets } = useQuery<SourceSnippet[]>({
    queryKey: ["/api/snippets"],
    queryFn: async () => {
      const res = await fetch("/api/snippets");
      if (!res.ok) throw new Error("Failed to load snippets");
      return res.json();
    },
  });

  const { data: tasks, refetch: refetchTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks", "company", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?entityType=company&entityId=${params.id}`);
      if (!res.ok) throw new Error("Failed to load tasks");
      return res.json();
    },
  });

  type ActivityEntry = { type: string; id: number; title: string | null; section: string | null; createdAt: string | null };
  const { data: activity } = useQuery<ActivityEntry[]>({
    queryKey: ["/api/companies", params.id, "activity"],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${params.id}/activity`);
      if (!res.ok) throw new Error("Failed to load activity");
      return res.json();
    },
  });

  const linkDocument = useMutation({
    mutationFn: async () => {
      if (!params.id || !selectedDocument || selectedDocument === "none") return;
      await apiRequest("POST", `/api/companies/${params.id}/documents`, {
        documentId: Number(selectedDocument),
      });
    },
    onSuccess: () => {
      setSelectedDocument("");
      refetch();
    },
  });

  const unlinkDocument = useMutation({
    mutationFn: async (documentId: number) => {
      await apiRequest("DELETE", `/api/companies/${params.id}/documents/${documentId}`);
    },
    onSuccess: () => refetch(),
  });

  const createCategory = useMutation({
    mutationFn: async () => {
      if (!categoryInput.name || !categoryInput.type) return;
      await apiRequest("POST", "/api/categories", {
        name: categoryInput.name,
        type: categoryInput.type,
      });
    },
    onSuccess: () => {
      setCategoryInput({});
      refetch();
    },
  });

  const assignCategory = useMutation({
    mutationFn: async () => {
      if (!categoryInput.categoryId) return;
      await apiRequest("POST", `/api/companies/${params.id}/categories`, {
        categoryId: Number(categoryInput.categoryId),
      });
    },
    onSuccess: () => {
      setCategoryInput((prev) => ({ ...prev, categoryId: undefined }));
      refetch();
    },
  });

  const removeCategory = useMutation({
    mutationFn: async (categoryId: number) => {
      await apiRequest("DELETE", `/api/companies/${params.id}/categories/${categoryId}`);
    },
    onSuccess: () => refetch(),
  });

  const upsertMetric = useMutation({
    mutationFn: async () => {
      if (!metricForm.key) return;
      const valueNumber = Number(metricForm.value);
      await apiRequest("POST", `/api/companies/${params.id}/metrics`, {
        key: metricForm.key,
        valueText: Number.isNaN(valueNumber) ? metricForm.value : undefined,
        valueNumber: Number.isNaN(valueNumber) ? undefined : valueNumber,
        valueUnit: metricForm.unit || undefined,
        period: metricForm.period || undefined,
      });
    },
    onSuccess: () => {
      setMetricForm({ key: "", value: "", unit: "", period: "" });
      refetch();
    },
  });

  const deleteMetric = useMutation({
    mutationFn: async (metricId: number) => {
      await apiRequest("DELETE", `/api/companies/${params.id}/metrics/${metricId}`);
    },
    onSuccess: () => refetch(),
  });

  const updatePipeline = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/companies/${params.id}/pipeline`, {
        stage: pipelineStage || null,
      });
    },
    onSuccess: () => refetch(),
  });

  const createTask = useMutation({
    mutationFn: async () => {
      if (!taskForm.title.trim()) return;
      await apiRequest("POST", "/api/tasks", {
        entityType: "company",
        entityId: Number(params.id),
        title: taskForm.title,
        description: taskForm.description || undefined,
        status: taskForm.status,
        priority: taskForm.priority || undefined,
        dueDate: taskForm.dueDate || undefined,
      });
    },
    onSuccess: () => {
      setTaskForm({ title: "", description: "", status: "todo", priority: "medium", dueDate: "" });
      refetchTasks();
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Task> }) => {
      await apiRequest("PATCH", `/api/tasks/${id}`, updates);
    },
    onSuccess: () => refetchTasks(),
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: number) => {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => refetchTasks(),
  });

  const createResearchItem = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/research`, {
        entityType: "company",
        entityId: Number(params.id),
        section: researchForm.section,
        title: researchForm.title,
        content: researchForm.content,
      });
    },
    onSuccess: () => {
      setResearchForm({ section: "financials", title: "", content: "" });
      refetch();
    },
  });

  const addSource = useMutation({
    mutationFn: async (researchId: number) => {
      const form = sourceForm[researchId];
      if (!form?.sourceType) return;
      await apiRequest("POST", `/api/research/${researchId}/sources`, {
        sourceType: form.sourceType,
        documentId: form.sourceType === "document" ? Number(form.documentId) : undefined,
        pageNumber: form.pageNumber ? Number(form.pageNumber) : undefined,
        excerpt: form.excerpt,
        url: form.sourceType === "url" ? form.url : undefined,
        snippetId: form.snippetId ? Number(form.snippetId) : undefined,
      });
    },
    onSuccess: (_, researchId) => {
      setSourceForm((prev) => ({ ...prev, [researchId]: { sourceType: "document" } as any }));
      refetch();
    },
  });

  const deleteSource = useMutation({
    mutationFn: async (sourceId: number) => {
      await apiRequest("DELETE", `/api/sources/${sourceId}`);
    },
    onSuccess: () => refetch(),
  });

  const deleteResearch = useMutation({
    mutationFn: async (researchId: number) => {
      await apiRequest("DELETE", `/api/research/${researchId}`);
    },
    onSuccess: () => refetch(),
  });

  const documentOptions = useMemo(() => documents || [], [documents]);

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading company...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Unable to load company.</p>
      </div>
    );
  }

  useEffect(() => {
    if (data?.company) {
      setPipelineStage(data.company.pipelineStage || "");
    }
  }, [data?.company]);

  const researchBySection = (section: string) => data.research.filter((r) => r.section === section);

  const pinnedResearch = data.research.filter((r) => r.pinned);
  const activityItems = activity || [];

  const sections: { key: string; label: string }[] = [
    { key: "financials", label: "Financials" },
    { key: "valuation", label: "Valuation" },
    { key: "management", label: "Management" },
    { key: "risk", label: "Risk" },
    { key: "concall", label: "Concall" },
    { key: "other", label: "Other" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{data.company.name}</h1>
          <p className="text-sm text-muted-foreground">Company profile and linked documents</p>
        </div>
        <Link href={`/industries/${data.company.industryId}`}>
          <span className="text-sm text-primary hover:underline">View industry</span>
        </Link>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-5 w-full md:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Company details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-lg">{data.company.name}</span>
                {data.company.ticker && <Badge variant="secondary">{data.company.ticker}</Badge>}
              </div>
              {data.industry && (
                <p className="text-sm text-muted-foreground">Industry: {data.industry.name}</p>
              )}
              {data.company.description && (
                <p className="text-sm text-muted-foreground">{data.company.description}</p>
              )}
              <div className="grid gap-2 md:grid-cols-[200px_auto] md:items-end">
                <div>
                  <p className="text-sm font-medium">Pipeline stage</p>
                  <Select value={pipelineStage ?? ""} onValueChange={setPipelineStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {PIPELINE_STAGES.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => updatePipeline.mutate()} disabled={updatePipeline.isPending} className="w-full md:w-auto">
                  {updatePipeline.isPending ? "Saving..." : "Save stage"}
                </Button>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {data.categories.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No categories</span>
                  ) : (
                    data.categories.map((cat) => (
                      <Badge key={cat.id} variant="outline" className="flex items-center gap-2">
                        {cat.name}
                        <button
                          className="text-xs text-muted-foreground hover:text-destructive"
                          onClick={() => removeCategory.mutate(cat.id)}
                        >
                          ×
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <Select
                    value={categoryInput.categoryId ?? ""}
                    onValueChange={(val) => setCategoryInput((prev) => ({ ...prev, categoryId: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Assign category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name} ({cat.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => assignCategory.mutate()}
                    disabled={!categoryInput.categoryId || assignCategory.isPending}
                  >
                    {assignCategory.isPending ? "Assigning..." : "Assign"}
                  </Button>
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <Input
                    placeholder="New category name"
                    value={categoryInput.name ?? ""}
                    onChange={(e) => setCategoryInput((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Type (pipeline_stage, style, bucket)"
                    value={categoryInput.type ?? ""}
                    onChange={(e) => setCategoryInput((prev) => ({ ...prev, type: e.target.value }))}
                  />
                  <Button
                    variant="outline"
                    onClick={() => createCategory.mutate()}
                    disabled={!categoryInput.name || !categoryInput.type || createCategory.isPending}
                  >
                    {createCategory.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Created {new Date(data.company.createdAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pinned research</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pinnedResearch.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pinned items yet.</p>
                ) : (
                  pinnedResearch.map((item) => (
                    <div key={item.id} className="p-3 rounded border">
                      <p className="text-sm font-medium">{item.title}</p>
                      {item.content && <p className="text-xs text-muted-foreground line-clamp-3">{item.content}</p>}
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {item.section} • Updated {new Date(item.updatedAt || item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Latest activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {activityItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                ) : (
                  activityItems.map((event) => (
                    <div key={`${event.type}-${event.id}`} className="flex items-start gap-2 p-2 rounded border">
                      <div className="text-xs font-semibold uppercase text-muted-foreground">{event.type}</div>
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        {event.section && <p className="text-xs text-muted-foreground">{event.section}</p>}
                        {event.createdAt && (
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(event.createdAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Key metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 md:grid-cols-4">
                <Input
                  placeholder="Metric key (e.g. revenue)"
                  value={metricForm.key}
                  onChange={(e) => setMetricForm((prev) => ({ ...prev, key: e.target.value }))}
                />
                <Input
                  placeholder="Value"
                  value={metricForm.value}
                  onChange={(e) => setMetricForm((prev) => ({ ...prev, value: e.target.value }))}
                />
                <Input
                  placeholder="Unit"
                  value={metricForm.unit}
                  onChange={(e) => setMetricForm((prev) => ({ ...prev, unit: e.target.value }))}
                />
                <Input
                  placeholder="Period (FY24)"
                  value={metricForm.period}
                  onChange={(e) => setMetricForm((prev) => ({ ...prev, period: e.target.value }))}
                />
              </div>
              <Button onClick={() => upsertMetric.mutate()} disabled={!metricForm.key || upsertMetric.isPending}>
                {upsertMetric.isPending ? "Saving..." : "Save metric"}
              </Button>

              {data.metrics.length === 0 ? (
                <p className="text-sm text-muted-foreground">No metrics yet.</p>
              ) : (
                <div className="divide-y">
                  {data.metrics.map((metric) => (
                    <div key={metric.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium capitalize">{metric.key.replace(/_/g, " ")}</p>
                        <p className="text-sm text-muted-foreground">
                          {metric.valueNumber ?? metric.valueText} {metric.valueUnit}
                          {metric.period ? ` • ${metric.period}` : ""}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMetric.mutate(metric.id)}
                        disabled={deleteMetric.isPending}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="research" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Add research</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 md:grid-cols-3">
                <Select
                  value={researchForm.section}
                  onValueChange={(val) => setResearchForm((prev) => ({ ...prev, section: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.key} value={s.key}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Title"
                  value={researchForm.title}
                  onChange={(e) => setResearchForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <Textarea
                placeholder="Content or notes"
                value={researchForm.content}
                onChange={(e) => setResearchForm((prev) => ({ ...prev, content: e.target.value }))}
                rows={4}
              />
              <Button
                onClick={() => createResearchItem.mutate()}
                disabled={!researchForm.title || createResearchItem.isPending}
              >
                {createResearchItem.isPending ? "Adding..." : "Add research item"}
              </Button>
            </CardContent>
          </Card>

          {sections.map((section) => (
            <Card key={section.key}>
              <CardHeader>
                <CardTitle>{section.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {researchBySection(section.key).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items yet.</p>
                ) : (
                  researchBySection(section.key).map((item) => (
                    <div key={item.id} className="border rounded-md p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{item.title}</p>
                          {item.content && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.content}</p>}
                          <p className="text-xs text-muted-foreground">
                            Added {new Date(item.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteResearch.mutate(item.id)}
                          disabled={deleteResearch.isPending}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">Sources</p>
                        {item.sources?.length ? (
                          <div className="space-y-2">
                            {item.sources.map((source) => (
                              <div key={source.id} className="flex items-start justify-between gap-2 text-sm">
                                <div>
                                  <p className="font-medium capitalize">{source.sourceType}</p>
                                  {source.documentId && <p className="text-xs">Document #{source.documentId}</p>}
                                  {source.pageNumber && <p className="text-xs">Page {source.pageNumber}</p>}
                                  {source.url && (
                                    <a className="text-xs text-primary hover:underline" href={source.url} target="_blank" rel="noreferrer">
                                      {source.url}
                                    </a>
                                  )}
                                  {source.excerpt && (
                                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{source.excerpt}</p>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteSource.mutate(source.id)}
                                  disabled={deleteSource.isPending}
                                >
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No sources</p>
                        )}

                        <div className="grid gap-2 md:grid-cols-3">
                          <Select
                            value={sourceForm[item.id]?.sourceType || "document"}
                            onValueChange={(val) =>
                              setSourceForm((prev) => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], sourceType: val as "document" | "url" },
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Source type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="document">Document</SelectItem>
                              <SelectItem value="url">URL</SelectItem>
                            </SelectContent>
                          </Select>
                          {sourceForm[item.id]?.sourceType !== "url" ? (
                            <Select
                              value={sourceForm[item.id]?.documentId ?? ""}
                              onValueChange={(val) =>
                                setSourceForm((prev) => ({
                                  ...prev,
                                  [item.id]: { ...prev[item.id], documentId: val },
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select document" />
                              </SelectTrigger>
                              <SelectContent>
                                {documentOptions.map((doc) => (
                                  <SelectItem key={doc.id} value={doc.id.toString()}>
                                    {doc.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              placeholder="Source URL"
                              value={sourceForm[item.id]?.url ?? ""}
                              onChange={(e) =>
                                setSourceForm((prev) => ({
                                  ...prev,
                                  [item.id]: { ...prev[item.id], url: e.target.value },
                                }))
                              }
                            />
                          )}
                          {sourceForm[item.id]?.sourceType !== "url" &&
                          snippets?.filter((s) => s.documentId === Number(sourceForm[item.id]?.documentId)).length ? (
                            <Select
                              value={sourceForm[item.id]?.snippetId ?? ""}
                              onValueChange={(val) =>
                                setSourceForm((prev) => ({
                                  ...prev,
                                  [item.id]: { ...prev[item.id], snippetId: val },
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Attach snippet (optional)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {snippets
                                  ?.filter((s) => s.documentId === Number(sourceForm[item.id]?.documentId))
                                  .map((snippet) => (
                                    <SelectItem key={snippet.id} value={snippet.id.toString()}>
                                      {snippet.title || `Snippet #${snippet.id}`} ({snippet.pageNumber || "-"})
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          ) : null}
                          <Input
                            placeholder="Page or period"
                            value={sourceForm[item.id]?.pageNumber ?? ""}
                            onChange={(e) =>
                              setSourceForm((prev) => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], pageNumber: e.target.value },
                              }))
                            }
                          />
                        </div>
                        <Textarea
                          placeholder="Excerpt or note"
                          value={sourceForm[item.id]?.excerpt ?? ""}
                          onChange={(e) =>
                            setSourceForm((prev) => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], excerpt: e.target.value },
                            }))
                          }
                          rows={3}
                        />
                        <Button
                          onClick={() => addSource.mutate(item.id)}
                          disabled={addSource.isPending || !sourceForm[item.id]?.sourceType}
                        >
                          {addSource.isPending ? "Saving..." : "Add source"}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Linked documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select value={selectedDocument} onValueChange={setSelectedDocument}>
                  <SelectTrigger className="w-full sm:w-80">
                    <SelectValue placeholder="Select a document" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentOptions.length === 0 ? (
                      <SelectItem value="none" disabled>No documents available</SelectItem>
                    ) : (
                      documentOptions.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id.toString()}>
                          {doc.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => linkDocument.mutate()}
                  disabled={!selectedDocument || linkDocument.isPending}
                >
                  {linkDocument.isPending ? "Linking..." : "Link document"}
                </Button>
              </div>

              {data.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents linked yet.</p>
              ) : (
                <div className="divide-y">
                  {data.documents.map((doc) => (
                    <div key={doc.id} className="py-3 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <Link href={`/documents/${doc.id}`}>
                          <span className="font-medium hover:underline">{doc.title}</span>
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {doc.fileType} • Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => unlinkDocument.mutate(doc.id)}
                        disabled={unlinkDocument.isPending}
                      >
                        Unlink
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 md:grid-cols-4">
                <Input
                  placeholder="Task title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                />
                <Input
                  placeholder="Description"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, description: e.target.value }))}
                />
                <Select
                  value={taskForm.status}
                  onValueChange={(val) => setTaskForm((prev) => ({ ...prev, status: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To do</SelectItem>
                    <SelectItem value="doing">In progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={taskForm.priority}
                  onValueChange={(val) => setTaskForm((prev) => ({ ...prev, priority: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 md:grid-cols-[200px_auto]">
                <Input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                />
                <Button onClick={() => createTask.mutate()} disabled={!taskForm.title || createTask.isPending}>
                  {createTask.isPending ? "Saving..." : "Add task"}
                </Button>
              </div>

              <div className="space-y-2">
                {tasks && tasks.length > 0 ? (
                  tasks.map((task) => (
                    <div key={task.id} className="p-3 rounded border flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTask.mutate(task.id)}
                          disabled={deleteTask.isPending}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid gap-2 md:grid-cols-4">
                        <Select
                          value={task.status || "todo"}
                          onValueChange={(val) => updateTask.mutate({ id: task.id, updates: { status: val } })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To do</SelectItem>
                            <SelectItem value="doing">In progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={task.priority || "medium"}
                          onValueChange={(val) => updateTask.mutate({ id: task.id, updates: { priority: val } })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={task.dueDate ? task.dueDate.toString().slice(0, 10) : ""}
                          onChange={(e) => updateTask.mutate({ id: task.id, updates: { dueDate: e.target.value } })}
                        />
                        <Input
                          placeholder="Assignee"
                          value={task.assignedTo || ""}
                          onChange={(e) => updateTask.mutate({ id: task.id, updates: { assignedTo: e.target.value } })}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No tasks yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
