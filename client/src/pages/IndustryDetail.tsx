import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Pin, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Company, CompanyMetric, Document, Industry, Task, ResearchItem, ResearchSource } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const RESEARCH_SECTIONS = [
  { key: "market_overview", label: "Market Overview" },
  { key: "competitive_landscape", label: "Competitive Landscape" },
  { key: "trends", label: "Trends & Drivers" },
  { key: "regulations", label: "Regulatory Environment" },
  { key: "risks", label: "Risks & Challenges" },
  { key: "opportunities", label: "Opportunities" },
  { key: "other", label: "Other" },
];

type IndustryWithCompanies = Industry & {
  companies: Company[];
  companyMetrics: CompanyMetric[];
  documents: { id: number; title: string; fileType: string | null; createdAt: string; linkedAt?: string }[];
  totalRevenue?: number;
};

export default function IndustryDetailPage() {
  const params = useParams<{ id: string }>();
  const [formState, setFormState] = useState({
    demandDrivers: "",
    supplyDrivers: "",
    costDrivers: "",
    riskFactors: "",
    regulations: "",
  });
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["revenue"]);
  const [selectedDocument, setSelectedDocument] = useState<string>("");
  const [taskForm, setTaskForm] = useState({ title: "", description: "", status: "todo", priority: "medium", dueDate: "" });
  const [researchForm, setResearchForm] = useState({ section: "market_overview", title: "", content: "" });
  const [editingResearchId, setEditingResearchId] = useState<number | null>(null);
  const [editResearchForm, setEditResearchForm] = useState({ section: "", title: "", content: "" });

  const { data, isLoading, error, refetch } = useQuery<IndustryWithCompanies>({
    queryKey: ["/api/industries", params.id],
  });

  const { data: documents } = useQuery<Document[]>({
    queryKey: ["/api/documents", "industry-link"],
    queryFn: async () => {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to load documents");
      const payload = await res.json();
      return payload.documents as Document[];
    },
  });

  const { data: tasks, refetch: refetchTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks", "industry", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?entityType=industry&entityId=${params.id}`);
      if (!res.ok) throw new Error("Failed to load tasks");
      return res.json();
    },
  });

  const { data: research = [], refetch: refetchResearch } = useQuery<(ResearchItem & { sources: ResearchSource[] })[]>({
    queryKey: ["/api/research", "industry", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/research?entityType=industry&entityId=${params.id}`);
      if (!res.ok) throw new Error("Failed to load research");
      return res.json();
    },
  });

  useEffect(() => {
    if (data) {
      setFormState({
        demandDrivers: data.demandDrivers || "",
        supplyDrivers: data.supplyDrivers || "",
        costDrivers: data.costDrivers || "",
        riskFactors: data.riskFactors || "",
        regulations: data.regulations || "",
      });
      const keys = new Set<string>(selectedMetrics);
      data.companyMetrics.forEach((m) => keys.add(m.key));
      setSelectedMetrics(Array.from(keys));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id]);

  const saveIndustry = useMutation({
    mutationFn: async () => {
      if (!params.id) return;
      await apiRequest("PUT", `/api/industries/${params.id}`, formState);
    },
    onSuccess: () => refetch(),
  });

  const linkDocument = useMutation({
    mutationFn: async () => {
      if (!params.id || !selectedDocument) return;
      await apiRequest("POST", `/api/industries/${params.id}/documents`, {
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
      if (!params.id) return;
      await apiRequest("DELETE", `/api/industries/${params.id}/documents/${documentId}`);
    },
    onSuccess: () => refetch(),
  });

  const createTask = useMutation({
    mutationFn: async () => {
      if (!taskForm.title.trim()) return;
      await apiRequest("POST", "/api/tasks", {
        entityType: "industry",
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
      if (!params.id) return;
      await apiRequest("POST", "/api/research", {
        entityType: "industry",
        entityId: Number(params.id),
        section: researchForm.section,
        title: researchForm.title,
        content: researchForm.content || null,
      });
    },
    onSuccess: () => {
      setResearchForm({ section: "market_overview", title: "", content: "" });
      refetchResearch();
    },
  });

  const updateResearch = useMutation({
    mutationFn: async ({ researchId, data }: { researchId: number; data: { title?: string; content?: string; section?: string } }) => {
      await apiRequest("PATCH", `/api/research/${researchId}`, data);
    },
    onSuccess: () => {
      setEditingResearchId(null);
      setEditResearchForm({ section: "", title: "", content: "" });
      refetchResearch();
    },
  });

  const togglePinResearch = useMutation({
    mutationFn: async ({ researchId, pinned }: { researchId: number; pinned: boolean }) => {
      await apiRequest("PATCH", `/api/research/${researchId}`, { pinned });
    },
    onSuccess: () => refetchResearch(),
  });

  const deleteResearch = useMutation({
    mutationFn: async (researchId: number) => {
      await apiRequest("DELETE", `/api/research/${researchId}`);
    },
    onSuccess: () => refetchResearch(),
  });

  const availableMetricKeys = useMemo(() => {
    const keys = new Set<string>(["revenue"]);
    data?.companyMetrics.forEach((m) => keys.add(m.key));
    return Array.from(keys);
  }, [data?.companyMetrics]);

  const researchBySection = (section: string) => {
    return research.filter((r) => r.section === section && !r.pinned);
  };

  const pinnedResearch = useMemo(() => {
    return research.filter((r) => r.pinned);
  }, [research]);

  const tasksByStatus = useMemo(() => {
    const grouped = {
      todo: tasks?.filter((t) => t.status === "todo") || [],
      doing: tasks?.filter((t) => t.status === "doing") || [],
      done: tasks?.filter((t) => t.status === "done") || [],
    };
    return grouped;
  }, [tasks]);

  const metricForCompany = (companyId: number, key: string) => {
    if (key === "revenue") {
      const company = data?.companies.find((c) => c.id === companyId);
      if (company?.revenue) return { value: company.revenue, unit: "" };
    }
    const metric = data?.companyMetrics.find((m) => m.companyId === companyId && m.key === key);
    if (!metric) return undefined;
    const value = metric.valueNumber ?? metric.valueText;
    const detail = metric.period ? `${metric.period}` : "";
    return { value, unit: metric.valueUnit, detail };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Industry workspace</h1>
          <p className="text-sm text-muted-foreground">Research fields, linked companies, and documents</p>
        </div>
        {params.id && (
          <Link href={`/companies?industryId=${params.id}`}>
            <span className="text-sm text-primary hover:underline">Create company in this industry</span>
          </Link>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : error || !data ? (
        <p className="text-sm text-destructive">Unable to load industry.</p>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{data.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Created {new Date(data.createdAt).toLocaleString()}
              </p>
              {data.totalRevenue !== undefined && (
                <p className="text-lg font-semibold">
                  Total Industry Revenue: ${data.totalRevenue.toLocaleString()}
                </p>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                {([
                  "demandDrivers",
                  "supplyDrivers",
                  "costDrivers",
                  "riskFactors",
                  "regulations",
                ] as const).map((field) => (
                  <div key={field} className="space-y-2">
                    <p className="text-sm font-medium capitalize">{field.replace(/([A-Z])/g, " $1")}</p>
                    <Textarea
                      value={(formState as Record<string, string>)[field]}
                      onChange={(e) => setFormState((prev) => ({ ...prev, [field]: e.target.value }))}
                      placeholder="Add notes or bullet points"
                      rows={4}
                    />
                  </div>
                ))}
              </div>
              <Button onClick={() => saveIndustry.mutate()} disabled={saveIndustry.isPending}>
                {saveIndustry.isPending ? "Saving..." : "Save research fields"}
              </Button>
            </CardContent>
          </Card>

          {pinnedResearch.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pinned research</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pinnedResearch.map((item) => (
                  <div key={item.id} className="p-3 rounded border">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        {item.content && <p className="text-xs text-muted-foreground line-clamp-3">{item.content}</p>}
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {item.section} • Updated {new Date(item.updatedAt || item.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePinResearch.mutate({ researchId: item.id, pinned: false })}
                        disabled={togglePinResearch.isPending}
                        title="Unpin"
                      >
                        <Pin className="h-4 w-4 fill-current" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Research</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Select
                  value={researchForm.section}
                  onValueChange={(value) => setResearchForm((prev) => ({ ...prev, section: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESEARCH_SECTIONS.map((section) => (
                      <SelectItem key={section.key} value={section.key}>
                        {section.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Title"
                  value={researchForm.title}
                  onChange={(e) => setResearchForm((prev) => ({ ...prev, title: e.target.value }))}
                />
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
              </div>

              {RESEARCH_SECTIONS.map((section) => (
                <div key={section.key}>
                  {researchBySection(section.key).length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold mb-2">{section.label}</h3>
                      <div className="space-y-2">
                        {researchBySection(section.key).map((item) => (
                          <div key={item.id} className="border rounded-md p-3">
                            {editingResearchId === item.id ? (
                              <div className="space-y-2">
                                <Input
                                  placeholder="Title"
                                  value={editResearchForm.title}
                                  onChange={(e) => setEditResearchForm((prev) => ({ ...prev, title: e.target.value }))}
                                />
                                <Textarea
                                  placeholder="Content or notes"
                                  value={editResearchForm.content}
                                  onChange={(e) => setEditResearchForm((prev) => ({ ...prev, content: e.target.value }))}
                                  rows={4}
                                />
                                <Select
                                  value={editResearchForm.section}
                                  onValueChange={(value) => setEditResearchForm((prev) => ({ ...prev, section: value }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select section" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {RESEARCH_SECTIONS.map((s) => (
                                      <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => updateResearch.mutate({
                                      researchId: item.id,
                                      data: {
                                        title: editResearchForm.title || undefined,
                                        content: editResearchForm.content || undefined,
                                        section: editResearchForm.section || undefined
                                      }
                                    })}
                                    disabled={updateResearch.isPending}
                                  >
                                    {updateResearch.isPending ? "Saving..." : "Save"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingResearchId(null);
                                      setEditResearchForm({ section: "", title: "", content: "" });
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-medium">{item.title}</p>
                                  {item.content && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.content}</p>}
                                  <p className="text-xs text-muted-foreground">
                                    Added {new Date(item.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingResearchId(item.id);
                                      setEditResearchForm({
                                        title: item.title,
                                        content: item.content || "",
                                        section: item.section
                                      });
                                    }}
                                    title="Edit"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => togglePinResearch.mutate({ researchId: item.id, pinned: !item.pinned })}
                                    disabled={togglePinResearch.isPending}
                                    title={item.pinned ? "Unpin" : "Pin"}
                                  >
                                    <Pin className={`h-4 w-4 ${item.pinned ? 'fill-current' : ''}`} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteResearch.mutate(item.id)}
                                    disabled={deleteResearch.isPending}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Companies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <p className="text-sm font-medium">Metrics shown:</p>
                {availableMetricKeys.map((key) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedMetrics.includes(key)}
                      onCheckedChange={(checked) => {
                        setSelectedMetrics((prev) =>
                          checked ? [...prev, key] : prev.filter((k) => k !== key)
                        );
                      }}
                    />
                    <span className="capitalize">{key.replace(/_/g, " ")}</span>
                  </label>
                ))}
              </div>

              {data.companies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No companies yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="py-2">Name</th>
                        <th className="py-2">Ticker</th>
                        {selectedMetrics.map((key) => (
                          <th key={key} className="py-2 capitalize">
                            {key.replace(/_/g, " ")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.companies.map((company) => (
                        <tr key={company.id} className="hover:bg-muted/30">
                          <td className="py-2">
                            <Link href={`/companies/${company.id}`}>
                              <span className="font-medium hover:underline">{company.name}</span>
                            </Link>
                          </td>
                          <td className="py-2 text-muted-foreground">{company.ticker || "-"}</td>
                          {selectedMetrics.map((key) => {
                            const metric = metricForCompany(company.id, key);
                            return (
                              <td key={key} className="py-2 text-muted-foreground">
                                {metric ? (
                                  <div className="flex flex-col">
                                    <span className="text-foreground">
                                      {metric.value}
                                      {metric.unit ? ` ${metric.unit}` : ""}
                                    </span>
                                    {metric.detail && <span className="text-xs">{metric.detail}</span>}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Industry documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select value={selectedDocument} onValueChange={setSelectedDocument}>
                  <SelectTrigger className="w-full sm:w-80">
                    <SelectValue placeholder="Select a document" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const linkedDocIds = new Set(data.documents.map(d => d.id));
                      const availableDocs = documents?.filter(doc => !linkedDocIds.has(doc.id)) || [];
                      return availableDocs.length > 0 ? (
                        availableDocs.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id.toString()}>
                            {doc.title}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No documents available
                        </SelectItem>
                      );
                    })()}
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
                    <div key={doc.id} className="py-3 flex items-center justify-between gap-2">
                      <div>
                        <Link href={`/documents/${doc.id}`}>
                          <span className="font-medium hover:underline">{doc.title}</span>
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {doc.fileType} • Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Linked {new Date(doc.linkedAt || doc.createdAt).toLocaleDateString()}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unlinkDocument.mutate(doc.id)}
                          disabled={unlinkDocument.isPending}
                        >
                          Unlink
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
                <Select value={taskForm.status} onValueChange={(val) => setTaskForm((prev) => ({ ...prev, status: val }))}>
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

              {/* To Do Tasks */}
              {tasksByStatus.todo.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">To Do ({tasksByStatus.todo.length})</h3>
                  {tasksByStatus.todo.map((task) => (
                    <div key={task.id} className="p-3 rounded border space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
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
                          value={task.assignee || ""}
                          onChange={(e) => updateTask.mutate({ id: task.id, updates: { assignee: e.target.value } })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* In Progress Tasks */}
              {tasksByStatus.doing.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">In Progress ({tasksByStatus.doing.length})</h3>
                  {tasksByStatus.doing.map((task) => (
                    <div key={task.id} className="p-3 rounded border space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
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
                          value={task.assignee || ""}
                          onChange={(e) => updateTask.mutate({ id: task.id, updates: { assignee: e.target.value } })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Done Tasks */}
              {tasksByStatus.done.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">Done ({tasksByStatus.done.length})</h3>
                  {tasksByStatus.done.map((task) => (
                    <div key={task.id} className="p-3 rounded border space-y-2 opacity-60">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-medium">{task.title}</p>
                          {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
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
                          value={task.assignee || ""}
                          onChange={(e) => updateTask.mutate({ id: task.id, updates: { assignee: e.target.value } })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tasks && tasks.length === 0 && (
                <p className="text-sm text-muted-foreground mt-4">No tasks yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
