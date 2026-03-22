import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import Loader from "@/components/Loader";
import WaveBackground from "@/components/WaveBackground";
import { uploadPDF, deleteSession } from "@/services/api";
import { toast } from "@/hooks/use-toast";

const MAX_SIZE = 20 * 1024 * 1024;

const UploadPage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      toast({ title: "File too large", description: "Max file size is 20MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);

    try {
      const oldSessionId = localStorage.getItem("session_id");
      if (oldSessionId) {
        try { await deleteSession(oldSessionId); } catch { /* ignore */ }
      }

      const data = await uploadPDF(file);
      localStorage.setItem("session_id", data.session_id);
      navigate("/chat");
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden p-4 bg-background">
      <WaveBackground />

      <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up">
        <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl">
          QnA Doc{" "}
          <span className="bg-gradient-to-r from-[#22d3ee] via-[#3b82f6] to-[#6366f1] bg-clip-text text-transparent">
            AI
          </span>
        </h1>
        <p className="mb-10 max-w-lg text-lg text-muted-foreground">
          Upload a PDF and ask questions about it
        </p>

        {isUploading ? (
          <Loader message="Processing document… please wait" />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              size="lg"
              className="btn-glow gap-2 rounded-xl px-10 py-6 text-base font-semibold text-primary-foreground"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-5 w-5" />
              Upload PDF
            </Button>
            <p className="text-xs text-muted-foreground">Max file size 20MB</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
