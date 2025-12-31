import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, FileText, Search, Clock, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import type { Document } from "@shared/schema";

interface DashboardStats {
  totalDocuments: number;
  processingDocuments: number;
  completedDocuments: number;
  failedDocuments: number;
  recentDocuments: Document[];
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const totalDocs = stats?.totalDocuments || 0;
  const completed = stats?.completedDocuments || 0;
  const processing = stats?.processingDocuments || 0;
  const failed = stats?.failedDocuments || 0;
  const successRate = totalDocs > 0 ? Math.round((completed / totalDocs) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Research Vault</h1>
          <p className="text-sm text-muted-foreground">
            Your AI-powered document intelligence platform
          </p>
        </div>
        <Link href="/upload">
          <Button data-testid="button-dashboard-upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-documents">
              {totalDocs}
            </div>
            <p className="text-xs text-muted-foreground">
              In your research vault
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-processing-documents">
              {processing}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently being analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-completed-documents">
              {completed}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for search and Q&A
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-failed-documents">
              {failed}
            </div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Processing Status</CardTitle>
            <CardDescription>Overall document processing health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Success Rate</span>
                <span className="font-medium">{successRate}%</span>
              </div>
              <Progress value={successRate} className="h-2" />
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground">Pending</div>
                <div className="text-lg font-semibold">{totalDocs - completed - processing - failed}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground">Active</div>
                <div className="text-lg font-semibold">{processing}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-muted-foreground">Done</div>
                <div className="text-lg font-semibold">{completed}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/upload" className="block">
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover-elevate cursor-pointer">
                <div className="flex items-center gap-3">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Upload Documents</div>
                    <div className="text-xs text-muted-foreground">Add new research materials</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/search" className="block">
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover-elevate cursor-pointer">
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Search & Ask AI</div>
                    <div className="text-xs text-muted-foreground">Query your documents</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/documents" className="block">
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50 hover-elevate cursor-pointer">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Browse Library</div>
                    <div className="text-xs text-muted-foreground">View all documents</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {stats?.recentDocuments && stats.recentDocuments.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Documents</CardTitle>
              <CardDescription>Latest additions to your vault</CardDescription>
            </div>
            <Link href="/documents">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentDocuments.slice(0, 5).map((doc) => (
                <Link href={`/documents/${doc.id}`} key={doc.id}>
                  <div className="flex items-center justify-between p-3 rounded-md hover-elevate cursor-pointer border">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate" data-testid={`text-doc-title-${doc.id}`}>
                          {doc.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant={doc.processingStatus === "completed" ? "default" : "secondary"} className="flex-shrink-0 ml-2">
                      {doc.processingStatus}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
