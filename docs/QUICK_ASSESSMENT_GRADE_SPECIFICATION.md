# Quick Assessment: Grade-Specific AI Context & Output Specification

## Overview

This document specifies exactly what data we collect from students at each grade level, what context we provide to the AI, what we ask the AI to generate, and how the output differs across grades.

---

## Data Collection by Grade

### Junior Secondary (Grades 7-9)

**Step 1: Identity & Academics**
- **Name**: Student's full name
- **Email**: For report delivery
- **Grade**: Grade 7, 8, or 9
- **Subjects**: All 12 core CBC subjects (no specialisation yet)
  - Mathematics, English, Kiswahili, Integrated Science, Health Education, Pre-Technical & Pre-Career Studies, Social Studies, Business Studies, Agriculture & Nutrition, Life Skills Education, Creative Arts and Sports, Religious Education (CRE/IRE/HRE)
- **Subject Performance**: For each selected subject, rate performance as Below Expectation/Approaching Expectation/Meeting Expectation/Exceeding Expectation
- **School Pathways**: Which Senior Secondary pathways does the school offer? (STEM, Social Sciences, Arts & Sports Science, or "Not sure")

**Step 2: Interests & Activities**
- **Interests**: Multi-select from RIASEC-based categories (Realistic, Investigative, Artistic, Social, Enterprising, Conventional)
- **Clubs/Activities**: Multi-select from predefined list (Science club, Debate, Drama/Theatre, Sports team, Music/Choir, Art/Design, Coding/Robotics, Business club, Community service, Religious group)

**Step 3: Parent Expectations**
- **Parent Expectation**: What career does your parent/guardian want for you? (free text or select from: Doctor, Engineer, Lawyer, Teacher, Business owner, Farmer/Agriculture, Tech/IT, Government worker, Religious leader, They don't have a preference)
- **Parent Alignment**: How do you feel about that? (same/unsure/different)

**Step 4: Your Vision**
- **Future Vision**: Describe the life you want in 5-10 years (free text)

---

### Senior Secondary (Grades 10-12)

**Step 1: Identity & Academics**
- **Name**: Student's full name
- **Email**: For report delivery
- **Grade**: Grade 10, 11, or 12
- **Pathway**: Which Senior Secondary pathway? (STEM, Arts & Sports, Social Sciences, Technical & Vocational)
- **Subjects**: Pathway-specific subjects (varies by pathway)
  - **STEM**: Mathematics, English, Kiswahili, Physics, Chemistry, Biology, Computer Science, Further Mathematics, Technical Drawing, Agriculture & Nutrition
  - **Arts & Sports**: English, Kiswahili, Mathematics, Fine Art & Design, Music, Drama & Theatre, Physical Education & Sports Science, Media & Film Studies, Fashion & Design
  - **Social Sciences**: English, Kiswahili, Mathematics, History & Citizenship, Geography, Business Studies & Economics, Religious Education, Law, Sociology
  - **Technical & Vocational**: English, Kiswahili, Mathematics, Building & Construction, Electrical & Electronics, Mechanical Engineering, Agriculture, Home Science, Hairdressing & Beauty, Plumbing & Carpentry, ICT / Computer Studies
- **Subject Performance**: For each selected subject, rate performance as Below Expectation/Approaching Expectation/Meeting Expectation/Exceeding Expectation

**Step 2: Interests & Activities**
- **Interests**: Multi-select from RIASEC-based categories
- **Clubs/Activities**: Multi-select from predefined list

**Step 3: Your Vision**
- **Future Vision**: Describe the life you want in 5-10 years (free text)

**Step 4: Your Plans**
- **Post-Secondary Plan**: What's your plan after Senior School? (University, College/TVET/Diploma, Start working, Not decided yet)
- **Budget Range** (if not "Start working"): Budget range for further education (Government-sponsored KUCCPS, Self-sponsored, Scholarship/bursary, Not sure yet, Not relevant)
- **Specific Challenges**: What's your biggest challenge right now? (pick 1-2 from: Not sure which university/college to apply to, Worried about KUCCPS points / cut-off marks, My parents want something different from me, I'm struggling academically, I don't know what career options exist in my pathway, Financial concerns)

---

## What We Give the AI

### Career Fields Database

We load career fields from the `career_fields` table, filtered by grade appropriateness.

**Database Schema:**
```sql
CREATE TABLE career_fields (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,                    -- e.g., "Technology and Computing"
  description TEXT,
  cbc_pathway TEXT NOT NULL,             -- STEM, Social Sciences, Arts & Sports Science
  cbc_track TEXT NOT NULL,               -- e.g., "Applied Sciences"
  example_roles TEXT[],                  -- e.g., ["Software Developer", "Data Analyst"]
  jss_subjects TEXT[],                   -- Junior Secondary subjects (Grades 7-9) - 12 core subjects
  ss_subjects TEXT[],                    -- Senior Secondary subjects (Grades 10-12) - pathway-specific
  grade_appropriateness TEXT[] NOT NULL, -- e.g., ['7', '8', '9', '10', '11', '12']
  keywords TEXT[]
);
```

**Critical: Subjects Split for Junior vs Senior Secondary**

The `career_fields` table has **two separate subject arrays**:

1. **`jss_subjects`** - Junior Secondary subjects (Grades 7-9)
   - Drawn from the 12 core Junior Secondary subjects: Mathematics, English, Kiswahili, Integrated Science, Health Education, Pre-Technical & Pre-Career Studies, Social Studies, Business Studies, Agriculture & Nutrition, Life Skills Education, Creative Arts and Sports, Religious Education (CRE/IRE/HRE)
   - These are the precursor subjects a student should lean into NOW
   - Example for "Technology and Computing": `['Mathematics', 'Integrated Science', 'Pre-Technical & Pre-Career Studies']`

2. **`ss_subjects`** - Senior Secondary subjects (Grades 10-12)
   - Pathway-specific subjects
   - These are the actual Senior School subjects
   - Example for "Technology and Computing": `['Computer Science', 'Mathematics', 'Physics']`

**Why this matters:**
- Junior Secondary students only have access to the 12 core subjects (no specialisation yet)
- Senior Secondary students have pathway-specific subjects
- Rule #3 in the AI prompt enforces: Grades 7-9 use `jss_subjects`, Grades 10-12 use `ss_subjects`
- Validation logic checks AI-generated subjects against the appropriate list
- This prevents the critical bug where a Grade 7 student would be told to prioritise "Computer Science" (which doesn't exist in Junior Secondary)

**Filtering Logic:**
- Grade 7: Filter to fields where `grade_appropriateness` includes '7'
- Grade 8: Filter to fields where `grade_appropriateness` includes '8'
- Grade 9: Filter to fields where `grade_appropriateness` includes '9'
- Grade 10: Filter to fields where `grade_appropriateness` includes '10'
- Grade 11: Filter to fields where `grade_appropriateness` includes '11'
- Grade 12: Filter to fields where `grade_appropriateness` includes '12'

**Example Career Fields:**
- Technology and Computing (STEM / Applied Sciences) - Grades 7-12
- Medicine and Health Sciences (STEM / Pure Sciences) - Grades 7-12
- Business and Entrepreneurship (Social Sciences / Humanities & Business Studies) - Grades 7-12
- Creative Arts and Design (Arts & Sports Science / Visual Arts) - Grades 7-12
- Law and Governance (Social Sciences / Humanities & Business Studies) - Grade 12 only
- Engineering and Built Environment (STEM / Technical Studies) - Grades 9-12

### Student Data Payload

We pass this to the AI service:

```typescript
{
  grade: 'Grade 9',
  pathway: undefined, // Only for Senior Secondary
  name: 'John Doe',
  email: 'john@example.com',
  subjects: ['Mathematics', 'English', 'Integrated Science'],
  subjectPerformance: {
    'Mathematics': 'excelling',
    'English': 'good',
    'Integrated Science': 'excelling'
  },
  schoolPathways: ['STEM', 'Social Sciences'], // Only for Junior Secondary
  interests: ['Coding/Robotics', 'Science club', 'Problem-solving'],
  clubs: ['Science club', 'Coding/Robotics'],
  parentExpectation: 'Engineer', // Only for Junior Secondary
  parentAlignment: 'same', // Only for Junior Secondary
  futureVision: 'I want to work in technology and build apps that help people',
  postSecondaryPlan: undefined, // Only for Senior Secondary
  budgetRange: undefined, // Only for Senior Secondary
  specificChallenges: undefined, // Only for Senior Secondary
  targetCareer: undefined, // Optional: if student clicked "Am I a fit for X?"
  availableCareerFields: [
    {
      id: 'uuid',
      name: 'Technology and Computing',
      cbc_pathway: 'STEM',
      cbc_track: 'Applied Sciences',
      example_roles: ['Software Developer', 'Data Analyst', 'AI Engineer'],
      subjects: ['Computer Science', 'Mathematics'],
      grade_appropriateness: ['7', '8', '9', '10', '11', '12']
    },
    // ... more fields
  ]
}
```

---

## What We Ask the AI

### Grade-Specific Instructions

**Grade 7:**
```
The student is in Grade 7 (Junior Secondary). This is CRITICAL: Kenya's CBC places students into Senior School pathways based on Grades 7-8 school-based assessments (20%) plus Grade 9 summative evaluation (60%). What the student does THIS YEAR literally determines which Senior School pathway they qualify for. Focus on:
1. Broad exploration and subject curiosity - this is a transition phase for career discovery, not specialisation
2. Connecting interests to CBC's three Senior School pathways: STEM, Social Sciences, or Arts & Sports Science
3. Helping the student and parent understand that Grade 7-8 performance now shapes future options
4. Using age-appropriate field-level suggestions (e.g., "business and entrepreneurship" not "property sales agent")
5. Safe short activities that build evidence without requiring money or special equipment
```

**Grade 8:**
```
The student is in Grade 8 (Junior Secondary). CRITICAL CONTEXT: CBC pathway placement is based on Grades 7-8 school-based assessments (20%) plus Grade 9 summative (60%). The student is mid-cycle and current performance is shaping which Senior School pathway they'll access. Focus on:
1. Testing career interests against actual subject enjoyment and aptitude
2. Explicitly connecting career possibilities to CBC's three pathways: STEM, Social Sciences, Arts & Sports Science
3. Making the Grade 8 stakes clear - this year counts toward Senior School placement
4. Practical activities that help the student gather evidence for pathway choice
```

**Grade 9:**
```
The student is in Grade 9 (final year of Junior Secondary). CRITICAL: The summative evaluation this year determines 60% of their Senior School pathway placement. Grades 7-8 school-based assessments make up the other 20%. They need to:
1. Test final career ideas before committing to a Senior School pathway (STEM, Social Sciences, or Arts & Sports Science)
2. Make informed subject selections for Senior School based on evidence, not assumptions
3. Understand that pathway choice now shapes their Grade 10-12 experience
4. Focus on comparing training routes and first-hand experiences
```

**Grade 10:**
```
The student is in Grade 10 (first year of Senior Secondary) in the [PATHWAY] pathway. They have just committed to a pathway and are building their foundation. Focus on:
1. Confirming the pathway choice is right for them based on early performance and interests
2. Exploring career fields within their chosen pathway in depth
3. Understanding how pathway subjects connect to specific career fields
4. Building foundational knowledge and skills for post-secondary applications
```

**Grade 11:**
```
The student is in Grade 11 in the [PATHWAY] pathway. Focus on comparing training routes, subject requirements, and first experiences. Do not promise admission, a salary, or employment.
```

**Grade 12:**
```
The student is in Grade 12 (final year of Senior Secondary) in the [PATHWAY] pathway. This is the application year. Focus on:
1. Final career field selection based on KCSE performance expectations and pathway alignment
2. Understanding KUCCPS placement, cut-off marks, and application strategy
3. Exploring backup options (self-sponsored, TVET, apprenticeship) if university placement is uncertain
4. Connecting career fields to immediate post-secondary actions and deadlines
```

### The Prompt Structure

We construct a prompt that includes:

1. **Grade-specific instructions** (above)
2. **Student data** (all collected fields)
3. **Allowed career fields** (formatted list of career fields filtered by grade)
4. **Non-negotiable guidance rules** (14 rules)
5. **Expected JSON output schema**

### Non-Negotiable Guidance Rules

1. **Exact field names**: The three suggestions must be career fields from the allowed list above. Copy the field name EXACTLY as it appears. Never invent new field names, never paraphrase existing ones, and never suggest specific job titles.

2. **Pathway and track validation**: Each career field must include `cbc_pathway` and `cbc_track` fields that match the pathway and track shown in the allowed list above. Valid pathways are: STEM, Social Sciences, Arts & Sports Science.

3. **Subjects to prioritise (grade-aware)**: Each career field must include `subjects_to_prioritise` - 1-3 specific subjects the student should focus on this term. **CRITICAL**: For Grades 7-9, use subjects from the `[JSS subjects]` list (the 12 core Junior Secondary subjects shown in the career field data). For Grades 10-12, use subjects from the `[SS subjects]` list (pathway-specific Senior Secondary subjects). Base your choice on the student's performance data and the field's requirements. The validation layer will reject subjects that don't match the appropriate list for the student's grade level.

4. **Grade appropriateness (Junior Secondary)**: For Grades 7-9: only suggest fields marked as appropriate for the student's grade. "Law and Governance" must never appear for a Grade 7 student.

5. **School pathway filtering (Junior Secondary)**: For Grades 7-9: filter suggestions to school pathway availability. If the school only offers 2 of 3 pathways, don't suggest fields from the missing one.

6. **Parent expectations (Junior Secondary)**: For Grades 7-9: acknowledge parent expectations in `why_it_appeared`. If the student's signals conflict with parent wishes, name that tension honestly.

7. **Training routes (Senior Secondary)**: For Grades 10-12: connect each career field to at least one training route (university programme, college diploma, TVET certificate, or apprenticeship). Reference budget where relevant.

8. **Vision connection (Senior Secondary)**: For Grades 10-12: connect each career field to the student's future vision statement.

9. **Evidence-based reasoning**: Every `why_it_appeared` must cite at least two independent student signals (subject performance + interest, or interest + club, etc.).

10. **Reality checks**: Every `reality_to_test` must name an uncertainty about the day-to-day work within that field.

11. **Grade-appropriate activities**: Starter activities: Grades 7-9 = exploration (30-90 min, no cost, safe). Grades 10-12 = action (apply, prepare, build evidence for an application).

12. **Action plan**: The action plan must contain exactly 2 practical actions (not 3), each tied to a specific CareerGuide feature.

13. **Grade-aware summary**: The `student_summary` must explain the CBC placement structure for Grades 7-9, or the post-secondary landscape for Grades 10-12.

14. **No adult job titles**: Never use adult-framed job titles as suggestions. The student is exploring a field, not interviewing for a job.

### Expected JSON Output Schema

**For Junior Secondary (Grades 7-9):**

```json
{
  "student_summary": "2 concise sentences explaining what this brief used and why it is exploratory.",
  "grade_context": "1-2 sentences tied to the student's grade.",
  "grade_focus": "1 concise, grade-aware next focus.",
  "parent_note": "1 sentence acknowledging parent expectations and alignment.",
  "career_fields": [
    {
      "field": "Copy EXACT name from allowed list (e.g., Technology and Computing)",
      "cbc_pathway": "STEM or Social Sciences or Arts & Sports Science",
      "cbc_track": "Track name from the allowed list (e.g., Applied Sciences)",
      "subjects_to_prioritise": ["Subject 1", "Subject 2"],
      "why_it_appeared": "Specific evidence from at least two student signals; end with an uncertainty-aware statement.",
      "reality_to_test": "The aspect of daily work that still needs evidence.",
      "starter_activity": {
        "title": "Short activity title",
        "instruction": "Concrete 30-90 minute task, depending on grade.",
        "reflection_prompt": "One question that helps the student judge their experience."
      }
    }
  ],
  "plan": [
    {"timeframe":"...","title":"...","action":"...","careerguide_action":"Explore careers"}
  ]
}
```

**For Senior Secondary (Grades 10-12):**

```json
{
  "student_summary": "2 concise sentences explaining what this brief used and why it is exploratory.",
  "grade_context": "1-2 sentences tied to the student's grade.",
  "grade_focus": "1 concise, grade-aware next focus.",
  "vision_note": "1 sentence connecting the student's future vision to the career suggestions.",
  "career_fields": [
    {
      "field": "Copy EXACT name from allowed list (e.g., Technology and Computing)",
      "cbc_pathway": "STEM or Social Sciences or Arts & Sports Science",
      "cbc_track": "Track name from the allowed list (e.g., Applied Sciences)",
      "subjects_to_prioritise": ["Subject 1", "Subject 2"],
      "why_it_appeared": "Specific evidence from at least two student signals; end with an uncertainty-aware statement.",
      "reality_to_test": "The aspect of daily work that still needs evidence.",
      "training_routes": [
        {"route": "University", "programme": "Programme name", "requirements": "Entry requirements", "budget_note": "Cost information"},
        {"route": "College/TVET", "programme": "Programme name", "requirements": "Entry requirements", "budget_note": "Cost information"}
      ],
      "next_action": {
        "title": "Short action title",
        "instruction": "Concrete action to take now.",
        "deadline": "Timeframe for completion."
      }
    }
  ],
  "plan": [
    {"timeframe":"...","title":"...","action":"...","careerguide_action":"Explore careers"}
  ]
}
```

---

## Output Differences by Grade

### Junior Secondary (Grades 7-9)

**Output includes:**
- `student_summary`: Explains CBC placement structure (20% + 60%)
- `grade_context`: Grade-specific context (Grade 7: exploration, Grade 8: performance matters, Grade 9: final decision)
- `grade_focus`: What to focus on this year
- `parent_note`: Acknowledges parent expectations and alignment/tension
- `career_fields`: 3 career fields with:
  - Field name (exact match from database)
  - Pathway and track
  - Subjects to prioritise (based on performance data)
  - Why it appeared (2+ signals from student data)
  - Reality to test (uncertainty about daily work)
  - Starter activity (exploration-focused, 30-90 min, no cost)
- `plan`: 2 practical actions tied to CareerGuide features

**Output does NOT include:**
- `vision_note` (only for Senior Secondary)
- `training_routes` (only for Senior Secondary)
- `next_action` (only for Senior Secondary)

### Senior Secondary (Grades 10-12)

**Output includes:**
- `student_summary`: Explains post-secondary landscape (KUCCPS, training routes, applications)
- `grade_context`: Grade-specific context (Grade 10: confirming pathway, Grade 11: building evidence, Grade 12: applications & decisions)
- `grade_focus`: What to focus on this year
- `vision_note`: Connects future vision to career suggestions
- `career_fields`: 3 career fields with:
  - Field name (exact match from database)
  - Pathway and track
  - Subjects to prioritise (based on performance data)
  - Why it appeared (2+ signals from student data)
  - Reality to test (uncertainty about daily work)
  - Training routes (university, college/TVET, apprenticeship with requirements and budget notes)
  - Next action (concrete action to take now with deadline)
- `plan`: 2 practical actions tied to CareerGuide features

**Output does NOT include:**
- `parent_note` (only for Junior Secondary)
- `starter_activity` (only for Junior Secondary)

---

## Validation & Normalization

After the AI returns JSON, we validate and normalize:

### Tolerant Field Matching

If the AI returns a field name that doesn't exactly match the database, we use 6-level fallback:

1. **Exact match** (case-insensitive)
2. **Normalized match** (strip punctuation)
3. **Substring match** (AI name in DB name or vice versa)
4. **Keyword overlap** (most shared words wins)
5. **Pathway-based fallback** (any field from same pathway)
6. **Last resort** (first available field)

### Pathway Validation

If the AI returns an invalid pathway, we use the matched field's pathway from the database.

### Subject Validation

We validate that `subjects_to_prioritise` contains actual subjects from the student's selected subjects list.

### Starter Activity vs Training Routes

- Junior Secondary: Must have `starter_activity`, not `training_routes` or `next_action`
- Senior Secondary: Must have `training_routes` and `next_action`, not `starter_activity`

---

## Database Migration Required

To support all grades, we need to update the `career_fields` table:

```sql
-- Update all career fields to include all grades
UPDATE career_fields 
SET grade_appropriateness = ARRAY['7', '8', '9', '10', '11', '12']
WHERE grade_appropriateness = ARRAY['7', '8', '9', '11'];

UPDATE career_fields 
SET grade_appropriateness = ARRAY['9', '10', '11', '12']
WHERE grade_appropriateness = ARRAY['9', '11'];

UPDATE career_fields 
SET grade_appropriateness = ARRAY['10', '11', '12']
WHERE grade_appropriateness = ARRAY['11'];

-- For fields that were only for Grade 11, now include Grade 10 and 12
UPDATE career_fields 
SET grade_appropriateness = ARRAY['10', '11', '12']
WHERE name IN ('Law and Governance', 'Human Resources and Management', 'International Relations and Diplomacy', 'Public Administration and Government', 'Psychology and Counselling', 'Real Estate and Property', 'Education and Teaching', 'Economics and Development');
```

This migration ensures all career fields are available for the appropriate grades.

---

## Summary

### What We're Looking At (by Grade)

**Grade 7:**
- Broad exploration across all subjects
- Early performance patterns
- Parent expectations
- School pathway availability
- Interests and clubs

**Grade 8:**
- Emerging performance patterns (20% counts toward pathway)
- Building evidence through projects and clubs
- Parent expectations alignment
- Pathway exploration

**Grade 9:**
- Final performance before KJSEA (60% counts toward pathway)
- Confirming pathway choice
- Parent expectations alignment
- Pathway decision

**Grade 10:**
- First year in chosen pathway
- Early performance in pathway subjects
- Exploring career fields within pathway
- Building foundation

**Grade 11:**
- Mid-pathway performance
- Building evidence for applications
- Exploring training routes
- Budget considerations

**Grade 12:**
- Final year performance (KCSE)
- Application strategy
- KUCCPS placement expectations
- Backup options

### What We're Giving the AI

- Student data (all collected fields)
- Career fields filtered by grade appropriateness
- Grade-specific instructions
- 14 non-negotiable guidance rules
- Expected JSON schema

### What We're Asking the AI For

- 3 career fields from the allowed list
- Grade-aware context and focus
- Evidence-based reasoning (2+ signals per field)
- Pathway and track validation
- Grade-appropriate activities (exploration vs action)
- Training routes (Senior Secondary only)
- Parent note (Junior Secondary only) or vision note (Senior Secondary only)
- 2 practical actions

### What Context We're Using

- CBC placement structure (20% + 60% for Junior Secondary)
- Post-secondary landscape (KUCCPS, training routes for Senior Secondary)
- Subject performance data
- Parent expectations (Junior Secondary)
- Future vision (Senior Secondary)
- School pathway availability (Junior Secondary)
- Budget range (Senior Secondary)
- Specific challenges (Senior Secondary)
