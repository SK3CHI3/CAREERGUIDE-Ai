# AI Guidance Generation Process

The generation process in CareerPath AI is a multi-step workflow designed for precision and actionability. It leverages the Qwen via ModelScope API with a sophisticated recursive prompting strategy.

## 1. Context Assembly
Before calling the AI, the system gathers a "Full User Context" (`UserContext` interface):
- Full Name & Grade Level
- CBE Subjects & Average Grades
- Strongest/Weakest subjects
- Top 3 RIASEC Personality Types
- Core Values (e.g., Impact, Income)
- Specific Constraints (e.g., Family obligations, Scholarships needed)

## 2. Prompt Engineering Strategy
We use **Role-Based Prompting** combined with **Constraint-Satisfaction Logic**:
- **Student Recommendations**: The AI is prompted as a "Kenyan Career Counselor." It must return a JSON array with specific fields including `whyRecommended` and `actionabilityScore`.
- **Teacher Insights**: The AI is prompted as a "Pedagogical Mentor." It focus on tactical classroom actions and mentorship talking points.

## 3. Output Validation & Formatting
- **Sanity Check**: The system extracts JSON from the AI response and validates the existence of required fields (`title`, `matchPercentage`, etc.).
- **Fallback Logic**: If the AI fails to produce valid JSON or errors out, the system provides a robust fallback mechanism to ensure the user always sees recommendations.

## 4. The Caching Layer (Efficiency)
To minimize latency (which can be 5-10 seconds for deep analysis):
1. The system checks `ai_recommendations_cache` table in Supabase.
2. If a valid, non-expired cache exists, it is served instantly.
3. Fresh generation only occurs when the profile changes significantly or the cache expires.

## 5. Security & Safety
- **JWT Protection**: All AI-related requests are protected by Supabase Auth state.
- **Environment Safety**: The ModelScope token is stored as the server-only `MODELSCOPE_API_KEY` environment variable and is never exposed in the frontend bundle.
