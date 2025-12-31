import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";

interface SearchResult {
  companies: Array<{ id: number; name: string; ticker?: string | null; industryName?: string | null }>;
  industries: Array<{ id: number; name: string }>;
  research: Array<{ id: number; title: string; section: string; entityType: string; entityId: number; createdAt: string }>;
  documents: Array<{ id: number; title: string; fileType: string; uploadDate: string }>;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!query.trim()) {
        setResults(null);
        return;
      }
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        setResults(await res.json());
        setOpen(true);
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  const hasResults = useMemo(
    () =>
      !!results &&
      (results.companies.length || results.industries.length || results.research.length || results.documents.length),
    [results]
  );

  const showEmptyState = open && query.trim() && results && !hasResults;

  return (
    <div className="relative w-full max-w-xl" ref={containerRef}>
      <Input
        placeholder="Search companies, industries, research, documents"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results && setOpen(true)}
      />
      {open && hasResults && results ? (
        <Card className="absolute z-50 mt-1 w-full shadow-lg p-3 space-y-3">
          {results.companies.length > 0 && (
            <div>
              <p className="text-xs uppercase text-muted-foreground mb-1">Companies</p>
              <div className="space-y-1">
                {results.companies.map((c) => (
                  <Link key={c.id} href={`/companies/${c.id}`}>
                    <div className="p-2 rounded hover:bg-muted cursor-pointer" onClick={() => setOpen(false)}>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.ticker || ""} {c.industryName ? `• ${c.industryName}` : ""}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {results.industries.length > 0 && (
            <div>
              <p className="text-xs uppercase text-muted-foreground mb-1">Industries</p>
              <div className="space-y-1">
                {results.industries.map((i) => (
                  <Link key={i.id} href={`/industries/${i.id}`}>
                    <div className="p-2 rounded hover:bg-muted cursor-pointer" onClick={() => setOpen(false)}>
                      {i.name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {results.research.length > 0 && (
            <div>
              <p className="text-xs uppercase text-muted-foreground mb-1">Research</p>
              <div className="space-y-1">
                {results.research.map((r) => (
                  <Link
                    key={r.id}
                    href={`/${r.entityType === "company" ? "companies" : "industries"}/${r.entityId}`}
                  >
                    <div className="p-2 rounded hover:bg-muted cursor-pointer" onClick={() => setOpen(false)}>
                      <div className="font-medium">{r.title}</div>
                      <div className="text-xs text-muted-foreground">{r.section}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {results.documents.length > 0 && (
            <div>
              <p className="text-xs uppercase text-muted-foreground mb-1">Documents</p>
              <div className="space-y-1">
                {results.documents.map((d) => (
                  <Link key={d.id} href={`/documents/${d.id}`}>
                    <div className="p-2 rounded hover:bg-muted cursor-pointer" onClick={() => setOpen(false)}>
                      <div className="font-medium">{d.title}</div>
                      <div className="text-xs text-muted-foreground">{d.fileType}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Card>
      ) : null}
      {showEmptyState ? (
        <Card className="absolute z-50 mt-1 w-full shadow-lg p-3 text-sm text-muted-foreground">
          No results
        </Card>
      ) : null}
    </div>
  );
}
