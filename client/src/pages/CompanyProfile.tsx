import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import type { Company, Document, Industry } from "@shared/schema";

type LinkedDocument = {
  id: number;
  title: string;
  fileType: string | null;
  createdAt: string;
  linkedAt?: string;
};

type CompanyResponse = {
  company: Company;
  industry: Industry | null;
  documents: LinkedDocument[];
};

export default function CompanyProfilePage() {
  const params = useParams<{ id: string }>();
  const [selectedDocument, setSelectedDocument] = useState<string>("");

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

  const linkDocument = useMutation({
    mutationFn: async () => {
      if (!params.id || !selectedDocument) return;
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

      <Card>
        <CardHeader>
          <CardTitle>Company details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{data.company.name}</span>
            {data.company.ticker && <Badge variant="secondary">{data.company.ticker}</Badge>}
          </div>
          {data.industry && (
            <p className="text-sm text-muted-foreground">Industry: {data.industry.name}</p>
          )}
          {data.company.description && (
            <p className="text-sm text-muted-foreground">{data.company.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Created {new Date(data.company.createdAt).toLocaleString()}
          </p>
        </CardContent>
      </Card>

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
                {documentOptions.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id.toString()}>
                    {doc.title}
                  </SelectItem>
                ))}
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
    </div>
  );
}
