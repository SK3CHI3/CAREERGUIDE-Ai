import { ChatMessage } from './ai-service';

export interface GuestProfile {
  name?: string;
  curriculum?: string;
  age?: string;
  grade?: string;
  pathway?: string;
  subjects?: string[];
  interests?: string[];
  careerGoals?: string;
  aiSummary?: string;
  values?: string[];
  mbti?: string;
  workStyle?: string;
  barriers?: string;
  experience?: string;
  readiness?: string;
  strengths?: string[];
  challenges?: string[];
  dreamJob?: string;
  location?: string;
  resultsVerified?: boolean;
  kcseGrade?: string;
  kcsePoints?: number;
  clusterSubjects?: string[];
  subjectGrades?: Record<string, string>;
}

export interface CareerRecommendation {
  title: string;
  matchPercentage: number;
  description: string;
  universities: string[];
  salaryRange: string;
  education?: string;
  actionabilityScore?: number;
  whyRecommended?: string;
  estimatedClusterPoints?: number;
  kuccpsCluster?: string;
  isTechnicalMisfit?: boolean;
  reasoning?: string;
}

export class ReportGenerator {
  static generatePDFReport(
    profile: GuestProfile,
    conversation: ChatMessage[],
    recommendations: CareerRecommendation[] = []
  ): string {
    const currentDate = new Date().toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const reportId = Date.now().toString().slice(-6);

    const colors = {
      primary: '#2563eb',
      secondary: '#0f172a',
      accent: '#7c3aed',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      text: '#1e293b',
      muted: '#64748b',
      light: '#f8fafc',
      white: '#ffffff',
      border: '#e2e8f0'
    };

    const styles = this.getStyles(colors);

    // Build profile rows
    const profileRows = [
      { label: 'Full Name', value: profile.name || 'Student Candidate' },
      { label: 'Curriculum', value: profile.curriculum === 'cbc' ? 'Kenyan CBC' : profile.curriculum === 'igcse' ? 'British IGCSE / A-Level' : profile.curriculum === 'legacy' ? 'Kenyan 8-4-4 (Legacy)' : 'Not specified' },
      { label: 'Current Level', value: profile.grade || 'Not specified' },
      profile.pathway ? { label: 'Pathway', value: profile.pathway.toUpperCase() } : null,
      { label: 'Strong Subjects', value: profile.subjects && profile.subjects.length > 0 ? profile.subjects.join(', ') : 'Not specified' },
      { label: 'Interests', value: profile.interests && profile.interests.length > 0 ? profile.interests.filter(i => !i.startsWith('RIASEC')).slice(0, 5).join(', ') : 'Not specified' },
      { label: 'Personality Type (MBTI)', value: profile.mbti || 'Not assessed' },
      { label: 'Core Values', value: profile.values && profile.values.length > 0 ? profile.values.join(', ') : 'Not specified' },
      { label: 'Work Style', value: profile.workStyle || 'Not specified' },
      { label: 'Primary Barrier', value: profile.barriers || 'Not specified' },
      { label: 'Practical Experience', value: profile.experience || 'Not specified' },
      { label: 'Action Readiness', value: profile.readiness || 'Not specified' },
    ].filter(Boolean) as { label: string; value: string }[];

    // KCSE section (only if available)
    const hasKcse = profile.kcseGrade || profile.kcsePoints;

    return `
      <div class="report-container">
        <style>${styles}</style>

        <!-- PAGE 1: CANDIDATE PROFILE -->
        <div class="report-page">
          <div class="header">
            <div class="branding">
              <img src="${window.location.origin}/logos/CareerGuide_Logo.webp" class="logo" alt="CareerGuide">
              <div class="brand-text">
                <div class="brand-name">CareerGuide AI</div>
                <div class="brand-tagline">Professional Career Diagnostic</div>
              </div>
            </div>
            <div class="meta">
              <div class="report-label">Diagnostic Report</div>
              <div class="report-id">REF: ${reportId}</div>
              <div class="report-date">${currentDate}</div>
            </div>
          </div>

          <div class="page-title">Candidate Profile</div>

          <div class="profile-section">
            ${profileRows.map(row => `
              <div class="profile-row">
                <div class="profile-label">${row.label}</div>
                <div class="profile-value">${row.value}</div>
              </div>
            `).join('')}
          </div>

          ${hasKcse ? `
            <div class="page-title" style="margin-top: 30px;">Academic Performance</div>
            <div class="profile-section">
              ${profile.kcseGrade ? `
                <div class="profile-row">
                  <div class="profile-label">KCSE Mean Grade</div>
                  <div class="profile-value">${profile.kcseGrade}</div>
                </div>
              ` : ''}
              ${profile.kcsePoints ? `
                <div class="profile-row">
                  <div class="profile-label">KCSE Points</div>
                  <div class="profile-value">${profile.kcsePoints} points</div>
                </div>
              ` : ''}
              <div class="profile-row">
                <div class="profile-label">Verification Status</div>
                <div class="profile-value">${profile.resultsVerified ? 'Verified Official' : 'Self-Reported'}</div>
              </div>
            </div>
          ` : ''}

          ${profile.subjectGrades && Object.keys(profile.subjectGrades).length > 0 ? `
            <div class="page-title" style="margin-top: 30px;">Subject Breakdown</div>
            <div class="grades-table">
              <div class="grades-header">
                <span>Subject</span>
                <span>Grade</span>
              </div>
              ${Object.entries(profile.subjectGrades).map(([subject, grade]) => `
                <div class="grades-row">
                  <span class="grade-subject">${subject}</span>
                  <span class="grade-value">${grade}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- PAGE 2: DIAGNOSTIC SUMMARY -->
        <div class="report-page">
          <div class="page-title">Diagnostic Summary</div>
          <div class="summary-content">
            ${this.extractAISummary(profile.aiSummary || conversation)}
          </div>
        </div>

        <!-- PAGE 3: INSTITUTIONAL PLACEMENT -->
        <div class="report-page">
          <div class="page-title">Institutional Placement Roadmap</div>
          <p class="placement-intro">
            The following recommendations are triangulated using official 2025 KUCCPS cluster requirements and labour market performance trends.
          </p>

          ${recommendations.length > 0 ? recommendations.map(rec => `
            <div class="rec-card">
              <div class="rec-header">
                <div class="rec-title">${rec.title}</div>
                ${rec.isTechnicalMisfit ?
                  `<div class="misfit-badge">Technical Misfit</div>` :
                  `<div class="match-badge">${rec.matchPercentage}% Match</div>`
                }
              </div>

              <p class="rec-description">${rec.description}</p>

              <div class="rec-info-grid">
                <div class="info-pill">
                  <div class="pill-label">KUCCPS Cluster</div>
                  <div class="pill-value">${rec.kuccpsCluster || 'General'}</div>
                </div>
                <div class="info-pill">
                  <div class="pill-label">Cluster Points</div>
                  <div class="pill-value">${rec.estimatedClusterPoints || '22.0+'}</div>
                </div>
                <div class="info-pill">
                  <div class="pill-label">Path Index</div>
                  <div class="pill-value">${rec.actionabilityScore || 85}/100</div>
                </div>
              </div>

              <div class="inst-box">
                <div class="inst-label">Recommended Institutions</div>
                <div class="inst-list">${rec.universities && rec.universities.length > 0 ? rec.universities.join(' · ') : 'Major Public & Private Universities'}</div>
              </div>

              ${rec.isTechnicalMisfit ? `
                <div class="misfit-box">
                  <strong class="misfit-title">Admissions Alert</strong>
                  <p class="misfit-text">${rec.reasoning}</p>
                </div>
              ` : `
                <div class="why-box">
                  <strong class="why-title">Why This Career</strong>
                  <p class="why-text">${rec.whyRecommended || 'Aligns with your academic strengths and personality profile.'}</p>
                </div>
              `}

              ${rec.salaryRange ? `
                <div class="salary-box">
                  <span class="salary-label">Expected Salary Range:</span>
                  <span class="salary-value">${rec.salaryRange}</span>
                </div>
              ` : ''}

              ${rec.education ? `
                <div class="education-box">
                  <span class="education-label">Education Path:</span>
                  <span class="education-value">${rec.education}</span>
                </div>
              ` : ''}
            </div>
          `).join('') : `
            <div class="no-rec-box">
              <strong>Academic Analysis in Progress</strong>
              <p>Your profile is being synchronized with KUCCPS data. If recommendations don't appear shortly, please re-run the assessment.</p>
            </div>
          `}

          <div class="footer">
            <p><strong>CareerGuide AI</strong> — Professional Career Diagnostic • 2026 Edition</p>
            <p class="footer-sub">This roadmap is generated using Realistic Triangulation Logic for academic and career synchronization.</p>
            <p class="footer-sub">careerguideai.co.ke</p>
          </div>
        </div>
      </div>
    `;
  }

  private static getStyles(colors: any): string {
    return `
      * { box-sizing: border-box; margin: 0; padding: 0; }

      .report-container {
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: ${colors.text};
        background: ${colors.white};
        line-height: 1.5;
        font-size: 14px;
        -webkit-font-smoothing: antialiased;
      }

      .report-page {
        width: 800px;
        min-height: 1100px;
        margin: 0 auto;
        padding: 40px 50px;
        background: ${colors.white};
        page-break-after: always;
      }

      .report-page:last-child {
        page-break-after: auto;
      }

      /* HEADER */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 3px solid ${colors.primary};
        padding-bottom: 20px;
        margin-bottom: 30px;
      }

      .branding {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .logo {
        height: 50px;
        width: auto;
        object-fit: contain;
      }

      .brand-text {
        display: flex;
        flex-direction: column;
      }

      .brand-name {
        font-size: 22px;
        font-weight: 800;
        color: ${colors.secondary};
        letter-spacing: -0.5px;
      }

      .brand-tagline {
        font-size: 11px;
        font-weight: 600;
        color: ${colors.muted};
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .meta {
        text-align: right;
      }

      .report-label {
        text-transform: uppercase;
        font-size: 10px;
        font-weight: 700;
        color: ${colors.muted};
        letter-spacing: 1.5px;
      }

      .report-id {
        font-size: 18px;
        font-weight: 800;
        color: ${colors.secondary};
        margin-top: 2px;
      }

      .report-date {
        font-size: 12px;
        color: ${colors.muted};
        margin-top: 2px;
      }

      /* PAGE TITLE */
      .page-title {
        font-size: 24px;
        font-weight: 800;
        color: ${colors.secondary};
        margin-bottom: 25px;
        padding-bottom: 12px;
        border-bottom: 2px solid ${colors.border};
        letter-spacing: -0.5px;
      }

      /* PROFILE SECTION */
      .profile-section {
        display: flex;
        flex-direction: column;
      }

      .profile-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        padding: 14px 0;
        border-bottom: 1px solid ${colors.border};
      }

      .profile-row:last-child {
        border-bottom: none;
      }

      .profile-label {
        font-size: 12px;
        font-weight: 700;
        color: ${colors.muted};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        flex: 0 0 200px;
      }

      .profile-value {
        font-size: 15px;
        font-weight: 600;
        color: ${colors.secondary};
        text-align: right;
        flex: 1;
      }

      /* GRADES TABLE */
      .grades-table {
        border: 1px solid ${colors.border};
        border-radius: 8px;
        overflow: hidden;
      }

      .grades-header {
        display: flex;
        justify-content: space-between;
        padding: 12px 16px;
        background: ${colors.light};
        font-size: 11px;
        font-weight: 700;
        color: ${colors.muted};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid ${colors.border};
      }

      .grades-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 16px;
        border-bottom: 1px solid ${colors.border};
        font-size: 13px;
      }

      .grades-row:last-child {
        border-bottom: none;
      }

      .grade-subject {
        font-weight: 500;
        color: ${colors.text};
      }

      .grade-value {
        font-weight: 700;
        color: ${colors.primary};
      }

      /* SUMMARY CONTENT */
      .summary-content {
        font-size: 15px;
        line-height: 1.8;
        color: ${colors.text};
      }

      .summary-content p {
        margin-bottom: 16px;
      }

      .summary-content p:last-child {
        margin-bottom: 0;
      }

      .summary-content strong {
        color: ${colors.secondary};
        font-weight: 700;
      }

      .summary-content ul {
        margin: 12px 0 16px 24px;
      }

      .summary-content li {
        margin-bottom: 8px;
        line-height: 1.7;
      }

      /* PLACEMENT INTRO */
      .placement-intro {
        font-size: 13px;
        color: ${colors.muted};
        margin-bottom: 25px;
        line-height: 1.6;
        font-style: italic;
      }

      /* RECOMMENDATION CARDS */
      .rec-card {
        margin-bottom: 20px;
        padding: 20px;
        border-radius: 12px;
        border: 1px solid ${colors.border};
        background: ${colors.white};
        page-break-inside: avoid;
        break-inside: avoid;
      }

      .rec-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }

      .rec-title {
        font-size: 18px;
        font-weight: 800;
        color: ${colors.primary};
      }

      .match-badge {
        padding: 5px 14px;
        border-radius: 20px;
        font-weight: 700;
        font-size: 12px;
        background: ${colors.primary};
        color: white;
      }

      .misfit-badge {
        background: ${colors.danger};
        color: white;
        padding: 5px 14px;
        border-radius: 20px;
        font-weight: 700;
        font-size: 12px;
      }

      .rec-description {
        margin-bottom: 15px;
        color: ${colors.text};
        font-size: 13px;
        line-height: 1.6;
      }

      .rec-info-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin: 15px 0;
      }

      .info-pill {
        padding: 10px;
        background: ${colors.light};
        border-radius: 8px;
        text-align: center;
        border: 1px solid ${colors.border};
      }

      .pill-label {
        font-size: 9px;
        color: ${colors.muted};
        text-transform: uppercase;
        font-weight: 700;
        letter-spacing: 0.5px;
      }

      .pill-value {
        font-size: 14px;
        font-weight: 700;
        color: ${colors.secondary};
        margin-top: 2px;
      }

      .inst-box {
        margin: 15px 0;
        padding: 12px 15px;
        background: rgba(37, 99, 235, 0.04);
        border-radius: 8px;
        border-left: 3px solid ${colors.primary};
      }

      .inst-label {
        font-size: 10px;
        color: ${colors.primary};
        text-transform: uppercase;
        font-weight: 800;
        letter-spacing: 0.5px;
      }

      .inst-list {
        font-weight: 600;
        font-size: 13px;
        margin-top: 4px;
        color: ${colors.secondary};
        line-height: 1.5;
      }

      .misfit-box {
        padding: 12px 15px;
        background: rgba(239, 68, 68, 0.05);
        border-left: 3px solid ${colors.danger};
        border-radius: 4px;
        margin-top: 12px;
      }

      .misfit-title {
        color: ${colors.danger};
        font-size: 11px;
        text-transform: uppercase;
        font-weight: 800;
        letter-spacing: 0.5px;
      }

      .misfit-text {
        font-size: 12px;
        margin-top: 4px;
        color: ${colors.text};
        line-height: 1.5;
      }

      .why-box {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid ${colors.border};
      }

      .why-title {
        font-size: 10px;
        color: ${colors.muted};
        text-transform: uppercase;
        font-weight: 800;
        letter-spacing: 0.5px;
      }

      .why-text {
        font-size: 12px;
        margin-top: 4px;
        color: ${colors.text};
        line-height: 1.5;
      }

      .salary-box,
      .education-box {
        margin-top: 8px;
        font-size: 12px;
      }

      .salary-label,
      .education-label {
        font-weight: 700;
        color: ${colors.muted};
        margin-right: 6px;
      }

      .salary-value,
      .education-value {
        font-weight: 600;
        color: ${colors.secondary};
      }

      .no-rec-box {
        padding: 40px;
        text-align: center;
        border: 2px dashed ${colors.border};
        border-radius: 12px;
        background: ${colors.light};
      }

      .no-rec-box strong {
        display: block;
        color: ${colors.warning};
        font-size: 14px;
        margin-bottom: 8px;
      }

      .no-rec-box p {
        color: ${colors.muted};
        font-size: 12px;
      }

      /* FOOTER */
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 2px solid ${colors.border};
        text-align: center;
        font-size: 11px;
        color: ${colors.muted};
      }

      .footer p {
        margin-bottom: 4px;
      }

      .footer-sub {
        font-size: 10px;
        color: ${colors.muted};
      }
    `;
  }

  static extractAISummary(input: string | ChatMessage[]): string {
    let summary = '';

    if (typeof input === 'string') {
        summary = input;
    } else {
        const assistantMsgs = input.filter(m => m.role === 'assistant').map(m => m.content);
        if (assistantMsgs.length === 0) return '<p>No diagnostic summary available. Re-run assessment to generate analysis.</p>';
        summary = assistantMsgs.reverse().find(t => (t || '').length > 100) || assistantMsgs[0] || '';
    }

    if (!summary || summary.length < 10) {
        return '<p>Analysis complete. Recommended careers reflect your academic strengths, personality profile, and professional values.</p>';
    }

    const formatted = summary
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .split(/\n{2,}/)
      .map(paragraph => {
        const lines = paragraph.split('\n').filter(l => l.trim());
        const isList = lines.every(l => l.trim().startsWith('- ') || l.trim().startsWith('* ') || l.trim().match(/^\d+\./));

        if (isList) {
          const listItems = lines.map(l => {
            const content = l.trim().replace(/^[-*]\s+|\d+\.\s+/, '');
            return `<li>${content}</li>`;
          }).join('');
          return `<ul>${listItems}</ul>`;
        }

        return `<p>${paragraph.trim().replace(/\n/g, '<br>')}</p>`;
      })
      .join('');

    return formatted;
  }

  static async downloadPDF(htmlContent: string, filename: string): Promise<void> {
    const html2pdf = (await import('html2pdf.js')).default;

    const safeFilename = (filename || 'CareerGuide-Diagnostic.pdf')
      .replace(/[^a-z0-9. -]/gi, '_');

    const wrappedHtml = `<div style="width:800px;background:#ffffff;padding:0;margin:0;">${htmlContent}</div>`;

    const options: any = {
      margin: [5, 5, 5, 5],
      filename: safeFilename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
        width: 800,
        windowWidth: 800,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    await html2pdf()
      .from(wrappedHtml)
      .set(options)
      .save();
  }

  static generateTextReport(profile: GuestProfile, conversation: ChatMessage[]): string {
    const currentDate = new Date().toLocaleDateString();
    return `
CAREERGUIDE AI - PROFESSIONAL DIAGNOSTIC
Generated on: ${currentDate}

STUDENT NAME: ${profile.name || 'Student'}
CURRICULUM: ${profile.curriculum || 'Kenyan'}
MEAN GRADE: ${profile.kcseGrade || 'N/A'}

DIAGNOSTIC INSIGHTS:
${this.extractAISummary(conversation).replace(/<\/?[^>]+(>|$)/g, "")}

NEXT STEPS:
1. Verify Cluster Points against KUCCPS 2025 thresholds.
2. Direct application to recommended institutions.
3. Consult professional development roadmap on CareerGuide AI.

Empowering Kenya's Students Through AI-Driven Success.
    `;
  }

  static getCBEPathInfo(grade?: string): string {
    if (!grade) return "Determining pathway...";
    const gradeNum = parseInt(grade.replace(/\D/g, ''));
    if (grade.toLowerCase().includes('form') || grade.toLowerCase().includes('kcse')) return "Tertiary Readiness (KUCCPS)";
    if (gradeNum <= 9) return "Junior Secondary (Exploring Areas)";
    return "Senior Secondary (Pathway Specialization)";
  }
}
