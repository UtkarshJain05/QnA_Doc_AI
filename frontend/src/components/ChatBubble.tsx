import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

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
        <ReactMarkdown
          components={{
            // Map Markdown elements to Tailwind classes so they render beautifully
            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
            strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
            ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
            ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2" {...props} />,
            li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          }}
        >
          {message}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default ChatBubble;