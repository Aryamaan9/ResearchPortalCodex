import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Company, Industry } from "@shared/schema";

type IndustryWithCompanies = Industry & { 
  companies: Company[];
  totalRevenue?: number;
};

export default function IndustryDetailPage() {
  const params = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery<IndustryWithCompanies>({
    queryKey: ["/api/industries", params.id],
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Industry</h1>
          <p className="text-sm text-muted-foreground">Companies associated with this industry</p>
        </div>
        {params.id && (
          <Link href={`/companies?industryId=${params.id}`}>
            <span className="text-sm text-primary hover:underline">Create company in this industry</span>
          </Link>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : error || !data ? (
        <p className="text-sm text-destructive">Unable to load industry.</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{data.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Created {new Date(data.createdAt).toLocaleString()}
              </p>
              {data.totalRevenue !== undefined && (
                <p className="text-lg font-semibold">
                  Total Industry Revenue: ${data.totalRevenue.toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Companies</CardTitle>
            </CardHeader>
            <CardContent>
              {data.companies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No companies yet.</p>
              ) : (
                <div className="divide-y">
                  {data.companies.map((company) => (
                    <div key={company.id} className="py-3">
                      <Link href={`/companies/${company.id}`}>
                        <span className="font-medium hover:underline">{company.name}</span>
                      </Link>
                      {company.ticker && (
                        <p className="text-sm text-muted-foreground">Ticker: {company.ticker}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
