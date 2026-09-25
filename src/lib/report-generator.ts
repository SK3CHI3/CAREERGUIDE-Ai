import { ChatMessage } from './ai-service';
import type { QuickAssessmentBrief } from './quick-assessment-report';

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
  workPreferences?: string[];
  strengths?: string[];
  challenges?: string[];
  dreamJob?: string;
  location?: string;
  resultsVerified?: boolean;
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
      { label: 'Curriculum', value: 'Kenya\'s Competency-Based Curriculum (CBC)' },
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

  static generateQuickAssessmentPDFReport(profile: GuestProfile, brief: QuickAssessmentBrief): string {
    const escape = (value: string | undefined) => this.escapeHtml(value || 'Not specified');
    const currentDate = new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });
    const studentName = escape(profile.name || 'Student');
    const subjectList = escape(profile.subjects?.slice(0, 4).join(', ') || 'Not selected');
    const interestList = escape(profile.interests?.slice(0, 4).join(', ') || 'Not selected');
    const isGrade11 = profile.grade === 'Grade 11';

    const careerCards = brief.careerFields.map((field, index) => `
      <article class="brief-career-card">
        <div class="brief-career-number">0${index + 1}</div>
        <div class="brief-kicker">Career field to explore</div>
        <h2>${escape(field.field)}</h2>
        <div class="brief-pathway-badges">
          <span class="brief-pathway-badge brief-pathway-${field.cbc_pathway.toLowerCase().replace(/\s+/g, '-')}">${escape(field.cbc_pathway)}</span>
          <span class="brief-track-badge">${escape(field.cbc_track)}</span>
        </div>
        <div class="brief-copy-block">
          <h3>Subjects to prioritise</h3>
          <div class="brief-subject-chips">
            ${field.subjectsToPrioritise.map(s => `<span class="brief-subject-chip">${escape(s)}</span>`).join('')}
          </div>
        </div>
        <div class="brief-copy-block">
          <h3>Why it appeared</h3>
          <p>${escape(field.whyItAppeared)}</p>
        </div>
        <div class="brief-copy-block">
          <h3>What still needs testing</h3>
          <p>${escape(field.realityToTest)}</p>
        </div>
        ${!isGrade11 && field.starterActivity ? `
        <div class="brief-activity">
          <strong>${escape(field.starterActivity.title)}</strong>
          <p>${escape(field.starterActivity.instruction)}</p>
          <span><b>Notice:</b> ${escape(field.starterActivity.reflectionPrompt)}</span>
        </div>
        ` : ''}
        ${isGrade11 && field.trainingRoutes ? `
        <div class="brief-training-routes">
          <strong>Training routes</strong>
          ${field.trainingRoutes.map(route => `
            <div class="brief-route">
              <p><b>${escape(route.route)}:</b> ${escape(route.programme)}</p>
              <p>${escape(route.requirements)}</p>
              <p class="brief-route-budget">${escape(route.budgetNote)}</p>
            </div>
          `).join('')}
        </div>
        ` : ''}
        ${isGrade11 && field.nextAction ? `
        <div class="brief-next-action">
          <strong>${escape(field.nextAction.title)}</strong>
          <p>${escape(field.nextAction.instruction)}</p>
          <span><b>Deadline:</b> ${escape(field.nextAction.deadline)}</span>
        </div>
        ` : ''}
      </article>
    `).join('');

    const planCards = brief.plan.map((step, index) => `
      <article class="brief-plan-card">
        <div class="brief-plan-number">0${index + 1}</div>
        <div>
          <div class="brief-kicker">${escape(step.timeframe)}</div>
          <h2>${escape(step.title)}</h2>
          <p>${escape(step.action)}</p>
          <span>${escape(step.careerGuideAction)}</span>
        </div>
      </article>
    `).join('');

    return `
      <div class="quick-brief">
        <style>${this.getQuickAssessmentStyles()}</style>

        <section class="quick-brief-page">
          ${this.getQuickAssessmentHeader('Quick Assessment - Direction Brief')}
          <div class="brief-title-block">
            <div class="brief-kicker">CareerGuide AI Quick Assessment</div>
            <h1>${studentName}'s Direction Brief</h1>
            <p>A practical guide for the next stage - not a final verdict.</p>
          </div>
          <div class="brief-student-card">
            <div class="brief-kicker">Student snapshot</div>
            <h2>${escape(profile.grade)}${profile.pathway ? ` | ${escape(profile.pathway)} pathway` : ''}</h2>
            <div class="brief-chip-row"><span>${subjectList}</span><span>${interestList}</span></div>
          </div>
          <div class="brief-section">
            <div class="brief-kicker">What this brief used</div>
            <h2>Use the pattern as a starting point.</h2>
            <p>${escape(brief.studentSummary)}</p>
          </div>
          <div class="brief-callout green">
            <div class="brief-kicker">Your grade context</div>
            <p>${escape(brief.gradeContext)}</p>
          </div>
          <div class="brief-section compact">
            <div class="brief-kicker">Your focus now</div>
            <h2>${escape(brief.gradeFocus)}</h2>
          </div>
          ${brief.parentNote ? `
          <div class="brief-callout">
            <div class="brief-kicker">Your family's expectations</div>
            <p>${escape(brief.parentNote)}</p>
          </div>
          ` : ''}
          ${brief.visionNote ? `
          <div class="brief-callout">
            <div class="brief-kicker">Your vision</div>
            <p>${escape(brief.visionNote)}</p>
          </div>
          ` : ''}
          ${this.getQuickAssessmentFooter(1)}
        </section>

        <section class="quick-brief-page">
          ${this.getQuickAssessmentHeader('Three careers to explore')}
          <div class="brief-title-block small">
            <h1>Test the work before you choose.</h1>
            <p>These are real careers from CareerGuide's library. Each is a possibility to investigate, not a promise or a final decision.</p>
          </div>
          ${careerCards}
          ${this.getQuickAssessmentFooter(2)}
        </section>

        <section class="quick-brief-page">
          ${this.getQuickAssessmentHeader('Your starting plan')}
          <div class="brief-title-block small">
            <h1>Turn curiosity into evidence.</h1>
            <p>Keep the next step small enough to finish, then use what you learn to make a better decision.</p>
          </div>
          <div class="brief-plan-stack">${planCards}</div>
          <div class="brief-callout">
            <div class="brief-kicker">Bring this question to a conversation</div>
            <h2>What should I notice while I test these directions?</h2>
            <p>Ask a teacher, parent, mentor, or CareerGuide counsellor to respond to the work you actually produce.</p>
          </div>
          ${this.getQuickAssessmentFooter(3)}
        </section>
      </div>
    `;
  }

  private static getQuickAssessmentHeader(section: string): string {
    return `
      <header class="brief-header">
        <img src="${window.location.origin}/logos/CareerGuide_Logo.webp" class="brief-logo" alt="CareerGuide AI">
        <span>${this.escapeHtml(section)}</span>
      </header>
    `;
  }

  private static getQuickAssessmentFooter(page: number): string {
    return `
      <footer class="brief-footer">
        <strong>CareerGuide AI</strong><span>careerguideai.co.ke</span><span>${page} / 4</span>
      </footer>
    `;
  }

  private static escapeHtml(value: string): string {
    return value.replace(/[&<>'"]/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
    }[character] || character));
  }

  private static getQuickAssessmentStyles(): string {
    return `
      * { box-sizing: border-box; }
      .quick-brief { width: 100%; max-width: 794px; color: #14213d; background: #fff; font-family: Georgia, 'Times New Roman', serif; margin: 0 auto; }
      .quick-brief-page { width: 100%; max-width: 794px; min-height: 1123px; padding: 42px 52px 54px; position: relative; background: #fff; page-break-after: always; break-after: page; margin: 0 auto; }
      .quick-brief-page:last-child { page-break-after: auto; break-after: auto; }
      .brief-header { height: 53px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #dce4ed; font-family: Arial, sans-serif; color: #64748b; font-size: 11px; }
      .brief-logo { display: block; width: 155px; height: auto; max-height: 35px; object-fit: contain; object-position: left center; }
      .brief-title-block { margin: 46px 0 32px; }
      .brief-title-block.small { margin: 38px 0 25px; }
      .brief-kicker { color: #1f5bc5; font-family: Arial, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; }
      .brief-title-block h1 { font-size: 31px; line-height: 1.12; margin: 10px 0; color: #14213d; }
      .brief-title-block p, .brief-section p, .brief-callout p { margin: 0; color: #52627a; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.55; }
      .brief-student-card { padding: 25px; background: #eef4ff; border-radius: 16px; margin-bottom: 38px; }
      .brief-student-card h2 { font-family: Arial, sans-serif; font-size: 18px; margin: 10px 0 16px; }
      .brief-chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
      .brief-chip-row span { display: inline-block; max-width: 100%; padding: 6px 9px; border-radius: 12px; background: #fff; color: #1f5bc5; font: 700 10px/1.3 Arial, sans-serif; }
      .brief-section { margin: 0 0 28px; }
      .brief-section h2, .brief-callout h2 { font-size: 22px; line-height: 1.2; margin: 10px 0; }
      .brief-section.compact { margin-top: 28px; }
      .brief-callout { padding: 22px 25px; border-radius: 14px; background: #eef4ff; }
      .brief-callout.green { background: #ecf8f0; }
      .brief-callout.green .brief-kicker { color: #237a4b; }
      .brief-career-card { position: relative; margin: 0 0 20px; padding: 21px 24px 22px 38px; border: 1px solid #dce4ed; border-radius: 15px; page-break-inside: avoid; break-inside: avoid; }
      .brief-career-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: #1f5bc5; border-radius: 15px 0 0 15px; }
      .brief-career-card:nth-of-type(2)::before { background: #237a4b; }
      .brief-career-number { position: absolute; top: 18px; left: 14px; font: 700 10px Arial, sans-serif; color: #1f5bc5; }
      .brief-career-card h2 { margin: 6px 0 14px; font-size: 20px; line-height: 1.12; }
      .brief-copy-block { margin: 0 0 11px; }
      .brief-copy-block h3 { margin: 0 0 3px; color: #64748b; font: 700 9px Arial, sans-serif; letter-spacing: .4px; text-transform: uppercase; }
      .brief-copy-block p { margin: 0; color: #44546a; font: 12px/1.4 Arial, sans-serif; }
      .brief-activity { margin-top: 14px; padding: 11px 14px; border-radius: 10px; background: #eef4ff; font-family: Arial, sans-serif; }
      .brief-activity strong { color: #1f5bc5; font-size: 12px; }
      .brief-activity p { margin: 4px 0 5px; font-size: 11px; line-height: 1.38; }
      .brief-activity span { display: block; color: #64748b; font-size: 10px; line-height: 1.35; }
      .brief-pathway-badges { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
      .brief-pathway-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font: 700 10px/1.3 Arial, sans-serif; }
      .brief-pathway-stem { background: #dbeafe; color: #1e40af; }
      .brief-pathway-social-sciences { background: #f3e8ff; color: #6b21a8; }
      .brief-pathway-arts-&-sports-science { background: #dcfce7; color: #166534; }
      .brief-track-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; background: #f1f5f9; color: #475569; font: 600 10px/1.3 Arial, sans-serif; }
      .brief-subject-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
      .brief-subject-chip { display: inline-block; padding: 4px 8px; border-radius: 8px; background: #eef4ff; color: #1f5bc5; font: 700 10px/1.3 Arial, sans-serif; }
      .brief-training-routes { margin-top: 14px; padding: 11px 14px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-family: Arial, sans-serif; }
      .brief-training-routes strong { color: #14213d; font-size: 12px; display: block; margin-bottom: 8px; }
      .brief-route { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e2e8f0; }
      .brief-route:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
      .brief-route p { margin: 2px 0; font-size: 11px; line-height: 1.38; color: #44546a; }
      .brief-route-budget { color: #1f5bc5 !important; font-weight: 600; }
      .brief-next-action { margin-top: 14px; padding: 11px 14px; border-radius: 10px; background: #ecf8f0; font-family: Arial, sans-serif; }
      .brief-next-action strong { color: #237a4b; font-size: 12px; }
      .brief-next-action p { margin: 4px 0 5px; font-size: 11px; line-height: 1.38; color: #44546a; }
      .brief-next-action span { display: block; color: #64748b; font-size: 10px; line-height: 1.35; }
      .brief-plan-stack { margin-top: 38px; }
      .brief-plan-card { display: grid; grid-template-columns: 58px 1fr; gap: 16px; margin-bottom: 20px; padding: 20px; border: 1px solid #dce4ed; border-radius: 15px; page-break-inside: avoid; break-inside: avoid; }
      .brief-plan-number { display: grid; width: 48px; height: 48px; place-items: center; background: #eef4ff; border-radius: 12px; color: #1f5bc5; font: 700 13px Arial, sans-serif; }
      .brief-plan-card h2 { font-size: 20px; margin: 6px 0 7px; }
      .brief-plan-card p { margin: 0 0 7px; color: #52627a; font: 12px/1.45 Arial, sans-serif; }
      .brief-plan-card span { color: #1f5bc5; font: 700 10px Arial, sans-serif; }
      .brief-reflections { margin-top: 36px; }
      .brief-reflection-row { margin-bottom: 26px; }
      .brief-reflection-row h3 { margin: 0 0 13px; color: #1f5bc5; font: 700 11px Arial, sans-serif; text-transform: uppercase; }
      .brief-reflection-row div { height: 22px; border-bottom: 1px solid #dce4ed; }
      .brief-next-card { margin-top: 35px; padding: 25px; border-radius: 15px; background: #14213d; color: #fff; }
      .brief-next-card h2 { margin: 0 0 10px; font-size: 21px; }
      .brief-next-card p { margin: 0; color: #dce7ff; font: 11px/1.45 Arial, sans-serif; }
      .brief-footer { position: absolute; right: 52px; bottom: 25px; left: 52px; display: flex; justify-content: space-between; padding-top: 11px; border-top: 1px solid #dce4ed; color: #64748b; font: 10px Arial, sans-serif; }
      .brief-footer strong { color: #52627a; }
    `;
  }

  private static getStyles(colors: any): string {
    return `
      * { box-sizing: border-box; margin: 0; padding: 0; }

      .report-container {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        color: ${colors.text};
        background: ${colors.white};
        line-height: 1.5;
        font-size: 14px;
        -webkit-font-smoothing: antialiased;
      }

      .report-page {
        width: 100%;
        max-width: 794px;
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

    console.log("Starting PDF generation...", { filename: safeFilename, htmlLength: htmlContent.length });

    // Wait for fonts with timeout
    if ('fonts' in document) {
      try {
        await Promise.race([
          document.fonts.ready,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Font loading timeout')), 3000))
        ]);
      } catch (err) {
        console.warn('Font loading timeout, continuing anyway:', err);
      }
    }

    const options: any = {
      margin: [8, 8, 8, 8],
      filename: safeFilename,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
        windowWidth: 850,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true
      },
      pagebreak: {
        mode: ['css', 'legacy'],
        avoid: ['.brief-career-card', '.brief-plan-card', '.brief-reflection-row']
      }
    };

    try {
      // Pass HTML as string — html2pdf creates its own visible rendering container
      await html2pdf()
        .from(htmlContent, 'string')
        .set(options)
        .save();

      console.log("PDF save completed successfully");
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static generateTextReport(profile: GuestProfile, conversation: ChatMessage[]): string {
    const currentDate = new Date().toLocaleDateString();
    return `
CAREERGUIDE AI - PROFESSIONAL DIAGNOSTIC
Generated on: ${currentDate}

STUDENT NAME: ${profile.name || 'Student'}
CURRICULUM: Kenya's Competency-Based Curriculum (CBC)
CURRENT GRADE: ${profile.grade || 'Not specified'}
PATHWAY: ${profile.pathway || 'Not specified'}

DIAGNOSTIC INSIGHTS:
${this.extractAISummary(conversation).replace(/<\/?[^>]+(>|$)/g, "")}

NEXT STEPS:
1. Explore KUCCPS cluster requirements for your pathway.
2. Research recommended universities and programmes.
3. Consult professional development roadmap on CareerGuide AI.

Empowering Kenya's Students Through AI-Driven Success.
    `;
  }

  static getCBEPathInfo(grade?: string): string {
    if (!grade) return "Determining pathway...";
    const gradeNum = parseInt(grade.replace(/\D/g, ''));
    if (gradeNum <= 9) return "Junior Secondary (Exploring Areas)";
    return "Senior Secondary (Pathway Specialization)";
  }
}
