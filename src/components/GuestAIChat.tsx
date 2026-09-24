import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Bot, User, Sparkles, Loader2, Download, ArrowRight } from "lucide-react";
import { aiCareerService, type ChatMessage } from "@/lib/ai-service";
import { ReportGenerator, type GuestProfile } from "@/lib/report-generator";
import { MessageContent } from "@/components/chat/MessageContent";
import { ChatInput, type ChatInputHandle } from "@/components/chat/ChatInput";

const GuestAIChat = () => {
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestProfile, setGuestProfile] = useState<GuestProfile>({});
  const [assessmentComplete, setAssessmentComplete] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [connectionTest, setConnectionTest] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);

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
      
I'm your friendly career counselor, here to help you discover your perfect career path through Kenya's Competency-Based Curriculum (CBC)!

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
      if (text.includes('cbc') || text.includes('cbe')) {
        newProfile.curriculum = 'cbc';
      }
    }

    setGuestProfile(newProfile);
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
        guestProfile,
        0,
        'guest-preview'
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

      if (updatedConversation.length >= 10 && !assessmentComplete) {
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
    // Re-focus input after clearing
    setTimeout(() => chatInputRef.current?.focus(), 0);
    await handleSendMessage(currentMsg);
  };

  const downloadReport = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      // Generate structured recommendations based on the conversation context
      const recommendations = await aiCareerService.generateCareerRecommendations({
        name: guestProfile.name,
        curriculum: 'Kenyan CBC',
        currentGrade: guestProfile.grade,
        interests: guestProfile.interests
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
            <ChatInput
              ref={chatInputRef}
              message={message}
              onChange={setMessage}
              onSend={handleSend}
              disabled={isLoading}
              placeholder="Type your message here..."
              className="p-0"
              inputClassName="px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              buttonClassName="bg-primary text-white"
              aria-label="Chat message"
              autoFocus
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default GuestAIChat;
