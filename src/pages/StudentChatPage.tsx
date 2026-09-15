import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle, ArrowLeft, Loader2, MessageSquare, PanelLeftClose,
  PanelLeftOpen, Plus, Send, Sparkles, User, X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { aiCareerService, type ChatMessage, type UserContext } from "@/lib/ai-service";
import { loadStudentAIContext } from "@/lib/student-ai-context";
import { ThemeToggle } from "@/components/ThemeToggle";

type ChatThread = { id: string; title: string; messages: ChatMessage[]; updatedAt: string };

const SUGGESTED_QUESTIONS = [
  "Which career areas are worth exploring from my current profile?",
  "What should I improve first to keep my options open?",
  "Help me compare two career paths realistically.",
  "What can I do this month to learn more about my interests?",
];

const getWelcomeMessage = (context: UserContext): ChatMessage => {
  const name = context.name?.split(' ')[0] || 'there';
  const grade = context.currentGrade ? ` in ${context.currentGrade}` : '';
  const signals = [
    context.subjects?.length ? `${context.subjects.length} selected subjects` : null,
    context.interests?.length ? `${context.interests.length} interests` : null,
    context.hasRecordedGrades ? 'your recorded grades' : null,
  ].filter(Boolean);
  return {
    id: crypto.randomUUID(), role: 'assistant', timestamp: new Date(),
    content: `Habari, ${name}. I’ll use the learning information you have already shared${grade} to make this conversation specific to you.${signals.length ? ` I can see ${signals.join(', ')}.` : ''}

I won’t treat an interest as proof that a career fits. We can compare your options against your subjects, grades and what you want to work towards.

What would you like to work out first?`,
  };
};

const makeThread = (context: UserContext): ChatThread => ({
  id: crypto.randomUUID(), title: 'New conversation', messages: [getWelcomeMessage(context)], updatedAt: new Date().toISOString(),
});

const toMessage = (value: unknown): ChatMessage | null => {
  if (!value || typeof value !== 'object') return null;
  const message = value as Partial<ChatMessage>;
  if ((message.role !== 'user' && message.role !== 'assistant') || typeof message.content !== 'string') return null;
  const timestamp = new Date(message.timestamp || Date.now());
  if (Number.isNaN(timestamp.getTime())) return null;
  return { id: typeof message.id === 'string' ? message.id : crypto.randomUUID(), role: message.role, content: message.content, timestamp };
};

const readSavedThreads = (userId: string, context: UserContext): ChatThread[] => {
  try {
    const savedThreads = localStorage.getItem(`student_ai_chat_threads_${userId}`);
    if (savedThreads) {
      const parsed = JSON.parse(savedThreads) as unknown;
      if (Array.isArray(parsed)) {
        const threads = parsed.flatMap((item): ChatThread[] => {
          if (!item || typeof item !== 'object') return [];
          const thread = item as Partial<ChatThread>;
          const messages = Array.isArray(thread.messages) ? thread.messages.map(toMessage).filter(Boolean) as ChatMessage[] : [];
          if (!messages.length) return [];
          return [{ id: typeof thread.id === 'string' ? thread.id : crypto.randomUUID(), title: typeof thread.title === 'string' && thread.title.trim() ? thread.title : 'Earlier conversation', messages, updatedAt: typeof thread.updatedAt === 'string' ? thread.updatedAt : new Date().toISOString() }];
        });
        if (threads.length) return threads.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      }
    }
    const legacyConversation = localStorage.getItem(`ai_chat_${userId}`);
    if (legacyConversation) {
      const parsed = JSON.parse(legacyConversation) as unknown;
      const messages = Array.isArray(parsed) ? parsed.map(toMessage).filter(Boolean) as ChatMessage[] : [];
      if (messages.length) return [{ id: crypto.randomUUID(), title: 'Earlier conversation', messages, updatedAt: new Date().toISOString() }];
    }
  } catch (error) {
    console.warn('Could not restore saved chat history:', error);
  }
  return [makeThread(context)];
};

const getThreadTitle = (prompt: string) => {
  const compact = prompt.replace(/\s+/g, ' ').trim();
  return compact.length > 42 ? `${compact.slice(0, 42)}…` : compact;
};

const MessageContent = ({ content, role }: { content: string; role: 'user' | 'assistant' }) => {
  if (role === 'user') return <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{content}</p>;
  return (
    <div className="prose prose-sm max-w-none prose-p:my-2 prose-headings:mb-2 prose-headings:mt-4 prose-ul:my-2 prose-ol:my-2 prose-li:my-1">
      <ReactMarkdown components={{
        h1: ({ children }) => <h1 className="text-base font-bold text-slate-900">{children}</h1>,
        h2: ({ children }) => <h2 className="text-[15px] font-bold text-slate-900">{children}</h2>,
        h3: ({ children }) => <h3 className="text-sm font-bold text-slate-800">{children}</h3>,
        p: ({ children }) => <p className="text-sm leading-relaxed text-slate-700">{children}</p>,
        strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
        ul: ({ children }) => <ul className="list-disc space-y-1 pl-4 text-slate-700">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal space-y-1 pl-4 text-slate-700">{children}</ol>,
        li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-blue-200 pl-3 text-slate-600">{children}</blockquote>,
        code: ({ children }) => <code className="rounded bg-slate-100 px-1 py-0.5 text-[0.82em] text-slate-800">{children}</code>,
        a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="font-medium text-blue-700 underline underline-offset-2">{children}</a>,
      }}>{content}</ReactMarkdown>
    </div>
  );
};

const StudentChatPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [message, setMessage] = useState('');
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userContext, setUserContext] = useState<UserContext>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = useMemo(() => threads.find(thread => thread.id === activeThreadId)?.messages || [], [activeThreadId, threads]);
  const hasUserMessage = conversation.some(item => item.role === 'user');

  useEffect(() => { if (user && profile && !isInitialized) void initializeChat(); }, [user, profile, isInitialized]);
  useEffect(() => {
    if (user?.id && isInitialized && threads.length) localStorage.setItem(`student_ai_chat_threads_${user.id}`, JSON.stringify(threads));
  }, [threads, user?.id, isInitialized]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [conversation, isLoading]);

  const initializeChat = async () => {
    if (!user?.id) return;
    try {
      setError(null);
      const context = await loadStudentAIContext(user.id, profile?.full_name);
      const restoredThreads = readSavedThreads(user.id, context);
      setUserContext(context);
      setThreads(restoredThreads);
      setActiveThreadId(restoredThreads[0].id);
      setIsInitialized(true);
    } catch (caughtError) {
      console.error('Failed to initialize student chat:', caughtError);
      setError('We could not load your guidance profile. Please try again.');
    }
  };

  const updateActiveThread = (updater: (thread: ChatThread) => ChatThread) => {
    setThreads(current => current.map(thread => thread.id === activeThreadId ? updater(thread) : thread));
  };
  const closeHistoryOnMobile = () => {
    if (window.innerWidth < 1024) setIsHistoryOpen(false);
  };
  const startNewChat = () => {
    const thread = makeThread(userContext);
    setThreads(current => [thread, ...current]);
    setActiveThreadId(thread.id);
    setMessage(''); setError(null); closeHistoryOnMobile();
  };
  const handleSend = async () => {
    const prompt = message.trim();
    if (!prompt || isLoading || !user || !activeThreadId) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: prompt, timestamp: new Date() };
    const historyForRequest = conversation;
    updateActiveThread(thread => ({ ...thread, title: thread.title === 'New conversation' ? getThreadTitle(prompt) : thread.title, messages: [...thread.messages, userMessage], updatedAt: new Date().toISOString() }));
    setMessage(''); setError(null); setIsLoading(true);
    try {
      const response = await aiCareerService.sendMessage(prompt, historyForRequest, userContext);
      const assistantMessage: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: response, timestamp: new Date() };
      updateActiveThread(thread => ({ ...thread, messages: [...thread.messages, assistantMessage], updatedAt: new Date().toISOString() }));
    } catch (caughtError) {
      console.error('Failed to send student chat message:', caughtError);
      const sourceMessage = caughtError instanceof Error ? caughtError.message : '';
      setError(sourceMessage.includes('Network connection failed') ? 'Network connection failed. Check your connection and try again.' : sourceMessage.includes('Too many requests') ? 'The adviser is busy. Please wait a moment and try again.' : 'The adviser could not respond just now. Please try again.');
    } finally { setIsLoading(false); }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-background"><Alert className="max-w-md"><AlertCircle className="h-4 w-4" /><AlertDescription>Please sign in to use your career adviser.</AlertDescription></Alert></div>;
  if (error && !isInitialized) return <div className="min-h-screen flex items-center justify-center bg-background p-4"><div className="max-w-md w-full space-y-3"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert><Button onClick={() => void initializeChat()} variant="outline" className="w-full">Try again</Button></div></div>;

  return (
    <div className="chat-page-shell h-[100dvh] flex flex-col overflow-hidden">
      <header className="chat-page-header shrink-0"><div className="chat-page-header-inner mx-auto max-w-6xl px-3 sm:px-5"><div className="flex h-12 items-center justify-between sm:h-14">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/student')} className="chat-page-back h-8 w-8 shrink-0"><ArrowLeft className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" aria-label={isHistoryOpen ? 'Hide conversation history' : 'Show conversation history'} onClick={() => setIsHistoryOpen(open => !open)} className="chat-page-back h-8 w-8 shrink-0">{isHistoryOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}</Button>
          <div className="chat-adviser-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9"><Sparkles className="h-4 w-4" /></div>
          <div className="min-w-0"><h1 className="chat-page-title truncate text-sm font-bold">Career adviser</h1><p className="chat-online-label text-[10px] font-medium uppercase tracking-wider">Profile-aware guidance</p></div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">{userContext.currentGrade && <Badge variant="secondary" className="chat-level-badge hidden px-2 py-0.5 text-[10px] sm:inline-flex">{userContext.currentGrade}</Badge>}<Button size="sm" variant="ghost" onClick={startNewChat} disabled={!isInitialized || isLoading} className="chat-reset h-8 px-2 text-xs sm:px-3"><Plus className="mr-1 h-3.5 w-3.5" />New chat</Button><ThemeToggle /></div>
      </div></div></header>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {isHistoryOpen && <button aria-label="Close conversation history" onClick={() => setIsHistoryOpen(false)} className="absolute inset-0 z-10 bg-slate-900/20 lg:hidden" />}
        <aside className={`absolute inset-y-0 left-0 z-20 flex w-[min(18rem,86vw)] shrink-0 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:relative lg:w-72 ${isHistoryOpen ? 'translate-x-0' : '-translate-x-full lg:-ml-72'}`}>
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-3"><div><p className="text-xs font-bold text-slate-800">Chat history</p><p className="mt-0.5 text-[11px] text-slate-500">Your conversations stay on this device.</p></div><Button variant="ghost" size="icon" onClick={() => setIsHistoryOpen(false)} className="h-7 w-7 lg:hidden"><X className="h-4 w-4" /></Button></div>
          <div className="p-3"><Button onClick={startNewChat} disabled={!isInitialized || isLoading} variant="outline" className="w-full justify-start border-slate-200 text-sm text-slate-700"><Plus className="mr-2 h-4 w-4 text-blue-700" />Start a new chat</Button></div>
          <ScrollArea className="min-h-0 flex-1 px-2 pb-3"><div className="space-y-1">{threads.map(thread => <button key={thread.id} onClick={() => { setActiveThreadId(thread.id); closeHistoryOnMobile(); }} className={`group flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-colors ${thread.id === activeThreadId ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-slate-50'}`}><MessageSquare className={`h-4 w-4 shrink-0 ${thread.id === activeThreadId ? 'text-blue-700' : 'text-slate-400'}`} /><span className="min-w-0"><span className="block truncate text-xs font-semibold">{thread.title}</span><span className="mt-0.5 block text-[10px] text-slate-500">{new Date(thread.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span></span></button>)}</div></ScrollArea>
          <div className="border-t border-slate-100 px-3 py-3 text-[11px] text-slate-500"><span className="font-semibold text-slate-700">Context in use:</span> profile, subjects and grades.</div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col bg-[#f8fafc]"><div className="min-h-0 flex-1 overflow-hidden"><ScrollArea className="h-full"><div className="chat-message-list mx-auto max-w-3xl space-y-5 px-3 py-5 sm:px-5 sm:py-7">
          {!isInitialized && <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-blue-700" /></div>}
          {conversation.map(msg => <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`flex max-w-[94%] gap-2 sm:max-w-[82%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end`}><div className={`chat-message-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${msg.role === 'user' ? 'chat-message-avatar-user' : 'chat-message-avatar-adviser'}`}>{msg.role === 'user' ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}</div><div className={`chat-message-bubble rounded-2xl p-3 sm:p-4 ${msg.role === 'user' ? 'chat-message-user rounded-br-none' : 'chat-message-adviser rounded-bl-none'}`}><MessageContent content={msg.content} role={msg.role as 'user' | 'assistant'} /><p className={`mt-1.5 text-[10px] opacity-55 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div></div></div>)}
          {isLoading && <div className="flex justify-start"><div className="flex items-end gap-2"><div className="chat-message-avatar chat-message-avatar-adviser flex h-8 w-8 items-center justify-center rounded-lg"><Sparkles className="h-4 w-4" /></div><div className="chat-message-bubble chat-message-adviser rounded-2xl rounded-bl-none px-4 py-3"><div className="flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin text-blue-700" />Considering your profile…</div></div></div></div>}
          <div ref={messagesEndRef} />
        </div></ScrollArea></div>
          <div className="chat-composer-wrap shrink-0 border-t border-slate-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4"><div className="mx-auto max-w-3xl">
            {error && <Alert variant="destructive" className="mb-3 text-xs"><AlertCircle className="h-3 w-3" /><AlertDescription>{error}</AlertDescription></Alert>}
            {!hasUserMessage && !isLoading && <div className="mb-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">{SUGGESTED_QUESTIONS.map(question => <Button key={question} variant="outline" size="sm" onClick={() => setMessage(question)} className="chat-suggestion h-8 shrink-0 whitespace-nowrap rounded-full px-3 text-xs">{question}</Button>)}</div>}
            <div className="chat-composer flex items-center gap-2 rounded-2xl p-2 transition-all"><input type="text" placeholder="Ask about your subjects, grades or next steps…" value={message} onChange={event => setMessage(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleSend(); } }} disabled={isLoading || !isInitialized} className="chat-composer-input min-h-[42px] flex-1 border-0 bg-transparent px-2 text-sm focus:outline-none disabled:opacity-50 sm:text-base" /><Button onClick={() => void handleSend()} disabled={isLoading || !message.trim() || !isInitialized} size="icon" className="chat-send-button h-10 w-10 shrink-0 rounded-xl"><Send className="h-4 w-4" /></Button></div>
            <div className="mt-2 flex items-center justify-between px-1"><p className="chat-composer-note flex items-center text-[10px]"><Sparkles className="mr-1 h-3 w-3" />Uses your saved profile and grade data</p>{userContext.hasRecordedGrades ? <span className="text-[10px] font-medium text-emerald-700">Grades included</span> : <span className="text-[10px] text-slate-500">No grades uploaded yet</span>}</div>
          </div></div>
        </main>
      </div>
    </div>
  );
};

export default StudentChatPage;
