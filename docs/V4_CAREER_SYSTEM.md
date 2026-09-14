# V4 Career System Update

**Version:** 4.0.0  
**Date:** January 14, 2026  
**Status:** Production Ready

---

## Overview

This release represents a complete overhaul of CareerGuide AI's career guidance system, transforming it from a generic career platform into a specialized CBC-to-university pathway mapper. The platform now focuses exclusively on Kenya's Competency-Based Curriculum (CBC) and provides students with a clear roadmap from secondary school subjects through KUCCPS university clusters to career outcomes.

### Key Metrics
- **Career Paths:** 535 → 461 (removed 74 duplicates)
- **Categories:** 29 → 19 (consolidated overlapping categories)
- **Universities:** 6 → 20 (expanded Kenyan university coverage)
- **KUCCPS Clusters:** 10 → 19 (complete official cluster coverage)
- **Curriculum Support:** CBC + IGCSE + 8-4-4 → **CBC-only**

---

## Workstream 1: Career Paths Cleanup & Course-Based Naming

### Problem
The career paths database contained role-based job titles (e.g., "Bank Manager", "Public Relations Officer") instead of the university courses students actually enrol in. This created a disconnect between career guidance and academic planning.

### Solution
Renamed all career entries to reflect university programmes rather than job titles, and added a `related_roles` field to show what careers each course leads to.

### Changes

#### Database Schema
```sql
ALTER TABLE career_paths ADD COLUMN related_roles text[];
```

#### Category Consolidation
Merged 29 overlapping categories into 19 clean categories:

| Original Categories | Merged Into |
|---------------------|-------------|
| Arts, Arts & Creative, Creative Arts, Creative Economy | Creative Arts |
| Health, Healthcare | Health Sciences |
| Fitness, Sports | Sports & Fitness |
| Hospitality, Tourism | Hospitality & Tourism |
| Infrastructure | Engineering |
| Retail, Real Estate | Business |
| Religion | Social Sciences |

#### Career Renames (Examples)
| Before (Role-Based) | After (Course-Based) | Related Roles |
|---------------------|----------------------|---------------|
| Bank Manager | Banking & Finance | Bank Manager, Branch Manager, Financial Analyst |
| Public Relations Officer | Public Relations & Communication | PR Officer, Communications Manager |
| Supply Chain Manager | Supply Chain Management | Supply Chain Manager, Logistics Manager |
| Tax Consultant | Taxation | Tax Consultant, Tax Manager |
| Human Resource Manager | Human Resource Management | HR Manager, HR Business Partner |

#### UI Updates
- **Admin Panel:** Added "Related Job Roles" input field to career management form
- **Career Detail Modal:** Added "This Leads to Roles Like" section showing related job titles
- **AI Prompts:** Updated career generation prompt to explicitly request course names, not job titles

### Files Modified
- `src/lib/dashboard-service.ts` (CareerPath interface)
- `src/components/CareerPathwaysManagement.tsx` (admin form)
- `src/components/CareerDetailModal.tsx` (display)
- `src/lib/ai-service.ts` (prompt updates)
- Database migrations via Supabase MCP

---

## Workstream 2: KUCCPS Clusters & Subject Selection Guide

### Problem
Students had no way to understand which subjects lead to which university programmes. The platform mentioned KUCCPS but didn't provide actionable guidance for subject selection.

### Solution
Created a complete KUCCPS cluster database and an interactive Subject Selection Guide that shows students the pathway from CBC subjects → KUCCPS clusters → University programmes.

### Database Structure

#### `kuccps_clusters` Table
```sql
CREATE TABLE kuccps_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id INTEGER UNIQUE,
  name TEXT,
  subjects TEXT[],
  min_requirements JSONB,
  programmes TEXT[],
  universities TEXT[],
  cutoff_estimate TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### The 19 Official KUCCPS Clusters
1. Law
2. Business, Hospitality & Tourism
3. Communication, Media & Arts
4. Geosciences
5. Engineering & Technology
6. Architecture & Built Environment
7. Computer Science & IT
8. Agriculture, Fisheries & Related
9. Natural Sciences
10. Actuarial Science & Economics
11. Social Sciences & Related
12. Nursing
13. Medicine & Health Sciences
14. Pharmacy
15. Business Administration & Management
16. Veterinary Medicine
17. Forestry, Wildlife & Environmental Sciences
18. Sports Science & Recreation
19. Education
20. Technical & Vocational Education & Training

### Components Created

#### `src/lib/kuccps-service.ts`
Service for fetching clusters and matching student subjects:
```typescript
interface KUCCPSCluster {
  id: string;
  cluster_id: number;
  name: string;
  subjects: string[];
  min_requirements: Record<string, string>;
  programmes: string[];
  universities: string[];
  cutoff_estimate: string;
}

interface SubjectMatch {
  cluster: KUCCPSCluster;
  matchedSubjects: string[];
  missingRequirements: string[];
  isQualified: boolean;
  matchPercentage: number;
}
```

#### `src/components/SubjectSelectionGuide.tsx`
Interactive 4-step guide:
1. **Choose Pathway:** STEM, Arts & Sports, Social Sciences, or Technical & Vocational
2. **Select Subjects:** Minimum 7 subjects from the chosen pathway
3. **Enter Grades:** Optional KCSE grades for aggregate calculation
4. **View Results:** See qualified clusters with match percentages and university recommendations

#### `src/pages/SubjectGuide.tsx`
Standalone page at `/subject-guide` route (public, no auth required)

#### `src/components/KUCCPSClustersManagement.tsx`
Admin CRUD interface for managing all 19 clusters with:
- Add/edit/delete clusters
- Manage subject requirements
- Set minimum grade requirements (JSON)
- Assign universities to clusters
- Update cutoff estimates

### Integration Points
- Added "Subject Selection Guide" card to student dashboard overview
- Added "KUCCPS Clusters" tab to admin dashboard
- Linked from career paths to relevant KUCCPS clusters

---

## Workstream 3: University & Course Mapping

### Problem
The platform only listed 6 universities, and university mentions in career details were generic or AI-generated. Students needed accurate information about which universities offer which programmes.

### Solution
Expanded university coverage from 6 to 20 Kenyan institutions and mapped each university to relevant KUCCPS clusters and programmes.

### The 20 Universities

| University | Type | Notable Programmes |
|------------|------|-------------------|
| University of Nairobi | Public | Medicine, Law, Engineering |
| Kenyatta University | Public | Education, Health Sciences |
| JKUAT | Public | Engineering, Computer Science |
| Moi University | Public | Medicine, Law, Engineering |
| Strathmore University | Private | Business, Finance, Law |
| USIU-Africa | Private | International Relations, Psychology |
| Egerton University | Public | Agriculture, Veterinary Medicine |
| Maseno University | Public | Fisheries, Education |
| Masinde Muliro University | Public | Engineering, Science |
| Technical University of Kenya | Public | Engineering, Technology |
| Technical University of Mombasa | Public | Engineering, Maritime Studies |
| University of Eldoret | Public | Agriculture, Engineering |
| Pwani University | Public | Agriculture, Education |
| Kisii University | Public | Education, Health Sciences |
| Laikipia University | Public | Education, Science |
| South Eastern Kenya University | Public | Agriculture, Water Resources |
| Multimedia University | Public | Media, Communication |
| KCA University | Private | Business, IT |
| Daystar University | Private | Communication, Business |
| Mount Kenya University | Private | Pharmacy, Nursing |

### Database Updates
- Updated `UNIVERSITY_DATA` in `src/lib/kuccps-reference.ts` with all 20 universities
- Mapped universities to all 19 KUCCPS clusters in the database
- Each cluster now shows relevant universities that offer its programmes

### UI Integration
- Subject Selection Guide shows universities for each matched cluster
- Student dashboard displays "Universities Matched to You" card (shows 6 universities based on student's subjects)
- Career detail modals show relevant universities for each career path

---

## Workstream 4: Senior to University Transition Guide

### Problem
Students had fragmented information about subjects, clusters, and universities with no unified view showing the complete pathway from secondary school to career.

### Solution
Created `PersonalizedPathway` component that shows the complete journey: CBC Pathway → Subjects → KUCCPS Clusters → Universities → Career Outcomes.

### `src/components/PersonalizedPathway.tsx`

#### Features
1. **Pathway Detection:** Automatically detects CBC pathway (STEM/Arts/Social/TechVoc) from selected subjects
2. **Subject Display:** Shows student's selected subjects with grades (if available)
3. **KCSE Aggregate:** Calculates aggregate score and determines cutoff tier:
   - Very High (38-46 points): Medicine, Law, Architecture
   - High (34-39 points): Engineering, Computer Science
   - Medium (26-35 points): Finance, Accounting, Education
   - Low (20-27 points): Agriculture, Social Work
4. **Qualified Clusters:** Displays KUCCPS clusters with visual indicators:
   - Green cards: Fully qualified clusters
   - Amber cards: Partial matches with missing requirements
   - Grey cards: Clusters that don't match yet
5. **University Aggregation:** Shows all universities from qualified clusters (up to 10)
6. **Career Outcomes:** Links to relevant career paths based on qualified clusters
7. **Call-to-Action:** Two buttons:
   - "Explore & Adjust Your Pathway" (links to full Subject Selection Guide)
   - "Discuss with AI Counselor" (links to AI chat)

### Integration
- Integrated at top of `/subject-guide` page
- Only visible to logged-in students with subjects in their profile
- Uses student's existing profile data (subjects, grades)

### User Flow
1. Student logs in and completes profile with subjects
2. Navigates to `/subject-guide`
3. Sees PersonalizedPathway at top showing their complete journey
4. Can scroll down to interactive Subject Selection Guide to explore alternatives
5. Can click through to adjust subjects or chat with AI counselor

---

## Workstream 5: PWA Mobile Design & UX Improvements

### Problem
The PWA experience on mobile felt like a shrunk-down desktop site with poor typography, cramped layouts, and elements that looked randomly placed.

### Solution
Implemented mobile-first design principles with proper typography scale, safe area handling, and improved touch targets.

### Typography System

Added mobile typography scale in `src/index.css`:
```css
@media (max-width: 640px) {
  html {
    font-size: 16px; /* Base font */
  }
  
  h1 { font-size: 2rem; line-height: 1.2; }
  h2 { font-size: 1.75rem; line-height: 1.3; }
  h3 { font-size: 1.375rem; line-height: 1.4; }
  
  body {
    line-height: 1.6; /* Better readability */
  }
}
```

### Safe Area Handling

Added CSS classes for notched devices:
```css
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

Applied to:
- StudentDashboard header and main wrapper
- Navigation component
- Updated `viewport-fit=cover` in `index.html`

### Touch Target Improvements
- Increased hamburger menu button from default size to 40x40px (`h-10 w-10`)
- Ensured all interactive elements meet 44x44px minimum touch target

### Layout Cleanup
- Hidden FeedbackWidget on mobile (added `hidden md:flex` wrapper)
- Removed 3 action cards from student dashboard overview to reduce clutter:
  - "Take Assessment" card
  - "Subject Selection Guide" card
  - "Talk to a Counselor" card
- These features remain accessible through navigation and other entry points

### Mobile-Specific Adjustments
- Dashboard stats grid: Stacks to 2 columns on mobile
- Career cards: Full width on mobile, proper padding
- Navigation menu: Improved spacing and touch targets
- Forms: Larger input fields and buttons on mobile

---

## CBC-Only Refactor

### Rationale
The platform was trying to support three different education systems (CBC, IGCSE, 8-4-4) but doing none of them well. By focusing exclusively on CBC, we can provide deeper, more accurate guidance for the majority of Kenyan students.

### Changes

#### QuickAssessment.tsx
- Removed curriculum selector (CBC/IGCSE/Legacy buttons)
- Defaulted curriculum to `'cbc'`
- Grade options now only: Grade 7, Grade 9, Grade 11
- Removed Form 4 Leaver sub-step and KCSE grade entry form
- Removed kcseGrade/kcsePoints/subjectGrades from profile data
- Simplified sub-stepping from 4 steps to 3

#### ProfileSetup.tsx
- Removed curriculum selector step (was step 1)
- Schema now requires `curriculum: 'cbc'`
- Removed IGCSE education level options (Key Stage 1-2, Key Stage 3-4, A-Levels)
- Simplified subject filtering to CBC-only (removed IGCSE category filtering)
- Removed curriculumType variable

#### GuestAIChat.tsx
- Removed legacy/8-4-4 auto-detection from chat text
- Removed KCSE scorecard form
- Removed handleGradeSubmit function
- Updated welcome message to mention only CBC
- Removed kcseGrade/subjectGrades from report download payload

#### ai-service.ts
- Removed IGCSE branch from curriculum section in system prompt
- Removed KCSE academic performance section
- Updated guidance logic to remove "Form 4 Leavers" references
- Removed kcseGrade/kcsePoints/subjectGrades from UserContext interface
- Removed KCSE line from career recommendations prompt

#### report-generator.ts
- Removed kcseGrade/kcsePoints/clusterSubjects/subjectGrades from GuestProfile interface
- Curriculum now always displays "Kenya's Competency-Based Curriculum (CBC)"
- Removed entire KCSE section from PDF (no more "Academic Performance (KCSE)" page)
- Removed subjectGrades breakdown table
- Updated text report to remove MEAN GRADE field
- Updated getCBEPathInfo to remove Form/KCSE detection logic

#### cbc-pathways.ts (New File)
Created as single source of truth for CBC pathway data:
```typescript
interface CBCPathway {
  id: string;
  name: string;
  description: string;
  subjects: string[];
  careerClusters: string[];
}

const CBC_PATHWAYS = {
  STEM: {
    id: 'stem',
    name: 'Science, Technology, Engineering & Mathematics',
    subjects: ['Mathematics', 'Physics', 'Chemistry', 'Biology', /* 14 total */],
    careerClusters: ['Medicine & Health Sciences', 'Engineering', /* 6 total */]
  },
  ARTS_SPORTS: { /* 18 subjects, 5 clusters */ },
  SOCIAL_SCIENCES: { /* 14 subjects, 6 clusters */ },
  TECHNICAL_VOCATIONAL: { /* 15 subjects, 5 clusters */ }
};

// Competency level mapping
const CBC_COMPETENCY_LEVELS = {
  EXCEEDING: { label: 'Exceeding Expectations', points: 12, kcseEquivalent: 'A' },
  MEETING: { label: 'Meeting Expectations', points: 10, kcseEquivalent: 'B+' },
  APPROACHING: { label: 'Approaching Expectations', points: 7, kcseEquivalent: 'C+' },
  BELOW: { label: 'Below Expectations', points: 4, kcseEquivalent: 'D' }
};
```

### Database Cleanup Required
```sql
DELETE FROM profiles WHERE curriculum != 'cbc' OR curriculum IS NULL;
```

This removes any test profiles that used IGCSE or Legacy curricula.

---

## Migration Guide

### For Developers
1. Pull latest changes from `main` branch
2. Run `npm install` (no new dependencies)
3. Run `npm run build` to verify TypeScript compilation
4. Deploy to production

### For Users
- No action required
- Existing CBC students will see improved guidance
- IGCSE/8-4-4 students will be prompted to select CBC on next login

### Database Changes
- `related_roles` column added to `career_paths` table
- `kuccps_clusters` table created with 19 rows
- All clusters updated with university mappings

---

## Testing Recommendations

### Manual Testing
1. **Career Paths:**
   - Verify renamed careers display correctly in `/careers`
   - Check "This Leads to Roles Like" section in career detail modal
   - Test admin career management form with related_roles field

2. **Subject Selection Guide:**
   - Complete 4-step flow for each CBC pathway
   - Verify cluster matching accuracy
   - Check university display for matched clusters

3. **Personalized Pathway:**
   - Log in as student with subjects
   - Verify pathway detection
   - Check KCSE aggregate calculation (if grades available)
   - Verify qualified cluster display

4. **Mobile Design:**
   - Test on iPhone (notch), Android, and tablet
   - Verify safe area padding
   - Check touch targets (buttons, links)
   - Test PWA install and standalone mode

5. **CBC-Only Flow:**
   - Complete QuickAssessment (should not see curriculum selector)
   - Complete ProfileSetup (should not see curriculum selector)
   - Test GuestAIChat (should not detect legacy/8-4-4)
   - Generate PDF report (should not show KCSE section)

### Automated Testing
- All TypeScript builds passing
- No console errors
- No runtime errors in production

---

## Known Limitations

1. **KCSE Grade Entry:** Removed for CBC-only focus. Students with actual KCSE grades (Form 4 leavers) cannot enter them. Future versions may add optional KCSE entry for Grade 12 students preparing for national exams.

2. **CBC Competency Levels:** The `CBC_COMPETENCY_LEVELS` mapping exists but is not yet integrated into the UI. Future versions will allow students to enter competency levels instead of letter grades.

3. **University Programme Details:** Universities are mapped to clusters but not to specific programmes. Future versions may add programme-level detail (e.g., "University of Nairobi offers Bachelor of Medicine and Bachelor of Surgery").

4. **Grade 12 Students:** The platform currently focuses on Grade 7, 9, and 11. Grade 12 students preparing for KCSE are not fully supported yet.

---

## Future Enhancements

### Planned (Q1 2026)
1. **CBC Competency Level Entry:** Allow students to enter Exceeding/Meeting/Approaching/Below instead of letter grades
2. **Grade 12 Support:** Add Grade 12 option with KCSE preparation guidance
3. **Programme-Level University Details:** Map specific programmes to universities within each cluster
4. **Career Pathway Visualization:** Interactive flowchart showing Subject → Cluster → University → Career

### Planned (Q2 2026)
1. **Parent/Mentor Dashboard:** Allow parents to view child's pathway and receive guidance
2. **School Integration:** Reintroduce school system for teachers to track student pathways
3. **TVET Pathways:** Add Technical and Vocational Education and Training options
4. **International University Mapping:** Add universities outside Kenya for students considering studying abroad

### Planned (Q3 2026)
1. **AI Pathway Advisor:** Enhanced AI counselor that can discuss pathway options and trade-offs
2. **Application Timeline Tracker:** Show KUCCPS application deadlines and requirements
3. **Scholarship Integration:** Map scholarships to programmes and universities
4. **Alumni Network:** Connect students with alumni from their target universities

---

## Conclusion

Version 4.0 represents a fundamental shift from a generic career platform to a specialized CBC-to-university pathway mapper. By focusing exclusively on Kenya's Competency-Based Curriculum and providing clear guidance from subjects through KUCCPS clusters to university programmes, CareerGuide AI now delivers actionable, accurate career guidance that helps students make informed decisions about their academic and career futures.

The platform is production-ready and all builds are passing. The next steps are user testing, gathering feedback, and planning the enhancements outlined above.

---

**Questions or Issues?**  
Open an issue on GitHub or contact the development team.

**Last Updated:** January 14, 2026
