import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Building2, FileText, LineChart, Rocket } from "lucide-react";
import { Company, PipelineItem } from "@/types/research";

interface HomeDashboardProps {
  companies: Company[];
  pipeline: PipelineItem[];
}

export function HomeDashboard({ companies, pipeline }: HomeDashboardProps) {
  const pipelineByStage = pipeline.reduce<Record<string, PipelineItem[]>>((acc, item) => {
    acc[item.stage] = acc[item.stage] ? [...acc[item.stage], item] : [item];
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Research Platform</h1>
          <p className="text-muted-foreground">Macro dashboard plus GRWTH pipeline at a glance.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">New Note</Button>
          <Button>
            <Rocket className="h-4 w-4 mr-2" />
            Start Dossier
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LineChart className="h-4 w-4" /> Macro Pulse</CardTitle>
            <CardDescription>Rates easing, credit spreads stable, funding windows open.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Liquidity</span>
              <Badge variant="secondary">Improving</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Risk Appetite</span>
              <Badge>Constructive</Badge>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Inflation glide path</span>
                <span>68%</span>
              </div>
              <Progress value={68} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Industry Signals</CardTitle>
            <CardDescription>Watchlist triggers across focus industries.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Fintech Infra</span>
              <Badge>Stable</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>HealthTech Services</span>
              <Badge variant="secondary">Warming</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Software Infra</span>
              <Badge variant="outline">Tracking</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Library</CardTitle>
            <CardDescription>Recent uploads staged for analysis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Documents ready</span>
              <Badge variant="secondary">12</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>In processing</span>
              <Badge>4</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Q&A sessions</span>
              <Badge variant="outline">8</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-1">
          <CardTitle className="text-lg">GRWTH Pipeline</CardTitle>
          <CardDescription>Company progression with research focus.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(pipelineByStage).map(([stage, items]) => (
              <div key={stage} className="rounded-lg border bg-card p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{stage}</span>
                  <Badge variant="outline">{items.length}</Badge>
                </div>
                <div className="space-y-3">
                  {items.map((item) => {
                    const company = companies.find((c) => c.id === item.companyId);
                    return (
                      <div key={item.id} className="p-3 rounded-md bg-muted/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{company?.name}</span>
                          <Badge variant="secondary">{company?.stage || ""}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.summary}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
