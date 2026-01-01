import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Industry } from "@/types/research";
import { Link } from "wouter";
import { Building2 } from "lucide-react";

interface IndustriesListProps {
  industries: Industry[];
}

export function IndustriesList({ industries }: IndustriesListProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Industries</h1>
          <p className="text-muted-foreground">Browse focus industries and open dossiers.</p>
        </div>
        <Button variant="outline">Add Industry</Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {industries.map((industry) => (
          <Card key={industry.id} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-4 w-4" /> {industry.name}
              </CardTitle>
              <CardDescription className="flex flex-wrap gap-2">
                <Badge variant="secondary">{industry.size}</Badge>
                <Badge variant="outline">{industry.growth}</Badge>
                <Badge variant="outline">{industry.pe}</Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {industry.drivers?.map((driver) => (
                  <Badge key={driver} variant="outline">{driver}</Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {industry.themes?.map((theme) => (
                  <Badge key={theme} variant="secondary">{theme}</Badge>
                ))}
              </div>
              <Link href={`/research/industries/${industry.id}`}>
                <Button variant="ghost" className="px-0">Open dossier →</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
