import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { User, Sparkles, ArrowUp } from "lucide-react";
import { aiCareerService, type ChatMessage, type UserContext } from "@/lib/ai-service";
import { dashboardService, type CareerField } from "@/lib/dashboard-service";
import { MessageContent } from "@/components/chat/MessageContent";
import { trackChatMessageByRole, trackChatSession } from "@/lib/tracking-service";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const SUGGESTED_QUESTIONS = [
  "What careers match my CBC subjects?",
  "Help me choose a Senior Secondary pathway",
  "What are high-demand careers in Kenya?",
  "How do I prepare for university applications?"
];

const AIChat = ({ isStandalone = false }: { isStandalone?: boolean }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatContext, setChatContext] = useState<UserContext>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load career fields and CBC data from database on mount
  useEffect(() => {
    const loadContext = async () => {
      try {
        const careerFields = await dashboardService.getCareerFields();
        const careerPaths = await dashboardService.getCareerPaths(undefined, 20);

        // Build a concise summary of career fields by pathway
        const pathwaySummary: Record<string, string[]> = {};
        careerFields.forEach((field: CareerField) => {
          if (!pathwaySummary[field.cbc_pathway]) {
            pathwaySummary[field.cbc_pathway] = [];
          }
          pathwaySummary[field.cbc_pathway].push(
            `${field.name} (${field.cbc_track}) — roles: ${field.example_roles?.slice(0, 3).join(', ') || 'N/A'}`
          );
        });

        const trendingCareers = careerPaths
          .filter(p => p.is_featured)
          .slice(0, 5)
          .map(p => `${p.title} (${p.demand_level} demand, ${p.salary_range || 'varies'})`);

        setChatContext({
          careerFieldsData: careerFields,
          pathwaySummary,
          trendingCareers,
          totalCareerFields: careerFields.length,
          totalCareerPaths: careerPaths.length,
        });
      } catch (error) {
        console.error('Failed to load chat context:', error);
      }
    };

    loadContext();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  // Focus input on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const sendMessage = async (content: string, currentMessages: ChatMessage[]) => {
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    }]);
    setIsLoading(true);
    trackChatMessageByRole("user");

    try {
      const response = await aiCareerService.sendMessage(content, currentMessages, chatContext);
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      trackChatMessageByRole("assistant");
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setMessage("");
    setIsLoading(true);
    trackChatMessageByRole("user");

    try {
      const response = await aiCareerService.sendMessage(message.trim(), newMessages, chatContext);
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      trackChatMessageByRole("assistant");
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
      timestamp: new Date().toISOString(),
    };
    setMessages([userMessage]);
    setMessage("");
    setIsLoading(true);
    trackChatMessageByRole("user");

    aiCareerService.sendMessage(question, [userMessage], chatContext)
      .then((response) => {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response,
          timestamp: new Date().toISOString(),
        }]);
        trackChatMessageByRole("assistant");
      })
      .catch((error) => {
        console.error("Chat error:", error);
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I'm sorry, I encountered an error. Please try again.",
          timestamp: new Date().toISOString(),
        }]);
      })
      .finally(() => {
        setIsLoading(false);
        setTimeout(() => textareaRef.current?.focus(), 0);
      });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Messages area */}
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {messages.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center"
              >
                <Sparkles className="w-8 h-8 text-primary" />
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="space-y-2"
              >
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                  How can I help you today?
                </h1>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl"
              >
                {SUGGESTED_QUESTIONS.map((question, index) => (
                  <button
                    key={index}
                    className="text-left px-4 py-3.5 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/[0.03] transition-all text-sm text-foreground/80 hover:text-foreground"
                    onClick={() => handleSuggestedQuestion(question)}
                  >
                    {question}
                  </button>
                ))}
              </motion.div>
            </div>
          ) : (
            /* Messages */
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[75%] sm:max-w-[70%]",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-2.5"
                        : ""
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <div className="py-1">
                        <MessageContent content={msg.content} role={msg.role} />
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center mt-0.5">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="py-3 flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area — ChatGPT style */}
      <div className="border-t border-border bg-background px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-card px-4 py-2 shadow-sm focus-within:border-primary/40 focus-within:shadow-md transition-all">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message CareerGuide AI..."
              disabled={isLoading}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm sm:text-base py-1.5 focus:outline-none placeholder:text-muted-foreground/60 max-h-[200px] disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                message.trim() && !isLoading
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-center text-muted-foreground/70 mt-2">
            CareerGuide AI can make mistakes. Consider verifying important information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
