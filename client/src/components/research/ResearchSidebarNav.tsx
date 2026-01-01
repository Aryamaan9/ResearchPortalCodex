import { Link, useLocation } from "wouter";
import { Building2, FileText, Home, Layers, ListChecks, Rocket, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/research" },
  { label: "Documents", href: "/research/documents" },
  { label: "Industries", href: "/research/industries" },
  { label: "Companies", href: "/research/companies" },
  { label: "Pipeline", href: "/research/pipeline" },
  { label: "Screener", href: "/research/screener" },
  { label: "Tasks", href: "/research/tasks" },
];

const icons = [Home, FileText, Layers, Building2, Rocket, ScrollText, ListChecks];

export function ResearchSidebarNav() {
  const [location] = useLocation();

  return (
    <aside className="border-r bg-muted/40 w-64 shrink-0 hidden lg:block">
      <div className="p-4 space-y-6">
        <div>
          <p className="text-xs uppercase text-muted-foreground">MoneyStories</p>
          <h2 className="text-lg font-semibold">Research Platform</h2>
        </div>
        <nav className="space-y-1">
          {navItems.map((item, index) => {
            const Icon = icons[index];
            const active = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    active ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
