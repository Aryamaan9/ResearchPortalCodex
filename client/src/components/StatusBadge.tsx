import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import type { ProcessingStatus } from "@shared/schema";

interface StatusBadgeProps {
  status: ProcessingStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config: Record<string, { icon: typeof CheckCircle; label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending: {
      icon: Clock,
      label: "Pending",
      variant: "secondary",
    },
    processing: {
      icon: Loader2,
      label: "Processing",
      variant: "outline",
    },
    completed: {
      icon: CheckCircle,
      label: "Completed",
      variant: "default",
    },
    failed: {
      icon: AlertCircle,
      label: "Failed",
      variant: "destructive",
    },
  };

  const { icon: Icon, label, variant } = config[status] || config.pending;
  const isProcessing = status === "processing";

  return (
    <Badge variant={variant} className={className}>
      <Icon className={`h-3 w-3 mr-1 ${isProcessing ? "animate-spin" : ""}`} />
      {label}
    </Badge>
  );
}
