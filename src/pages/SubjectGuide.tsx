import SubjectSelectionGuide from '@/components/SubjectSelectionGuide';
import { PersonalizedPathway } from '@/components/PersonalizedPathway';
import { useAuth } from '@/contexts/AuthContext';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Award, BookOpen, MessageSquare, Search, User } from 'lucide-react';
import { StudentAppHeader } from '@/components/StudentAppHeader';

export default function SubjectGuide() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  const initialSubjects = profile?.subjects || profile?.cbe_subjects || [];
  const initialGrades = profile?.grades || {};

  return (
    <div className="subject-guide-page student-courses-page student-shell min-h-screen text-foreground">
      <Helmet>
        <title>Subject Selection Guide | CareerGuide AI</title>
        <meta name="description" content="Discover which KUCCPS clusters and university programmes match your subject combinations. Interactive guide for Kenyan CBC students." />
      </Helmet>
      <StudentAppHeader />

      <main className="subject-guide-main max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-28 space-y-7">
        <div className="subject-guide-intro text-center">
          <p>KUCCPS subject guide</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Subject Selection Guide
          </h1>
          <span className="text-lg md:text-xl max-w-3xl mx-auto">
            Discover which KUCCPS clusters and university programmes match your CBC subject combinations
          </span>
        </div>

        {/* Personalized Pathway - Only show for logged-in users with subjects */}
        {profile && initialSubjects.length > 0 && (
          <PersonalizedPathway
            subjects={initialSubjects}
            grades={initialGrades}
            profile={profile}
          />
        )}

        {/* Interactive Selection Guide */}
        <SubjectSelectionGuide
          initialSubjects={initialSubjects}
          initialGrades={initialGrades}
        />
      </main>

      {user && <nav className="student-courses-nav" aria-label="Student navigation">
        <button type="button" onClick={() => navigate('/student')}><Award className="h-5 w-5" /><span>Home</span></button>
        <button type="button" onClick={() => navigate('/student', { state: { activeTab: 'careers' } })}><Search className="h-5 w-5" /><span>Explore</span></button>
        <button type="button" className="is-active"><BookOpen className="h-5 w-5" /><span>Plan</span></button>
        <button type="button" onClick={() => navigate('/student/chat')}><MessageSquare className="h-5 w-5" /><span>Chat</span></button>
        <button type="button" onClick={() => navigate('/student', { state: { activeTab: 'profile' } })}><User className="h-5 w-5" /><span>Profile</span></button>
      </nav>}
    </div>
  );
}
