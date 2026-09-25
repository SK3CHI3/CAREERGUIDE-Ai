# Quick Assessment Career Suggestion System

## Overview

The Quick Assessment generates personalized career suggestions for Kenyan students based on a 6-phase questionnaire. Career titles are sourced from the platform's career catalogue database and ranked using AI analysis of student signals.

---

## 1. Data Collection Flow

**File:** `src/pages/QuickAssessment.tsx`

The assessment collects student data across 6 phases:

### Phase 1: Identity & Academics
- **Name** (text input)
- **Email** (for report delivery)
- **Grade** (Grade 7, 8, 9, or 11)
- **Pathway** (only for Grade 11: STEM, Arts & Sports, Social Sciences, Technical & Vocational)
- **Subjects** (multi-select from grade-specific subject lists)

### Phase 2: Interests
- Predefined interest categories (RIASEC-based)
- Custom interest input allowed
- Multi-select from category items

### Phase 3: Values & Work Style
- **Values** (pick 2): Independence, Collaboration, Stability, Creativity, Impact, Leadership
- **Work Style** (pick 1): Hands-on practical, Analytical/problem-solving, Creative/expression, People-focused, Structured/detailed

### Phase 4: Working Preferences
Three practical questions (not a personality test):
- **Focus**: Building something concrete vs Exploring new ideas
- **Decisions**: Data and logic vs People and values
- **Structure**: Clear plan and checklist vs Flexible and adaptive

### Phase 5: Reality Check
- **Barrier**: Biggest current challenge (free text)
- **Experience**: Relevant experience (free text)

### Phase 6: Readiness
- **Readiness level**: Self-assessed readiness to act on suggestions

### Optional: Target Career
- If student arrives via URL param `?career=X`, the assessment focuses on whether that career fits
- Stored as `targetCareer` in the payload

---

## 2. Career Catalogue Loading

**File:** `src/pages/QuickAssessment.tsx` (line ~220)

```typescript
const catalogue = await dashboardService.getCareerPaths(undefined, 160)
```

- Fetches up to 160 careers from the Supabase `career_paths` table
- Each career includes: `id`, `title`, `category`, `description`
- **Fallback**: If fetch fails, empty array is passed (AI still generates suggestions using default careers)
- **Catalogue role**: Acts as the "allowed list" — AI must choose careers from this catalogue

---

## 3. AI Prompt Construction

**File:** `src/lib/ai-service.ts` (line 351-440)

The `generateQuickAssessmentBrief()` method constructs the AI prompt:

### Grade-Specific Instructions

**Grade 7:**
```
Focus on broad exposure, subject curiosity, and safe short activities.
Do not discuss admissions, university choices, or locking in a pathway.
```

**Grade 8:**
```
Focus on connecting interests to subjects and building evidence through practical activities.
Begin exploring Senior School pathways without committing.
```

**Grade 9:**
```
Focus on testing ideas before Senior School pathway and subject selection.
Do not present a career as chosen or guaranteed.
```

**Grade 11:**
```
Focus on comparing training routes, subject requirements, and first experiences.
Do not promise admission, a salary, or employment.
```

### Student Data Passed to AI

```typescript
{
  grade: "Grade 7",
  pathway: "STEM", // only for Grade 11
  subjects: ["Mathematics", "Physics"],
  interests: ["coding", "robotics", "gaming"],
  values: ["Independence", "Impact"],
  workStyle: "Analytical/problem-solving",
  preferences: {
    focus: "Building something concrete",
    decisions: "Data and logic",
    structure: "Clear plan and checklist"
  },
  barrier: "Not sure which subjects to focus on",
  experience: "Built a simple website",
  readiness: "Ready to take action",
  targetCareer: "Software Engineer" // optional
}
```

### Career Catalogue Format

Careers are formatted as a simple list:
```
- Software Developer (Technology)
- UX/UI Designer (Technology & Design)
- Registered Nurse (Health)
- Accountant (Business)
```

### AI Rules (12 Rules)

The prompt includes 12 non-negotiable rules:

1. **Use exact career titles** from the catalogue (no broad labels like "technology")
2. **Age-appropriate framing** for Grades 7-9 (avoid adult job titles like "property sales agent")
3. **Exploratory language** (no "perfect fit", "destiny", or "final choice")
4. **Evidence-based reasoning** (cite 2+ student signals per career)
5. **Reality checks** (name an uncertainty about daily work, no invented facts)
6. **No MBTI/RIASEC mentions** (preferences aren't validated assessments)
7. **Direct, warm language** (no filler paragraphs)
8. **Practical starter activities** (safe, achievable with school/home resources)
9. **Grade-specific context** (tailored to student's stage)
10. **Action plan** (3 practical actions linked to CareerGuide features)
11. **CBC pathway mapping** (for Grades 7-9: map careers to STEM/Social Sciences/Arts & Sports Science)
12. **Placement context** (for Grades 7-8: explain 20% school-based + 60% Grade 9 summative structure)

---

## 4. AI Output Structure

The AI returns a JSON object with this shape:

```json
{
  "student_summary": "This brief is based on your Grade 7 subjects, interests, and working preferences. It's exploratory — designed to help you test ideas, not lock in a career.",
  
  "grade_context": "Grade 7 is for broad exploration. You are gathering evidence about subjects and activities before any pathway decision is needed.",
  
  "grade_focus": "Try different kinds of work, notice which school subjects you want to return to, and keep a small record of what you learn.",
  
  "careers": [
    {
      "career": "Software Developer",
      "why_it_appeared": "You selected Mathematics and Physics, and your interests include coding and robotics. Your preference for analytical problem-solving aligns with this field. This is a possibility to test, not a guarantee.",
      "reality_to_test": "Software development involves long debugging sessions and reading documentation. Does sustained problem-solving appeal to you?",
      "starter_activity": {
        "title": "Build a Simple Calculator",
        "instruction": "Use Scratch or Python to create a basic calculator that adds, subtracts, multiplies, and divides. Spend 30-45 minutes on this.",
        "reflection_prompt": "Did you enjoy the process of figuring out the logic, or did it feel frustrating?"
      }
    }
  ],
  
  "plan": [
    {
      "timeframe": "This week",
      "title": "Explore a Career",
      "action": "Read the Software Developer career page and note what surprised you.",
      "careerguide_action": "Explore careers"
    },
    {
      "timeframe": "This month",
      "title": "Talk to Someone",
      "action": "Ask your computer science teacher or a family member in tech about their daily work.",
      "careerguide_action": "Ask the AI counsellor"
    },
    {
      "timeframe": "This term",
      "title": "Try a Project",
      "action": "Complete one coding tutorial and reflect on whether you want to do more.",
      "careerguide_action": "Compare careers and subject pathways"
    }
  ]
}
```

---

## 5. Fallback System

**File:** `src/lib/quick-assessment-report.ts`

If the AI request fails, a local fallback generates suggestions:

### Default Careers (12 options)
```typescript
const DEFAULT_CAREERS = [
  { title: 'Software Developer', category: 'Technology' },
  { title: 'UX/UI Designer', category: 'Technology & Design' },
  { title: 'Cybersecurity Analyst', category: 'Technology' },
  { title: 'Architect', category: 'Built Environment' },
  { title: 'Civil Engineer', category: 'Engineering' },
  { title: 'Registered Nurse', category: 'Health' },
  { title: 'Environmental Scientist', category: 'Science' },
  { title: 'Data Analyst', category: 'Technology & Business' },
  { title: 'Journalist', category: 'Media' },
  { title: 'Graphic Designer', category: 'Creative Arts' },
  { title: 'Accountant', category: 'Business' },
  { title: 'Agronomist', category: 'Agriculture' },
]
```

### Grade-Specific Context Messages

**Grade 7:**
- Context: "Grade 7 is for broad exploration. You are gathering evidence about subjects and activities before any pathway decision is needed."
- Focus: "Try different kinds of work, notice which school subjects you want to return to, and keep a small record of what you learn."

**Grade 9:**
- Context: "Grade 9 is a pathway-exploration year. These career ideas are evidence to test before you choose Senior School subjects - not a decision to lock in today."
- Focus: "Use short projects and teacher feedback to decide which subject combinations and Senior School pathway keep the strongest options open."

**Grade 11:**
- Context: "Grade 11 is a transition-planning stage within the [pathway] pathway. Use these career ideas to compare subject requirements, training routes, and first experiences - not as a guarantee of admission or employment."
- Focus: "Turn your strongest current subjects into evidence: compare training requirements, speak with a practitioner or teacher, and complete one relevant project before narrowing your options."

### Generic "Why It Appeared" Text

The fallback uses template text:
```typescript
whyItAppeared: `This career appears in your brief because of your interest in ${interests[0]} and your ${workStyle} work style. It's a possibility to explore, not a final decision.`
```

---

## 6. What's Missing (Per Feedback)

### Critical Gaps for Grades 7-8

**1. CBC Placement Structure**
- ❌ No mention of the 20%/60% assessment split
- ❌ No explanation that Grades 7-8 performance (20%) + Grade 9 summative (60%) determines Senior School pathway
- ❌ No clarity that what students do THIS YEAR shapes their options

**2. Pathway Mapping**
- ❌ Career suggestions don't connect to CBC's three pathways: STEM, Social Sciences, Arts & Sports Science
- ❌ No explicit statement: "This career → STEM pathway" or "This career → Social Sciences pathway"
- ❌ Students/parents can't see which subjects to prioritize for which pathway

**3. Age-Appropriate Framing**
- ❌ Overly specific adult job titles (e.g., "Property Sales Agent" for a 12-year-old who "likes selling")
- ❌ Should frame as fields/domains: "business and entrepreneurship" instead of "estate agent"
- ❌ Adult baggage (commission pressure, cold rejection) irrelevant to middle schoolers

---

## 7. Current Implementation Status

### What's Already Fixed

✅ **Rule 11 added** to AI prompt:
> "CRITICAL FOR JUNIOR SECONDARY (Grades 7-9): Each career suggestion must map to one of CBC's three Senior School pathways: STEM, Social Sciences, or Arts & Sports Science. Explicitly state which pathway the career connects to and why."

✅ **Rule 12 added** to AI prompt:
> "CRITICAL FOR GRADES 7-8: The student_summary must explain that performance in Grades 7-8 counts toward Senior School pathway placement (20% from school-based assessments, 60% from Grade 9 summative). This is the actionable information that helps parents and students understand why now matters."

✅ **Grade-specific instructions expanded**:
- Grade 7: Now includes CBC context, pathway mapping requirement, age-appropriate framing
- Grade 8: Now includes mid-cycle stakes, pathway testing focus
- Grade 9: Now includes summative evaluation context, informed subject selection

✅ **Rule 2 updated**:
> "For Junior Secondary students (Grades 7-9), use age-appropriate framing. Avoid overly specific adult job titles (e.g., "property sales agent", "estate agent") that carry adult baggage. Instead, frame careers as fields or domains to explore (e.g., "business and entrepreneurship", "trade and commerce", "sports and athletics")."

### What Still Needs Work

⚠️ **Fallback system** (`quick-assessment-report.ts`) has not been updated:
- Still uses generic "why_it_appeared" text
- No pathway mapping
- No CBC placement context
- No age-appropriate framing

⚠️ **Output structure** doesn't include pathway field:
- AI returns `career`, `why_it_appeared`, `reality_to_test`, `starter_activity`
- No explicit `pathway` field in the career object
- Pathway info would be embedded in `why_it_appeared` text

⚠️ **UI display** doesn't show pathway tags:
- `QuickAssessmentDirectionBrief.tsx` renders career cards
- No pathway badge/tag visible on each career
- Students/parents can't quickly see which pathway each career maps to

---

## 8. Key Files Reference

| File | Purpose |
|------|---------|
| `src/pages/QuickAssessment.tsx` | 6-phase questionnaire UI, data collection, state management |
| `src/lib/ai-service.ts` | AI prompt construction, API call, response parsing |
| `src/lib/quick-assessment-report.ts` | Type definitions, fallback logic, grade-specific context |
| `src/components/QuickAssessmentDirectionBrief.tsx` | Career card display, UI rendering |
| `src/lib/dashboard-service.ts` | Career catalogue fetching (`getCareerPaths()`) |
| `src/lib/report-generator.ts` | PDF generation from brief data |

---

## 9. Data Flow Diagram

```
QuickAssessment.tsx
  ↓ (6 phases of data collection)
  ↓ (fetches career catalogue)
  ↓ (builds payload)
  
ai-service.ts
  ↓ (constructs prompt with grade context)
  ↓ (sends to AI with 12 rules)
  ↓ (receives JSON response)
  
quick-assessment-report.ts
  ↓ (normalizes AI response)
  ↓ (fallback if AI fails)
  
QuickAssessmentDirectionBrief.tsx
  ↓ (renders career cards)
  ↓ (displays starter activities)
  ↓ (shows action plan)
  
report-generator.ts
  ↓ (generates PDF HTML)
  ↓ (triggers download)
```

---

## 10. Testing Checklist

When testing the Quick Assessment:

- [ ] Grade 7 student sees CBC placement context in summary
- [ ] Grade 8 student sees mid-cycle stakes explained
- [ ] Grade 9 student sees summative evaluation context
- [ ] Career suggestions map to CBC pathways (STEM/Social Sciences/Arts & Sports Science)
- [ ] Career titles are age-appropriate (no "property sales agent" for Grade 7)
- [ ] Each career cites 2+ student signals in `why_it_appeared`
- [ ] Starter activities are practical and achievable
- [ ] Action plan has 3 steps linked to CareerGuide features
- [ ] Fallback system works if AI fails
- [ ] PDF downloads with all content visible

---

## Next Steps

1. **Update fallback system** to include pathway mapping and CBC context
2. **Add `pathway` field** to AI output structure
3. **Update UI** to display pathway badges on career cards
4. **Test with real students** across Grades 7, 8, 9, and 11
5. **Validate AI outputs** for age-appropriate framing
6. **Monitor fallback rate** (how often AI fails vs local fallback)
