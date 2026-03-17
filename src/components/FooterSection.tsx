import { Activity } from "lucide-react";

const FooterSection = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="font-bold gradient-text">ServeSmart</span>
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Queue Optimization and Capacity Planning System — A Product Development and Management course project
            using queue theory and operations research.
          </p>
          <p className="text-xs text-muted-foreground">© 2026 ServeSmart. University Project.</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
