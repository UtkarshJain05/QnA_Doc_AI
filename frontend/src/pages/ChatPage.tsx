import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatBubble from "@/components/ChatBubble";
import TypingIndicator from "@/components/TypingIndicator";
import HeaderBar from "@/components/HeaderBar";
import WaveBackground from "@/components/WaveBackground";
import { askQuestion, deleteSession } from "@/services/api";

interface Message {
  text: string;
  isUser: boolean;
}

const WELCOME_MESSAGE =
  "👋 Hello! I am QnA Bot.\nUpload a document and ask questions about it.\nI will answer based only on the information inside your PDF.";

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    { text: WELCOME_MESSAGE, isUser: false },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sessionId = localStorage.getItem("session_id");

  useEffect(() => {
    if (!sessionId) navigate("/");
  }, [sessionId, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = useCallback(async () => {
    const question = input.trim();
    if (!question || !sessionId || isLoading) return;

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setMessages((prev) => [...prev, { text: question, isUser: true }]);
    setIsLoading(true);

    try {
      const data = await askQuestion(question, sessionId);
      setMessages((prev) => [...prev, { text: data.answer, isUser: false }]);
    } catch {
      setMessages((prev) => [...prev, { text: "Sorry, something went wrong.", isUser: false }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, sessionId, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
  };

  const handleNewPdf = async () => {
    if (sessionId) {
      try { await deleteSession(sessionId); } catch { /* ignore */ }
      localStorage.removeItem("session_id");
    }
    navigate("/");
  };

  const handleEndSession = async () => {
    if (sessionId) {
      try { await deleteSession(sessionId); } catch { /* ignore */ }
      localStorage.removeItem("session_id");
    }
    navigate("/");
  };

  return (
    // FIX 1: Changed h-screen to h-[100dvh] and added overflow-hidden to lock the background
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden">
      <WaveBackground />
      <HeaderBar onNewPdf={handleNewPdf} onEndSession={handleEndSession} />

      <ScrollArea className="flex-1 px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.map((msg, i) => (
            <ChatBubble key={i} message={msg.text} isUser={msg.isUser} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="glass-card rounded-none border-x-0 border-b-0 p-4">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about the document..."
            rows={1}
            // FIX 2: Changed text-sm to text-base (16px) to prevent iOS automatic zooming
            className="flex-1 resize-none rounded-xl border border-border bg-secondary px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            style={{ maxHeight: 150 }}
          />
          <Button
            type="button"
            size="icon"
            disabled={isLoading || !input.trim()}
            onClick={handleSend}
            className="btn-glow h-10 w-10 shrink-0 rounded-xl text-primary-foreground"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;