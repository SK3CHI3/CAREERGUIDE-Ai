import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Send, Bot, User, Sparkles, Loader2, Download, ArrowRight } from "lucide-react";
import { aiCareerService, type ChatMessage } from "@/lib/ai-service";
import { ReportGenerator, type GuestProfile } from "@/lib/report-generator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Component to render message content with proper markdown support
const MessageContent = ({ content, role }: { content: string, role: 'user' | 'assistant' }) => {
  if (role === 'user') {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{content}</p>;
  }

  return (
    <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
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

const GuestAIChat = () => {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestProfile, setGuestProfile] = useState<GuestProfile>({});
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showGradeForm, setShowGradeForm] = useState(false);
  const [subjectGrades, setSubjectGrades] = useState<Record<string, string>>({
    'Mathematics': '',
    'English': '',
    'Kiswahili': ''
  });
  const [connectionTest, setConnectionTest] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Karibu to CareerPath AI! 🦄
      
I'm your friendly career counselor, here to help you discover your perfect career path through Kenya's CBE (CBC) or 8-4-4 systems!

What you'll get:
✅ Targeted career matches based on your interests
✅ Placement guidance for your specific curriculum
✅ University & technical college suggestions (KUCCPS aligned)
✅ Professional career report (downloadable!)

What is your name? 😊`,
      timestamp: new Date()
    };
    setConversation([welcomeMessage]);
  }, []);


  const extractProfileInfo = (userMessage: string, aiResponse: string) => {
    const text = userMessage.toLowerCase();
    const newProfile = { ...guestProfile };

    if (!newProfile.name) {
      const namePatterns = [/(?:my name is|i'm|i am|call me)\s+([a-zA-Z\s]+)/, /^([a-zA-Z]+)$/, /^([a-zA-Z]+\s+[a-zA-Z]+)$/];
      for (const pattern of namePatterns) {
        const match = text.match(pattern);
        if (match && match[1].length > 1 && match[1].length < 30) {
          newProfile.name = match[1].trim().replace(/\b\w/g, l => l.toUpperCase());
          break;
        }
      }
    }

    if (!newProfile.grade) {
      if (text.includes('8-4-4') || text.includes('844') || text.includes('form 4') || text.includes('kcse')) {
        newProfile.curriculum = 'legacy';
        newProfile.grade = 'Form 4 / Leaver';
      } else if (text.includes('cbc') || text.includes('cbe')) {
        newProfile.curriculum = 'cbc';
      }
    }

    setGuestProfile(newProfile);

    if (newProfile.curriculum === 'legacy' && !newProfile.kcseGrade && !showGradeForm) {
      setShowGradeForm(true);
    }
  };

  const handleSendMessage = async (msg: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: msg,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await aiCareerService.sendMessage(
        msg, 
        conversation, 
        guestProfile
      );
      
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      const updatedConversation = [...conversation, userMessage, assistantMessage];
      setConversation(updatedConversation);
      extractProfileInfo(msg, response);

      if (updatedConversation.length >= 10 && !assessmentComplete && guestProfile.kcseGrade) {
        setAssessmentComplete(true);
      }
    } catch (err) {
      setError('Failed to connect to AI. Please try again.');
    } finally {
      setIsLoading(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;
    const currentMsg = message;
    setMessage("");
    await handleSendMessage(currentMsg);
  };

  const handleGradeSubmit = () => {
    const selectedGrades = Object.entries(subjectGrades).filter(([_, grade]) => grade !== '');
    
    if (selectedGrades.length < 5) {
      setError("Please select grades for at least 5 subjects to calculate an accurate Mean Grade.");
      return;
    }

    const gradePoints: Record<string, number> = {
      'A': 12, 'A-': 11, 'B+': 10, 'B': 9, 'B-': 8, 'C+': 7, 'C': 6, 'C-': 5, 'D+': 4, 'D': 3, 'D-': 2, 'E': 1
    };

    const totalPoints = selectedGrades.reduce((sum, [_, grade]) => sum + (gradePoints[grade] || 0), 0);
    const meanPoints = totalPoints / selectedGrades.length;
    
    const getGradeFromPoints = (points: number) => {
      if (points >= 11.5) return 'A';
      if (points >= 10.5) return 'A-';
      if (points >= 9.5) return 'B+';
      if (points >= 8.5) return 'B';
      if (points >= 7.5) return 'B-';
      if (points >= 6.5) return 'C+';
      if (points >= 5.5) return 'C';
      if (points >= 4.5) return 'C-';
      if (points >= 3.5) return 'D+';
      if (points >= 2.5) return 'D';
      if (points >= 1.5) return 'D-';
      return 'E';
    };

    const meanGrade = getGradeFromPoints(meanPoints);
    
    setGuestProfile(prev => ({
      ...prev,
      kcseGrade: meanGrade,
      kcsePoints: Math.round(meanPoints),
      subjectGrades: Object.fromEntries(selectedGrades)
    }));
    
    setShowGradeForm(false);
    setError(null);

    const gradeSummary = selectedGrades.map(([s, g]) => `${s}: ${g}`).join(', ');
    handleSendMessage(`I've entered my grades. My Mean Grade is ${meanGrade}. Subjects: ${gradeSummary}`);
  };

  const renderGradeForm = () => {
    const grades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'];
    const otherSubjects = ['Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'CRE', 'Business Studies', 'Agriculture', 'Computer Studies'];

    return (
      <Card className="p-4 mt-2 border-primary/20 bg-primary/5 shadow-sm">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">🎓 KCSE Scorecard</h3>
        <ScrollArea className="h-[250px] pr-4">
          <div className="space-y-3">
            <Label className="text-[10px] uppercase tracking-wider font-bold text-primary">Mandatory</Label>
            {['Mathematics', 'English', 'Kiswahili'].map(subject => (
              <div key={subject} className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium">{subject}</span>
                <Select value={subjectGrades[subject]} onValueChange={(v) => setSubjectGrades(p => ({ ...p, [subject]: v }))}>
                  <SelectTrigger className="w-[70px] h-7 text-xs"><SelectValue placeholder="-" /></SelectTrigger>
                  <SelectContent>
                    {grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <Label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground pt-2 inline-block">Others</Label>
            {otherSubjects.map(subject => (
              <div key={subject} className="flex items-center justify-between gap-2">
                <span className="text-xs">{subject}</span>
                <Select value={subjectGrades[subject] || ''} onValueChange={(v) => setSubjectGrades(p => ({ ...p, [subject]: v }))}>
                  <SelectTrigger className="w-[70px] h-7 text-xs"><SelectValue placeholder="-" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-4 pt-3 border-t border-primary/10">
          <Button size="sm" className="w-full h-8 text-xs font-bold" onClick={handleGradeSubmit}>Submit Academic Profile 🚀</Button>
        </div>
      </Card>
    );
  };

  const downloadReport = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      // Generate structured recommendations based on the conversation context
      const recommendations = await aiCareerService.generateCareerRecommendations({
        name: guestProfile.name,
        curriculum: guestProfile.curriculum === 'cbc' ? 'Kenyan CBC' : 'Kenyan Legacy (8-4-4)',
        currentGrade: guestProfile.grade,
        interests: guestProfile.interests,
        kcseGrade: guestProfile.kcseGrade,
        subjectGrades: guestProfile.subjectGrades
      });

      const reportName = `Diagnostic-Report-${guestProfile.name || 'Student'}`;
      const htmlReport = ReportGenerator.generatePDFReport(guestProfile, conversation, recommendations);
      await ReportGenerator.downloadPDF(htmlReport, `${reportName}.pdf`);
    } catch (err) {
      console.error("Report generation failed:", err);
      setError("Failed to generate your professional report. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">
          Quick Career Assessment <span className="text-primary">with AI</span>
        </h2>
        <p className="text-sm text-foreground-muted">Discover your ideal career path in minutes. No signup required.</p>
      </div>

      <Card className="bg-white border-card-border shadow-lg overflow-hidden">
        <CardHeader className="border-b bg-muted/30 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Career Counselor AI</CardTitle>
              <p className="text-xs text-muted-foreground">Always active ΓÇó Precise Guidance</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea ref={scrollAreaRef} className="h-[500px] p-4 sm:p-6 bg-slate-50/50">
            <div className="space-y-6">
              {conversation.map((msg, index) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                      msg.role === 'user' ? 'bg-primary text-white' : 'bg-white border shadow-sm'
                    }`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary" />}
                    </div>
                    <div className={`p-4 rounded-2xl shadow-sm text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-br-none'
                        : 'bg-white border rounded-bl-none text-foreground'
                    }`}>
                      <MessageContent content={msg.content} role={msg.role as 'user' | 'assistant'} />
                      {msg.role === 'assistant' && index === conversation.length - 1 && showGradeForm && renderGradeForm()}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                  <Badge variant="outline" className="animate-pulse">AI is thinking...</Badge>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </CardContent>

        {(assessmentComplete || showReport) && (
          <div className="p-6 border-t bg-primary/5 text-center space-y-4">
            <div className="inline-flex items-center gap-2 text-primary font-bold">
              <Sparkles className="w-5 h-5" /> Assessment Complete!
            </div>
            <p className="text-xs text-muted-foreground">Your detailed career roadmap is ready for download.</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={downloadReport} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" /> Download PDF Report
              </Button>
              <Button size="sm" className="bg-primary text-white">
                Create Account <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {!showReport && !assessmentComplete && (
          <div className="p-4 border-t bg-white">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-3">
              <Input
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={handleSend} disabled={isLoading || !message.trim()} className="bg-primary text-white">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default GuestAIChat;
