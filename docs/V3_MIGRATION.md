# V3 Migration — Student + Teacher Focus

## Overview

V3 removes the school system entirely and restructures the platform around two core roles: **students** seeking career guidance and **teachers** helping them make better choices.

## What Changed

### Removed
- `school` role (PostgreSQL enum still has the value, but the app no longer uses it)
- All 5 school pages: `SchoolDashboard`, `SchoolTeachers`, `SchoolClasses`, `SchoolStudents`, `SchoolInsightsPage`
- School components: `SchoolOnboarding`, `InviteTeacher`, `SchoolInsights`, `SubscriptionCard`
- `school-service.ts` and all school-related imports
- `AcceptInvite` page and invite token flow
- Institutional subscription path (only individual + trial remain)
- 4 school user accounts and 1 school record from the database

### Reworked
- **SignupForm** — Now offers Student and Mentor (instead of Student and School)
- **Hero** — Landing page CTA buttons changed from Student/School to Student/Mentor
- **MentorDashboard** — Removed school_id dependency; mentors create independent classes
- **ClassService** — `school_id` parameter removed from `createClass()`
- **SubscriptionService** — Removed institutional subscription check path
- **PaymentWall** — Removed school-based per-student pricing
- **Dashboard redirect** — Removed school case
- **Mentor Role** — Renamed "Teacher" role to "Mentor" to include parents/guardians guiding students

### New
- **`/student/chat` route** — Full-page AI career chat with improved response parsing
- **`StudentChatPage.tsx`** — Dedicated full-page chat component with markdown rendering
- **`TrialActivationModal.tsx`** — Modal replacing the inline trial banner
- **Dashboard chat tab** — Now links to full-page `/student/chat` instead of embedded component
- **Counselor Booking System** — New feature allowing students to book 1-on-1 sessions with verified professional counselors

### Bug Fixes
- Replaced `window.location.href` with `navigate()` in 6 locations:
  - `CareerPaths.tsx` (line 206)
  - `CareerDetailModal.tsx` (line 160)
  - `Careers.tsx` (lines 244, 310)
  - `ProtectedRoute.tsx` sign-out (line 52)
- Replaced `window.location.reload()` in `StudentDashboard.tsx` trial activation
- Fixed AI career recommendations not loading on app open (improved L1 cache fallback)
- Fixed career titles not showing on Careers page reload (added empty-data guard)

### Mobile Improvements
- Compact header (h-14 mobile, h-16 desktop)
- Welcome greeting hidden on mobile (saves vertical space)
- Stacked trial/expiry banners with full-width buttons
- Compact stats cards with smaller icons and text
- Chart grid properly stacks on small screens
- Compact action cards with hidden descriptions on mobile
- Career cards with truncated text and smaller badges
- Journey tab cards with responsive heights (400→500→600px)
- Tab labels shortened: "AI Chat" → "Chat"

### Caching Improvements
- **Parallelized** `loadDashboardData` with `Promise.all` (stats + career recs + subscription)
- **localStorage** 2-minute session cache for dashboard stats (key: `sd_cache_{userId}`)
- **sessionStorage** cache for AI insights (key: `ai_insights_{userId}`) — skips DeepSeek API on re-mount
- **Merged** `checkAccessStatus` into the main `Promise.all` load
- **Non-blocking** course recommendations and AI insights (fire-and-forget background loads)

## Database Changes

### Migrations Applied
| Migration | Description |
|-----------|-------------|
| `v3_make_classes_school_id_nullable` | `classes.school_id` changed from NOT NULL to nullable |
| `v3_remove_school_data_and_users` | Deleted 1 school, 2 school_members rows, 4 auth.users + profiles |
| `20260710000000_enable_rls_counselor_tables` | RLS policies for counselor_profiles, sessions, messages |

### Tables Still Present (archived, not used by app)
- `schools` — Empty (was 1 row)
- `school_members` — Empty (was 2 rows)
- `school_subscriptions` — Empty (was 0 rows)
- `teacher_invites` — Empty (was 0 rows)
- `field_day_requests` — 0 rows (school_id FK still exists)

### User Role Enum
PostgreSQL `user_role` enum still contains `'school'` (can't remove from PG enums), but the app's TypeScript type is `'student' | 'admin' | 'teacher'` only.

## Architecture Impact

### Before V3
```
Student → School → Teacher hierarchy
Schools invited teachers via tokens
Institutional subscription via school_subscriptions
school_id required for classes
```

### After V3
```
Student ←→ Teacher (direct relationship)
Teachers self-register
Individual subscription only (no institutional)
Classes can be school-independent (school_id nullable)
```

## Files Modified (36 files, +1,405 / -2,857 lines)

### Deleted (11 files)
- `src/pages/SchoolDashboard.tsx`
- `src/pages/SchoolTeachers.tsx`
- `src/pages/SchoolClasses.tsx`
- `src/pages/SchoolStudents.tsx`
- `src/pages/SchoolInsightsPage.tsx`
- `src/pages/AcceptInvite.tsx`
- `src/components/school/SchoolOnboarding.tsx`
- `src/components/school/InviteTeacher.tsx`
- `src/components/school/SchoolInsights.tsx`
- `src/components/school/SubscriptionCard.tsx`
- `src/lib/school-service.ts`

### Created (3 files)
- `src/pages/StudentChatPage.tsx`
- `src/components/TrialActivationModal.tsx`
- `supabase/migrations/20260710000000_enable_rls_counselor_tables.sql`

### Modified (22 files)
- `src/App.tsx` — Removed school routes, added `/student/chat`
- `src/types/roles.ts` — Removed `school` from union type
- `src/contexts/AuthContext.tsx` — Updated role type
- `src/pages/StudentDashboard.tsx` — Mobile UI, caching, chat link, trial modal
- `src/pages/TeacherDashboard.tsx` — Removed school dependency
- `src/pages/Dashboard.tsx` — Removed school redirect
- `src/pages/Auth.tsx` — Updated role type
- `src/pages/Careers.tsx` — Fixed title loading on reload
- `src/components/CareerPaths.tsx` — Fixed navigation
- `src/components/CareerDetailModal.tsx` — Fixed navigation
- `src/components/Hero.tsx` — Student/Teacher CTAs
- `src/components/auth/SignupForm.tsx` — Student/Teacher signup
- `src/components/auth/ProtectedRoute.tsx` — Fixed navigation
- `src/components/PaymentWall.tsx` — Removed school pricing
- `src/components/PaymentGate.tsx` — Removed school-service import
- `src/lib/subscription-service.ts` — Removed institutional path
- `src/lib/class-service.ts` — Removed school_id param
- `src/lib/ai-cache-service.ts` — Improved L1 fallback
- `src/components/teacher/CreateClass.tsx` — Removed school_id prop

## Deployment Notes

1. **No breaking changes to student/teacher users** — They continue to work as before
2. **School users cannot log in** — Their accounts were deleted
3. **Netlify SPA fallback** — Already configured, no changes needed
4. **Environment variables** — No new variables required
5. **Database** — Migrations already applied via Supabase MCP

## Rollback Plan

If rollback is needed:
1. Checkout `main` branch (pre-v3)
2. School routes and pages will be restored
3. Database: school data was deleted, would need re-creation
4. `user_role` enum never changed in DB, so no rollback needed there

## Remaining Work (Future Phases)

- **Phase 4**: Implement `@tanstack/react-query` for proper data caching (installed but unused)
- **Phase 5**: Final cleanup pass, update landing page copy, update FAQ
