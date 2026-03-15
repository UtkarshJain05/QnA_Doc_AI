import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  message: string;
  isUser: boolean;
}

const ChatBubble = ({ message, isUser }: ChatBubbleProps) => {
  return (
    <div className={cn("flex w-full animate-fade-in-up", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap transition-all duration-200",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md shadow-lg shadow-primary/20"
            : "bg-secondary text-foreground rounded-bl-md"
        )}
      >
        {message}
      </div>
    </div>
  );
};

export default ChatBubble;
