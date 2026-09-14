import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, User, Sparkles, Loader2, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { aiCareerService, type ChatMessage, type UserContext } from "@/lib/ai-service";
import { dashboardService } from "@/lib/dashboard-service";
import { supabase } from "@/lib/supabase";
import type { Database } from '@/types/supabase';
import { ThemeToggle } from "@/components/ThemeToggle";

// Enhanced message content renderer with proper markdown support
const MessageContent = ({ content, role }: { content: string, role: 'user' | 'assistant' }) => {
  if (role === 'user') {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{content}</p>;
  }

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
      <ReactMarkdown
        components={{
          h1: ({children}) => <h1 className="text-lg font-bold mt-3 mb-2">{children}</h1>,
          h2: ({children}) => <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>,
          h3: ({children}) => <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>,
          p: ({children}) => <p className="text-sm leading-relaxed my-1.5">{children}</p>,
          strong: ({children}) => <strong className="font-bold">{children}</strong>,
          em: ({children}) => <em className="italic">{children}</em>,
          ul: ({children}) => <ul className="list-disc pl-4 my-2 space-y-1">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal pl-4 my-2 space-y-1">{children}</ol>,
          li: ({children}) => <li className="text-sm leading-relaxed">{children}</li>,
          br: () => <br />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

const StudentChatPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<ChatMessage[]>(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`ai_chat_${user.id}`);
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
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userContext, setUserContext] = useState<UserContext>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const SUGGESTED_QUESTIONS = [
    "What are the best careers for my subjects?",
    "How can I improve my grades for Engineering?",
    "Tell me about university programs in Kenya",
    "What are high-paying careers in Vision 2030?",
    "Show me TVET options for my interests"
  ];

  useEffect(() => {
    if (user && profile && !isInitialized) {
      initializeChat();
    }
  }, [user, profile, isInitialized]);

  useEffect(() => {
    if (user?.id && conversation.length > 0) {
      localStorage.setItem(`ai_chat_${user.id}`, JSON.stringify(conversation));
    }
  }, [conversation, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const initializeChat = async () => {
    try {
      const { data: studentProfileRaw } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      const studentProfile = studentProfileRaw as Database['public']['Tables']['profiles']['Row'] | null;

      const academicPerformance = await dashboardService.calculateAcademicPerformance(user?.id || '');

      const context: UserContext = {
        name: profile?.full_name || undefined,
        schoolLevel: studentProfile ? (studentProfile.school_level as 'primary' | 'secondary' | 'tertiary') || undefined : undefined,
        currentGrade: studentProfile ? studentProfile.current_grade || undefined : undefined,
        subjects: studentProfile ? (studentProfile.cbe_subjects || undefined) : undefined,
        interests: studentProfile ? (studentProfile.career_interests || undefined) : undefined,
        careerGoals: studentProfile ? studentProfile.career_goals || undefined : undefined,
        assessmentResults: undefined,
        academicPerformance: {
          overallAverage: academicPerformance.overallAverage,
          strongSubjects: academicPerformance.strongSubjects,
          weakSubjects: academicPerformance.weakSubjects,
          performanceTrend: academicPerformance.performanceTrend
        }
      };

      setUserContext(context);

      if (user?.id) {
        const history = await aiCareerService.loadConversationHistory(user.id);
        if (history.length > 0) {
          setConversation(history);
        } else {
          const welcomeMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Habari yako, ${context.name ? context.name.split(' ')[0] : 'there'}.

I'm your AI career counselor, specialized in Kenya's education system. I'm here to help you discover your perfect career path based on your interests, abilities, and goals.

${context.schoolLevel ? `I see you're in ${context.schoolLevel} education` : 'I\'d love to learn more about your educational background'}${context.currentGrade ? ` (Grade ${context.currentGrade})` : ''}.

What subjects do you enjoy most in your current studies?`,
            timestamp: new Date()
          };
          setConversation([welcomeMessage]);
        }
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      setError('Failed to initialize chat. Please refresh the page.');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      setConversation([]);
      setError(null);

      if (user?.id) {
        localStorage.removeItem(`ai_chat_${user.id}`);
      }

      setIsInitialized(false);
      await initializeChat();
    } catch (error) {
      console.error('Failed to refresh chat:', error);
      setError('Failed to refresh chat. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || isLoading || !user) return;

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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please sign in to chat with your AI career counselor.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error && !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-6">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            onClick={() => {
              setError(null);
              initializeChat();
            }}
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page-shell h-[100dvh] flex flex-col">
      {/* Header */}
      <header className="chat-page-header sticky top-0 z-10">
        <div className="chat-page-header-inner max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/student')}
                className="chat-page-back h-9 w-9"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="chat-adviser-icon w-10 h-10 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="chat-page-title text-base font-bold">Career adviser</h1>
                  <div className="flex items-center gap-2">
                    <span className="chat-online-dot w-2 h-2 rounded-full" />
                    <span className="chat-online-label text-[10px] font-medium uppercase tracking-wider">Ready to help</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              {userContext.schoolLevel && (
                <Badge variant="secondary" className="chat-level-badge text-[10px] py-0.5 px-2">
                  {userContext.schoolLevel}
                </Badge>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="chat-reset text-xs h-8 transition-colors"
              >
                {isRefreshing ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-1.5" />
                )}
                Reset
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="chat-message-area flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="chat-message-list max-w-3xl mx-auto px-4 py-6 space-y-5">
            {conversation.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[90%] sm:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2 items-end`}>
                  <div className={`chat-message-avatar w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user'
                    ? 'chat-message-avatar-user'
                    : 'chat-message-avatar-adviser'
                    }`}>
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>
                  <div className={`chat-message-bubble p-3 sm:p-4 rounded-2xl ${msg.role === 'user'
                    ? 'chat-message-user rounded-br-none'
                    : 'chat-message-adviser rounded-bl-none'
                    }`}>
                    <MessageContent content={msg.content} role={msg.role as 'user' | 'assistant'} />
                    <p className={`text-[10px] mt-1.5 opacity-60 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-2">
                  <div className="chat-message-avatar chat-message-avatar-adviser w-8 h-8 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="chat-message-bubble chat-message-adviser p-4 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm text-foreground-muted">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Chat Input */}
      <div className="chat-composer-wrap p-4">
        <div className="max-w-3xl mx-auto">
          {error && (
            <Alert variant="destructive" className="mb-3 text-xs">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Suggested Questions */}
          <div className="flex overflow-x-auto gap-2 mb-3 pb-2 no-scrollbar">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => setMessage(q)}
                className="chat-suggestion whitespace-nowrap rounded-full h-8 text-xs px-4 py-1 flex-shrink-0"
              >
                {q}
              </Button>
            ))}
          </div>

          {/* Input Field */}
          <div className="chat-composer flex gap-2 items-center rounded-2xl p-2 transition-all">
            <input
              type="text"
              placeholder="Ask about careers, subjects, university paths..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading}
              className="chat-composer-input flex-1 border-0 bg-transparent focus:outline-none min-h-[44px] text-sm sm:text-base px-3 disabled:opacity-50"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !message.trim()}
              size="icon"
              className="chat-send-button rounded-xl w-10 h-10 shrink-0 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between mt-2 px-1">
            <p className="chat-composer-note text-[10px] flex items-center">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-powered career guidance
            </p>
            {userContext.name && (
              <div className="flex items-center gap-1.5 opacity-60">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-[10px] font-medium">{userContext.name.split(' ')[0]}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentChatPage;
