import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Industry } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

type IndustryWithCount = Industry & { companyCount: number };

export default function IndustriesPage() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery<IndustryWithCount[]>({
    queryKey: ["/api/industries"],
  });

  const createIndustry = useMutation({
    mutationFn: async () => {
      setError(null);
      await apiRequest("POST", "/api/industries", { name });
    },
    onSuccess: () => {
      setName("");
      refetch();
    },
    onError: (err: any) => {
      setError(err?.message || "Failed to create industry");
    },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Industries</h1>
          <p className="text-sm text-muted-foreground">Manage industries and see company counts</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create industry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Industry name"
            />
            <Button onClick={() => createIndustry.mutate()} disabled={!name.trim() || createIndustry.isPending}>
              {createIndustry.isPending ? "Saving..." : "Create"}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All industries</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : data && data.length > 0 ? (
            <div className="divide-y">
              {data.map((industry) => (
                <div key={industry.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-1">
                    <Link href={`/industries/${industry.id}`}>
                      <span className="font-medium hover:underline">{industry.name}</span>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(industry.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="secondary">{industry.companyCount} companies</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No industries yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
