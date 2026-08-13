# Hybrid AI Caching Architecture

CareerPath AI implements a multi-tier caching system to ensure that dynamic AI guidance is both **fast (zero-latency)** and **accurate (always in-sync)**.

## 1. The Challenge
AI analysis of RIASEC profiles and grades can take 5-10 seconds. Requesting this on every page refresh or device switch would lead to:
- Poor User Experience (waiting for spinners).
- High API Costs.
- Redundant data generation.

## 2. The Solution: Tiered Caching

### Tier 1: L1 Cache (Local/Browser)
- **Implementation**: `localStorage` + Cookies.
- **Location**: Student's browser.
- **Logic**: Used for instant page loads. When a student navigates between dashboard tabs or refreshes the page, the data is served in <10ms.

### Tier 2: L2 Cache (Persistent/Database)
- **Implementation**: Supabase Tables (`cached_career_recommendations`, `cached_career_details`).
- **Location**: Centralized Database.
- **Logic**: Used for cross-device persistence. If a student finishes an assessment on a school computer and later checks their phone at home, the recommendations are instantly available without a new AI call.

## 3. Dynamic Invalidation (Context Fingerprinting).

The cache is not a static timer. We use a **Context Hash** to ensure the advice is always fresh.

### The Fingerprint
Every time the dashboard or assessment loads, the system generates a **Hash** of the current student's state:
- **Profile**: Interests, Career Goals, School Level, Grade.
- **Academics**: Every single grade entry in the `student_grades` table.

### The Logic
1. System generates a **New Hash** from current data.
2. System retrieves the **Stored Hash** from the user's browser/database.
3. **If matches**: Serve the cache.
4. **If mismatch**: (e.g., a Teacher uploaded a new math grade, or the student changed an interest), the system **instantly invalidates** all caches and triggers a fresh AI generation.

This ensures that the "AI Mentor" always knows the latest facts about the student, providing a "living" guidance experience.

---
*For more on the AI's internal decision making, see [TRIANGULATION_LOGIC.md](./TRIANGULATION_LOGIC.md).*
