import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Video, Shield, Clock, Users, CheckCircle2, BookOpen, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const CounselorBookingSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => {
    if (user) {
      navigate("/student/counselors");
    } else {
      navigate("/auth?mode=signup&role=student");
    }
  };

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-blue-500/[0.02] to-purple-500/[0.03]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">

          {/* LEFT: Visual */}
          <div className="relative order-2 md:order-1">
            <Card className="bg-gradient-to-br from-card to-card/80 border-card-border/60 shadow-2xl overflow-hidden">
              {/* Image representing career counseling */}
              <div className="h-48 sm:h-56 bg-gradient-to-br from-primary/10 via-blue-500/10 to-purple-500/10 flex items-center justify-center relative">
                {/* Logo watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.04]">
                  <img src="/logos/CareerGuide_Logo.webp" alt="" className="w-48 h-auto" />
                </div>
                {/* Career counseling image */}
                <img 
                  src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                  alt="Career counseling session" 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold text-green-600">Counselors Available</span>
                </div>

                <div className="space-y-4">
                  {/* Career Path Planning */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-card-border/40">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Career Path Planning</p>
                        <p className="text-[10px] text-muted-foreground">45 min</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-foreground">KSh 1,500</p>
                  </div>

                  {/* University Guidance */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-card-border/40">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">University Guidance</p>
                        <p className="text-[10px] text-muted-foreground">30 min</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-foreground">KSh 1,000</p>
                  </div>

                  {/* Subject Selection */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-card-border/40">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Subject Selection</p>
                        <p className="text-[10px] text-muted-foreground">30 min</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-foreground">KSh 800</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Floating badge */}
            <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-card rounded-xl p-3 sm:p-4 shadow-xl border border-primary/20 z-10">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Video className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="font-bold text-xs">Live Video</p>
                  <p className="text-[10px] text-muted-foreground">Verified experts</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Content */}
          <div className="order-1 md:order-2">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
              Book a Live
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600"> Career Call</span>
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed">
              Connect with verified career counselors for personalized 1-on-1 guidance.
              Get expert advice on university applications, career transitions, and academic planning tailored to Kenya's education system.
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm sm:text-base font-medium text-foreground">Verified professional counselors</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm sm:text-base font-medium text-foreground">Flexible scheduling</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm sm:text-base font-medium text-foreground">Secure video calls</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm sm:text-base font-medium text-foreground">Personalized career roadmap</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={handleCTA}
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-bold rounded-xl"
              >
                View Counselors
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/counselors")}
                className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg rounded-xl border-2"
              >
                Learn More
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Starting from KSh 800 per session • Instant booking
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CounselorBookingSection;
