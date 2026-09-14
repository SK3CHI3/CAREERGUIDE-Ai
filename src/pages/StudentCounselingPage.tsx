import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, Sparkles } from "lucide-react";
import AIChat from "@/components/AIChat";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const StudentCounselingPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const getInitials = (name: string | null) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="counseling-page min-h-screen flex flex-col">
      {/* Shared Header */}
      <header className="counseling-page-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate("/student")}
                className="counseling-back transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <img
                src="/logos/CareerGuide_Logo.webp"
                alt="CareerGuide AI"
                className="h-8 w-auto hidden sm:block"
              />
              <div className="h-4 w-px counseling-divider mx-2 hidden sm:block" />
              <div className="flex items-center gap-2">
                <Bot className="counseling-title-icon w-5 h-5" />
                <h1 className="counseling-page-title text-sm font-bold tracking-tight">Student support</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3 mr-2">
                <Avatar className="h-8 w-8 border border-primary/20">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="text-[10px] font-bold">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-bold text-foreground-muted">
                  {profile?.full_name?.split(' ')[0]}
                </span>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Focus Area */}
      <main className="counseling-main flex-1 flex flex-col max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">

        {/* Full Chat Interface container */}
        <div className="flex-1 flex flex-col h-[calc(100vh-220px)] sm:h-auto">
          <AIChat isStandalone={true} />
        </div>
      </main>
    </div>
  );
};

export default StudentCounselingPage;
