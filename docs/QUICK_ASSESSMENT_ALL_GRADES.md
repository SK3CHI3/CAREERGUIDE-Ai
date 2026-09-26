# Quick Assessment: All CBC Grades Implementation Plan

## Overview

Add support for all CBC grades (7-12) instead of just Grades 7, 9, and 11. Each grade has unique educational contexts and needs different guidance focus areas.

## Grade-Specific Contexts

### Junior Secondary School (Grades 7-9)

**Grade 7 - Transition & Exploration**
- Context: First year of Junior Secondary. Broad exploration, no specialisation yet.
- Focus: Discovering interests across all subjects, understanding CBC structure
- Key Questions: What do I enjoy? What am I curious about?
- Subjects: All 12 core subjects (no specialisation yet)
- Performance Context: Establishing baseline performance in all areas
- Parental Focus: Supporting exploration, not pushing specialisation
- School Pathways: Understanding the 3 Senior Secondary pathways (STEM, Arts & Sports, Social Sciences)

**Grade 8 - Performance Matters**
- Context: Mid Junior Secondary. Performance in Grades 8-9 counts for 20% of pathway placement.
- Focus: Identifying strengths, building evidence through projects and clubs
- Key Questions: Where do I excel? What evidence can I build?
- Subjects: All 12 core subjects (beginning to see patterns)
- Performance Context: Grades 8-9 performance = 20% of pathway decision
- Parental Focus: Aligning expectations with student's emerging strengths
- School Pathways: Exploring which pathway matches interests and performance

**Grade 9 - Final Decision**
- Context: Final Junior Secondary year. KJSEA summative assessment (60% weight) determines pathway.
- Focus: Confirming pathway choice, preparing for transition
- Key Questions: Which pathway am I best suited for? Am I ready for Senior Secondary?
- Subjects: All 12 core subjects (performance patterns now clear)
- Performance Context: KJSEA = 60% of pathway decision, Grades 8-9 = 20%, total = 80%
- Parental Focus: Final alignment before Senior Secondary pathway commitment
- School Pathways: Making the final pathway choice

### Senior Secondary School (Grades 10-12)

**Grade 10 - Confirming the Pathway**
- Context: First year of Senior Secondary. Just committed to a pathway.
- Focus: Confirming the pathway choice is right, exploring subjects in depth
- Key Questions: Did I choose the right pathway? What subjects should I prioritise?
- Subjects: Pathway-specific subjects (STEM/Arts/Social Sciences/TechVoc)
- Performance Context: Building foundation for KCSE, pathway is now locked in
- Parental Focus: Supporting the chosen pathway, not second-guessing
- School Pathways: Already chosen, focus is on subject selection within pathway

**Grade 11 - Building Evidence**
- Context: Mid Senior Secondary. Building evidence for post-secondary applications.
- Focus: Deepening subject knowledge, exploring career fields within pathway
- Key Questions: What career fields match my pathway? What evidence do I need?
- Subjects: Pathway-specific subjects (deeper specialisation)
- Performance Context: Building academic record for university/college applications
- Parental Focus: Understanding post-secondary options (KUCCPS, self-sponsored, etc.)
- School Pathways: Exploring career fields and training routes within chosen pathway

**Grade 12 - Applications & Decisions**
- Context: Final year. Applications, KUCCPS, post-secondary planning.
- Focus: Applications, cut-off marks, final decisions
- Key Questions: What are my options? What do I need for my chosen career field?
- Subjects: Pathway-specific subjects (final year, performance critical)
- Performance Context: KCSE results determine university placement via KUCCPS
- Parental Focus: Supporting application process, understanding cut-off marks
- School Pathways: Final career field selection, application strategy

## Implementation Changes

### 1. Update GRADES Array

```typescript
const GRADES = { 
  cbc: ["Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"] 
};
```

### 2. Update Subject Logic

```typescript
const getAvailableSubjects = () => {
  if (!grade) return [];
  
  // Junior Secondary (Grades 7-9): All 12 core subjects
  if (['Grade 7', 'Grade 8', 'Grade 9'].includes(grade)) {
    return SUBJECT_DATA.cbc_junior;
  }
  
  // Senior Secondary (Grades 10-12): Pathway-specific subjects
  if (['Grade 10', 'Grade 11', 'Grade 12'].includes(grade)) {
    if (!pathway) return [];
    return SUBJECT_DATA[`cbc_senior_${pathway}` as keyof typeof SUBJECT_DATA];
  }
  
  return [];
};
```

### 3. Update Pathway Selection Logic

```typescript
// Show pathway selection for Senior Secondary grades
if (['Grade 10', 'Grade 11', 'Grade 12'].includes(grade) && !pathway) {
  return setError("Please select your Senior Secondary pathway");
}
```

### 4. Update Validation Logic

**Grades 7-9 (Junior Secondary):**
- Step 1: Identity & Academics (name, email, grade, subjects, performance)
- Step 2: Interests & Activities (clubs, interests)
- Step 3: Parent Expectations (parent expectations, alignment)
- Step 4: Your Vision (future vision)
- Step 5: Results

**Grades 10-12 (Senior Secondary):**
- Step 1: Identity & Academics (name, email, grade, pathway, subjects, performance)
- Step 2: Interests & Activities (clubs, interests)
- Step 3: Your Vision (future vision)
- Step 4: Your Plans (post-secondary plan, budget, challenges)
- Step 5: Results

### 5. Update School Pathways Logic

```typescript
// School pathways question only for Junior Secondary
if (['Grade 7', 'Grade 8', 'Grade 9'].includes(grade) && schoolPathways.length === 0) {
  return setError("Please select which pathways your school offers");
}
```

### 6. Update AI Prompt Context

**Grade 7:**
```
Focus on broad exploration across all subjects. Help the student discover interests and strengths. Emphasise that this is a time for exploration, not specialisation. Discuss all 12 core subjects and how they connect to different career fields.
```

**Grade 8:**
```
Focus on identifying emerging patterns in performance and interests. Explain that Grades 8-9 performance counts for 20% of pathway placement. Help the student build evidence through projects and clubs. Discuss how current performance is shaping pathway options.
```

**Grade 9:**
```
Focus on final pathway decision. Explain that KJSEA (60%) + Grades 8-9 (20%) = 80% of pathway placement. Help the student confirm their pathway choice and prepare for Senior Secondary transition. Discuss the three pathways and which one matches their profile.
```

**Grade 10:**
```
Focus on confirming the pathway choice is right. Help the student explore subjects within their chosen pathway in depth. Discuss how pathway subjects connect to career fields. Address any concerns about the pathway choice and how to adjust if needed.
```

**Grade 11:**
```
Focus on building evidence for post-secondary applications. Help the student explore career fields within their pathway. Discuss training routes (university, college, TVET) and what evidence is needed. Address budget considerations and application timelines.
```

**Grade 12:**
```
Focus on applications and final decisions. Help the student understand KUCCPS cut-off marks and placement. Discuss application strategy and backup options. Address final career field selection based on expected KCSE performance.
```

### 7. Update Career Fields Grade Appropriateness

```sql
-- Update all career_fields to include all grades
UPDATE career_fields 
SET grade_appropriateness = ARRAY['7', '8', '9', '10', '11', '12']
WHERE grade_appropriateness = ARRAY['7', '8', '9', '11'];

-- For fields that were only for Grade 11, now include Grade 10 and 12
UPDATE career_fields 
SET grade_appropriateness = ARRAY['10', '11', '12']
WHERE grade_appropriateness = ARRAY['11'];
```

### 8. Update UI/UX

**Progress Bar:**
- All grades now show 5 steps (consistent)

**Step Labels:**
- Junior Secondary (7-9): "Your Vision" (Step 4)
- Senior Secondary (10-12): "Your Plans" (Step 4)

**Grade-Specific Messaging:**
- Grade 7: "Discover your interests across all subjects"
- Grade 8: "Build evidence and identify your strengths"
- Grade 9: "Make your final pathway choice"
- Grade 10: "Confirm your pathway and explore deeper"
- Grade 11: "Build your application portfolio"
- Grade 12: "Plan your post-secondary journey"

### 9. Update PDF Report

Add grade-specific sections:
- **Grade 7:** "Your Exploration Journey" - focus on all subjects and interests
- **Grade 8:** "Building Your Evidence" - focus on performance patterns and projects
- **Grade 9:** "Your Pathway Decision" - focus on KJSEA and pathway choice
- **Grade 10:** "Confirming Your Path" - focus on pathway subjects and career fields
- **Grade 11:** "Your Application Plan" - focus on training routes and evidence
- **Grade 12:** "Your Post-Secondary Strategy" - focus on applications and cut-off marks

## Testing Checklist

- [ ] Grade 7: Shows all 12 junior subjects, no pathway selection, parent expectations step
- [ ] Grade 8: Shows all 12 junior subjects, no pathway selection, parent expectations step, mentions 20% performance
- [ ] Grade 9: Shows all 12 junior subjects, no pathway selection, parent expectations step, mentions KJSEA 60%
- [ ] Grade 10: Shows pathway selection, pathway-specific subjects, no parent expectations step
- [ ] Grade 11: Shows pathway selection, pathway-specific subjects, post-secondary plans step
- [ ] Grade 12: Shows pathway selection, pathway-specific subjects, post-secondary plans step, mentions KCSE/KUCCPS

## Deployment Order

1. Update database (career_fields grade_appropriateness)
2. Update QuickAssessment.tsx (grades, subjects, validation)
3. Update ai-service.ts (grade-specific prompts)
4. Update QuickAssessmentDirectionBrief.tsx (grade-specific UI)
5. Update report-generator.ts (grade-specific PDF sections)
6. Test all grades end-to-end
7. Deploy to production
