import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Company, Industry } from "@/types/research";
import { Link } from "wouter";

interface CompaniesListProps {
  companies: Company[];
  industries: Industry[];
}

export function CompaniesList({ companies, industries }: CompaniesListProps) {
  const [industryId, setIndustryId] = useState<string>("");

  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => (industryId ? company.industryId === industryId : true));
  }, [companies, industryId]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Companies</h1>
          <p className="text-muted-foreground">Filter by industry and open company dossiers.</p>
        </div>
        <div className="w-48">
          <Select value={industryId} onValueChange={setIndustryId}>
            <SelectTrigger>
              <SelectValue placeholder="All industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              {industries.map((industry) => (
                <SelectItem key={industry.id} value={industry.id}>{industry.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coverage</CardTitle>
          <CardDescription>Pipeline stage, valuation, and quick metrics.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>MCAP</TableHead>
                  <TableHead>PE</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => {
                  const industry = industries.find((i) => i.id === company.industryId);
                  return (
                    <TableRow key={company.id}>
                      <TableCell className="font-semibold">{company.name}</TableCell>
                      <TableCell>{industry?.name}</TableCell>
                      <TableCell><Badge variant="secondary">{company.stage}</Badge></TableCell>
                      <TableCell>{company.mcap}</TableCell>
                      <TableCell>{company.pe}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/research/companies/${company.id}`}>
                          <Badge variant="outline" className="cursor-pointer">Open</Badge>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
