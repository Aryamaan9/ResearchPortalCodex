import type React from "react";
import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DocumentRecord } from "@/types/research";
import { Paperclip, Send, Upload, Wand2 } from "lucide-react";

interface DocumentsModuleProps {
  documents: DocumentRecord[];
  onUpload: (file: File) => void;
  onSelect: (doc: DocumentRecord) => void;
  selected?: DocumentRecord;
}

export function DocumentsModule({ documents, onUpload, onSelect, selected }: DocumentsModuleProps) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string | undefined>();
  const [industry, setIndustry] = useState<string | undefined>();
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<string[]>([]);

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = search
        ? doc.filename.toLowerCase().includes(search.toLowerCase()) || doc.summary?.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesType = type ? doc.type === type : true;
      const matchesIndustry = industry ? doc.industryId === industry : true;
      return matchesSearch && matchesType && matchesIndustry;
    });
  }, [documents, search, type, industry]);

  const industryOptions = useMemo(() => {
    const ids = new Set<string>();
    documents.forEach((doc) => {
      if (doc.industryId) ids.add(doc.industryId);
    });
    return Array.from(ids);
  }, [documents]);

  const typeOptions = useMemo(() => {
    const ids = new Set<string>();
    documents.forEach((doc) => {
      if (doc.type) ids.add(doc.type);
    });
    return Array.from(ids);
  }, [documents]);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    files.forEach((file) => onUpload(file));
  };

  const handleAsk = () => {
    if (!selected || !chatInput.trim()) return;
    setChatHistory((prev) => [...prev, `Q: ${chatInput}`, "A: Mocked response summarizing document context."]);
    setChatInput("");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Documents</h1>
          <p className="text-muted-foreground">Upload, filter, and ask questions against the library.</p>
        </div>
        <Label className="cursor-pointer">
          <input type="file" className="hidden" multiple onChange={handleUpload} />
          <Button variant="secondary">
            <Upload className="h-4 w-4 mr-2" /> Upload
          </Button>
        </Label>
      </div>

      <div className="grid md:grid-cols-[2fr,1fr] gap-4">
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle>Library</CardTitle>
              <CardDescription>Filter by type or search titles and summaries.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="w-48">
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select value={type} onValueChange={(val) => setType(val || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    {typeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Label className="text-xs text-muted-foreground">Industry</Label>
                <Select value={industry} onValueChange={(val) => setIndustry(val || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All</SelectItem>
                    {industryOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-60">
                <Label className="text-xs text-muted-foreground">Search</Label>
                <Input
                  placeholder="Find documents"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    onSelect(doc);
                    setChatHistory([]);
                  }}
                  className="border rounded-md p-3 cursor-pointer hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{doc.filename}</p>
                      <p className="text-xs text-muted-foreground">Uploaded {doc.uploadedAt}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge variant="secondary" className="capitalize">{doc.type.replace("_", " ")}</Badge>
                      {doc.industryId && <Badge variant="outline">{doc.industryId}</Badge>}
                      {doc.companyId && <Badge variant="outline">{doc.companyId}</Badge>}
                    </div>
                  </div>
                  {doc.summary && <p className="text-sm text-muted-foreground mt-2">{doc.summary}</p>}
                  {doc.tags && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {doc.tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Ask AI</CardTitle>
            <CardDescription>Selected document: {selected ? selected.filename : "None"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Ask a question about this document"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <div className="flex gap-2">
              <Button onClick={handleAsk} disabled={!selected}>
                <Send className="h-4 w-4 mr-2" /> Ask
              </Button>
              <Button variant="outline" disabled={!selected}>
                <Wand2 className="h-4 w-4 mr-2" /> Analyze
              </Button>
            </div>
            <ScrollArea className="h-64 rounded-md border p-3">
              {chatHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">Select a document to start a Q&A session.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {chatHistory.map((entry, idx) => (
                    <p key={idx} className={idx % 2 === 0 ? "font-medium" : "text-muted-foreground"}>{entry}</p>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="border rounded-md p-3 text-sm bg-muted/40">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">Sources ready</span>
              </div>
              <p className="text-muted-foreground text-xs mt-1">Responses will cite document sections when backend is connected.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
