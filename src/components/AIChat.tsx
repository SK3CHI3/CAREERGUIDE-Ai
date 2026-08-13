import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, User, Sparkles, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { aiCareerService, type ChatMessage, type UserContext } from "@/lib/ai-service";
import { dashboardService } from "@/lib/dashboard-service";
import { supabase } from "@/lib/supabase";
import type { Database } from '@/types/supabase';

// Component to render structured message content with proper markdown support
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

interface AIChatProps {
  isStandalone?: boolean;
}

const AIChat = ({ isStandalone = false }: AIChatProps) => {
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

  // Predefined quick questions for students
  const SUGGESTED_QUESTIONS = [
    "What are the best careers for my subjects?",
    "How can I improve my grades for Engineering?",
    "Tell me about university programs in Kenya",
    "What are high-paying careers in Vision 2030?",
    "Show me TVET options for my interests"
  ];

  // Initialize user context and conversation
  useEffect(() => {
    if (user && profile && !isInitialized) {
      initializeChat();
    }
  }, [user, profile, isInitialized]);


  // Save conversation to localStorage whenever it changes
  useEffect(() => {
    if (user?.id && conversation.length > 0) {
      localStorage.setItem(`ai_chat_${user.id}`, JSON.stringify(conversation));
      console.log('💾 Saved conversation to localStorage');
    }
  }, [conversation, user?.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const initializeChat = async () => {
    try {
      // Load user context from student profile
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

      // Load conversation history
      if (user?.id) {
        const history = await aiCareerService.loadConversationHistory(user.id);
        if (history.length > 0) {
          setConversation(history);
        } else {
          // Start with welcome message
          const welcomeMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `Habari yako, ${context.name ? context.name.split(' ')[0] : 'there'}! 👋

I'm your AI career counselor, specialized in Kenya's CBE education system. I'm here to help you discover your perfect career path based on your interests, abilities, and goals.

${context.schoolLevel ? `I see you're in ${context.schoolLevel} education` : 'I\'d love to learn more about your educational background'}${context.currentGrade ? ` (Grade ${context.currentGrade})` : ''}.

To give you the best guidance, let's start with one simple question:

What subjects do you enjoy most in your current studies? 🎯`,
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
  }

  // Function to refresh/clear the chat
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Clear the conversation
      setConversation([]);
      setError(null);

      // Clear localStorage
      if (user?.id) {
        localStorage.removeItem(`ai_chat_${user.id}`);
        console.log('🗑️ Cleared conversation from localStorage');
      }

      // Re-initialize the chat
      setIsInitialized(false);
      await initializeChat();

      console.log('Chat refreshed - conversation cleared and re-initialized');
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

      const updatedConversation = [...conversation, userMessage, assistantMessage];
      setConversation(updatedConversation);

      // Quick assessment - don't save conversation to database
      console.log('Quick assessment chat - conversation not saved to database');

    } catch (error) {
      console.error('Failed to send message:', error);

      // Show user-friendly error messages
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
      <div className="w-full max-w-4xl px-2 sm:mx-auto sm:p-6 p-2">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please sign in to chat with your AI career counselor.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fatal init error: show clear message and retry so the UI is not stuck
  if (error && !isInitialized) {
    return (
      <div className="w-full max-w-4xl px-2 sm:mx-auto sm:p-6 p-2">
        <Card className="bg-gradient-surface border-card-border shadow-elevated">
          <CardContent className="p-6">
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
            Quick AI assessment – Get personalized career guidance based on Kenya's education system and job market.
            <span className="text-blue-600 font-medium"> Conversations persist during your session but are not saved to database.</span>
          </p>
        </div>
      )}

      <div className={`flex flex-col h-full ${isStandalone ? '' : 'bg-gradient-surface border border-card-border shadow-elevated rounded-3xl overflow-hidden'}`}>
        {/* Chat Header */}
        <div className="border-b border-card-border p-4 sm:p-6 bg-card/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shadow-lg">
                <img 
                  src="/logos/CareerGuide_Logo.webp" 
                  alt="AI" 
                  className="w-6 h-auto" 
                />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold">Career Counselor AI</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] sm:text-xs font-medium text-green-600 uppercase tracking-wider">Online & Ready</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="text-xs h-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                {isRefreshing ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-1.5" />
                )}
                Reset Chat
              </Button>
              {userContext.schoolLevel && (
                <Badge variant="secondary" className="text-[10px] py-0.5 px-2 bg-primary/5 text-primary border-primary/10">
                  {userContext.schoolLevel}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="p-0 sm:p-6 p-3 flex-1 overflow-hidden">
          <ScrollArea className={`${isStandalone ? 'h-[calc(100vh-280px)]' : 'h-[450px] sm:h-[600px]'} p-2 sm:p-6`}>
            <div className="space-y-4 sm:space-y-6">
              {conversation.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
                  <div className={`flex max-w-[95%] sm:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2 items-end`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gradient-primary text-primary-foreground'
                      }`}>
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <img 
                          src="/logos/CareerGuide_Logo.webp" 
                          alt="AI" 
                          className="w-4 h-auto" 
                        />
                      )}
                    </div>
                    <div className={`p-3 sm:p-4 rounded-2xl shadow-sm ${msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-card border border-card-border rounded-bl-none'
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
                  <div className="flex gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                      <img 
                        src="/logos/CareerGuide_Logo.webp" 
                        alt="AI" 
                        className="w-4 h-auto" 
                      />
                    </div>
                    <div className="bg-background border border-card-border p-3 sm:p-4 rounded-2xl">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
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
        <div className="border-t border-card-border p-4 sm:p-6 bg-card/30">
          {error && (
            <Alert variant="destructive" className="mb-4 text-xs">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Quick Actions Scroll */}
          <div className="flex overflow-x-auto gap-2 mb-4 pb-2 no-scrollbar">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => {
                  setMessage(q);
                  // Optional: handleSend immediately if helpful
                }}
                className="whitespace-nowrap rounded-full h-8 text-xs bg-background/50 border-primary/20 hover:border-primary px-4 py-1 flex-shrink-0"
              >
                {q}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 items-center bg-background border border-card-border rounded-2xl p-1 shadow-inner focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Input
              placeholder="Ask about careers..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={isLoading}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[44px] text-sm sm:text-base flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !message.trim()}
              size="icon"
              className="bg-primary hover:primary/90 text-primary-foreground rounded-xl w-10 h-10 shrink-0 shadow-lg shadow-primary/20"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between mt-3 px-1">
            <p className="text-[10px] text-foreground-muted flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-primary" />
              Advanced AI Reasoning
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

  return Content;
};

export default AIChat;
