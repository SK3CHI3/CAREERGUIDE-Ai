# Career Guidance Flow: System Connectivity

This document outlines how the various components of the CareerGuide AI platform connect to provide a seamless career guidance experience for students.

## 1. Data Collection Layer
The journey begins with comprehensive data collection through the **Quick Assessment**:
- **Grade & Subjects**: Students select their current grade (7-12) and CBC subjects with performance ratings.
- **Interests & Activities**: Captured through interest categories and club/activity selection.
- **Parent Expectations**: For Junior Secondary students (Grades 7-9), parent career expectations are collected.
- **Future Vision**: Students describe their desired future career or lifestyle.

## 2. Processing Layer (AI Career Matching)
The system uses AI to synthesize data points and generate career recommendations:
- **Input**: Student Profile (grade, subjects, performance, interests, activities, vision).
- **Service**: `AICareerService` (`src/lib/ai-service.ts`) orchestrates the AI calls to Qwen via ModelScope.
- **Context**: AI receives real career fields from our database grouped by CBC pathway (STEM, Social Sciences, Arts & Sports Science, Technical & Vocational).
- **Output**: 3 career field recommendations with CBC pathway mapping, subjects to prioritize, and next steps.

## 3. Presentation Layer
- **Quick Assessment Results**: Paginated results showing 3 career fields with pathway badges, performance context, and action items.
- **AI Chat**: A conversational interface at `/chat` where students can ask follow-up questions. The AI has access to all career fields from our database and responds concisely.
- **Career Directory**: Students can explore 461+ career paths at `/careers` with detailed information.
- **Access Fit Feature**: From any career card, students can click "Access fit" to take a targeted assessment for that specific career.
- **Counselor Booking**: Students can book 1-on-1 sessions with verified career counselors for personalized guidance.

## 4. Connectivity Diagram
```
Student Profile & Assessment
         ↓
   AICareerService
         ↓
Career Fields Database (grouped by CBC pathway)
         ↓
   ModelScope API (Qwen)
         ↓
Career Recommendations + Action Items
         ↓
   ┌─────┴─────┐
   ↓           ↓
Assessment   AI Chat
  Results   (follow-up)
```

## 5. Key Features

### CBC Alignment
- Junior Secondary (Grades 7-9): Focus on core subjects and pathway exploration
- Senior Secondary (Grades 10-12): Focus on elective subjects and career field matching
- Performance descriptors use CBC terminology: Exceeding Expectation, Meeting Expectation, Approaching Expectation, Below Expectation

### Career Fields Database
- 47 career fields organized by CBC pathway
- Each field includes: example roles, subjects to prioritize, next steps
- AI only references careers from our verified database

### Anonymous Usage Tracking
- Page visits, assessment completions, and chat interactions tracked anonymously
- No authentication required
- Data used for analytics and platform improvement

## 6. Summary of Impacts
- **Students** get actionable, realistic career guidance aligned with Kenya's CBC system.
- **Students** can explore careers through the directory and ask follow-up questions via AI chat.
- **Students** can access personalized 1-on-1 guidance through the counselor booking system.
- **System** remains performant and free for all users.
