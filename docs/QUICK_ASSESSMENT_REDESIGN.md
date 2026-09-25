# Quick Assessment Redesign — Final Plan

This document covers the complete redesign of the Quick Assessment system to align with Kenya's CBC pathway placement structure. It replaces the current generic career exploration approach with a CBC-aware system that gives students and parents actionable, grade-specific guidance.

---

## 1. Design Principles

### What this assessment is
A CBC-aware career direction tool that tells a student and their parent:
- **Where they are** in the CBC placement cycle
- **What's still in their control** right now
- **Which career fields connect** to which Senior School pathways and tracks
- **Which subjects to prioritise** this term based on their actual performance
- **What to do next** — one concrete action, not three generic ones

### What this assessment is NOT
- A personality test
- A final career decision tool
- A generic "explore your interests" quiz
- A tool that pretends preferences matter when the CBC system is performance-driven
- A tool that hands a 12-year-old a specific adult job title like "Real Estate Manager"

### Core principle
The CBC system places students based on academic performance, not preferences. The assessment must collect performance-driven data and produce performance-aware output.

### No specific job titles
Career suggestions are framed as **fields and domains**, not specific job titles. Telling a Grade 7 student to explore "Real Estate Manager" or "Property Sales Agent" because they "like selling and negotiating" is a rules-engine match on keywords, not guidance. A 12-year-old should be exploring "business and entrepreneurship" or "trade and commerce" — fields broad enough to test through school activities, and free of adult baggage (commission pressure, cold rejection, client management) that has nothing to do with middle school exploration.

The same applies across the board:
- "Software Developer" → "technology and computing"
- "Registered Nurse" → "health and caring professions"
- "Accountant" → "business and finance"
- "Graphic Designer" → "creative arts and design"
- "Journalist" → "media and communication"
- "Civil Engineer" → "engineering and built environment"

For **Grade 11**, the framing can be slightly more specific because the student has already chosen a pathway and is closer to decisions — "computer science and software development" rather than just "technology." But even then, fields and domains are more useful than specific titles because there are many routes within any field.

---

## 2. Data Collection

### Grades 7-9 (Junior Secondary)

4 phases, not 6.

#### Phase 1: Identity & Academics

**Collect:**
- Full Name (text)
- Email (text)
- Grade (Grade 7 / 8 / 9)
- Strong subjects (multi-select from grade-appropriate list)
- **Subject performance** — for each selected subject, rate yourself:
  - Struggling
  - Passing
  - Good
  - Excelling

**Why performance matters:**
The CBC places students based on grades, not interest alone. A student who "likes" Math but is struggling in it needs different guidance than one excelling. The AI needs this signal to make realistic pathway suggestions.

**School pathways** — "Which Senior School pathways does your school offer?"
- STEM
- Social Sciences
- Arts & Sports Science
- Not sure
- My school hasn't decided yet

**Why this matters:**
Not all Kenyan schools offer all 3 pathways. Suggesting a career in Arts & Sports Science to a student whose school only offers STEM and Social Sciences is useless. The AI filters suggestions to what's actually available.

#### Phase 2: Interests & Activities

**Collect:**
- Interest categories (RIASEC-based, multi-select — same as current)
- Custom interest input (text)
- **Current clubs/activities** — concrete multi-select:
  - Science club, Debate, Drama/Theatre, Sports team, Music/Choir, Art/Design, Coding/Robotics, Business club, Community service, Religious group, None of these

**Why clubs instead of abstract preferences:**
"I'm in debate club" is a concrete signal. "I prefer analytical problem-solving" is an adult framing that 12-year-olds can't reliably self-report. Clubs are observable facts.

#### Phase 3: Parent Expectations

**Collect:**
- **What career does your parent/guardian want for you?**
  - Free text input
  - Plus common options: Doctor, Engineer, Lawyer, Teacher, Business owner, Farmer/Agriculture, Tech/IT, Government worker, Religious leader, They don't have a preference
- **How do you feel about that?**
  - I want the same thing
  - I'm not sure
  - I want something different

**Why this matters:**
Parent expectations are the single largest non-academic factor in Kenyan student career decisions. If a student's signals point toward Arts but parents want Medicine, the report needs to acknowledge that tension explicitly rather than ignore it.

#### Phase 4: Your Vision (replaces Barrier + Readiness)

**Collect:**
- **What kind of future do you imagine for yourself?**
  - Free text: "Describe the life you want in 5-10 years — where you live, what you do, what matters to you."

**Why this replaces barriers and readiness:**
"Barriers" and "readiness" are self-reported noise. A student who says "I'm not ready" might be perfectly capable. A student who says "no barriers" might have three. Instead of asking students to self-diagnose obstacles, we ask them to describe their desired future. The AI uses that vision to connect career suggestions to something personal and motivating, not just academic signals.

### Grade 11 (Senior Secondary)

4 phases. More deterministic because the student has already chosen a pathway.

#### Phase 1: Identity & Academics

**Collect:**
- Full Name, Email
- Current pathway (STEM / Arts & Sports / Social Sciences / Technical & Vocational)
- Current subjects (multi-select)
- **Subject performance** — same rating scale (Struggling / Passing / Good / Excelling)

#### Phase 2: Interests

**Collect:**
- Interest categories (multi-select)
- Custom interest

#### Phase 3: Future Plans & Lifestyle

**Collect:**
- **What's your plan after Senior School?**
  - University
  - College/TVET/Diploma
  - Start working
  - Not decided yet
- **Budget range:**
  - Government-sponsored (KUCCPS)
  - Self-sponsored (parents paying)
  - Scholarship/bursary
  - Not sure yet
  - Not relevant (going straight to work)
- **What kind of future do you imagine for yourself?**
  - Free text: same prompt as Grades 7-9

**Why budget matters:**
University choice in Kenya is heavily budget-constrained. A KUCCPS student has different options than a self-sponsored one. The AI needs this to make realistic training route suggestions.

#### Phase 4: Specific Challenges

**Collect:**
- **What's your biggest challenge right now?** (pick 1-2)
  - Not sure which university/college to apply to
  - Worried about KUCCPS points / cut-off marks
  - My parents want something different from me
  - I'm struggling academically
  - I don't know what career options exist in my pathway
  - Financial concerns
  - Other (free text)

**Why this is different from Grades 7-9:**
Grade 11 students face concrete, deterministic challenges. These are real obstacles, not vague "readiness" questions. The AI uses them to tailor the action plan.

---

## 3. CBC Pathway Database

### 3.1 The career catalogue vs the Quick Assessment

The existing `career_paths` table (~160 specific roles like "Software Developer," "Registered Nurse") is a **browsing feature only**. Students use it to explore career detail pages, read descriptions, and understand what specific roles involve. It is NOT used by the Quick Assessment in any way.

The Quick Assessment uses a completely separate `career_fields` table — broad fields and domains, not specific job titles. These two features are independent.

### 3.2 The `career_fields` table

```sql
CREATE TABLE career_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- e.g., "Technology and Computing"
  description TEXT,                      -- 1-2 sentences: what people in this field do
  cbc_pathway TEXT NOT NULL CHECK (cbc_pathway IN ('STEM', 'Social Sciences', 'Arts & Sports Science')),
  cbc_track TEXT NOT NULL,               -- e.g., "Applied Sciences"
  example_roles TEXT[],                  -- 3-5 example job titles (for AI context, never surfaced directly)
  subjects TEXT[],                       -- key subjects in this field
  grade_appropriateness TEXT[] NOT NULL,  -- which grades this field is appropriate for: {7,8,9,11}
  keywords TEXT[]                        -- interest/subject keywords that signal this field
);
```

### 3.3 Complete career fields list

**STEM Pathway — Pure Sciences track:**

| name | example_roles | subjects | grade_appropriateness |
|------|--------------|----------|----------------------|
| Medicine and Health Sciences | Doctor, Surgeon, Pharmacist, Physiotherapist, Medical Researcher | Biology, Chemistry, Mathematics | {7,8,9,11} |
| Biological and Life Sciences | Biologist, Zoologist, Botanist, Marine Biologist, Geneticist | Biology, Chemistry | {7,8,9,11} |
| Chemistry and Materials Science | Chemist, Biochemist, Pharmacologist, Toxicologist | Chemistry, Physics, Mathematics | {9,11} |
| Physics and Astronomy | Physicist, Astrophysicist, Nuclear Scientist, Optical Engineer | Physics, Mathematics | {9,11} |
| Mathematics and Statistics | Mathematician, Statistician, Actuary, Quantitative Analyst | Mathematics | {7,8,9,11} |
| Earth and Environmental Sciences | Geologist, Meteorologist, Oceanographer, Seismologist | Geography, Physics, Chemistry | {7,8,9,11} |

**STEM Pathway — Applied Sciences track:**

| name | example_roles | subjects | grade_appropriateness |
|------|--------------|----------|----------------------|
| Technology and Computing | Software Developer, Data Scientist, Cybersecurity Analyst, AI Engineer, Systems Administrator | Computer Science, Mathematics | {7,8,9,11} |
| Agriculture and Food Science | Agronomist, Food Scientist, Soil Scientist, Animal Scientist, Horticulturist | Agriculture, Biology, Chemistry | {7,8,9,11} |
| Veterinary Science | Veterinarian, Animal Health Technician, Wildlife Conservationist | Biology, Chemistry, Agriculture | {7,8,9,11} |
| Nutrition and Dietetics | Nutritionist, Dietitian, Food Safety Inspector, Public Health Nutritionist | Biology, Chemistry, Home Science | {9,11} |
| Home Science and Hospitality | Hotel Manager, Chef, Event Planner, Interior Designer, Housekeeping Manager | Home Science, Business Studies | {9,11} |
| Business Analytics and Data | Business Analyst, Market Researcher, Data Analyst, Operations Analyst | Mathematics, Computer Science, Business Studies | {9,11} |
| Forestry and Wildlife Management | Forester, Park Ranger, Wildlife Manager, Conservation Officer | Agriculture, Biology, Geography | {7,8,9,11} |

**STEM Pathway — Technical Studies track:**

| name | example_roles | subjects | grade_appropriateness |
|------|--------------|----------|----------------------|
| Engineering and Built Environment | Civil Engineer, Mechanical Engineer, Electrical Engineer, Architect, Urban Planner | Mathematics, Physics | {9,11} |
| Electrical and Electronics | Electrician, Electronics Technician, Power Systems Engineer, Telecommunications Engineer | Physics, Mathematics, Electricity | {9,11} |
| Mechanical and Automotive | Mechanical Engineer, Automotive Technician, Aircraft Mechanic, Welder | Physics, Metal Work, Mathematics | {9,11} |
| Building and Construction | Builder, Quantity Surveyor, Construction Manager, Site Engineer, Plumber | Mathematics, Building & Construction | {9,11} |
| Aviation and Marine | Pilot, Air Traffic Controller, Marine Engineer, Ship Captain, Naval Architect | Physics, Mathematics, Aviation | {9,11} |
| Woodwork and Furniture | Carpenter, Furniture Designer, Wood Technologist, Cabinet Maker | Woodwork, Mathematics | {9,11} |
| Media Technology | Broadcast Engineer, Sound Engineer, Video Producer, Lighting Technician | Physics, Computer Science | {9,11} |

**Social Sciences Pathway — Languages & Literature track:**

| name | example_roles | subjects | grade_appropriateness |
|------|--------------|----------|----------------------|
| Media and Communication | Journalist, Editor, Content Creator, Broadcaster, Public Relations Specialist | English, Kiswahili | {9,11} |
| Languages and Translation | Translator, Interpreter, Linguist, Language Teacher, Localisation Specialist | English, Kiswahili, Foreign Languages | {7,8,9,11} |
| Writing and Publishing | Author, Publisher, Copywriter, Technical Writer, Literary Agent | English, Literature, Kiswahili | {9,11} |
| Film and Broadcasting | Film Director, Producer, Screenwriter, TV Presenter, Radio Host | English, Media Studies | {9,11} |

**Social Sciences Pathway — Humanities & Business Studies track:**

| name | example_roles | subjects | grade_appropriateness |
|------|--------------|----------|----------------------|
| Business and Entrepreneurship | Entrepreneur, Business Owner, Manager, Consultant, Startup Founder | Business Studies, Mathematics | {7,8,9,11} |
| Finance and Banking | Accountant, Financial Analyst, Banker, Investment Analyst, Auditor | Mathematics, Business Studies | {7,8,9,11} |
| Law and Governance | Lawyer, Magistrate, Policy Analyst, Diplomat, Human Rights Advocate | History, English, CRE/IRE | {11} |
| Education and Teaching | Teacher, Lecturer, Curriculum Developer, School Administrator, Education Officer | All subjects (pathway-dependent) | {9,11} |
| Public Administration and Government | Civil Servant, Policy Maker, County Official, Diplomat, Intelligence Analyst | History, Geography, CRE/IRE | {9,11} |
| Economics and Development | Economist, Development Worker, NGO Manager, Research Analyst, Trade Specialist | Mathematics, Geography, Business Studies | {9,11} |
| Social Work and Community Development | Social Worker, Counsellor, Community Development Officer, Youth Worker | CRE/IRE, History, Geography | {7,8,9,11} |
| International Relations and Diplomacy | Diplomat, Foreign Affairs Officer, UN Worker, International NGO Manager | History, Geography, Languages | {9,11} |
| Real Estate and Property | Property Developer, Valuer, Estate Agent, Land Surveyor, Urban Planner | Mathematics, Geography, Business Studies | {9,11} |
| Tourism and Travel | Tour Guide, Travel Agent, Tourism Manager, Safari Operator, Hotel Manager | Geography, Languages, History | {7,8,9,11} |
| Psychology and Counselling | Psychologist, Counsellor, Therapist, Career Guidance Officer, HR Specialist | CRE/IRE, Biology, English | {9,11} |
| Human Resources and Management | HR Manager, Recruitment Specialist, Training Manager, Organisational Consultant | Business Studies, English | {9,11} |
| Religion and Ministry | Pastor, Chaplain, Theologian, Religious Education Teacher, Missionary | CRE/IRE/HRE | {7,8,9,11} |

**Arts & Sports Science Pathway — Sports Science track:**

| name | example_roles | subjects | grade_appropriateness |
|------|--------------|----------|----------------------|
| Sports and Athletics | Athlete, Coach, Sports Physiotherapist, PE Teacher, Sports Psychologist | Physical Education | {7,8,9,11} |
| Sports Management | Sports Agent, League Manager, Event Organiser, Stadium Manager, Sports Journalist | Physical Education, Business Studies | {9,11} |
| Fitness and Recreation | Personal Trainer, Gym Manager, Recreation Officer, Outdoor Adventure Guide | Physical Education | {7,8,9,11} |

**Arts & Sports Science Pathway — Performing Arts track:**

| name | example_roles | subjects | grade_appropriateness |
|------|--------------|----------|----------------------|
| Music and Sound | Musician, Composer, Music Producer, Sound Engineer, Music Teacher | Music | {7,8,9,11} |
| Theatre and Performance | Actor, Director, Playwright, Stage Manager, Drama Teacher | Theatre, English, Literature | {7,8,9,11} |
| Dance and Movement | Dancer, Choreographer, Dance Teacher, Movement Therapist | Dance, Physical Education | {7,8,9,11} |

**Arts & Sports Science Pathway — Visual Arts track:**

| name | example_roles | subjects | grade_appropriateness |
|------|--------------|----------|----------------------|
| Creative Arts and Design | Graphic Designer, Illustrator, Interior Designer, Fashion Designer, Animator | Art, Design | {7,8,9,11} |
| Photography and Visual Media | Photographer, Videographer, Photojournalist, Visual Artist | Art, Computer Science | {7,8,9,11} |
| Fashion and Textiles | Fashion Designer, Tailor, Textile Designer, Stylist, Fashion Entrepreneur | Art, Home Science | {7,8,9,11} |
| Applied Arts and Craft | Ceramicist, Jeweller, Sculptor, Printmaker, Artisan | Art, Woodwork | {7,8,9,11} |

### 3.4 Add `cbc_pathway` + `cbc_track` to `career_paths` (browsing feature)

```sql
ALTER TABLE career_paths ADD COLUMN cbc_pathway TEXT CHECK (cbc_pathway IN ('STEM', 'Social Sciences', 'Arts & Sports Science'));
ALTER TABLE career_paths ADD COLUMN cbc_track TEXT;
```

This is for the browsing experience (career detail pages can show "This role sits within the STEM / Applied Sciences pathway"), NOT for the Quick Assessment.

### 3.5 Update `dashboardService`

Add a `getCareerFields()` method that returns the `career_fields` table data, filtered by the student's grade. This is the ONLY data source for the Quick Assessment AI prompt.

### 3.6 The three pathways and their tracks

**STEM:**
- Pure Sciences (Math, Biology, Chemistry, Physics)
- Applied Sciences (Agriculture, Computer Science, Home Science, Business Studies)
- Technical Studies (Aviation, Building & Construction, Electricity, Metal Work, Power Mechanics, Woodwork, Media Technology, Marine & Fisheries)

**Social Sciences:**
- Languages & Literature (English, Kiswahili, French, German, Mandarin, Arabic, Indigenous Languages)
- Humanities & Business Studies (CRE/IRE/HRE, Business Studies, History & Citizenship, Geography)

**Arts & Sports Science:**
- Sports Science (Physical Education, Sports & Recreation)
- Performing Arts (Music, Dance, Theatre, Film)
- Visual Arts (Applied Arts, Fine Arts)

---

## 4. AI Prompt Changes

### 4.1 Career fields format

The AI receives the `career_fields` table data, not the full career catalogue:

```
- Technology and Computing — STEM / Applied Sciences (appropriate for Grades 7, 8, 9, 11)
- Health and Caring Professions — STEM / Pure Sciences (appropriate for Grades 7, 8, 9, 11)
- Business and Finance — Social Sciences / Humanities & Business Studies (appropriate for Grades 7, 8, 9, 11)
- Creative Arts and Design — Arts & Sports Science / Visual Arts (appropriate for Grades 7, 8, 9, 11)
- Media and Communication — Social Sciences / Languages & Literature (appropriate for Grades 9, 11)
- Engineering and Built Environment — STEM / Technical Studies (appropriate for Grades 9, 11)
- Law and Governance — Social Sciences / Humanities & Business Studies (appropriate for Grade 11 only)
```

The AI picks 3 fields from this list. It does NOT pick specific job titles. The `example_roles` column is available as context for the AI to understand what's inside each field, but it is never surfaced directly to the student as a suggestion.

### 4.2 Output schema changes

The `career` field is now a **field/domain name**, not a job title:

```json
{
  "career_field": "Technology and Computing",
  "cbc_pathway": "STEM",
  "cbc_track": "Applied Sciences",
  "subjects_to_prioritise": ["Mathematics", "Computer Science"],
  "why_it_appeared": "...",
  "reality_to_test": "...",
  "starter_activity": { ... }
}
```

**Validation:** The system checks that `career_field` matches a name from the `career_fields` table. If the AI returns something not in the table, the suggestion is rejected and the AI is called again.

### 4.3 Grade-specific prompt differences

**Grades 7-9:**
- Must explain the 20/20/60 breakdown: "Your Grade 6 KPSEA result (20%) is already set. Your Grades 7-8 school-based assessments count for 20%. Your Grade 9 summative (KJSEA) counts for 60%."
- Must filter career fields to school pathway availability
- Must filter career fields to those marked appropriate for the student's grade
- Must acknowledge parent expectations and any tension with student signals
- Must connect each career field to a CBC pathway and track
- Must name which subjects to prioritise this term based on performance data
- Starter activities must be exploration-focused, safe, no-cost
- Language must be age-appropriate — field-level framing, never specific job titles

**Grade 11:**
- Must connect each career field to training routes (university vs college vs TVET vs polytechnic)
- Must consider budget constraints when suggesting training routes
- Must reference current pathway and how it aligns with career field suggestions
- Must use subject performance data to assess readiness for specific programmes
- Starter activities must be action-focused (apply, prepare, build evidence)
- Must acknowledge the student's future vision and connect career field suggestions to it
- Can reference example roles within a field to illustrate what the field involves

### 4.4 Prompt rules (updated)

1. The three suggestions must be career fields from the allowed fields list. Never suggest specific job titles like "Real Estate Manager," "Software Developer," or "Registered Nurse." Use field-level framing: "Technology and Computing," "Health and Caring Professions," "Business and Finance."
2. Each career field must include `cbc_pathway` and `cbc_track` fields. Validate against the 3 known pathways.
3. Each career field must include `subjects_to_prioritise` — 1-3 specific subjects the student should focus on this term, based on their performance data and the field's track requirements.
4. For Grades 7-9: only suggest fields marked as appropriate for the student's grade. "Law and Governance" must never appear for a Grade 7 student.
5. For Grades 7-9: filter suggestions to school pathway availability. If the school only offers 2 of 3 pathways, don't suggest fields from the missing one.
6. For Grades 7-9: acknowledge parent expectations in `why_it_appeared`. If the student's signals conflict with parent wishes, name that tension honestly.
7. For Grade 11: connect each career field to at least one training route (university programme, college diploma, TVET certificate, or apprenticeship). Reference budget where relevant.
8. For Grade 11: connect each career field to the student's future vision statement.
9. Every `why_it_appeared` must cite at least two independent student signals (subject performance + interest, or interest + club, etc.).
10. Every `reality_to_test` must name an uncertainty about the day-to-day work within that field.
11. Starter activities: Grades 7-9 = exploration (30-90 min, no cost, safe). Grade 11 = action (apply, prepare, build evidence for an application).
12. The action plan must contain exactly 2 practical actions (not 3), each tied to a specific CareerGuide feature.
13. The `student_summary` must explain the CBC placement structure for Grades 7-9, or the post-secondary landscape for Grade 11.
14. Never use adult-framed job titles as suggestions. The student is exploring a field, not interviewing for a job.

### 4.5 Output schema (final)

**For Grades 7-9:**

```json
{
  "student_summary": "2 sentences. Must explain the 20/20/60 CBC placement structure and what is still in the student's control.",
  "grade_context": "1-2 sentences tied to the student's grade and school pathway availability.",
  "grade_focus": "1 sentence. Which subjects to prioritise and why.",
  "parent_note": "1 sentence acknowledging parent expectations and any alignment or tension with the student's own signals.",
  "career_fields": [
    {
      "field": "Technology and Computing",
      "cbc_pathway": "STEM",
      "cbc_track": "Applied Sciences",
      "subjects_to_prioritise": ["Mathematics", "Computer Science"],
      "why_it_appeared": "Evidence from 2+ signals. Must reference pathway and track.",
      "reality_to_test": "Uncertainty about daily work in this field.",
      "starter_activity": {
        "title": "Short activity title",
        "instruction": "Concrete 30-90 minute exploration task, no cost.",
        "reflection_prompt": "One question to judge the experience."
      }
    }
  ],
  "plan": [
    {"timeframe": "...", "title": "...", "action": "...", "careerguide_action": "..."}
  ]
}
```

**For Grade 11:**

```json
{
  "student_summary": "2 sentences. Must reference current pathway, post-secondary plans, and budget context.",
  "grade_context": "1-2 sentences tied to the student's pathway and where they are in the application timeline.",
  "grade_focus": "1 sentence. What to focus on before their next application step.",
  "vision_note": "1 sentence connecting the student's future vision to the career field suggestions.",
  "career_fields": [
    {
      "field": "Technology and Computing",
      "cbc_pathway": "STEM",
      "cbc_track": "Applied Sciences",
      "training_routes": [
        {"route": "University", "programme": "BSc Computer Science", "requirements": "C+ overall, B in Math", "budget_note": "Available via KUCCPS"},
        {"route": "College/TVET", "programme": "Diploma in IT", "requirements": "C- overall", "budget_note": "Self-sponsored, ~KES 80,000/year"}
      ],
      "subjects_to_prioritise": ["Mathematics", "Computer Science"],
      "why_it_appeared": "Evidence from 2+ signals. Must reference current pathway alignment.",
      "reality_to_test": "Uncertainty about daily work in this field.",
      "next_action": {
        "title": "Short action title",
        "instruction": "Concrete action: apply, prepare, or build evidence.",
        "deadline": "Before [specific timeframe]"
      }
    }
  ],
  "plan": [
    {"timeframe": "...", "title": "...", "action": "...", "careerguide_action": "..."}
  ]
}
```

---

## 5. Display / UI

The report looks different depending on the grade group. The current `QuickAssessmentDirectionBrief` component needs to render two distinct layouts.

### 5.1 Grades 7-9 Display

**Section 1: "Why Now Matters"**
- Explains the 20/20/60 CBC placement structure
- Explicit: "Your Grade 6 result (20%) is already locked in. Here's what you can still influence."
- Shows the student's current grade and how much weight their current year carries
- Colour-coded: green for "still in your control", grey for "already set"

**Section 2: "Your Picture"**
- Student summary (2 sentences)
- Grade context
- Grade focus
- Parent note (acknowledges expectations + tension)

**Section 3: "Three Career Fields to Explore"**
Each field card shows:
- Field name (e.g., "Technology and Computing")
- **Pathway badge** (STEM = blue, Social Sciences = purple, Arts & Sports Science = green)
- **Track label** underneath (e.g., "STEM — Applied Sciences")
- **Subjects to prioritise** — chips/badges showing which subjects to focus on this term
- Why it appeared (evidence from signals)
- What still needs testing
- Starter activity (exploration-focused)
- Reflection prompt

**Section 4: "Your School Context"**
- Shows which pathways the school offers
- If a suggested field's pathway is not available at the school, mark it as "aspirational — explore outside school"
- If all 3 suggestions are available at the school, confirm: "All three are within your school's pathways"

**Section 5: "Your Starting Plan"**
- 2 actions (not 3), each tied to a CareerGuide feature
- Timeframe-aware: "This week" and "This term"

**Section 6: "Take This Into Your Next Conversation"**
- Prompt to discuss with parent/guardian/mentor
- Reference the parent expectations tension if one exists

### 5.2 Grade 11 Display

**Section 1: "Where You Stand"**
- Current pathway and subjects
- Post-secondary plan (university/college/TVET/work)
- Budget context
- Student summary

**Section 2: "Your Vision"**
- The student's future vision statement
- How the career field suggestions connect to that vision

**Section 3: "Three Career Fields to Pursue"**
Each field card shows:
- Field name
- Pathway badge + track
- **Training routes** — expandable section showing:
  - University option: programme name, requirements, KUCCPS availability
  - College/TVET option: programme name, requirements, cost estimate
  - Polytechnic/apprenticeship option where relevant
- Subjects to prioritise
- Why it appeared
- What still needs testing
- Next action (action-focused: apply, prepare, build evidence)
- Deadline/timeframe

**Section 4: "Your Action Plan"**
- 2 actions tied to CareerGuide features
- Timeframe-aware: "This week" and "Before your next application step"

**Section 5: "Talk to Someone"**
- Prompt to discuss with mentor/counsellor
- Reference specific challenges the student reported

### 5.3 Component Architecture

Split `QuickAssessmentDirectionBrief` into:
- `QuickAssessmentDirectionBrief` (wrapper, routes to grade-specific layout)
- `JuniorSecondaryBrief` (Grades 7-9 layout)
- `SeniorSecondaryBrief` (Grade 11 layout)
- `CareerFieldCard` (shared card component, renders pathway badge + track + subjects)
- `TrainingRoutesPanel` (Grade 11 only, expandable training route details)
- `CbcPlacementCard` (Grades 7-9 only, the "Why Now Matters" section)

---

## 6. No Fallback System

The current `createFallbackQuickAssessmentBrief` in `quick-assessment-report.ts` is a local deterministic fallback that generates career suggestions without AI. Per the decision to "just do the right thing," we remove this entirely.

**What happens if the AI call fails:**
- Show the user a clear error message: "We couldn't generate your report. Please try again."
- Provide a "Retry" button.
- Do NOT silently ship a degraded experience.

**The AI call itself should be reliable:**
- The prompt is structured and deterministic (pathway/track are data, not guesses)
- The career catalogue is bounded (~160 careers, not open-ended)
- JSON validation catches malformed output before it reaches the UI
- Retry logic on transient failures (network timeout, rate limiting)

---

## 7. Type Definitions

```typescript
export interface QuickAssessmentInput {
  // Grades 7-9 + Grade 11
  grade: string;
  pathway?: string;                          // Grade 11 only
  name: string;
  email: string;

  // Academics
  subjects: string[];
  subjectPerformance: Record<string, 'struggling' | 'passing' | 'good' | 'excelling'>;

  // School context (Grades 7-9)
  schoolPathways: string[];                  // which pathways the school offers

  // Interests
  interests: string[];
  clubs: string[];

  // Parent expectations (Grades 7-9)
  parentExpectation: string;
  parentAlignment: 'same' | 'unsure' | 'different';

  // Grade 11 only
  postSecondaryPlan?: string;
  budgetRange?: string;

  // Future vision (all grades)
  futureVision: string;

  // Specific challenges (Grade 11 only)
  specificChallenges?: string[];

  // Optional
  targetCareer?: string;
}

export interface CareerField {
  id: string;
  name: string;                              // e.g., "Technology and Computing"
  description?: string;
  cbc_pathway: 'STEM' | 'Social Sciences' | 'Arts & Sports Science';
  cbc_track: string;
  exampleRoles: string[];                    // e.g., ["Software Developer", "Data Analyst"]
  gradeAppropriateness: string[];            // e.g., ["7", "8", "9", "11"]
}

export interface CareerFieldPossibility {
  field: string;                             // e.g., "Technology and Computing"
  fieldId?: string;                          // links back to career_fields table
  cbc_pathway: 'STEM' | 'Social Sciences' | 'Arts & Sports Science';
  cbc_track: string;
  subjectsToPrioritise: string[];
  whyItAppeared: string;
  realityToTest: string;

  // Grades 7-9
  starterActivity?: {
    title: string;
    instruction: string;
    reflectionPrompt: string;
  };

  // Grade 11
  trainingRoutes?: TrainingRoute[];
  nextAction?: {
    title: string;
    instruction: string;
    deadline: string;
  };
}

export interface TrainingRoute {
  route: string;          // "University", "College/TVET", "Polytechnic", "Apprenticeship"
  programme: string;
  requirements: string;
  budgetNote: string;
}

export interface ActionPlanStep {
  timeframe: string;
  title: string;
  action: string;
  careerGuideAction: string;
}

export interface QuickAssessmentBrief {
  studentSummary: string;
  gradeContext: string;
  gradeFocus: string;

  // Grades 7-9
  parentNote?: string;

  // Grade 11
  visionNote?: string;

  careerFields: CareerFieldPossibility[];
  plan: ActionPlanStep[];
}
```

---

## 8. Files to Change

| File | Change |
|------|--------|
| `supabase/migrations/` | Migration 1: create `career_fields` table with ~45 fields. Migration 2: add `cbc_pathway` + `cbc_track` to `career_paths` (browsing feature). |
| `src/lib/dashboard-service.ts` | Add `getCareerFields(grade?: string)` method — returns career fields, optionally filtered by grade appropriateness. Update `getCareerPaths()` to return new pathway/track columns. |
| `src/pages/QuickAssessment.tsx` | Rewrite 6 phases → 4 phases. New state variables. Drop values/workStyle/preferences/barrier/readiness/experience. Add subjectPerformance/schoolPathways/clubs/parentExpectation/parentAlignment/futureVision/postSecondaryPlan/budgetRange/specificChallenges. |
| `src/lib/ai-service.ts` | Rewrite `generateQuickAssessmentBrief()` prompt. Pass `career_fields` data instead of career catalogue. New grade-specific instructions. New output schema with `career_fields` array. Remove fallback call. |
| `src/lib/quick-assessment-report.ts` | Rewrite all interfaces (`CareerFieldPossibility`, `QuickAssessmentBrief`, etc.). Remove `createFallbackQuickAssessmentBrief` entirely. Update normaliser to validate `field` against the `career_fields` table. |
| `src/components/QuickAssessmentDirectionBrief.tsx` | Split into wrapper + grade-specific layouts. Add pathway badges, training routes, CBC placement card. Replace career title rendering with field name rendering. |
| `src/components/quick-assessment/CareerFieldCard.tsx` | New component. Renders a single career field with pathway badge, track label, subjects, starter activity. |
| `src/components/quick-assessment/JuniorSecondaryBrief.tsx` | New component. Grades 7-9 layout with "Why Now Matters" section, school context, parent note. |
| `src/components/quick-assessment/SeniorSecondaryBrief.tsx` | New component. Grade 11 layout with training routes, vision note, action-focused next steps. |
| `src/components/quick-assessment/CbcPlacementCard.tsx` | New component. The "Why Now Matters" card for Grades 7-9. |
| `src/components/quick-assessment/TrainingRoutesPanel.tsx` | New component. Expandable training route details for Grade 11. |
| `src/lib/report-generator.ts` | Update PDF generation to match new output structure. Different layouts for Grades 7-9 vs Grade 11. Field names instead of job titles. |
| `docs/Cbc pathway mapping.md` | Already exists. Used as reference for populating `career_fields` table and tagging `career_paths`. |

---

## 9. Execution Order

| Step | Task | Depends On | Estimated Complexity |
|------|------|-----------|---------------------|
| 1 | Create `career_fields` table with ~45 fields (all pathways and tracks) | Nothing | Medium (editorial work, this is the core data source) |
| 2 | Add `cbc_pathway` + `cbc_track` columns to `career_paths` table (browsing feature) | Nothing | Low |
| 3 | Tag all ~160 careers in `career_paths` with pathway + track | Step 2 | Medium (editorial work, separate from QA) |
| 4 | Update `dashboardService` — add `getCareerFields()` method (filtered by grade) | Step 1 | Low |
| 5 | Rewrite `QuickAssessmentInput`, `CareerFieldPossibility`, `QuickAssessmentBrief` type definitions | Step 1 | Low |
| 6 | Rewrite QuickAssessment.tsx — 6 phases → 4 phases | Step 5 | High |
| 7 | Rewrite AI prompt in `ai-service.ts` — pass `career_fields` data, enforce field-level output | Steps 4, 5 | High |
| 8 | Update `normaliseQuickAssessmentBrief` to validate `field` against `career_fields` table | Step 7 | Medium |
| 9 | Remove `createFallbackQuickAssessmentBrief` and all fallback code | Step 8 | Low |
| 10 | Build new display components (JuniorSecondaryBrief, SeniorSecondaryBrief, CareerFieldCard, CbcPlacementCard, TrainingRoutesPanel) | Step 5 | High |
| 11 | Update PDF generation for new output structure and field-based layout | Steps 8, 10 | High |
| 12 | End-to-end testing across Grades 7, 8, 9, 11 | All above | Medium |
| 13 | Monitor AI output quality — verify field names are returned, not job titles | Step 12 | Ongoing |

**Parallel paths:**
- Steps 1 and 2-3 can run in parallel (career_fields vs career_paths tagging are independent)
- Steps 4-5 (service + types) depend on Step 1
- Steps 6 (UI) and 7 (AI) can run in parallel once types are ready
- Steps 10-11 (display) depend on types being finalised
- Steps 12-13 (testing + monitoring) are the final gate

---

## 10. Summary of Changes

### What we stop collecting
- Values (Independence, Collaboration, etc.)
- Work Style (Hands-on vs Analytical)
- Working Preferences (3 abstract questions)
- Generic "experience" free text
- "Readiness" self-assessment
- "Barrier" free text (replaced by structured choices for Grade 11, dropped for Grades 7-9)

### What we start collecting
- Subject performance ratings (Struggling / Passing / Good / Excelling)
- School pathway availability
- Current clubs/activities
- Parent expectations + alignment
- Future vision (free text, all grades)
- Post-secondary plans + budget (Grade 11)
- Specific challenges (Grade 11, structured)

### What the AI stops doing
- Picking specific job titles from the career catalogue
- Guessing CBC pathway from category labels
- Suggesting adult job titles to children
- Receiving the career catalogue at all (it now receives the `career_fields` table instead)

### What the AI starts doing
- Picking 3 career fields from the editorially-controlled `career_fields` table
- Filtering fields by grade appropriateness (no "Law and Governance" for Grade 7)
- Filtering fields by school pathway availability
- Acknowledging parent expectation tension
- Connecting fields to the student's future vision
- Suggesting training routes for Grade 11 (university vs college vs TVET)
- Naming specific subjects to prioritise based on performance data

### What the display starts showing
- Career fields, not job titles ("Technology and Computing" not "Software Developer")
- CBC placement breakdown (20/20/60) for Grades 7-9
- Pathway + track badges on every field card
- Subjects to prioritise this term
- School pathway context (available vs aspirational)
- Parent expectations acknowledgment
- Training routes for Grade 11 (university/college/TVET with requirements + costs)
- Future vision connection
- Grade-specific action plans (exploration for 7-9, action for 11)

### What we remove
- The entire fallback system (`createFallbackQuickAssessmentBrief`)
- Generic "why it appeared" template text
- The 3-phase action plan (reduced to 2)
- Reflection prompts as a separate section (integrated into starter activities)
- The `availableCareers` catalogue from the AI prompt (replaced by `career_fields`)
