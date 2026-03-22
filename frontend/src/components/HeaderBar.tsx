import { Upload, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderBarProps {
  onNewPdf: () => void;
  onEndSession: () => void;
}

const HeaderBar = ({ onNewPdf, onEndSession }: HeaderBarProps) => {
  return (
    <header className="glass-card flex items-center justify-between rounded-none border-x-0 border-t-0 px-4 py-3 sm:px-5">
      <h1 className="text-lg font-bold tracking-tight text-foreground truncate mr-2">
        QnA Doc AI
      </h1>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          className="btn-glow gap-1.5 rounded-lg px-3 sm:px-4 text-primary-foreground"
          onClick={onNewPdf}
        >
          <Upload className="h-4 w-4 shrink-0" />
          {/* Text is hidden on mobile, visible on small screens and up */}
          <span className="hidden sm:inline">New PDF</span>
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="gap-1.5 rounded-lg px-3 sm:px-4"
          onClick={onEndSession}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">End Session</span>
        </Button>
      </div>
    </header>
  );
};

export default HeaderBar;