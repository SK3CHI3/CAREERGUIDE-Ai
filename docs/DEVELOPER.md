# CareerPath AI: Developer Documentation & Technical Decisions

This document serves as the "source of truth" for technical decisions and architectural patterns used in the CareerPath AI platform.

## 1. Architectural Overview
CareerPath AI is a modern SaaS platform built with:
- **Frontend**: React 18, Vite, Tailwind CSS, Shadcn/UI.
- **Backend/BaaS**: Supabase (Auth, PostgreSQL, Real-time).
- **AI Core**: DeepSeek-V3 (via DeepSeek API).

## 2. Core Technical Decisions

### 2.1. "Realistic Triangulation" Engine
The primary differentiator of this platform is the triangulation logic.
- **The Problem**: Career tools often rely on naive interest matching, ignoring real-world constraints.
- **The Solution**: A synthesis of four data dimensions:
    - **Psychometric**: RIASEC (Holland Codes) personality types.
    - **Academic**: CBE subject performance and grade trends.
    - **Socio-Economic**: Financial, geographical, and time constraints.
    - **Strategic**: Kenyan Market Realities (Vision 2030).
- **Implementation**: Managed in `src/lib/ai-service.ts` using prompt engineering that enforces constraint-satisfaction.

### 2.2. Role-Based Access Control (RBAC)
- **Architecture**: A centralized `AuthContext.tsx` handles Supabase session management.
- **Roles**: `student`, `teacher`, `school`, `admin`.
- **Logic**: The `ProtectedRoute` component enforces role requirements before allowing access to dashboard paths.

### 2.3. AI Performance & Cost Management
- **Decision**: Implement a Server-Side Cache.
- **Solution**: `AICacheService` (`src/lib/ai-cache-service.ts`) stores career recommendations in the `ai_recommendations_cache` table.
- **Outcome**: 90%+ reduction in latency for returning users and significant reduction in AI API costs.

### 2.4. Teacher-Centric Pedagogical Insights
- **Decision**: Create a dedicated view for teachers to "see into" the AI's logic.
- **Implementation**: The `StudentInsightDialog` in `src/components/teacher/` uses the AI to translate student triangulation data into classroom-level tactical actions.

### 2.5. Data Modeling (PostgreSQL)
- **JSONB Usage**: We use JSONB for `assessment_results` to allow the personality framework to evolve (e.g., adding DISC or Big Five later) without schema migrations.
- **Relational Integrity**: Traditional tables for `classes`, `enrollments`, and `student_grades` ensure strict data consistency for academic records.

### 2.6. Counselor Booking System
- **Architecture**: A new component-based system for booking 1-on-1 career counseling sessions.
- **Components**: 
  - `CounselorBookingSection.tsx` - Main marketing section for counselor bookings
  - `CounselorCard.tsx` - Individual counselor display
  - `BookingModal.tsx` - Session scheduling modal
- **Integration**: Uses existing IntaSend payment infrastructure with BOOK_ prefixed references
- **Database**: Creates entries in `counselor_sessions` table linking students and counselors

### 2.7. Mentor Role System
- **Architecture**: Implemented mentor role to replace teacher role, expanding scope to include parents and guardians
- **Components**: 
  - `MentorDashboard.tsx` - Dashboard for mentors managing students
  - `SignupForm.tsx` - Updated registration form to include mentor-specific fields
  - `StudentInsightDialog.tsx` - Mentor-focused career insights
- **Database**: Extended `profiles` table with `mentor_student_count` and `mentor_type` fields
- **Services**: Modified `class-service.ts` to work with mentor IDs instead of teacher IDs
- **Authentication**: Updated `AuthContext.tsx` to recognize mentor role

## 3. Development Guidelines
- **Modern Typography**: Always use Google Fonts (Inter/Outfit) for a premium feel.
- **Type Safety**: Avoid `any` - use the interfaces defined in `src/types/database.ts`.
- **Micro-Animations**: Use `framer-motion` or CSS transitions for hover states to keep the app feeling "alive."

## 4. Key Service Endpoints
- `AICareerService.generateCareerRecommendations`: The primary endpoint for triangulation.
- `AICareerService.generateTeacherInsights`: Specialized pedagogical generation.
- `DashboardService.calculateAcademicPerformance`: Aggregates grades into performance trends.
