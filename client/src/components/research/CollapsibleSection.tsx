import { PropsWithChildren } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps extends PropsWithChildren {
  title: string;
  defaultOpen?: boolean;
  description?: string;
}

export function CollapsibleSection({ title, defaultOpen = false, description, children }: CollapsibleSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="border rounded-lg">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between text-left px-4 py-3 font-semibold">
          <span>
            {title}
            {description && <span className="block text-sm font-normal text-muted-foreground">{description}</span>}
          </span>
          <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4 pt-0 space-y-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
