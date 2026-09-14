import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { kuccpsService, KUCCPSCluster, SubjectMatch, calculateKCSEAggregate } from '@/lib/kuccps-service';
import { BookOpen, GraduationCap, Target, CheckCircle, XCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubjectSelectionGuideProps {
  initialSubjects?: string[];
  initialGrades?: Record<string, string>;
}

const CBC_PATHWAYS = {
  STEM: {
    name: 'STEM Pathway',
    subjects: [
      'Mathematics', 'Physics', 'Chemistry', 'Biology',
      'Computer Science', 'Geography', 'Agriculture',
      'Technical Drawing', 'Power Mechanics', 'Electricity',
      'Metalwork', 'Building Construction', 'Woodwork'
    ]
  },
  ARTS: {
    name: 'Arts & Sports Science',
    subjects: [
      'English Literature', 'Kiswahili', 'History', 'Geography',
      'Christian Religious Education', 'Islamic Religious Education',
      'Hindu Religious Education', 'Business Studies', 'Music',
      'Art & Design', 'Drama & Theatre', 'French', 'German',
      'Arabic', 'Chinese', 'Kenya Sign Language', 'Home Science',
      'Computer Studies'
    ]
  },
  SOCIAL: {
    name: 'Social Sciences',
    subjects: [
      'English Literature', 'Kiswahili', 'History', 'Geography',
      'Christian Religious Education', 'Islamic Religious Education',
      'Business Studies', 'Economics', 'Sociology', 'Psychology',
      'Political Science', 'Public Administration'
    ]
  },
  TECHVOC: {
    name: 'Technical & Vocational',
    subjects: [
      'Mathematics', 'Physics', 'Chemistry', 'Biology',
      'Technical Drawing', 'Power Mechanics', 'Electricity',
      'Metalwork', 'Building Construction', 'Woodwork',
      'Agriculture', 'Home Science', 'Computer Studies',
      'Business Studies', 'Art & Design'
    ]
  }
};

const GRADE_OPTIONS = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'];

export default function SubjectSelectionGuide({ initialSubjects = [], initialGrades = {} }: SubjectSelectionGuideProps) {
  const [step, setStep] = useState(1);
  const [selectedPathway, setSelectedPathway] = useState<keyof typeof CBC_PATHWAYS | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(initialSubjects);
  const [grades, setGrades] = useState<Record<string, string>>(initialGrades);
  const [clusters, setClusters] = useState<KUCCPSCluster[]>([]);
  const [matches, setMatches] = useState<SubjectMatch[]>([]);
  const [aggregate, setAggregate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadClusters();
  }, []);

  useEffect(() => {
    if (selectedSubjects.length > 0 && clusters.length > 0) {
      const matches = kuccpsService.matchSubjectsWithClusters(selectedSubjects, grades, clusters);
      setMatches(matches);
      
      if (Object.keys(grades).length > 0) {
        const agg = calculateKCSEAggregate(grades);
        setAggregate(agg);
      }
    }
  }, [selectedSubjects, grades, clusters]);

  const loadClusters = async () => {
    setIsLoading(true);
    try {
      const data = await kuccpsService.getAllClusters();
      setClusters(data);
    } catch (error) {
      toast({
        title: 'Error loading KUCCPS data',
        description: 'Could not load cluster information',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const setGrade = (subject: string, grade: string) => {
    setGrades(prev => ({ ...prev, [subject]: grade }));
  };

  const reset = () => {
    setStep(1);
    setSelectedPathway(null);
    setSelectedSubjects([]);
    setGrades({});
    setMatches([]);
  };

  const qualifiedClusters = matches.filter(m => m.isQualified);
  const partialMatches = matches.filter(m => !m.isQualified && m.matchPercentage >= 50);

  return (
    <div className="subject-selection-guide space-y-6">
      {/* Progress Indicator */}
      <div className="subject-guide-progress flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="subject-progress-item flex items-center flex-1">
            <div className={`subject-progress-dot w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
              step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {s}
            </div>
            {s < 4 && (
              <div className={`subject-progress-line flex-1 h-1 mx-2 transition-all ${
                step > s ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Pathway */}
      {step === 1 && (
        <Card className="subject-guide-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              Step 1: Choose Your CBC Pathway
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Select the senior secondary pathway that matches your interests and career goals.
            </p>
            <div className="subject-pathway-grid grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(CBC_PATHWAYS).map(([key, pathway]) => (
                <Card
                  key={key}
                  className={`subject-pathway-card cursor-pointer transition-all hover:shadow-md ${
                    selectedPathway === key ? 'border-primary border-2' : ''
                  }`}
                  onClick={() => setSelectedPathway(key as keyof typeof CBC_PATHWAYS)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{pathway.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {pathway.subjects.length} subjects available
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={!selectedPathway}
              className="subject-guide-primary w-full"
            >
              Continue to Subject Selection
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Subjects */}
      {step === 2 && selectedPathway && (
        <Card className="subject-guide-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-6 h-6" />
              Step 2: Select Your Subjects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Choose at least 7 subjects that you're taking or planning to take.
            </p>
            <div className="subject-chip-grid flex flex-wrap gap-2">
              {CBC_PATHWAYS[selectedPathway].subjects.map(subject => (
                <Badge
                  key={subject}
                  variant={selectedSubjects.includes(subject) ? 'default' : 'outline'}
                  className={`subject-choice-chip cursor-pointer ${selectedSubjects.includes(subject) ? 'subject-choice-selected' : ''}`}
                  onClick={() => toggleSubject(subject)}
                >
                  {subject}
                </Badge>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              Selected: {selectedSubjects.length} subjects
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={selectedSubjects.length < 7}
                className="subject-guide-primary flex-1"
              >
                Continue to Grade Entry (Optional)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Enter Grades (Optional) */}
      {step === 3 && (
        <Card className="subject-guide-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6" />
              Step 3: Enter Your Grades (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Enter your KCSE or predicted grades to see which clusters you qualify for based on requirements.
            </p>
            <div className="subject-grade-grid grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedSubjects.map(subject => (
                <div key={subject} className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-medium">{subject}</span>
                  <Select
                    value={grades[subject] || ''}
                    onValueChange={(value) => setGrade(subject, value)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_OPTIONS.map(grade => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {aggregate > 0 && (
              <div className="p-4 bg-primary/10 rounded-lg">
                <p className="font-bold">Your KCSE Aggregate: {aggregate}</p>
                <p className="text-sm text-muted-foreground">
                  Based on your top 7 subjects
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1">
                View Results
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Results */}
      {step === 4 && (
        <div className="space-y-6">
          {/* Summary */}
            <Card className="subject-results-summary">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold">Your KUCCPS Cluster Matches</h3>
                  <p className="text-muted-foreground">
                    Based on your {selectedSubjects.length} selected subjects
                    {aggregate > 0 && ` and aggregate of ${aggregate}`}
                  </p>
                </div>
                <Button variant="outline" onClick={reset}>
                  Start Over
                </Button>
              </div>
              <div className="subject-result-stats grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-background rounded-lg">
                  <div className="text-3xl font-bold text-emerald-600">{qualifiedClusters.length}</div>
                  <div className="text-sm text-muted-foreground">Fully Qualified</div>
                </div>
                <div className="p-4 bg-background rounded-lg">
                  <div className="text-3xl font-bold text-amber-600">{partialMatches.length}</div>
                  <div className="text-sm text-muted-foreground">Partial Matches</div>
                </div>
                <div className="p-4 bg-background rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{matches.length}</div>
                  <div className="text-sm text-muted-foreground">Total Clusters</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Qualified Clusters */}
          {qualifiedClusters.length > 0 && (
            <Card className="subject-guide-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-6 h-6" />
                  You Qualify For These Clusters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {qualifiedClusters.map(match => (
                  <ClusterCard key={match.cluster.id} match={match} variant="qualified" />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Partial Matches */}
          {partialMatches.length > 0 && (
            <Card className="subject-guide-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <Info className="w-6 h-6" />
                  Partial Matches (50%+ subjects)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {partialMatches.map(match => (
                  <ClusterCard key={match.cluster.id} match={match} variant="partial" />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Not Qualified */}
          {matches.filter(m => !m.isQualified && m.matchPercentage < 50).length > 0 && (
            <Card className="subject-guide-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <XCircle className="w-6 h-6" />
                  Other Clusters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {matches.filter(m => !m.isQualified && m.matchPercentage < 50).map(match => (
                  <ClusterCard key={match.cluster.id} match={match} variant="other" />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

interface ClusterCardProps {
  match: SubjectMatch;
  variant: 'qualified' | 'partial' | 'other';
}

function ClusterCard({ match, variant }: ClusterCardProps) {
  const borderColor = {
    qualified: 'border-emerald-500/30 bg-emerald-500/5',
    partial: 'border-amber-500/30 bg-amber-500/5',
    other: 'border-border bg-muted/30'
  }[variant];

  return (
    <Card className={`subject-cluster-card ${borderColor}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="text-lg font-bold mb-1">{match.cluster.name}</h4>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{match.matchPercentage}% match</span>
              {match.cluster.cutoff_estimate && (
                <span>Cutoff: {match.cluster.cutoff_estimate}</span>
              )}
            </div>
          </div>
          <Badge variant={variant === 'qualified' ? 'default' : 'outline'}>
            {match.matchPercentage}%
          </Badge>
        </div>

        {match.cluster.programmes.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">PROGRAMMES:</p>
            <div className="flex flex-wrap gap-1">
              {match.cluster.programmes.slice(0, 5).map(programme => (
                <Badge key={programme} variant="secondary" className="text-xs">
                  {programme}
                </Badge>
              ))}
              {match.cluster.programmes.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{match.cluster.programmes.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {match.cluster.universities && match.cluster.universities.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">WHERE TO STUDY:</p>
            <div className="flex flex-wrap gap-1">
              {match.cluster.universities.slice(0, 4).map(university => (
                <Badge key={university} variant="outline" className="text-xs">
                  {university}
                </Badge>
              ))}
              {match.cluster.universities.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{match.cluster.universities.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {variant === 'partial' && match.missingRequirements.length > 0 && (
          <div className="mt-3 p-3 bg-amber-500/10 rounded-lg">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
              Missing Requirements:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {match.missingRequirements.slice(0, 3).map((req, i) => (
                <li key={i}>• {req}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
