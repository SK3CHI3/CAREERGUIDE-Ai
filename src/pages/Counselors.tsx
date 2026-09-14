import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, GraduationCap, Award, BookOpen, MessageSquare, Search, User } from "lucide-react";
import { CounselorDirectory } from "@/components/CounselorDirectory";
import { StudentAppHeader } from "@/components/StudentAppHeader";

const Counselors = () => {
  const navigate = useNavigate();
  return (
    <div className="student-courses-page student-shell min-h-screen">
      <StudentAppHeader />

      <main className="student-courses-content max-w-5xl py-8 pb-28">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 sm:mb-6 hover:bg-muted font-bold text-xs"
          onClick={() => navigate("/student")}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
 
        <div className="relative mb-8 sm:mb-12">
          {/* Background Watermark Logo */}
          <div className="absolute -top-10 -right-10 sm:-top-16 sm:-right-16 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
            <img src="/logos/CareerGuide_Logo.webp" alt="" className="w-48 sm:w-80 h-auto grayscale" />
          </div>
 
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
              <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              Specialized Counselors
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Connect with verified experts to build your professional roadmap.
            </p>
          </div>
        </div>


        <CounselorDirectory />
      </main>
      <nav className="student-courses-nav" aria-label="Student navigation">
        <button type="button" onClick={() => navigate('/student')}><Award className="h-5 w-5" /><span>Home</span></button>
        <button type="button" onClick={() => navigate('/student', { state: { activeTab: 'careers' } })}><Search className="h-5 w-5" /><span>Explore</span></button>
        <button type="button" onClick={() => navigate('/student', { state: { activeTab: 'progress' } })}><BookOpen className="h-5 w-5" /><span>Plan</span></button>
        <button type="button" onClick={() => navigate('/student/chat')}><MessageSquare className="h-5 w-5" /><span>Chat</span></button>
        <button type="button" onClick={() => navigate('/student', { state: { activeTab: 'profile' } })}><User className="h-5 w-5" /><span>Profile</span></button>
      </nav>
    </div>
  );
};

export default Counselors;
