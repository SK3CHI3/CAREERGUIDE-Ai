import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, User, Sparkles, Loader2, AlertCircle, RefreshCw, ArrowLeft, Briefcase, Target, GraduationCap as GradIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { aiCareerService, type ChatMessage, type UserContext } from "@/lib/ai-service";
import { dashboardService } from "@/lib/dashboard-service";
import { supabase } from "@/lib/supabase";
import type { Database } from '@/types/supabase';
import { ThemeToggle } from "@/components/ThemeToggle";

// Enhanced message content renderer with better markdown parsing
const MessageContent = ({ content, role }: { content: string, role: 'user' | 'assistant' }) => {
  if (role === 'user') {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{content}</p>;
  }

  const parts = content.split('\n');

  return (
    <div className="space-y-3">
      {parts.map((part, i) => {
        const trimmed = part.trim();

        // Detect headers (# or **bold** at start)
        if (trimmed.startsWith('# ')) {
          return <h3 key={i} className="text-lg font-bold text-foreground mt-2">{trimmed.substring(2)}</h3>;
        }
        if (trimmed.startsWith('## ')) {
          return <h4 key={i} className="text-base font-bold text-foreground mt-2">{trimmed.substring(3)}</h4>;
        }

        // Detect bold text
        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          return <p key={i} className="font-bold text-sm">{trimmed.slice(2, -2)}</p>;
        }

        // Detect bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 items-start pl-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
              <p className="text-sm leading-relaxed">{trimmed.substring(2)}</p>
            </div>
          );
        }

        // Detect numbered lists
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
        if (numberedMatch) {
          return (
            <div key={i} className="flex gap-2 items-start pl-1">
              <span className="text-xs font-bold text-primary/60 mt-0.5">{numberedMatch[1]}.</span>
              <p className="text-sm leading-relaxed">{numberedMatch[2]}</p>
            </div>
          );
        }

        // Detect Career Recommendations
        if (trimmed.startsWith('Career Profile:') || trimmed.startsWith('Recommended Career:') || trimmed.startsWith('Career Match:')) {
          return (
            <div key={i} className="bg-primary/5 border border-primary/10 rounded-xl p-3 my-3">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Career Match</span>
              </div>
              <p className="font-bold text-sm sm:text-base">{trimmed.split(':')[1]?.trim()}</p>
            </div>
          );
        }

        // Detect Key Insights
        if (trimmed.toLowerCase().includes('insight:') || trimmed.toLowerCase().includes('why this matches:')) {
          return (
            <div key={i} className="flex items-center gap-2 text-primary font-bold text-xs mt-4 mb-1">
              <Target className="w-3.5 h-3.5" />
              <span>{trimmed.toUpperCase()}</span>
            </div>
          );
        }

        // Detect Subjects
        if (trimmed.startsWith('Subjects:') || trimmed.startsWith('Academic Focus:') || trimmed.startsWith('Recommended Subjects:')) {
          return (
            <div key={i} className="flex items-center gap-2 text-purple-600 font-bold text-xs mt-4 mb-1">
              <GradIcon className="w-3.5 h-3.5" />
              <span>{trimmed.toUpperCase()}</span>
            </div>
          );
        }

        // Regular text
        if (!trimmed) return <div key={i} className="h-2" />;
        return <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap break-words">{trimmed}</p>;
      })}
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
            content: `Habari yako, ${context.name ? context.name.split(' ')[0] : 'there'}! 👋

I'm your AI career counselor, specialized in Kenya's education system. I'm here to help you discover your perfect career path based on your interests, abilities, and goals.

${context.schoolLevel ? `I see you're in ${context.schoolLevel} education` : 'I\'d love to learn more about your educational background'}${context.currentGrade ? ` (Grade ${context.currentGrade})` : ''}.

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
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-card-border bg-background/95 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/student')}
                className="h-9 w-9"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-base font-bold">AI Career Counselor</h1>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-medium text-green-600 uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              {userContext.schoolLevel && (
                <Badge variant="secondary" className="text-[10px] py-0.5 px-2 bg-primary/5 text-primary border-primary/10">
                  {userContext.schoolLevel}
                </Badge>
              )}
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
                Reset
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
            {conversation.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[90%] sm:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2 items-end`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-gradient-primary text-primary-foreground'
                    }`}>
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
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
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-card border border-card-border p-4 rounded-2xl">
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
      <div className="border-t border-card-border bg-background/95 backdrop-blur-md p-4">
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
                className="whitespace-nowrap rounded-full h-8 text-xs bg-background/50 border-primary/20 hover:border-primary px-4 py-1 flex-shrink-0"
              >
                {q}
              </Button>
            ))}
          </div>

          {/* Input Field */}
          <div className="flex gap-2 items-center bg-card border border-card-border rounded-2xl p-2 shadow-inner focus-within:ring-2 focus-within:ring-primary/20 transition-all">
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
              className="flex-1 border-0 bg-transparent focus:outline-none min-h-[44px] text-sm sm:text-base px-3 disabled:opacity-50"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !message.trim()}
              size="icon"
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl w-10 h-10 shrink-0 shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[10px] text-foreground-muted flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-primary" />
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
