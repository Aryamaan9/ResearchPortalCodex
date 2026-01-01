import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobalSearch } from "@/components/GlobalSearch";
import Dashboard from "@/pages/Dashboard";
import Upload from "@/pages/Upload";
import Documents from "@/pages/Documents";
import DocumentViewer from "@/pages/DocumentViewer";
import Search from "@/pages/Search";
import IndustriesPage from "@/pages/Industries";
import IndustryDetailPage from "@/pages/IndustryDetail";
import CompaniesPage from "@/pages/Companies";
import CompanyProfilePage from "@/pages/CompanyProfile";
import NotFound from "@/pages/not-found";
import ResearchPlatformPage from "@/pages/ResearchPlatform";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/upload" component={Upload} />
      <Route path="/documents" component={Documents} />
      <Route path="/documents/:id" component={DocumentViewer} />
      <Route path="/research/:rest*" component={ResearchPlatformPage} />
      <Route path="/research" component={ResearchPlatformPage} />
      <Route path="/industries/:id" component={IndustryDetailPage} />
      <Route path="/industries" component={IndustriesPage} />
      <Route path="/companies/:id" component={CompanyProfilePage} />
      <Route path="/companies" component={CompaniesPage} />
      <Route path="/search" component={Search} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between gap-4 p-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <GlobalSearch />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
