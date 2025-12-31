import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Company, Industry } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

type CompanyListItem = Company & { industryName: string | null };

export default function CompaniesPage() {
  const searchQuery = useSearch();
  const searchParams = useMemo(() => new URLSearchParams(searchQuery), [searchQuery]);
  const initialIndustry = searchParams.get("industryId") || "";

  const [industryFilter, setIndustryFilter] = useState(initialIndustry);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    ticker: "",
    industryId: initialIndustry,
    description: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: industries } = useQuery<Industry[]>({
    queryKey: ["/api/industries"],
  });

  const { data: companies, isLoading, refetch } = useQuery<CompanyListItem[]>({
    queryKey: ["/api/companies", industryFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (industryFilter && industryFilter !== "all") params.set("industryId", industryFilter);
      if (search) params.set("q", search);
      const res = await fetch(`/api/companies${params.toString() ? `?${params.toString()}` : ""}`);
      if (!res.ok) throw new Error("Failed to fetch companies");
      return res.json();
    },
  });

  const createCompany = useMutation({
    mutationFn: async () => {
      setFormError(null);
      await apiRequest("POST", "/api/companies", {
        name: form.name,
        ticker: form.ticker || undefined,
        industryId: form.industryId,
        description: form.description || undefined,
      });
    },
    onSuccess: () => {
      setForm({ name: "", ticker: "", industryId: industryFilter, description: "" });
      refetch();
    },
    onError: (err: any) => setFormError(err?.message || "Failed to create company"),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Companies</h1>
          <p className="text-sm text-muted-foreground">Browse, filter, and create companies</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Industry</p>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All industries</SelectItem>
                {industries?.map((industry) => (
                  <SelectItem key={industry.id} value={industry.id.toString()}>
                    {industry.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <p className="text-xs text-muted-foreground mb-1">Search</p>
            <Input
              placeholder="Search by name or ticker"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create company</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              placeholder="Ticker (optional)"
              value={form.ticker}
              onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value }))}
            />
            <Select
              value={form.industryId}
              onValueChange={(value) => setForm((f) => ({ ...f, industryId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {industries?.map((industry) => (
                  <SelectItem key={industry.id} value={industry.id.toString()}>
                    {industry.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="md:col-span-2"
            />
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <Button
            onClick={() => createCompany.mutate()}
            disabled={!form.name.trim() || !form.industryId || createCompany.isPending}
          >
            {createCompany.isPending ? "Saving..." : "Create company"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading companies...</p>
          ) : companies && companies.length > 0 ? (
            <div className="divide-y">
              {companies.map((company) => (
                <div key={company.id} className="py-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <Link href={`/companies/${company.id}`}>
                        <span className="font-medium hover:underline">{company.name}</span>
                      </Link>
                      {company.ticker && (
                        <p className="text-sm text-muted-foreground">{company.ticker}</p>
                      )}
                      {company.industryName && (
                        <p className="text-xs text-muted-foreground">{company.industryName}</p>
                      )}
                      {company.description && (
                        <p className="text-sm text-muted-foreground mt-1">{company.description}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(company.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No companies found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
