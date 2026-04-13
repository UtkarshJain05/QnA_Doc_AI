import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Square } from "lucide-react";
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
  "👋 Hello! I am QnA Bot.\nYour document is successfully processed and ready.\nWhat would you like to ask about it?";

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    { text: WELCOME_MESSAGE, isUser: false },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sessionId = localStorage.getItem("session_id");

  useEffect(() => {
    if (!sessionId) navigate("/");
  }, [sessionId, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages, isLoading]);

  const handleStop = useCallback(() => {
    // If there is an active network request, kill it
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Instantly unlock the input box
    setIsLoading(false);
  }, []);
  
  const handleSend = useCallback(async () => {
    const question = input.trim();
    if (!question || !sessionId || isLoading) return;

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    
    setMessages((prev) => [
      ...prev, 
      { text: question, isUser: true }, 
      { text: "", isUser: false }
    ]);
    
    setIsLoading(true); 

    // Create the controller and store it globally in the ref
    abortControllerRef.current = new AbortController();

    try {
      const backendUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
      const response = await fetch(`${backendUrl}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question, session_id: sessionId }),
        signal: abortControllerRef.current.signal, // Bind the kill switch here
      });

      if (!response.body) throw new Error("No readable stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const charsPerFrame = 15; 
        
        for (let i = 0; i < chunk.length; i += charsPerFrame) {
          const miniChunk = chunk.slice(i, i + charsPerFrame);
          
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            newMessages[lastIndex] = {
              ...newMessages[lastIndex],
              text: newMessages[lastIndex].text + miniChunk,
            };
            return newMessages;
          });
          
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
    } catch (error: any) {
      // If the user clicked the stop button, we gracefully do nothing (just leave the text as is)
      if (error.name !== 'AbortError') {
        console.error("Streaming error:", error);
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text += "\n\n⚠️ Connection interrupted.";
          return newMessages;
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
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
    <div className="fixed inset-0 flex flex-col w-full overflow-hidden bg-background">
      <WaveBackground />
      <HeaderBar onNewPdf={handleNewPdf} onEndSession={handleEndSession} />

      <ScrollArea className="flex-1 px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 pb-32">
          {messages.map((msg, i) => {
            // HIDE THE EMPTY BUBBLE: If it's the bot and there is no text yet, render nothing.
            if (!msg.isUser && msg.text === "") return null;
            
            return <ChatBubble key={i} message={msg.text} isUser={msg.isUser} />;
          })}
          
          {/* Only show dots if it's loading AND the bot hasn't typed its first letter yet */}
          {isLoading && messages[messages.length - 1]?.text === "" && <TypingIndicator />}
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
            // If it's NOT loading, disable it if the input is empty.
            // If it IS loading, keep it enabled so the user can click Stop.
            disabled={!isLoading && !input.trim()} 
            onClick={isLoading ? handleStop : handleSend}
            className="btn-glow h-10 w-10 shrink-0 rounded-xl text-primary-foreground flex items-center justify-center"
          >
            {isLoading ? (
              <Square className="h-4 w-4 fill-current" /> // The Stop Icon
            ) : (
              <Send className="h-4 w-4" /> // The Send Icon
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;