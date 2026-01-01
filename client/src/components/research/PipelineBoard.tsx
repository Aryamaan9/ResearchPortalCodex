import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Company, PipelineItem } from "@/types/research";

interface PipelineBoardProps {
  items: PipelineItem[];
  companies: Company[];
}

const stageOrder = ["Sourcing", "Research", "Diligence", "Weigh", "Track", "Harvest"];

export function PipelineBoard({ items, companies }: PipelineBoardProps) {
  const grouped = useMemo(() => {
    const map: Record<string, PipelineItem[]> = {};
    stageOrder.forEach((stage) => {
      map[stage] = [];
    });
    items.forEach((item) => {
      if (!map[item.stage]) map[item.stage] = [];
      map[item.stage].push(item);
    });
    return map;
  }, [items]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">GRWTH Pipeline Tracker</h1>
          <p className="text-muted-foreground text-sm">Board view with stages and context cards.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stageOrder.map((stage) => (
          <Card key={stage} className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{stage}</span>
                <Badge variant="secondary">{grouped[stage]?.length ?? 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {grouped[stage]?.length ? (
                grouped[stage].map((item) => {
                  const company = companies.find((c) => c.id === item.companyId);
                  return (
                    <div key={item.id} className="rounded-lg border bg-muted/40 p-3 space-y-1">
                      <div className="font-semibold text-sm">{company?.name || "Unmapped company"}</div>
                      <div className="text-xs text-muted-foreground">{company?.industryId || "Unknown industry"}</div>
                      <p className="text-xs text-muted-foreground mt-1">{item.summary}</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">No items in this stage.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
