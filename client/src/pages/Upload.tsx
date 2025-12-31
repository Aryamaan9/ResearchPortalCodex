import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload as UploadIcon, FileText, X, CheckCircle, AlertCircle, Loader2, File, FileSpreadsheet, Image } from "lucide-react";

interface FileUpload {
  file: File;
  id: string;
  status: "pending" | "uploading" | "processing" | "completed" | "error";
  progress: number;
  error?: string;
}

const acceptedTypes = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/csv": [".csv"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function getFileIcon(type: string) {
  if (type.includes("pdf")) return FileText;
  if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv")) return FileSpreadsheet;
  if (type.includes("image")) return Image;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function UploadPage() {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (fileUpload: FileUpload) => {
      const formData = new FormData();
      formData.append("file", fileUpload.file);
      
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(error.error || "Upload failed");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === variables.id
            ? { ...f, status: "completed", progress: 100 }
            : f
        )
      );
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error, variables) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === variables.id
            ? { ...f, status: "error", error: error.message }
            : f
        )
      );
    },
  });

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    rejectedFiles.forEach((rejection) => {
      toast({
        title: "File rejected",
        description: `${rejection.file.name}: ${rejection.errors[0]?.message || "Invalid file"}`,
        variant: "destructive",
      });
    });

    const newFiles: FileUpload[] = acceptedFiles.map((file) => ({
      file,
      id: crypto.randomUUID(),
      status: "pending",
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadAll = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    
    for (const fileUpload of pendingFiles) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileUpload.id
            ? { ...f, status: "uploading", progress: 30 }
            : f
        )
      );
      
      try {
        await uploadMutation.mutateAsync(fileUpload);
      } catch (error) {
        // Error handled in mutation onError
      }
    }

    const successCount = files.filter((f) => f.status === "completed").length + pendingFiles.length;
    if (successCount > 0) {
      toast({
        title: "Upload complete",
        description: `${successCount} document(s) uploaded successfully`,
      });
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const uploadingCount = files.filter((f) => f.status === "uploading").length;
  const completedCount = files.filter((f) => f.status === "completed").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Upload Documents</h1>
        <p className="text-sm text-muted-foreground">
          Add financial documents to your research vault for AI analysis
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Drop Zone</CardTitle>
          <CardDescription>
            Drag and drop files or click to browse. Supports PDF, DOCX, XLSX, CSV, and images (max 50MB each).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
              transition-colors duration-200
              ${isDragActive 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }
            `}
            data-testid="dropzone-upload"
          >
            <input {...getInputProps()} data-testid="input-file-upload" />
            <div className="flex flex-col items-center gap-4">
              <div className={`
                flex h-16 w-16 items-center justify-center rounded-full
                ${isDragActive ? "bg-primary/10" : "bg-muted"}
              `}>
                <UploadIcon className={`h-8 w-8 ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isDragActive ? "Drop files here" : "Drag and drop files here"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse your computer
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                <Badge variant="secondary">PDF</Badge>
                <Badge variant="secondary">DOCX</Badge>
                <Badge variant="secondary">XLSX</Badge>
                <Badge variant="secondary">CSV</Badge>
                <Badge variant="secondary">PNG/JPG</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg">Upload Queue</CardTitle>
              <CardDescription>
                {pendingCount} pending, {uploadingCount} uploading, {completedCount} completed
                {errorCount > 0 && `, ${errorCount} failed`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {completedCount > 0 && (
                <Button variant="outline" onClick={() => navigate("/documents")} data-testid="button-view-documents">
                  View Documents
                </Button>
              )}
              {pendingCount > 0 && (
                <Button 
                  onClick={uploadAll} 
                  disabled={uploadMutation.isPending}
                  data-testid="button-upload-all"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="h-4 w-4 mr-2" />
                      Upload All ({pendingCount})
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {files.map((fileUpload) => {
                  const Icon = getFileIcon(fileUpload.file.type);
                  return (
                    <div
                      key={fileUpload.id}
                      className="flex items-center gap-4 p-4 rounded-lg border"
                      data-testid={`upload-item-${fileUpload.id}`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {fileUpload.file.name}
                          </p>
                          {fileUpload.status === "completed" && (
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          )}
                          {fileUpload.status === "error" && (
                            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(fileUpload.file.size)}
                          {fileUpload.error && (
                            <span className="text-destructive ml-2">{fileUpload.error}</span>
                          )}
                        </p>
                        {(fileUpload.status === "uploading" || fileUpload.status === "processing") && (
                          <Progress value={fileUpload.progress} className="h-1 mt-2" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {fileUpload.status === "uploading" && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {(fileUpload.status === "pending" || fileUpload.status === "error") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(fileUpload.id)}
                            data-testid={`button-remove-file-${fileUpload.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
