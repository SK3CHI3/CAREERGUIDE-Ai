/**
 * Anonymous Tracking Service
 * Handles all anonymous usage tracking without requiring authentication
 */

import { supabase } from './supabase';

// Session management
const SESSION_KEY = 'anonymous_session_id';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get or create an anonymous session ID
 * Stored in localStorage, lasts for 24 hours
 */
export function getOrCreateSessionId(): string {
  const stored = localStorage.getItem(SESSION_KEY);
  
  if (stored) {
    try {
      const { sessionId, createdAt } = JSON.parse(stored);
      const age = Date.now() - createdAt;
      
      // If session is still valid, return it
      if (age < SESSION_DURATION) {
        return sessionId;
      }
    } catch (e) {
      // Invalid stored data, create new session
    }
  }
  
  // Create new session
  const sessionId = crypto.randomUUID();
  const sessionData = {
    sessionId,
    createdAt: Date.now()
  };
  
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  return sessionId;
}

/**
 * Track or update an anonymous session in the database
 */
export async function trackSession(): Promise<void> {
  try {
    const sessionId = getOrCreateSessionId();
    const userAgent = navigator.userAgent;

    // Upsert: insert if new, update if exists — avoids race condition 409 errors
    const { data: existing } = await supabase
      .from('anonymous_sessions')
      .select('visit_count')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('anonymous_sessions')
        .update({
          last_visit: new Date().toISOString(),
          visit_count: existing.visit_count + 1,
          user_agent: userAgent
        })
        .eq('session_id', sessionId);
    } else {
      const { error } = await supabase
        .from('anonymous_sessions')
        .insert({
          session_id: sessionId,
          user_agent: userAgent,
          first_visit: new Date().toISOString(),
          last_visit: new Date().toISOString(),
          visit_count: 1
        });

      // If 409 (another tab created it first), just update instead
      if (error && error.code === '23505') {
        await supabase
          .from('anonymous_sessions')
          .update({
            last_visit: new Date().toISOString(),
            visit_count: 1
          })
          .eq('session_id', sessionId);
      }
    }
  } catch (error) {
    console.error('Error tracking session:', error);
    // Don't throw - tracking failures shouldn't break the app
  }
}

/**
 * Track a page visit
 */
export async function trackPageVisit(
  pagePath: string,
  pageTitle?: string,
  referrer?: string
): Promise<void> {
  try {
    const sessionId = getOrCreateSessionId();
    
    await supabase
      .from('page_visits')
      .insert({
        session_id: sessionId,
        page_path: pagePath,
        page_title: pageTitle || null,
        referrer: referrer || null,
        visited_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error tracking page visit:', error);
  }
}

/**
 * Track a Quick Assessment completion
 */
export async function trackQuickAssessmentCompletion(params: {
  assessmentId: string;
  grade?: string;
  pathway?: string;
  targetCareer?: string;
  durationSeconds?: number;
  careerFieldsGenerated?: number;
}): Promise<void> {
  try {
    const sessionId = getOrCreateSessionId();
    
    await supabase
      .from('quick_assessment_completions')
      .insert({
        session_id: sessionId,
        assessment_id: params.assessmentId,
        grade: params.grade || null,
        pathway: params.pathway || null,
        target_career: params.targetCareer || null,
        duration_seconds: params.durationSeconds || null,
        career_fields_generated: params.careerFieldsGenerated || 3,
        user_agent: navigator.userAgent,
        completed_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error tracking Quick Assessment completion:', error);
  }
}

/**
 * Track the start of an AI chat session
 */
export async function trackChatSessionStart(chatSessionId: string): Promise<void> {
  try {
    const sessionId = getOrCreateSessionId();
    
    await supabase
      .from('ai_chat_interactions')
      .insert({
        session_id: sessionId,
        chat_session_id: chatSessionId,
        message_count: 0,
        started_at: new Date().toISOString(),
        user_agent: navigator.userAgent
      });
  } catch (error) {
    console.error('Error tracking chat session start:', error);
  }
}

/**
 * Update chat session with end time and duration
 */
export async function trackChatSessionEnd(
  chatSessionId: string,
  messageCount: number,
  durationSeconds: number
): Promise<void> {
  try {
    await supabase
      .from('ai_chat_interactions')
      .update({
        ended_at: new Date().toISOString(),
        message_count: messageCount,
        duration_seconds: durationSeconds
      })
      .eq('chat_session_id', chatSessionId);
  } catch (error) {
    console.error('Error tracking chat session end:', error);
  }
}

/**
 * Track individual chat messages
 */
export async function trackChatMessage(
  chatSessionId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  try {
    await supabase
      .from('ai_chat_messages')
      .insert({
        chat_session_id: chatSessionId,
        message_role: role,
        message_content: content,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error tracking chat message:', error);
  }
}

/**
 * Initialize tracking on app load
 * Call this in your main App component or layout
 */
export async function initializeTracking(): Promise<void> {
  await trackSession();
}

/**
 * Simplified wrapper for tracking Quick Assessment completion
 * Generates assessment ID automatically
 */
export async function trackQuickAssessment(params: {
  grade: string;
  pathway: string;
  targetCareer: string | null;
  subjectsCount: number;
  interestsCount: number;
}): Promise<void> {
  const assessmentId = `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await trackQuickAssessmentCompletion({
    assessmentId,
    grade: params.grade,
    pathway: params.pathway,
    targetCareer: params.targetCareer || undefined,
    careerFieldsGenerated: 3 // Default to 3 career fields
  });
}

/**
 * Simplified wrapper for tracking chat session events
 * Uses a single session ID per browser session
 */
const CHAT_SESSION_KEY = 'current_chat_session_id';

function getOrCreateChatSessionId(): string {
  const stored = localStorage.getItem(CHAT_SESSION_KEY);
  if (stored) {
    return stored;
  }
  
  const chatSessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem(CHAT_SESSION_KEY, chatSessionId);
  return chatSessionId;
}

function resetChatSessionId(): void {
  localStorage.removeItem(CHAT_SESSION_KEY);
}

export async function trackChatSession(action: 'start' | 'end' | 'reset'): Promise<void> {
  const chatSessionId = getOrCreateChatSessionId();
  
  if (action === 'start') {
    await trackChatSessionStart(chatSessionId);
  } else if (action === 'end') {
    // We don't have message count or duration here, so just mark as ended
    await trackChatSessionEnd(chatSessionId, 0, 0);
  } else if (action === 'reset') {
    resetChatSessionId();
    // Start new session
    const newChatSessionId = getOrCreateChatSessionId();
    await trackChatSessionStart(newChatSessionId);
  }
}

/**
 * Simplified wrapper for tracking chat messages
 * Uses current session ID and only tracks role (not content for privacy)
 */
export async function trackChatMessageByRole(role: 'user' | 'assistant'): Promise<void> {
  const chatSessionId = getOrCreateChatSessionId();
  await trackChatMessage(chatSessionId, role, ''); // Empty content for privacy
}

