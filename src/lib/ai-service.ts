import { supabase } from './supabase'
import type { AIConversation, ChatMessage, UserProfile } from '../types/database'
import { KUCCPS_CLUSTERS, UNIVERSITY_DATA, CUTOFF_ESTIMATES } from './kuccps-reference'
import {
  normaliseQuickAssessmentBrief,
  type QuickAssessmentBrief,
  type QuickAssessmentInput,
  type AssessmentCareerCatalogueItem,
} from './quick-assessment-report'

const AI_ENDPOINT = '/.netlify/functions/ai-chat'

export type { ChatMessage } from '../types/database'

export interface UserContext {
  name?: string
  curriculum?: 'cbc' | string
  schoolLevel?: UserProfile['school_level']
  currentGrade?: string
  subjects?: string[]
  interests?: string[]
  careerGoals?: string
  dreamJob?: string
  assessmentResults?: UserProfile['assessment_results']
  constraints?: string[]
  previousRecommendations?: UserProfile['previous_recommendations']
  academicPerformance?: {
    overallAverage: number
    strongSubjects: string[]
    weakSubjects: string[]
    performanceTrend: 'improving' | 'declining' | 'stable'
  }
  gradeSnapshot?: { subject: string; average: number }[]
  hasRecordedGrades?: boolean
  quickAssessment?: QuickAssessmentInput
  availableCareers?: AssessmentCareerCatalogueItem[]
}

class AICareerService {
  private createSystemPrompt(userContext: UserContext): string {
    const assessment = userContext.assessmentResults;
    const riasec = assessment?.riasec_scores;
    const personality = assessment?.personality_type?.join(', ');
    const values = assessment?.values?.join(', ');
    const constraints = userContext.constraints?.join(', ') || assessment?.constraints?.join(', ');

    const assessmentSection = assessment ? `
ASSESSMENT DATA:
${riasec ? `- RIASEC Personality: ${personality} (Scores: R:${riasec.realistic}, I:${riasec.investigative}, A:${riasec.artistic}, S:${riasec.social}, E:${riasec.enterprising}, C:${riasec.conventional})` : ''}
${values ? `- Core Values: ${values}` : ''}
${constraints ? `- Real-world Constraints: ${constraints}` : ''}
` : '';

    const curriculumSection = `
CURRICULUM SPECIFICS:
- Current Curriculum: Competency-Based Curriculum (Kenya)
- Use the student's recorded pathway and subjects as planning context, not as proof of a formal eligibility decision.
- Do not present pathway, programme, KUCCPS cluster, university entry, salary, or labour-demand information as current official fact without a current verified source.
`;

    const academicSection = userContext.hasRecordedGrades && userContext.academicPerformance ? `
ACADEMIC PERFORMANCE:
- Overall: ${userContext.academicPerformance.overallAverage.toFixed(1)}%
- Strong in: ${userContext.academicPerformance.strongSubjects.join(', ')}
- Weak in: ${userContext.academicPerformance.weakSubjects.join(', ')}
- Subject averages: ${userContext.gradeSnapshot?.map(item => `${item.subject} ${item.average}%`).join(', ') || 'No subject breakdown available'}
- Recent direction: ${userContext.academicPerformance.performanceTrend}
` : `
ACADEMIC PERFORMANCE:
- No grades have been uploaded. Do not invent marks, strengths, weaknesses, or eligibility. Explain what evidence is still needed when it matters.
`;

    return `You are CareerGuide AI, a careful career adviser for Kenyan students. Use only the student context below and clearly distinguish a useful possibility from a confirmed academic fit. Your job is to turn their real profile into practical next steps, not to flatter them or make unsupported promises.

CURRENT USER PROFILE:
${userContext.name ? `- Name: ${userContext.name}` : '- Name: Not provided'}
${userContext.curriculum ? `- Curriculum: ${userContext.curriculum.toUpperCase()}` : '- Curriculum: Not specified'}
${userContext.schoolLevel ? `- Education Level: ${userContext.schoolLevel}` : '- Education Level: Not specified'}
${userContext.currentGrade ? `- Current Grade: ${userContext.currentGrade}` : '- Current Grade: Not specified'}
${userContext.subjects?.length ? `- Subjects: ${userContext.subjects.join(', ')}` : '- Subjects: Not specified'}
${userContext.interests?.length ? `- Career Interests: ${userContext.interests.join(', ')}` : '- Career Interests: Not specified'}
${userContext.careerGoals ? `- Career Goals: ${userContext.careerGoals}` : '- Career Goals: Not specified'}
${assessmentSection}
${curriculumSection}
${academicSection}

GUIDANCE LOGIC:
1. Treat RIASEC, interests and stated goals as signals to explore—not proof that a career fits. Never claim a student is suited to a career from interests alone.
2. Compare possible paths against their actual grades when they exist. If evidence is missing or a subject is below a typical requirement, say so plainly and suggest a realistic way to investigate, improve, or keep options open.
3. Personal Values: Factor in what matters to them (e.g., Autonomy, Impact, Income). If they value stability, avoid highly volatile freelance/startup-heavy paths unless they have a safety net.
4. Feasibility & Constraints: Respect constraints (Geography, Finance, Time). If they need remote work or scholarships, prioritize careers with high digital accessibility or available government/private funding in Kenya.
5. Labor Market Reality: Do not present salary, university entry thresholds, course availability, or labour demand as verified facts unless the student asks and you can state that they should confirm the current official source.

CONVERSATION STRUCTURE:
1. Greeting & Context - Acknowledge their assessment results and core values.
2. Dynamic Exploration - Ask one question at a time to dive deeper into how their values conflict or align with their interests.
3. Actionable Coaching - Don't just list careers; provide the "Feasibility Score" for their goals.
4. Professional Recommendations - Provide 3 precise career matches based on all data. Ensure at least one recommendation is an emerging or unconventional role if it fits their RIASEC/Values.

FORMATTING RULES:
- Return display-ready Markdown only. Never return JSON, raw HTML, XML tags, a prompt transcript, or hidden reasoning.
- Keep responses easy to scan: a short direct answer, then concise bullets or numbered steps where useful.
- Use Markdown bolding (**text**) sparingly for decisions and actions. No emojis unless the student uses them first.
- Use one clear follow-up question only when more student information is genuinely needed.
- Avoid robotic technical jargon and never say "perfect career path".

CURRENT-FACTS SAFETY:
- Requirements and course availability change. Treat the app's verified catalogue as the source for exploration and direct the student to current KUCCPS or institution sources before they make an application decision.
- Never invent cluster points, cut-offs, salary figures, university availability, or admissions requirements.

CRITICAL: Except when specifically asked for an Assessment Summary or JSON recommendations, ask only ONE question per response. Be curious, realistic, and empathetic. Wait for their answer before proceeding.`
  }

  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[],
    userContext: UserContext,
    retryCount = 0,
    purpose: 'student-chat' | 'guest-preview' = 'student-chat'
  ): Promise<string> {
    const maxRetries = 2
    const retryDelay = 1000 * (retryCount + 1) // Exponential backoff

    try {
      const systemPrompt = this.createSystemPrompt(userContext)

      const history = conversationHistory.slice(-16).map(msg => ({ role: msg.role, content: msg.content }))
      // Public preview traffic is deliberately sent without a privileged system
      // message. That keeps the anonymous endpoint useful but prevents it from
      // becoming a general prompt-injection proxy.
      const messages = purpose === 'guest-preview'
        ? [{ role: 'user', content: `${systemPrompt}\n\nStudent question: ${message}` }]
        : [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: message }]

      return await this.requestCompletion(messages, 800, 0.7, purpose)
    } catch (error) {
      console.error('AI Service Error:', error)

      // Retry logic for network errors
      if (retryCount < maxRetries && (
        (error instanceof TypeError && error.message.includes('Failed to fetch')) ||
        (error instanceof Error && error.message.includes('timeout'))
      )) {
        console.log(`Retrying AI request (attempt ${retryCount + 1}/${maxRetries})...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return this.sendMessage(message, conversationHistory, userContext, retryCount + 1, purpose)
      }

      // Handle specific network errors with user-friendly messages
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Network connection failed. Please check your internet connection and try again.')
      } else if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error('Request timed out. Please try again.')
      } else if (error instanceof Error && error.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.')
      } else {
        throw new Error(`Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  async sendStructuredPrompt(prompt: string, maxTokens = 1500): Promise<string> {
    return this.requestCompletion([{ role: 'user', content: prompt }], maxTokens, 0.7, 'student-chat')
  }

  private async requestCompletion(messages: { role: string; content: string }[], maxTokens: number, temperature: number, purpose: 'student-chat' | 'quick-assessment' | 'guest-preview' = 'student-chat'): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
      body: JSON.stringify({ messages, maxTokens, temperature, purpose }),
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(payload.error || `AI service error: ${response.status}`)
    }
    if (typeof payload.content !== 'string' || !payload.content.trim()) {
      throw new Error('Empty response from AI service')
    }
    return this.normaliseModelOutput(payload.content)
  }

  private normaliseModelOutput(content: string): string {
    let output = content
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<analysis>[\s\S]*?<\/analysis>/gi, '')
      .trim()

    const fenced = output.match(/^```(?:markdown|md|text|json)?\s*\n?([\s\S]*?)\n?```$/i)
    if (fenced) output = fenced[1].trim()

    // Some compatible providers wrap the actual answer in a small JSON object.
    // Unwrap only known display fields; structured JSON responses remain intact.
    if (output.startsWith('{') && output.endsWith('}')) {
      try {
        const parsed = JSON.parse(output) as Record<string, unknown>
        const wrapped = parsed.content ?? parsed.response ?? parsed.message
        if (typeof wrapped === 'string') output = wrapped.trim()
      } catch {
        // Keep the model output unchanged. JSON-specific callers repair it later.
      }
    }

    if (!output) throw new Error('Empty response from AI service')
    return output
  }

  async getQuickGuidance(message: string): Promise<string> {
    const quickContext: UserContext = {
      curriculum: 'cbc' // Default to CBC for Kenyan context
    };
    
    const prompt = `You are providing a QUICK PREVIEW guidance for a student. Keep it under 100 words. Focus on immediate encouragement and one logical next step. Use Kenyan context.`;
    
    return this.sendMessage(message, [{ role: 'system', content: prompt } as ChatMessage], quickContext);
  }

  async generateTeacherInsights(userContext: UserContext): Promise<string> {
    try {
      const assessmentInfo = userContext.assessmentResults ? `
ASSESSMENT DATA:
- Personality (RIASEC): ${userContext.assessmentResults.personality_type?.join(', ') || 'Not assessed'}
- Core Values: ${userContext.assessmentResults.values?.join(', ') || 'Not assessed'}
- Constraints: ${userContext.assessmentResults.constraints?.join(', ') || 'None stated'}
` : ''

      const academicInfo = userContext.academicPerformance ? `
ACADEMIC PERFORMANCE:
- Overall Average: ${userContext.academicPerformance.overallAverage.toFixed(1)}%
- Strong Subjects: ${userContext.academicPerformance.strongSubjects.join(', ') || 'None identified'}
- Weak Subjects: ${userContext.academicPerformance.weakSubjects.join(', ') || 'None identified'}
- Performance Trend: ${userContext.academicPerformance.performanceTrend}
` : ''

      const prompt = `You are a Senior Pedagogical Consultant & Career Mentor. Your task is to provide a Mentor with specific, actionable guidance strategies for a student named ${userContext.name || 'this student'}.

STUDENT PROFILE:
${userContext.schoolLevel ? `- Level: ${userContext.schoolLevel}` : ''} ${userContext.currentGrade ? `(Grade ${userContext.currentGrade})` : ''}
- Career Interests: ${userContext.interests?.join(', ') || 'Not specified'}
${assessmentInfo}
${academicInfo}

TASK:
Provide a strategic "Mentor Guidance Report" that is realistic and tactical.

STRUCTURE YOUR RESPONSE IN THESE SECTIONS (NO MARKDOWN ** or ##):

1. STUDENT TRIANGULATION SUMMARY
A one-sentence summary of who this student is based on the intersection of their personality, academics, and practical constraints.

2. GUIDANCE TACTICS
Provide 3 concrete actions the mentor can take to support this student's specific career trajectory.
If they are weak in a subject core to their goal, suggest a specific remedial approach.
If they have financial/geographical constraints, suggest specific resources (TVET, bursaries, digital skills).

3. MENTORSHIP TALKING POINTS
Provide 2-3 specific questions or topics the mentor should bring up in a 1-on-1 guidance session.

4. REAL-WORLD REALITY CHECK
Highlight one major opportunity or hurdle the mentor should prepare the student for (e.g., automation risk, market demand in Kenya).

FORMATTING:
- Use clear headings in ALL CAPS.
- No markdown bolding or subheadings.
- Use emojis for readability.
- Keep sentences professional but warm.`

      const response = await this.sendMessage(prompt, [], userContext)
      return response
    } catch (error) {
      console.error('Failed to generate mentor insights:', error)
      return "I'm sorry, I couldn't generate insights for this student right now. Please check if the student has completed their profile and grades are uploaded."
    }
  }

  // Dedicated non-streaming call for structured JSON responses.
  // Streaming can introduce SSE parsing artifacts that corrupt JSON.
  private async sendJsonRequest(prompt: string, userContext: UserContext): Promise<string> {
    const systemPrompt = this.createSystemPrompt(userContext)
    const messages = userContext.quickAssessment
      ? [{ role: 'user', content: `${systemPrompt}\n\n${prompt}` }]
      : [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }]

    return this.requestCompletion(messages, 3000, 0.7, userContext.quickAssessment ? 'quick-assessment' : 'student-chat')
  }

  async generateCareerRecommendations(userContext: UserContext): Promise<any[]> {
    try {
      const assessmentInfo = userContext.assessmentResults ? `
Assessment Results:
- Personality (RIASEC): ${userContext.assessmentResults.personality_type?.join(', ') || 'Not assessed'}
- Core Values: ${userContext.assessmentResults.values?.join(', ') || 'Not assessed'}
- Constraints: ${userContext.assessmentResults.constraints?.join(', ') || 'None stated'}
` : ''

      const academicInfo = userContext.academicPerformance ? `
Academic Performance:
- Overall Average: ${userContext.academicPerformance.overallAverage.toFixed(1)}%
- Strong Subjects: ${userContext.academicPerformance.strongSubjects.join(', ') || 'None identified'}
- Weak Subjects: ${userContext.academicPerformance.weakSubjects.join(', ') || 'None identified'}
- Performance Trend: ${userContext.academicPerformance.performanceTrend}
` : ''

      const prompt = `CRITICAL: Return ONLY a valid JSON array. No markdown, no backticks, no explanation text.

Generate exactly 3 career recommendations for a Kenyan student.

IMPORTANT NAMING RULE: Use the name of the university course or programme the student would study, NOT the job title. A student picks a course to enrol in, not a job role.
CORRECT examples: "Computer Science", "Nursing", "Banking & Finance", "Journalism", "Civil Engineering", "Pharmacy", "Law", "Actuarial Science", "Agriculture"
WRONG examples: "Software Engineer", "Nurse", "Bank Manager", "Journalist", "Civil Engineer", "Pharmacist", "Lawyer", "Actuary", "Farmer"

Profile: ${userContext.schoolLevel || 'Secondary'} student, Grade ${userContext.currentGrade || '10'}, Subjects: ${userContext.subjects?.slice(0, 3).join(', ') || 'Math, English, Science'}, Interests: ${userContext.interests?.slice(0, 2).join(', ') || 'Technology, Business'}
${assessmentInfo}
${academicInfo}

Instructions:
1. Match career courses to their core values and RIASEC personality type.
${userContext.dreamJob ? `2. CRITICAL: The student has requested an evaluation for the career: "${userContext.dreamJob}". MAKE THIS THE VERY FIRST RECOMMENDATION and objectively evaluate if they are a fit or a misfit.` : `2. Verify grades against KUCCPS cluster requirements. If they don't meet the floor, set isTechnicalMisfit to true.`}
3. Recommend courses with strong growth in Kenya (Vision 2030).
4. Suggest specific Kenyan universities strongest in that field.
5. Estimate Weighted Cluster Points (1-48).

Return EXACTLY this JSON format (array of 3 objects):
[{"title":"Course Name","matchPercentage":85,"estimatedClusterPoints":39.5,"kuccpsCluster":"Cluster 5","universities":["JKUAT","UoN"],"isTechnicalMisfit":false,"reasoning":"Brief note","actionabilityScore":90,"description":"Short description","salaryRange":"KSh range","education":"Required path","whyRecommended":"Explanation of fit"}]`

      // Use non-streaming request for reliable JSON
      const response = await this.sendJsonRequest(prompt, userContext)
      console.log('Career recommendations raw response length:', response.length)

      try {
        const parsed = this.parseAndRepairJson(response)
        // Validate the structure
        if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].title || parsed[0].name)) {
          console.log('Successfully parsed', parsed.length, 'career recommendations')
          return parsed
        }
        console.error('Parsed result did not match expected structure:', parsed)
        throw new Error('AI returned invalid career recommendation structure')
      } catch (parseError) {
        console.error('Failed to parse career recommendations:', parseError)
        console.error('Raw response:', response)
        throw parseError
      }
    } catch (error) {
      console.error('Failed to generate career recommendations:', error)
      throw error
    }
  }

  async generateQuickAssessmentBrief(userContext: UserContext): Promise<QuickAssessmentBrief> {
    const input = userContext.quickAssessment
    if (!input) throw new Error('Quick assessment data is required to create a direction brief.')

    const careers = (userContext.availableCareers || input.availableCareers || [])
      .slice(0, 160)
      .map(item => `- ${item.title}${item.category ? ` (${item.category})` : ''}`)
      .join('\n') || '- Software Developer\n- UX/UI Designer\n- Registered Nurse\n- Accountant\n- Architect\n- Environmental Scientist'

    const gradeInstruction = input.grade === 'Grade 7'
      ? 'The student is in Grade 7. Focus on broad exposure, subject curiosity, and safe short activities. Do not discuss admissions, university choices, or locking in a pathway.'
      : input.grade === 'Grade 9'
        ? 'The student is in Grade 9. Focus on testing ideas before Senior School pathway and subject selection. Do not present a career as chosen or guaranteed.'
        : `The student is in Grade 11${input.pathway ? ` in the ${input.pathway} pathway` : ''}. Focus on comparing training routes, subject requirements, and first experiences. Do not promise admission, a salary, or employment.`

    const prompt = `Return ONLY one valid JSON object. No markdown, no backticks, no text outside the object.

You are creating a CareerGuide AI Quick Assessment Direction Brief for a Kenyan CBC student.

${gradeInstruction}

Student data - use every relevant field:
- Grade: ${input.grade}
- Pathway: ${input.pathway || 'Not selected'}
- Strong subjects: ${input.subjects.join(', ') || 'Not selected'}
- Interests: ${input.interests.join(', ') || 'Not selected'}
- Values: ${input.values.join(', ') || 'Not selected'}
- Preferred work style: ${input.workStyle || 'Not selected'}
- Focus preference: ${input.preferences.focus || 'Not selected'}
- Decision preference: ${input.preferences.decisions || 'Not selected'}
- Structure preference: ${input.preferences.structure || 'Not selected'}
- Current barrier: ${input.barrier || 'Not selected'}
- Experience: ${input.experience || 'Not selected'}
- Readiness: ${input.readiness || 'Not selected'}
${input.targetCareer ? `- Career the student asked about: ${input.targetCareer}` : ''}

ALLOWED CAREERS - choose exactly three titles from this catalogue and copy each title exactly:
${careers}

Non-negotiable guidance rules:
1. The three suggestions must be named, real careers from the allowed catalogue. Never use broad labels such as "technology", "creative work", "business", or "problem-solving" as a career.
2. Do not call any suggestion a fit, perfect match, destiny, or final choice. These are possibilities to test.
3. Every why_it_appeared must cite at least two independent student signals (for example a selected subject plus an interest, or an interest plus a work preference). Do not infer a career only because the student likes one subject or one idea.
4. Every reality_to_test must name an uncertainty about the day-to-day work. Do not invent grades, personality tests, salary figures, KUCCPS points, university requirements, or labour-market facts.
5. Do not mention MBTI or RIASEC. The three preference answers are not a validated personality assessment.
6. Make the language direct, warm, specific, and readable. No filler paragraphs.
7. Each starter activity must be safe, practical, and achievable with ordinary school/home resources. It must help the student collect evidence, not merely research careers.
8. Grade context and grade focus must be specific to the student's grade and stage.
9. The plan must contain exactly three practical actions and connect each to an existing CareerGuide activity: Explore careers, Ask the AI counsellor, or Compare careers and subject pathways.

Return exactly this shape:
{
  "student_summary": "2 concise sentences explaining what this brief used and why it is exploratory.",
  "grade_context": "1-2 sentences tied to the student's grade.",
  "grade_focus": "1 concise, grade-aware next focus.",
  "careers": [
    {
      "career": "Exact title from the allowed catalogue",
      "why_it_appeared": "Specific evidence from at least two student signals; end with an uncertainty-aware statement.",
      "reality_to_test": "The aspect of daily work that still needs evidence.",
      "starter_activity": {
        "title": "Short activity title",
        "instruction": "Concrete 30-90 minute or one-week task, depending on grade.",
        "reflection_prompt": "One question that helps the student judge their experience."
      }
    }
  ],
  "plan": [
    {"timeframe":"...","title":"...","action":"...","careerguide_action":"Explore careers"}
  ]
}`

    const response = await this.sendJsonRequest(prompt, userContext)
    const parsed = this.parseJsonObject(response)
    return normaliseQuickAssessmentBrief(parsed, input)
  }

  async getTrendingCareers(): Promise<any[]> {
    try {
      const prompt = `CRITICAL: Return ONLY a valid JSON array of objects. No markdown, no backticks, no text.
      
      Structure:
      [{"title":"...","category":"...","demand_level":"...","salary_range":"...","growth_percentage":"...","skills_required":[],"description":"...","education_requirements":"...","career_level":"..."}]
      
      Constraints:
      - exactly 15 items
      - demand_level: "Very High" | "High" | "Growing" | "Emerging"
      - career_level: "entry" | "mid" | "senior"
      - Be specific to Kenya.`;

      const response = await this.sendMessage(prompt, [], {});
      
      return this.parseAndRepairJson(response);
    } catch (error) {
      console.error('Failed to get trending careers from AI:', error);
      throw error;
    }
  }

  private parseAndRepairJson(content: string): any[] {
    // 1. Clean the response: remove any potential markdown code blocks
    let cleaned = content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    // 2. Extract the array part
    // IMPORTANT: Use GREEDY match (not lazy *?) to capture the full outer array.
    // Lazy *? would stop at the first ] it finds (e.g., inside "universities":["A","B"]),
    // truncating the response and making it unparseable.
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in AI response');
    }

    let jsonString = jsonMatch[0];

    try {
      // Try standard parse first
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.warn('Initial JSON parse failed, attempting repair...', e);
    }

    // 3. Robust Repair Steps
    try {
      // Fix common LLM errors in multiple passes
      let repaired = jsonString;
      
      // Pass 1: Simple syntax fixes
      repaired = repaired
        .replace(/,\s*([\]}])/g, '$1') // Trailing commas
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // Unquoted keys
        .replace(/"\s+([a-zA-Z0-9_]+)":/g, '", "$1":'); // Missing commas between props

      // Pass 2: Handle unescaped internal quotes and newlines more aggressively
      // We look for the start of a value after a colon and try to find the actual end quote
      repaired = repaired.replace(/:\s*"([\s\S]*?)"(?=\s*[,}\]])/g, (match, p1) => {
        // If there are internal quotes that aren't escaped, escape them
        const fixed = p1
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/(?<!\\)"/g, '\\"');
        return `: "${fixed}"`;
      });
      
      // Pass 3: Fix missing commas between objects in array
      repaired = repaired.replace(/}\s*{/g, '}, {');

      // Pass 4: Fix unescaped characters that are common
      repaired = repaired.replace(/[\u0000-\u0019]+/g, "");

      try {
        const parsed = JSON.parse(repaired);
        if (Array.isArray(parsed)) return parsed;
      } catch (innerError) {
        console.warn('Advanced repair pass failed. Raw snippet near error:', repaired.substring(Math.max(0, (innerError as any).pos - 50), (innerError as any).pos + 50));
        
        // Pass 5: Extreme cleanup
        repaired = repaired.replace(/"\s*,\s*"/g, '", "');
      }

      const ultraClean = repaired
        .replace(/[\x00-\x1F\x7F-\x9F]/g, "") // Remove control characters
        .replace(/\\(?!["\\/bfnrtu])/g, "\\\\"); // Fix invalid escapes
      
      return JSON.parse(ultraClean);
    } catch (repairError) {
      console.error('All JSON repair attempts failed. Raw content length:', jsonString.length);
      console.error('JSON string at failure:', jsonString);
      throw new Error(`JSON parsing failed: ${repairError instanceof Error ? repairError.message : String(repairError)}`);
    }
  }

  private parseJsonObject(content: string): Record<string, unknown> {
    const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim()
    const direct = (() => {
      try { return JSON.parse(cleaned) } catch { return null }
    })()
    if (direct && typeof direct === 'object' && !Array.isArray(direct)) return direct as Record<string, unknown>

    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('AI returned an invalid direction brief.')
    const parsed = JSON.parse(match[0])
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('AI returned an invalid direction brief.')
    }
    return parsed as Record<string, unknown>
  }

  // Note: Conversations are now stored in localStorage only (not in database)
  // This prevents unnecessary database queries and 404 errors
  async saveConversation(userId: string, messages: ChatMessage[]): Promise<void> {
    // Conversations are stored in localStorage only
    // No database storage to prevent 404 errors
    console.log('Conversation saved to localStorage only')
  }

  async loadConversationHistory(userId: string): Promise<ChatMessage[]> {
    // Conversations are loaded from localStorage only
    // No database queries to prevent 404 errors
    return []
  }

  // Test method to verify API connectivity
  async testConnection(): Promise<boolean> {
    try {
      await this.requestCompletion([{ role: 'user', content: 'Reply with a single word: ready.' }], 32, 0);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export const aiCareerService = new AICareerService()
