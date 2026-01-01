import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Company } from "@/types/research";

interface ScreenerViewProps {
  companies: Company[];
}

export function ScreenerView({ companies }: ScreenerViewProps) {
  const [minGrowth, setMinGrowth] = useState<string>("");
  const [minMargin, setMinMargin] = useState<string>("");
  const [maxPe, setMaxPe] = useState<string>("");

  const filtered = useMemo(() => {
    return companies.filter((co) => {
      const peValue = Number(co.pe?.replace(/[^\d.]/g, "")) || 0;
      const growthPass = minGrowth ? Number(minGrowth) <= 25 : true;
      const marginPass = minMargin ? Number(minMargin) <= 30 : true;
      const pePass = maxPe ? peValue <= Number(maxPe) : true;
      return growthPass && marginPass && pePass;
    });
  }, [companies, maxPe, minGrowth, minMargin]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Stock Screener</h1>
          <p className="text-muted-foreground text-sm">Quick filters with a lightweight result table.</p>
        </div>
        <Button>Run Screen</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Revenue Growth &gt;</p>
              <Input value={minGrowth} onChange={(e) => setMinGrowth(e.target.value)} placeholder="15" type="number" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">EBITDA Margin &gt;</p>
              <Input value={minMargin} onChange={(e) => setMinMargin(e.target.value)} placeholder="20" type="number" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">P/E Ratio &lt;</p>
              <Input value={maxPe} onChange={(e) => setMaxPe(e.target.value)} placeholder="25" type="number" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Results</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-2">Company</th>
                  <th className="px-4 py-2">Industry</th>
                  <th className="px-4 py-2 text-right">Rev Growth</th>
                  <th className="px-4 py-2 text-right">Margin</th>
                  <th className="px-4 py-2 text-right">P/E</th>
                  <th className="px-4 py-2 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((co) => (
                  <tr key={co.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-semibold">{co.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{co.industryId}</td>
                    <td className="px-4 py-3 text-right text-green-600">18%</td>
                    <td className="px-4 py-3 text-right">22.5%</td>
                    <td className="px-4 py-3 text-right">{co.pe || "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant="secondary">8.5/10</Badge>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="px-4 py-3 text-muted-foreground" colSpan={6}>
                      No companies match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
