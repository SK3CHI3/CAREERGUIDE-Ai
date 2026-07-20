/**
 * User roles for v3 — student-focused career guidance tool.
 * Mentors help students make better career choices.
 * No parent role – parents share the student dashboard.
 */
export type UserRole = 'student' | 'admin' | 'mentor'

export const ROLE_DASHBOARD_PATH: Record<UserRole, string> = {
  student: '/student',
  admin: '/admin',
  mentor: '/mentor',
}

export function getDashboardPathForRole(role: UserRole): string {
  return ROLE_DASHBOARD_PATH[role] ?? '/student'
}
