import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Sparkles, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { aiCareerService, type ChatMessage, type UserContext } from "@/lib/ai-service";
import { MessageContent } from "@/components/chat/MessageContent";
import { ChatInput, type ChatInputHandle } from "@/components/chat/ChatInput";
import { trackChatMessageByRole, trackChatSession } from "@/lib/tracking-service";

interface AIChatProps {
  isStandalone?: boolean;
}

const AIChat = ({ isStandalone = false }: AIChatProps) => {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('ai_chat_anonymous');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      } catch (error) {
        console.error('Failed to parse saved conversation:', error);
      }
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userContext, setUserContext] = useState<UserContext>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessionMessageCount, setSessionMessageCount] = useState(0);

  // Predefined quick questions for students
  const SUGGESTED_QUESTIONS = [
    "What are the best careers for my subjects?",
    "How can I improve my grades for Engineering?",
    "Tell me about university programs in Kenya",
    "What are high-paying careers in Vision 2030?",
    "Show me TVET options for my interests"
  ];

  // Initialize chat with welcome message
  useEffect(() => {
    if (!isInitialized && conversation.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Habari! I'm your AI career counselor, specialized in Kenya's CBE education system.

I'm here to help you discover your perfect career path based on your interests, abilities, and goals.

To give you the best guidance, let's start with one simple question:

What subjects do you enjoy most in your current studies?`,
        timestamp: new Date()
      };
      setConversation([welcomeMessage]);
      setIsInitialized(true);
      trackChatSession('start');
    }
  }, [isInitialized, conversation.length]);

  // Save conversation to localStorage whenever it changes
  useEffect(() => {
    if (conversation.length > 0) {
      localStorage.setItem('ai_chat_anonymous', JSON.stringify(conversation));
    }
  }, [conversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Function to refresh/clear the chat
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      setConversation([]);
      setError(null);
      localStorage.removeItem('ai_chat_anonymous');
      setIsInitialized(false);
      setSessionMessageCount(0);
      trackChatSession('reset');
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('Chat refreshed - conversation cleared and re-initialized');
    } catch (error) {
      console.error('Failed to refresh chat:', error);
      setError('Failed to refresh chat. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    setConversation(prev => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);
    setError(null);

    trackChatMessageByRole('user');
    setSessionMessageCount(prev => prev + 1);

    setTimeout(() => chatInputRef.current?.focus(), 0);

    try {
      const response = await aiCareerService.sendMessage(
        userMessage.content,
        conversation,
        userContext
      );

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setConversation(prev => [...prev, assistantMessage]);
      trackChatMessageByRole('assistant');
      setSessionMessageCount(prev => prev + 1);

      console.log('Anonymous chat - conversation saved to localStorage');

    } catch (error) {
      console.error('Failed to send message:', error);

      let errorMessage = 'Failed to send message. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Network connection failed')) {
          errorMessage = 'Network connection failed. Please check your internet connection.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Fatal init error: show clear message and retry
  if (error && !isInitialized) {
    return (
      <div className="w-full max-w-4xl px-2 sm:mx-auto sm:p-6 p-2">
        <Card className="bg-gradient-surface border-card-border shadow-elevated">
          <CardContent className="p-6">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              onClick={() => {
                setError(null);
                setIsInitialized(false);
              }}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Content = (
    <div className={`w-full ${isStandalone ? '' : 'max-w-5xl px-2 sm:mx-auto sm:p-2 p-1'}`}>
      {!isStandalone && (
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4">
            Chat with Your{" "}
            <span className="bg-gradient-text bg-clip-text text-transparent">
              AI Career Counselor
            </span>
          </h2>
          <p className="text-foreground-muted max-w-2xl mx-auto text-sm sm:text-base">
            Get personalized career guidance based on Kenya's education system and job market.
            <span className="text-blue-600 font-medium"> Conversations persist during your session.</span>
          </p>
        </div>
      )}

      <div className={`adviser-chat flex flex-col h-full ${isStandalone ? 'adviser-chat-standalone' : 'bg-gradient-surface border border-card-border shadow-elevated rounded-3xl overflow-hidden'}`}>
        {/* Chat Header */}
        <div className="adviser-chat-header p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="adviser-chat-logo w-10 h-10 rounded-xl flex items-center justify-center">
                <img
                  src="/logos/CareerGuide_Logo.webp"
                  alt="AI"
                  className="w-6 h-auto"
                />
              </div>
              <div>
                <CardTitle className="adviser-chat-title text-base sm:text-lg font-bold">Career support adviser</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="adviser-online-dot w-2 h-2 rounded-full" />
                  <span className="adviser-online-label text-[10px] sm:text-xs font-medium uppercase tracking-wider">Here when you need it</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="adviser-reset text-xs h-8 transition-colors"
              >
                {isRefreshing ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-1.5" />
                )}
                Reset Chat
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <ScrollArea className="adviser-chat-body flex-1">
          <div className="p-4 sm:p-6 space-y-4">
            {conversation.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`adviser-message-avatar flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    msg.role === 'user' ? 'adviser-message-user' : 'adviser-message-ai'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>
                  <div className={`adviser-message-bubble rounded-2xl p-4 ${
                    msg.role === 'user' ? 'adviser-message-user' : 'adviser-message-ai'
                  }`}>
                    <MessageContent content={msg.content} role={msg.role} />
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-3">
                  <div className="adviser-message-avatar adviser-message-ai flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="adviser-message-bubble adviser-message-ai rounded-2xl p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Suggested Questions (only show if conversation is just welcome message) */}
        {conversation.length === 1 && (
          <div className="px-4 sm:px-6 pb-4">
            <CardDescription className="text-xs mb-2 text-center">Try asking:</CardDescription>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setMessage(q);
                    setTimeout(() => handleSend(), 100);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-card-border hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input */}
        <div className="adviser-chat-footer p-4 sm:p-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <ChatInput
            ref={chatInputRef}
            message={message}
            onChange={setMessage}
            onSend={handleSend}
            placeholder="Ask about careers, subjects, or university programs..."
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );

  return Content;
};

export default AIChat;
