# Access Fit Feature

## Overview

The "Access fit" feature allows students to test their compatibility with any career from the career directory. When clicked, it launches a personalized Quick Assessment focused on that specific career.

## How It Works

### 1. Career Directory Integration

**Location:** `src/components/CareerPaths.tsx`

Each career card displays two buttons:
- **View Details** - Opens the career detail modal
- **Access fit** - Launches personalized assessment

```typescript
<Button
  variant="outline"
  className="w-full font-bold border-primary/30 hover:border-primary hover:bg-primary/5"
  onClick={() => {
    navigate(`/quick-assessment?career=${encodeURIComponent(career.title)}`);
  }}
>
  Access fit
</Button>
```

### 2. URL Parameter Passing

The career title is passed as a URL parameter:
```
/quick-assessment?career=Software%20Engineer
```

### 3. QuickAssessment Page

**Location:** `src/pages/QuickAssessment.tsx`

#### Desktop Header
When a target career is present, the header changes:
- **Normal mode:** "CBC Pathway Assessment"
- **Fit mode:** "Testing fit for [Career Name]?"

#### Mobile Banner
A colored banner appears at the top of the card on mobile:
```
Testing fit for: Software Engineer
```

#### Data Flow
1. URL parameter is extracted: `const targetCareer = searchParams.get('career')`
2. Flag is set: `const isCareerFitMode = !!targetCareer`
3. Passed to guest profile as `dreamJob`
4. Passed to quick assessment as `targetCareer`

### 4. AI Service Integration

**Location:** `src/lib/ai-service.ts`

The AI service handles the target career specially:

#### Priority Handling
When `dreamJob` or `targetCareer` is present:
- The target career becomes the **FIRST recommendation**
- AI objectively evaluates if the student is a fit or misfit
- Evaluation is based on:
  - Subject performance alignment
  - Interest patterns
  - CBC pathway compatibility
  - Performance ratings

#### Prompt Instruction
```
CRITICAL: The student has requested an evaluation for the career: "{targetCareer}". 
MAKE THIS THE VERY FIRST RECOMMENDATION and objectively evaluate if they are a fit or a misfit.
```

### 5. Assessment Flow

When a student clicks "Access fit":

1. **Navigate** to `/quick-assessment?career={career_title}`
2. **Show** personalized header with career name
3. **Collect** student data through 4 phases:
   - Identity & Academics (name, email, grade, subjects, performance)
   - Interests & Activities (interests, clubs)
   - Parent Expectations (Grades 7-9) OR Vision (Grades 10-12)
   - Your Plans (Grades 10-12 only)
4. **Generate** brief with target career as first recommendation
5. **Display** paginated results with fit evaluation

### 6. Results Display

The QuickAssessmentDirectionBrief component:
- Shows the target career as the first career field (if it's a fit)
- Provides honest evaluation if it's a misfit
- Suggests alternative fields that better match the student's profile
- Includes training routes and next actions for all recommendations

## User Experience

### Desktop
1. Student browses trending careers on homepage
2. Clicks "Access fit" button
3. Sees personalized header: "Testing fit for Software Engineer?"
4. Completes assessment
5. Gets results with Software Engineer as first recommendation (if fit)

### Mobile
1. Student browses trending careers
2. Clicks "Access fit" button
3. Sees banner: "Testing fit for: Software Engineer"
4. Completes assessment
5. Gets results with Software Engineer as first recommendation (if fit)

## Technical Implementation

### Files Modified
- `src/components/CareerPaths.tsx` - Added "Access fit" button
- `src/pages/QuickAssessment.tsx` - Added header and banner for fit mode

### Files Already Supporting
- `src/lib/ai-service.ts` - Already handles targetCareer/dreamJob
- `src/lib/quick-assessment-report.ts` - Already supports targetCareer in payload
- `src/components/QuickAssessmentDirectionBrief.tsx` - Already displays results properly

## Benefits

1. **Personalized Experience** - Assessment is focused on student's specific interest
2. **Honest Evaluation** - AI provides objective fit/misfit assessment
3. **Alternative Suggestions** - If misfit, suggests better alternatives
4. **Context Awareness** - Uses full student profile (grades, interests, pathway)
5. **Seamless Flow** - No extra steps, just click and assess

## Testing

To test the feature:
1. Go to homepage
2. Find a trending career card
3. Click "Access fit" button
4. Verify header shows career name
5. Complete assessment
6. Check that target career appears first in results (if fit)
7. Check that evaluation is honest and evidence-based

## Future Enhancements

Potential improvements:
- Show fit score percentage
- Add "Why this is/isn't a fit" section
- Compare multiple careers side-by-side
- Save fit assessments to student profile
- Share fit assessment results with counselors
