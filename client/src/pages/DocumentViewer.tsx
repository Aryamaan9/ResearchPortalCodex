import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/StatusBadge";
import { DocumentTypeIcon, getDocumentTypeLabel } from "@/components/DocumentTypeIcon";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Sparkles, 
  MessageSquare, 
  FileText, 
  Send,
  Loader2,
  BookOpen,
  Lightbulb,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import type { Document, DocumentPage } from "@shared/schema";
import { format } from "date-fns";

interface DocumentWithPages extends Document {
  pages: DocumentPage[];
}

interface SummaryResponse {
  summary: string;
  keyThemes: string[];
  risks: string[];
  opportunities: string[];
  sentiment: string;
}

interface PageInsightResponse {
  summary: string;
  keyPoints: string[];
}

interface DocumentQAResponse {
  answer: string;
  citations: Array<{
    pageNumber: number;
    excerpt: string;
  }>;
}

export default function DocumentViewer() {
  const params = useParams<{ id: string }>();
  const search = useSearch();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const searchParams = new URLSearchParams(search);
  const initialPage = parseInt(searchParams.get("page") || "1");

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [zoom, setZoom] = useState(100);
  const [aiTab, setAiTab] = useState("summary");
  const [question, setQuestion] = useState("");
  const [documentAnswer, setDocumentAnswer] = useState<DocumentQAResponse | null>(null);
  const [pageInsight, setPageInsight] = useState<PageInsightResponse | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const { data: document, isLoading } = useQuery<DocumentWithPages>({
    queryKey: ["/api/documents", params.id],
  });

  const summaryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/documents/${params.id}/summary`, {});
      return (await response.json()) as SummaryResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents", params.id] });
      toast({
        title: "Summary generated",
        description: "AI summary has been generated and saved",
      });
    },
    onError: (error) => {
      toast({
        title: "Error generating summary",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pageInsightMutation = useMutation({
    mutationFn: async (pageNumber: number) => {
      const response = await apiRequest("POST", `/api/documents/${params.id}/page-insight`, { pageNumber });
      return (await response.json()) as PageInsightResponse;
    },
    onSuccess: (data) => {
      setPageInsight(data);
    },
  });

  const documentQAMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiRequest("POST", `/api/documents/${params.id}/ask`, { question });
      return (await response.json()) as DocumentQAResponse;
    },
    onSuccess: (data) => {
      setDocumentAnswer(data);
    },
  });

  useEffect(() => {
    if (aiTab === "page" && document) {
      pageInsightMutation.mutate(currentPage);
    }
  }, [currentPage, aiTab]);

  const handleAskDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      documentQAMutation.mutate(question);
    }
  };

  const goToPage = (page: number) => {
    if (document && page >= 1 && page <= (document.pageCount || 1)) {
      setCurrentPage(page);
      setPageInsight(null);
    }
  };

  if (isLoading) {
    return <ViewerSkeleton />;
  }

  if (!document) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate("/documents")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Documents
        </Button>
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Document not found</p>
        </div>
      </div>
    );
  }

  const totalPages = document.pageCount || 1;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 p-4 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center gap-4 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate("/documents")} data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold truncate" data-testid="text-document-title">
              {document.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <StatusBadge status={document.processingStatus} />
              {document.documentType && (
                <Badge variant="outline">{getDocumentTypeLabel(document.documentType)}</Badge>
              )}
              <span>{format(new Date(document.uploadDate), "MMM d, yyyy")}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/documents/${document.id}/download`} download>
              <Download className="h-4 w-4 mr-2" />
              Download
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col bg-muted/30">
          <div className="flex items-center justify-between gap-4 p-3 border-b bg-background">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm min-w-[100px] text-center" data-testid="text-page-info">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                data-testid="button-next-page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom(Math.max(50, zoom - 25))}
                disabled={zoom <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm min-w-[50px] text-center">{zoom}%</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div ref={pdfContainerRef} className="flex-1 overflow-auto p-4">
            <div 
              className="mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
              style={{ 
                width: `${Math.min(800 * (zoom / 100), pdfContainerRef.current?.clientWidth || 800)}px`,
                minHeight: "1000px"
              }}
            >
              {document.fileType === "application/pdf" ? (
                <iframe
                  src={`/api/documents/${document.id}/view?page=${currentPage}#page=${currentPage}`}
                  className="w-full h-full min-h-[1000px]"
                  title="PDF Viewer"
                />
              ) : (
                <div className="p-8">
                  <div className="prose prose-sm max-w-none">
                    {document.pages?.find(p => p.pageNumber === currentPage)?.pageText || (
                      <p className="text-muted-foreground">
                        Preview not available for this file type. 
                        Please download the file to view its contents.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-[380px] border-l flex flex-col bg-background">
          <Tabs value={aiTab} onValueChange={setAiTab} className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-3 m-3 mr-3">
              <TabsTrigger value="summary" className="text-xs" data-testid="tab-summary">
                <Sparkles className="h-3 w-3 mr-1" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="ask" className="text-xs" data-testid="tab-ask-doc">
                <MessageSquare className="h-3 w-3 mr-1" />
                Ask AI
              </TabsTrigger>
              <TabsTrigger value="page" className="text-xs" data-testid="tab-page">
                <Lightbulb className="h-3 w-3 mr-1" />
                Page
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="flex-1 overflow-hidden m-0 p-4">
              <ScrollArea className="h-full">
                {document.aiSummary ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Executive Summary
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap" data-testid="text-summary">
                        {document.aiSummary}
                      </p>
                    </div>

                    {document.keyTopics && document.keyTopics.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium mb-2">Key Themes</h4>
                          <div className="flex flex-wrap gap-2">
                            {document.keyTopics.map((topic, i) => (
                              <Badge key={i} variant="secondary">{topic}</Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {document.sentiment && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium mb-2">Sentiment</h4>
                          <Badge variant="outline">{document.sentiment}</Badge>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="text-sm font-medium mb-2">No Summary Yet</h4>
                    <p className="text-xs text-muted-foreground mb-4">
                      Generate an AI summary to see key insights from this document
                    </p>
                    <Button
                      onClick={() => summaryMutation.mutate()}
                      disabled={summaryMutation.isPending || document.processingStatus !== "completed"}
                      data-testid="button-generate-summary"
                    >
                      {summaryMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Summary
                        </>
                      )}
                    </Button>
                    {document.processingStatus !== "completed" && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Document must be fully processed first
                      </p>
                    )}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="ask" className="flex-1 overflow-hidden m-0 flex flex-col">
              <div className="p-4 flex-1 overflow-auto">
                {documentAnswer && (
                  <div className="space-y-4 mb-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm whitespace-pre-wrap" data-testid="text-doc-answer">
                        {documentAnswer.answer}
                      </p>
                    </div>
                    {documentAnswer.citations.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-xs font-medium text-muted-foreground">References:</h5>
                        {documentAnswer.citations.map((citation, i) => (
                          <div
                            key={i}
                            className="p-2 rounded border text-xs cursor-pointer hover-elevate"
                            onClick={() => goToPage(citation.pageNumber)}
                            data-testid={`citation-page-${citation.pageNumber}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="h-3 w-3" />
                              <span className="font-medium">Page {citation.pageNumber}</span>
                            </div>
                            <p className="text-muted-foreground line-clamp-2 italic">
                              "{citation.excerpt}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <form onSubmit={handleAskDocument} className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask about this document..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={2}
                    className="resize-none text-sm"
                    data-testid="input-doc-question"
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={documentQAMutation.isPending}
                    data-testid="button-ask-doc"
                  >
                    {documentQAMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="page" className="flex-1 overflow-hidden m-0 p-4">
              <ScrollArea className="h-full">
                {pageInsightMutation.isPending ? (
                  <LoadingSpinner text="Analyzing page..." size="sm" />
                ) : pageInsight ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Page {currentPage} Summary</h4>
                      <p className="text-sm text-muted-foreground">
                        {pageInsight.summary}
                      </p>
                    </div>
                    {pageInsight.keyPoints.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium mb-2">Key Points</h4>
                          <ul className="space-y-2">
                            {pageInsight.keyPoints.map((point, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                <span className="text-primary">-</span>
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Switch to this tab to see AI insights about the current page
                    </p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function ViewerSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 p-4 border-b">
        <Skeleton className="h-8 w-8" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="flex flex-1">
        <div className="flex-1 p-4">
          <Skeleton className="w-full h-[800px] rounded-lg" />
        </div>
        <div className="w-[380px] border-l p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}
