---
name: curriculum-verification
description: Verify and align project curriculum data against official education sources, fix discrepancies in docs and code, and add contextual integration points
source: auto-skill
extracted_at: '2026-07-10T09:38:02.122Z'
---

# Curriculum Verification and Alignment

Systematic workflow for verifying education curriculum data in a project against official sources, identifying discrepancies, and updating both documentation and code to maintain accuracy.

## When to Use

- Project contains curriculum structures (grade levels, subjects, pathways, assessments)
- Data needs to align with official education frameworks (KICD, KNEC, Cambridge, IB, etc.)
- Code references curriculum data that may be outdated
- Need to add "where product fits" context into curriculum decision points

## Procedure

### 1. Gather Official Sources

Fetch and cross-reference:
- **Primary sources**: Official curriculum bodies (KICD, KNEC, Cambridge Assessment, IBO)
- **Secondary sources**: Wikipedia education articles, government education ministry sites
- **Training knowledge**: Use when official sites are unreachable, but flag confidence level

**Key facts to verify:**
- System structure (e.g., 2-6-3-3-3 for Kenya CBC)
- Subject lists by level (compulsory vs elective)
- Assessment names and first administration dates
- Pathways/tracks available
- Grading scales

### 2. Create Discrepancy Report

Compare project docs against verified facts. Categorize issues:

| Severity | Example |
|---|---|
| **Major** | Wrong structure (Early Years + Middle School vs official 2-6-3-3-3) |
| **Major** | Missing pathway (3 pathways listed vs 4 official pathways) |
| **Medium** | Wrong assessment date (KLEE 2026 vs 2025) |
| **Medium** | Missing assessment (KPSEA not mentioned) |
| **Medium** | Incorrect subject grouping (Creative Arts + PE separate vs combined) |
| **Minor** | Nuanced date (framework 2017 vs pilot 2019) |

### 3. Fix Documentation Systematically

Update in order:
1. **Structure tables** - Fix grade levels, age ranges, durations
2. **Subject lists** - Add missing subjects, combine integrated areas correctly
3. **Assessment sections** - Add missing exams, fix dates, clarify purpose
4. **Pathways** - Add missing tracks with full subject lists
5. **Comparison tables** - Update side-by-side curriculum comparisons

### 4. Add Contextual Integration Points

Create a "Career Guidance Touchpoints" or "Product Integration" section that maps:
- **Critical decision points** in the curriculum (transitions, exams, pathway selection)
- **Grade/age** when each occurs
- **What happens** at that point
- **Where your product fits** (assessment, guidance, reports, dashboards)

**Key insight to highlight:** Identify when curriculum decisions happen *earlier* than legacy systems and position product as filling that gap.

### 5. Update Code Files

Search for hardcoded curriculum data in:
- **Constants/arrays** (subject lists, pathway options)
- **Type definitions** (pathway enums, curriculum types)
- **UI components** (dropdown menus, selection buttons)
- **Form schemas** (validation rules for curriculum fields)

**Changes needed:**
- Add new pathways to union types
- Add missing subjects to arrays
- Fix subject names (e.g., "Pre-Technical Studies" → "Pre-Technical & Pre-Career Studies")
- Update UI to show new pathway options with readable labels

### 6. Verify Compilation

Run TypeScript compiler (`npx tsc --noEmit`) to catch:
- Type mismatches from new pathway values
- Missing array indices
- Broken enum references

## Example: Kenya CBC Verification

**Found discrepancies:**
- Structure showed "Early Years (PP1-PP2, Grades 1-3)" + "Middle School (Grades 4-6)"
- Only 3 Senior Secondary pathways listed (missing Technical & Vocational)
- KLEE first administration listed as 2026 (should be 2025)
- KPSEA assessment missing entirely
- "Creative Arts" and "Physical Education" listed as separate electives (should be combined as one compulsory area)

**Fixed:**
- Restructured to official 2-6-3-3-3 (Pre-Primary → Primary → Junior Secondary → Senior Secondary)
- Added 4th pathway with subjects (Building & Construction, Electrical & Electronics, Mechanical Engineering, Agriculture, Home Science, Hairdressing & Beauty, Plumbing & Carpentry)
- Added KPSEA section (Grade 6 assessment, first administered 2022)
- Combined "Creative Arts and Sports" as single compulsory area
- Added "Life Skills Education" as compulsory JS subject
- Added Section 6b mapping 6 career guidance touchpoints to CBC decision points

## Common Pitfalls

- **Integrated subjects**: CBC combines Biology/Chemistry/Physics into "Integrated Science" at Junior Secondary — don't list them separately
- **Combined learning areas**: "Creative Arts and Sports" is one area, not two electives
- **Official names**: Use exact names from KICD (e.g., "Pre-Technical & Pre-Career Studies" not "Pre-Technical Studies")
- **First administration dates**: Calculate from first cohort progression (2019 pilot → Grade 6 in 2022 → Grade 9 in 2025 → Grade 12 in 2028)
- **Pathway completeness**: Always verify number of official pathways — projects often list only academic tracks

## Confidence Tracking

When official sources are unreachable, explicitly track confidence:

| Detail | Confidence | Source |
|---|---|---|
| Structure 2-6-3-3-3 | HIGH | Wikipedia + KICD |
| KLEE name | MEDIUM | Training knowledge only |
| KUSE vs KSEC | LOW-MEDIUM | Conflicting references |

Flag low-confidence items for user verification.
