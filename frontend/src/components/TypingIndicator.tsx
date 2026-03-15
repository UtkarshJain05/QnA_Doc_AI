const TypingIndicator = () => {
  return (
    <div className="flex justify-start animate-fade-in-up">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-secondary px-4 py-3">
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
        <span className="ml-2 text-xs text-muted-foreground">QnA Bot is thinking...</span>
      </div>
    </div>
  );
};

export default TypingIndicator;
