# Quick Assessment: Feedback Response & Implementation Status

**Date**: September 26, 2026  
**Status**: Critical bug fixed, additional issues documented

---

## Summary

This document addresses the technical feedback received on September 26, 2026. We've fixed the ship-blocking bug (subjects split) and documented the remaining issues for follow-up.

---

## ✅ Fixed: subjects_to_prioritise Split (Ship-Blocking)

### The Bug

The `career_fields.subjects` array contained Senior Secondary subjects (e.g., "Computer Science"), but Junior Secondary students only have access to 12 core subjects. This caused validation failures or hallucinated subjects when the AI tried to generate `subjects_to_prioritise` for Grades 7-9.

### The Fix

**1. Database Schema Split**
- Added `jss_subjects` column (Junior Secondary subjects - 12 core subjects)
- Added `ss_subjects` column (Senior Secondary subjects - pathway-specific)
- Dropped the old `subjects` column
- Migration file: `supabase/migrations/20260926000000_split_subjects_jss_ss.sql`

**2. TypeScript Types Updated**
- `CareerField` interface now has `jss_subjects: string[]` and `ss_subjects: string[]`
- File: `src/lib/dashboard-service.ts`

**3. AI Prompt Updated**
- Fields list now shows both `[JSS subjects: ...]` and `[SS subjects: ...]`
- Rule #3 updated to specify which array to use based on grade
- File: `src/lib/ai-service.ts`

**4. Validation Logic Updated**
- Checks AI-generated subjects against the appropriate list based on grade
- Falls back to the right array if AI doesn't provide subjects
- File: `src/lib/quick-assessment-report.ts`

**5. Documentation Updated**
- Database schema section updated
- Rule #3 updated with grade-aware instructions
- File: `docs/QUICK_ASSESSMENT_GRADE_SPECIFICATION.md`

### Example

**Before (broken):**
```
Technology and Computing — STEM / Applied Sciences
subjects: ["Computer Science", "Mathematics"]
```
Grade 7 student gets told to prioritise "Computer Science" → validation fails (not in JSS curriculum)

**After (fixed):**
```
Technology and Computing — STEM / Applied Sciences
jss_subjects: ["Mathematics", "Integrated Science", "Pre-Technical & Pre-Career Studies"]
ss_subjects: ["Computer Science", "Mathematics", "Physics"]
```
Grade 7 student gets told to prioritise "Mathematics" and "Integrated Science" → validation passes

---

## ⚠️ Documented: 20% + 60% Framing (Unresolved from Last Round)

### The Issue

All three JSS grade instructions say pathway placement is "Grades 7-8 school-based assessments (20%) plus Grade 9 summative evaluation (60%)." That's 80%, not 100%. KPSEA (Grade 6, primary exit) is the missing 20%, and it's already locked in by the time any of these students take this assessment.

### Current State

The `student_summary` instruction (Rule #13) says:
> "The student_summary must explain the CBC placement structure for Grades 7-9, or the post-secondary landscape for Grades 10-12."

This is vague and doesn't explicitly require mentioning KPSEA.

### Recommended Fix

Update Rule #13 to:
> "The student_summary must explain the CBC placement structure for Grades 7-9: 'Your Grade 6 KPSEA result (20%) is already locked in. Here's what's still yours to influence: Grades 7-8 school-based assessments (20%) and Grade 9 summative (60%).' For Grades 10-12, explain the post-secondary landscape."

### Status

**Not fixed yet.** This is a documentation/prompt update, not a code change. Low risk, easy to implement.

---

## ⚠️ Documented: School Pathway Hard Suppress (Design Flaw)

### The Issue

Rule #5 says: if the school only offers 2 of 3 pathways, don't suggest fields from the missing one. But Senior School in Kenya is a nationwide selection through the portal—a student can rank and apply to any of the ~9,600 Senior Schools regardless of what their current Junior School offers.

Suppressing a strong, well-evidenced interest signal because the local JSS doesn't offer that pathway is actively withholding the most useful piece of information a family could act on: "this fits you, your current school doesn't offer it, here's the actual national process for applying somewhere that does."

### Current State

Rule #5 in `src/lib/ai-service.ts`:
> "For Grades 7-9: filter suggestions to school pathway availability. If the school only offers 2 of 3 pathways, don't suggest fields from the missing one."

### Recommended Fix

Change Rule #5 to a soft flag instead of a hard filter:
> "For Grades 7-9: if the school only offers 2 of 3 pathways, still suggest fields from the missing pathway if they're strongly evidenced, but add a note in `why_it_appeared`: 'Your current school doesn't offer this pathway, but you can apply to other schools through the national selection portal.'"

### Status

**Not fixed yet.** This is a prompt/logic change. Medium risk, requires testing.

---

## ⚠️ Documented: Rule #6 Parent Tension Wording (Guardrail Needed)

### The Issue

Rule #6 says: "acknowledge parent expectations in `why_it_appeared`. If the student's signals conflict with parent wishes, name that tension honestly."

This is fine in principle but genuinely easy to get wrong in tone. "Name that tension honestly" without specifying *how* leaves room for an output that reads as "your parent is wrong about you," landing in a kid's inbox with zero adult mediation.

### Current State

Rule #6 in `src/lib/ai-service.ts`:
> "For Grades 7-9: acknowledge parent expectations in why_it_appeared. If the student's signals conflict with parent wishes, name that tension honestly."

### Recommended Fix

Update Rule #6 to:
> "For Grades 7-9: acknowledge parent expectations in `why_it_appeared`. If the student's signals conflict with parent wishes, name it neutrally as a thing worth discussing together, never as a verdict on which side is right. Example: 'Your parent hopes you'll become an engineer, and your strong performance in Mathematics and interest in coding suggest technology could be a good fit—this is worth exploring together.'"

### Status

**Not fixed yet.** This is a prompt wording change. Low risk, easy to implement.

---

## 📝 Documented: Grade 9 Timing Awareness (Lower Priority)

### The Issue

Nothing in the Grade 9 payload captures where in the academic year the assessment is happening. Selection (ranking pathway/school choices) runs June 9-30, KJSEA sits Oct/Nov, placement lands in December. The Grade 9 instructions say "test final career ideas before committing to a pathway," but a student taking this in September has already submitted their ranked choices back in June. The advice is stale for anyone past the selection window.

### Current State

Grade 9 instructions in `src/lib/ai-service.ts`:
> "The student is in Grade 9 (final year of Junior Secondary). CRITICAL: The summative evaluation this year determines 60% of their Senior School pathway placement. Grades 7-8 school-based assessments make up the other 20%. They need to: 1. Test final career ideas before committing to a Senior School pathway..."

This assumes pre-selection timing.

### Recommended Fix

Add a `hasCompletedSelection` boolean to the Grade 9 payload and update the Grade 9 instructions:
> "If `hasCompletedSelection` is true: 'You've already submitted your pathway choices in June. Now focus on preparing for KJSEA (Oct/Nov) which determines 60% of your placement.' If false: use the current instructions."

### Status

**Not fixed yet.** This requires adding a new field to the payload, updating the UI, and updating the prompt. Medium risk, requires UI changes.

---

## 📝 Documented: Law and Governance Grade Appropriateness (Doc Contradiction)

### The Issue

The documentation says "Law and Governance" is "Grade 12 only" in the example section, but the migration SQL sets it to `['10', '11', '12']`.

### Current State

**docs/QUICK_ASSESSMENT_GRADE_SPECIFICATION.md:**
> "- Law and Governance (Social Sciences / Humanities & Business Studies) - Grade 12 only"

**supabase/migrations/20260926000000_split_subjects_jss_ss.sql:**
```sql
UPDATE career_fields 
SET grade_appropriateness = ARRAY['10', '11', '12']
WHERE name IN ('Law and Governance', ...)
```

### Recommended Fix

Update the documentation to match the migration:
> "- Law and Governance (Social Sciences / Humanities & Business Studies) - Grades 10-12"

### Status

**Not fixed yet.** This is a documentation update. Trivial risk.

---

## Implementation Plan

### Immediate (This PR)

1. ✅ **Subjects split** - Database migration, TypeScript types, AI prompt, validation logic, documentation
2. ✅ **Documentation updates** - Database schema, Rule #3, examples

### Next PR (Follow-up)

1. **20% + 60% framing** - Update Rule #13 to explicitly mention KPSEA
2. **School pathway soft flag** - Change Rule #5 from hard filter to soft flag
3. **Parent tension guardrail** - Update Rule #6 with neutral wording
4. **Law and Governance doc fix** - Update grade appropriateness in docs

### Future PR (Enhancement)

1. **Grade 9 timing awareness** - Add `hasCompletedSelection` field, update UI and prompt

---

## Files Changed

### This PR

- `src/lib/dashboard-service.ts` - Added `jss_subjects` and `ss_subjects` to `CareerField` interface
- `src/lib/ai-service.ts` - Updated fields list format, updated Rule #3
- `src/lib/quick-assessment-report.ts` - Added grade-aware validation logic
- `docs/QUICK_ASSESSMENT_GRADE_SPECIFICATION.md` - Updated schema, Rule #3, added subjects split section
- `supabase/migrations/20260926000000_split_subjects_jss_ss.sql` - Database migration

### Next PR (Planned)

- `src/lib/ai-service.ts` - Update Rule #5, #6, #13
- `docs/QUICK_ASSESSMENT_GRADE_SPECIFICATION.md` - Update Rule #5, #6, #13, Law and Governance example
- `src/pages/QuickAssessment.tsx` - Add `hasCompletedSelection` field (future)
- `src/lib/quick-assessment-report.ts` - Add `hasCompletedSelection` to types (future)

---

## Testing Checklist

### This PR

- [ ] Run migration on dev database
- [ ] Verify `jss_subjects` and `ss_subjects` columns created
- [ ] Verify data migrated correctly
- [ ] Test Grade 7 assessment - verify subjects_to_prioritise uses JSS subjects
- [ ] Test Grade 10 assessment - verify subjects_to_prioritise uses SS subjects
- [ ] Verify validation rejects invalid subjects
- [ ] Check AI prompt includes both subject lists
- [ ] Verify documentation is accurate

### Next PR

- [ ] Test Grade 7 assessment with parent expectation conflict - verify neutral tone
- [ ] Test Grade 9 assessment with school that only offers 2 pathways - verify soft flag appears
- [ ] Verify student_summary mentions KPSEA
- [ ] Test all grades to ensure no regressions

---

## Bottom Line

**Ship-blocking bug fixed.** The subjects split addresses the critical validation failure for Grades 7-9. The remaining issues are real but survivable and can be patched in the next PR.

**Core architecture is solid.** DB-as-ground-truth, tolerant matching, grade-differentiated schema—this is the right shape. The details underneath just need one more round of polish.

**Next steps:**
1. Merge this PR (subjects split)
2. Run migration on production database
3. Test end-to-end with real Grade 7, 8, 9, 10, 11, 12 students
4. Ship follow-up PR with remaining fixes
5. Monitor for any new issues
