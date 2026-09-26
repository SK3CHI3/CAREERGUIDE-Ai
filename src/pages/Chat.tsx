import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import BackgroundGradient from "@/components/BackgroundGradient";
import AIChat from "@/components/AIChat";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const ChatPage = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col text-foreground relative overflow-hidden bg-background">
      <Helmet>
        <title>AI Career Chat | CareerGuide AI</title>
        <meta name="description" content="Chat with our AI career counselor for free. Get personalized career guidance aligned with Kenya's CBC education system." />
      </Helmet>
      <BackgroundGradient />

      {/* Minimal header */}
      <header className="relative z-50 flex items-center justify-between px-4 sm:px-6 py-3 bg-card/80 backdrop-blur-md border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-2 text-foreground-muted hover:text-foreground"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Home</span>
        </Button>

        <div className="flex items-center gap-2">
          <img
            src="/logos/CareerGuide_Logo.webp"
            alt="CareerGuide AI"
            className="h-8 w-auto"
          />
        </div>

        <div className="w-16" /> {/* Spacer for centering */}
      </header>

      {/* Chat area - takes remaining space */}
      <main className="flex-1 overflow-hidden relative z-10">
        <AIChat isStandalone={true} />
      </main>
    </div>
  );
};

export default ChatPage;
