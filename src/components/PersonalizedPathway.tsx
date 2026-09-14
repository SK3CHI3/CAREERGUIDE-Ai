import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  BookOpen, 
  Building2, 
  Briefcase, 
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { kuccpsService } from '@/lib/kuccps-service';
import { useNavigate } from 'react-router-dom';

interface PersonalizedPathwayProps {
  subjects: string[];
  grades?: Record<string, string>;
  profile?: any;
}

const CBC_PATHWAYS = {
  STEM: {
    name: 'STEM Pathway',
    color: 'blue',
    subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Engineering', 'Technology']
  },
  ARTS: {
    name: 'Arts & Sports Science',
    color: 'purple',
    subjects: ['English', 'Kiswahili', 'History', 'Geography', 'CRE', 'IRE', 'Music', 'Art', 'Sports']
  },
  SOCIAL: {
    name: 'Social Sciences',
    color: 'emerald',
    subjects: ['English', 'Kiswahili', 'History', 'Geography', 'Economics', 'Business Studies', 'Psychology']
  },
  TECHVOC: {
    name: 'Technical & Vocational',
    color: 'orange',
    subjects: ['Mathematics', 'Physics', 'Technical Drawing', 'Power Mechanics', 'Electricity', 'Woodwork', 'Metalwork']
  }
};

export function PersonalizedPathway({ subjects, grades, profile }: PersonalizedPathwayProps) {
  const navigate = useNavigate();
  const [pathway, setPathway] = useState<keyof typeof CBC_PATHWAYS | null>(null);
  const [clusterMatches, setClusterMatches] = useState<any[]>([]);
  const [qualifiedUniversities, setQualifiedUniversities] = useState<string[]>([]);
  const [kcseAggregate, setKcseAggregate] = useState<number | null>(null);
  const [cutoffTier, setCutoffTier] = useState<string>('');

  useEffect(() => {
    if (subjects.length > 0) {
      detectPathway();
      matchClusters();
      if (grades && Object.keys(grades).length > 0) {
        calculateKCSEAggregate();
      }
    }
  }, [subjects, grades]);

  const detectPathway = () => {
    let maxScore = 0;
    let detectedPathway: keyof typeof CBC_PATHWAYS | null = null;

    Object.entries(CBC_PATHWAYS).forEach(([key, data]) => {
      const score = subjects.filter(s => 
        data.subjects.some(ds => s.toLowerCase().includes(ds.toLowerCase()))
      ).length;
      
      if (score > maxScore) {
        maxScore = score;
        detectedPathway = key as keyof typeof CBC_PATHWAYS;
      }
    });

    setPathway(detectedPathway);
  };

  const matchClusters = async () => {
    try {
      const clusters = await kuccpsService.getAllClusters();
      const gradesObj = grades || {};
      const matches = kuccpsService.matchSubjectsWithClusters(subjects, gradesObj, clusters);
      setClusterMatches(matches);

      // Aggregate universities from qualified clusters
      const universities = new Set<string>();
      matches.forEach(match => {
        if (match.isQualified) {
          match.cluster.universities.forEach(uni => universities.add(uni));
        }
      });
      setQualifiedUniversities(Array.from(universities));
    } catch (error) {
      console.error('Error matching clusters:', error);
    }
  };

  const calculateKCSEAggregate = () => {
    if (!grades) return;
    
    const gradePoints: Record<string, number> = {
      'A': 12, 'A-': 11, 'B+': 10, 'B': 9, 'B-': 8,
      'C+': 7, 'C': 6, 'C-': 5, 'D+': 4, 'D': 3, 'D-': 2, 'E': 1
    };

    const subjectGrades = Object.values(grades);
    const topGrades = subjectGrades
      .map(g => gradePoints[g] || 0)
      .sort((a, b) => b - a)
      .slice(0, 7);

    const aggregate = topGrades.reduce((sum, grade) => sum + grade, 0);
    setKcseAggregate(aggregate);

    // Determine cutoff tier
    if (aggregate >= 38) setCutoffTier('Very High (38-46)');
    else if (aggregate >= 34) setCutoffTier('High (34-39)');
    else if (aggregate >= 26) setCutoffTier('Medium (26-35)');
    else setCutoffTier('Low (20-27)');
  };

  const qualifiedClusters = clusterMatches.filter(m => m.isQualified);
  const partialClusters = clusterMatches.filter(m => !m.isQualified && m.matchPercentage >= 50);
  const notQualifiedClusters = clusterMatches.filter(m => !m.isQualified && m.matchPercentage < 50);

  const pathwayData = pathway ? CBC_PATHWAYS[pathway] : null;
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
    purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    orange: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30'
  };

  return (
    <Card className="personalized-pathway-card">
      <CardHeader>
        <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
          <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
          Your Personalized Pathway
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Based on your selected subjects and grades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pathway Badge */}
        {pathwayData && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm sm:text-base">Your CBC Pathway:</span>
            </div>
            <Badge className={`${colorClasses[pathwayData.color as keyof typeof colorClasses]} px-3 py-1 text-sm font-bold`}>
              {pathwayData.name}
            </Badge>
          </div>
        )}

        {/* Your Subjects */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm sm:text-base">Your Subjects ({subjects.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject, i) => (
              <Badge key={i} variant="outline" className="text-xs sm:text-sm">
                {subject}
                {grades && grades[subject] && (
                  <span className="ml-1 font-bold">({grades[subject]})</span>
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* KCSE Aggregate */}
        {kcseAggregate !== null && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">KCSE Aggregate</div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{kcseAggregate}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Cutoff Tier</div>
                <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700">
                  {cutoffTier}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* KUCCPS Clusters */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm sm:text-base">KUCCPS Clusters You Qualify For</span>
          </div>
          
          {qualifiedClusters.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Fully Qualified ({qualifiedClusters.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {qualifiedClusters.slice(0, 6).map((match, i) => (
                  <div key={i} className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                    <div className="font-medium text-sm text-emerald-900 dark:text-emerald-100">
                      {match.cluster.name}
                    </div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                      {match.matchPercentage}% match
                    </div>
                    {match.cluster.programmes && match.cluster.programmes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {match.cluster.programmes.slice(0, 2).map((prog: string, j: number) => (
                          <Badge key={j} variant="outline" className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                            {prog}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {qualifiedClusters.length > 6 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/subject-guide')}
                  className="text-primary hover:text-primary/80"
                >
                  View all {qualifiedClusters.length} qualified clusters →
                </Button>
              )}
            </div>
          )}

          {partialClusters.length > 0 && (
            <div className="space-y-2 mt-4">
              <div className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Partial Match - Missing Requirements ({partialClusters.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {partialClusters.slice(0, 3).map((match, i) => (
                  <div key={i} className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <div className="font-medium text-sm text-amber-900 dark:text-amber-100">
                      {match.cluster.name}
                    </div>
                    <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      {match.matchPercentage}% match
                    </div>
                    {match.missingRequirements && match.missingRequirements.length > 0 && (
                      <div className="mt-2 text-[10px] text-amber-600 dark:text-amber-400">
                        Missing: {match.missingRequirements.slice(0, 2).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {qualifiedClusters.length === 0 && partialClusters.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <XCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No clusters matched yet. Add more subjects or adjust your grades.</p>
            </div>
          )}
        </div>

        {/* Universities */}
        {qualifiedUniversities.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm sm:text-base">Universities You Can Study At</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {qualifiedUniversities.slice(0, 10).map((uni, i) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className="text-xs sm:text-sm py-1 px-2 sm:px-3 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                >
                  {uni}
                </Badge>
              ))}
              {qualifiedUniversities.length > 10 && (
                <Badge variant="outline" className="text-xs sm:text-sm bg-muted">
                  +{qualifiedUniversities.length - 10} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Career Outcomes */}
        {qualifiedClusters.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm sm:text-base">Career Outcomes</span>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-3">
                Based on your qualified clusters, explore careers in:
              </p>
              <div className="flex flex-wrap gap-2">
                {qualifiedClusters.slice(0, 5).map((match, i) => (
                  <Badge key={i} variant="secondary" className="text-xs sm:text-sm">
                    {match.cluster.name}
                  </Badge>
                ))}
              </div>
              <Button 
                variant="link" 
                onClick={() => navigate('/careers')}
                className="mt-3 text-sm p-0 h-auto"
              >
                Explore all career paths →
              </Button>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
          <Button 
            onClick={() => navigate('/subject-guide')}
            className="flex-1"
          >
            Explore & Adjust Your Pathway
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/student/chat')}
            className="flex-1"
          >
            Discuss with AI Counselor
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
