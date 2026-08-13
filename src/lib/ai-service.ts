import { supabase } from './supabase'
import type { AIConversation, ChatMessage, UserProfile } from '../types/database'
import { KUCCPS_CLUSTERS, UNIVERSITY_DATA, CUTOFF_ESTIMATES } from './kuccps-reference'

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY
const MODEL_NAME = 'deepseek-chat' // Non-thinking mode of DeepSeek-V3.1

export type { ChatMessage } from '../types/database'

export interface UserContext {
  name?: string
  curriculum?: 'cbc' | 'igcse' | string
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
  kcseGrade?: string
  kcsePoints?: number
  subjectGrades?: Record<string, string>
}

class AICareerService {
  private apiKey: string
  private modelName: string
  private baseUrl: string

  constructor() {
    this.apiKey = DEEPSEEK_API_KEY
    this.modelName = MODEL_NAME
    this.baseUrl = 'https://api.deepseek.com'

    if (import.meta.env.DEV) {
      console.log('AI Service initialized:', {
        hasApiKey: !!this.apiKey,
        apiKeyLength: this.apiKey?.length,
        modelName: this.modelName,
        baseUrl: this.baseUrl
      });
    }

    if (!this.apiKey) {
      throw new Error('AI Service key is not configured. Please add VITE_DEEPSEEK_API_KEY to your environment variables.')
    }
  }

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

    const curriculumSection = userContext.curriculum ? `
CURRICULUM SPECIFICS:
- Current Curriculum: ${userContext.curriculum === 'cbc' ? 'Competency-Based Curriculum (Kenya)' : 'British Curriculum (IGCSE / A-Levels)'}
${userContext.curriculum === 'cbc' ? 
  '--> MAPPING RULE: Since they are in CBC, strictly map their interests to one of the 3 Senior Secondary Pathways (STEM, Arts & Sports Science, Social Sciences). Reference practical CBC subjects like Pre-Technical Studies or Integrated Science.' : 
  '--> MAPPING RULE: Since they are in the British Curriculum, strictly map their interests to specific IGCSE subject combinations and leading A-Level paths required for UK/global university entry.'
}` : '';

    const academicSection = userContext.academicPerformance ? `
ACADEMIC PERFORMANCE:
- Overall: ${userContext.academicPerformance.overallAverage.toFixed(1)}%
- Strong in: ${userContext.academicPerformance.strongSubjects.join(', ')}
- Weak in: ${userContext.academicPerformance.weakSubjects.join(', ')}
` : userContext.kcseGrade ? `
ACADEMIC PERFORMANCE (KCSE):
- Mean Grade: ${userContext.kcseGrade}
- Points: ${userContext.kcsePoints}
- Subject Breakdown: ${Object.entries(userContext.subjectGrades || {}).map(([s, g]) => `${s}: ${g}`).join(', ')}
` : '';

    return `You are CareerGuide AI, Kenya's most advanced career counselor. Your mission is to provide personalized, actionable guidance using "Realistic Triangulation Logic"—balancing a student's Personality (RIASEC), Academic Performance, Stated Interests, and Real-World Realities.

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
1. Personality (RIASEC): Holland Codes are the foundation. Recommend roles aligned with their top 2-3 RIASEC types.
2. Academic Performance: Align careers with their strong subjects. For "Form 4 Leavers", strictly prioritize their actual KCSE grades as the primary academic evidence. If a student wants a STEM career but is weak in Math, suggest technical pathways that leverage their other strengths or bridging options.
3. Personal Values: Factor in what matters to them (e.g., Autonomy, Impact, Income). If they value stability, avoid highly volatile freelance/startup-heavy paths unless they have a safety net.
4. Feasibility & Constraints: Respect constraints (Geography, Finance, Time). If they need remote work or scholarships, prioritize careers with high digital accessibility or available government/private funding in Kenya.
5. Labor Market Reality: Factor in Kenyan market demand (Vision 2030, tech boom, manufacturing needs, automation risk). Prioritize emerging fields in the Creative Economy (Content Creation, Digital Art) and the Digital Superhighway over saturated traditional roles.

CONVERSATION STRUCTURE:
1. Greeting & Context - Acknowledge their assessment results and core values.
2. Dynamic Exploration - Ask one question at a time to dive deeper into how their values conflict or align with their interests.
3. Actionable Coaching - Don't just list careers; provide the "Feasibility Score" for their goals.
4. Professional Recommendations - Provide 3 precise career matches based on all data. Ensure at least one recommendation is an emerging or unconventional role if it fits their RIASEC/Values.

FORMATTING RULES:
- Use Markdown bolding (**text**) for key terms and summaries. The PDF engine requires this.
- Clean, natural sentences with line breaks.
- Use emojis for warmth.
- Numbered options clearly.
- Avoid robotic technical jargon.

KENYAN CAREER & KUCCPS CONTEXT (2025 Cycle):
- KUCCPS CLUSTERS: We map to 19 official clusters. Higher cutoffs (38-46) for MBChB, Law, Architecture, Nursing.
- HARD REQUIREMENTS: Law requires KISW/ENG B plain. Medicine/Engineering require C+ in all 4 cluster subjects.
- INSTITUTIONAL MAPPING: UoN (Medicine/Law/Journalism), JKUAT (Engineering/CompSci), Strathmore (Business/Accounting/Law), KU (Education/Arts).
- VISION 2030: Prioritize Digital Superhighway, Creative Economy, Healthcare, and Engineering.

CRITICAL: Except when specifically asked for an Assessment Summary or JSON recommendations, ask only ONE question per response. Be curious, realistic, and empathetic. Wait for their answer before proceeding.`
  }

  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[],
    userContext: UserContext,
    retryCount = 0
  ): Promise<string> {
    const maxRetries = 2
    const retryDelay = 1000 * (retryCount + 1) // Exponential backoff

    try {
      const systemPrompt = this.createSystemPrompt(userContext)

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ]

      if (import.meta.env.DEV) {
        console.log('Making AI API call to:', `${this.baseUrl}/chat/completions`);
        console.log('API Key available:', !!this.apiKey);
        console.log('Request payload:', {
          model: this.modelName,
          messageCount: messages.length,
          temperature: 0.7,
          streaming: true
        });
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: messages,
          temperature: 0.7,
          max_tokens: 800,
          top_p: 0.9,
          stream: true
        })
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('AI Service Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        // Specific handling for 402 Payment Required
        if (response.status === 402) {
          throw new Error('The AI Counselor is currently experiencing high demand. Please try again in a few minutes or contact support if the issue persists.')
        }
        
        throw new Error(`AI service error: ${response.status} - ${response.statusText}`)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      const decoder = new TextDecoder()
      let fullResponse = ''
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          
          // Keep the last partial line in the buffer
          buffer = lines.pop() || ''

          for (const line of lines) {
            const trimmedLine = line.trim()
            if (!trimmedLine || trimmedLine === 'data: [DONE]') continue
            
            if (trimmedLine.startsWith('data: ')) {
              try {
                const data = trimmedLine.slice(6)
                const parsed = JSON.parse(data)
                if (parsed.choices?.[0]?.delta?.content) {
                  fullResponse += parsed.choices[0].delta.content
                }
              } catch (e) {
                console.warn('Silent skip: Partial or malformed SSE line', line)
                continue
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

      if (!fullResponse.trim()) {
        throw new Error('Empty response from AI service')
      }

      return fullResponse
    } catch (error) {
      console.error('AI Service Error:', error)

      // Retry logic for network errors
      if (retryCount < maxRetries && (
        (error instanceof TypeError && error.message.includes('Failed to fetch')) ||
        (error instanceof Error && error.message.includes('timeout'))
      )) {
        console.log(`Retrying AI request (attempt ${retryCount + 1}/${maxRetries})...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        return this.sendMessage(message, conversationHistory, userContext, retryCount + 1)
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
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.modelName,
        messages,
        temperature: 0.7,
        max_tokens: 3000, // Career JSON needs room for 3 detailed objects
        top_p: 0.9,
        stream: false // NON-STREAMING for reliable JSON
      })
    })

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
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

Profile: ${userContext.schoolLevel || 'Secondary'} student, Grade ${userContext.currentGrade || '10'}, Subjects: ${userContext.subjects?.slice(0, 3).join(', ') || 'Math, English, Science'}, Interests: ${userContext.interests?.slice(0, 2).join(', ') || 'Technology, Business'}
${userContext.kcseGrade ? `KCSE Performance: Mean Grade ${userContext.kcseGrade}, Points ${userContext.kcsePoints}` : ''}
${assessmentInfo}
${academicInfo}

Instructions:
1. Match careers to their core values and RIASEC personality type.
${userContext.dreamJob ? `2. CRITICAL: The student has requested an evaluation for the career: "${userContext.dreamJob}". MAKE THIS THE VERY FIRST RECOMMENDATION and objectively evaluate if they are a fit or a misfit.` : `2. Verify grades against KUCCPS cluster requirements. If they don't meet the floor, set isTechnicalMisfit to true.`}
3. Recommend careers with strong growth in Kenya (Vision 2030).
4. Suggest specific Kenyan universities strongest in that field.
5. Estimate Weighted Cluster Points (1-48).

Return EXACTLY this JSON format (array of 3 objects):
[{"title":"Career Name","matchPercentage":85,"estimatedClusterPoints":39.5,"kuccpsCluster":"Cluster 5","universities":["JKUAT","UoN"],"isTechnicalMisfit":false,"reasoning":"Brief note","actionabilityScore":90,"description":"Short description","salaryRange":"KSh range","education":"Required path","whyRecommended":"Explanation of fit"}]`

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
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10,
          stream: false
        })
      });

      console.log('Connection test response:', response.status, response.statusText);
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

export const aiCareerService = new AICareerService()
