import { supabase } from './supabase';

export interface KUCCPSCluster {
  id: string;
  cluster_id: number;
  name: string;
  subjects: string[];
  min_requirements: Record<string, string>;
  programmes: string[];
  universities: string[];
  cutoff_estimate: string;
  is_active: boolean;
}

export interface SubjectMatch {
  cluster: KUCCPSCluster;
  matchedSubjects: string[];
  missingRequirements: string[];
  isQualified: boolean;
  matchPercentage: number;
}

export const kuccpsService = {
  async getAllClusters(): Promise<KUCCPSCluster[]> {
    const { data, error } = await supabase
      .from('kuccps_clusters')
      .select('*')
      .eq('is_active', true)
      .order('cluster_id');

    if (error) throw error;
    return data as KUCCPSCluster[];
  },

  async getClusterByProgramme(programme: string): Promise<KUCCPSCluster | null> {
    const { data, error } = await supabase
      .from('kuccps_clusters')
      .select('*')
      .contains('programmes', [programme])
      .eq('is_active', true)
      .single();

    if (error) return null;
    return data as KUCCPSCluster;
  },

  matchSubjectsWithClusters(
    selectedSubjects: string[],
    grades: Record<string, string>,
    clusters: KUCCPSCluster[]
  ): SubjectMatch[] {
    return clusters.map(cluster => {
      const matchedSubjects: string[] = [];
      const missingRequirements: string[] = [];

      cluster.subjects.forEach(requiredSubject => {
        const normalizedRequired = requiredSubject.toLowerCase();
        const hasMatch = selectedSubjects.some(selected => {
          const normalizedSelected = selected.toLowerCase();
          return normalizedRequired.includes(normalizedSelected) || 
                 normalizedSelected.includes(normalizedRequired.split('/')[0]);
        });

        if (hasMatch) {
          matchedSubjects.push(requiredSubject);
        } else {
          missingRequirements.push(requiredSubject);
        }
      });

      let gradeRequirementsMet = true;
      if (cluster.min_requirements && grades) {
        Object.entries(cluster.min_requirements).forEach(([subject, minGrade]) => {
          const studentGrade = grades[subject];
          if (studentGrade && !isGradeSufficient(studentGrade, minGrade)) {
            gradeRequirementsMet = false;
            missingRequirements.push(`${subject}: requires ${minGrade}, you have ${studentGrade}`);
          }
        });
      }

      const matchPercentage = Math.round((matchedSubjects.length / cluster.subjects.length) * 100);
      const isQualified = missingRequirements.length === 0 && gradeRequirementsMet;

      return {
        cluster,
        matchedSubjects,
        missingRequirements,
        isQualified,
        matchPercentage
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);
  }
};

function isGradeSufficient(studentGrade: string, requiredGrade: string): boolean {
  const gradeScale: Record<string, number> = {
    'A': 12, 'A-': 11, 'B+': 10, 'B': 9, 'B-': 8,
    'C+': 7, 'C': 6, 'C-': 5, 'D+': 4, 'D': 3, 'D-': 2, 'E': 1
  };

  const studentScore = gradeScale[studentGrade] || 0;
  const requiredScore = gradeScale[requiredGrade] || 0;

  return studentScore >= requiredScore;
}

export function calculateKCSEAggregate(grades: Record<string, string>): number {
  const gradePoints: Record<string, number> = {
    'A': 12, 'A-': 11, 'B+': 10, 'B': 9, 'B-': 8,
    'C+': 7, 'C': 6, 'C-': 5, 'D+': 4, 'D': 3, 'D-': 2, 'E': 1
  };

  const subjectGrades = Object.values(grades);
  const topGrades = subjectGrades
    .map(g => gradePoints[g] || 0)
    .sort((a, b) => b - a)
    .slice(0, 7);

  return topGrades.reduce((sum, grade) => sum + grade, 0);
}
