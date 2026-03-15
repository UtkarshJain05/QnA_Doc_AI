import { Upload, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderBarProps {
  onNewPdf: () => void;
  onEndSession: () => void;
}

const HeaderBar = ({ onNewPdf, onEndSession }: HeaderBarProps) => {
  return (
    <header className="glass-card flex items-center justify-between rounded-none border-x-0 border-t-0 px-5 py-3">
      <h1 className="text-lg font-bold tracking-tight text-foreground">
        QnA Doc AI
      </h1>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="btn-glow gap-1.5 rounded-lg px-4 text-primary-foreground"
          onClick={onNewPdf}
        >
          <Upload className="h-4 w-4" />
          New PDF
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="gap-1.5 rounded-lg px-4"
          onClick={onEndSession}
        >
          <LogOut className="h-4 w-4" />
          End Session
        </Button>
      </div>
    </header>
  );
};

export default HeaderBar;
