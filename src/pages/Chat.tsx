import { Helmet } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BackgroundGradient from "@/components/BackgroundGradient";
import AIChat from "@/components/AIChat";

const ChatPage = () => {
  return (
    <div className="min-h-screen text-foreground relative overflow-x-hidden">
      <Helmet>
        <title>AI Career Chat | CareerGuide AI</title>
        <meta name="description" content="Chat with our AI career counselor for free. Get personalized career guidance aligned with Kenya's CBC education system." />
      </Helmet>
      <BackgroundGradient />
      <Navigation />
      <main className="pt-20 pb-16">
        <AIChat isStandalone={true} />
      </main>
      <Footer />
    </div>
  );
};

export default ChatPage;
