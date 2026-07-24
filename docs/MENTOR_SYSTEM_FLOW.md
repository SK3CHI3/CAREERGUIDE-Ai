# Mentor Role System and Student Management Flow

## Overview
This document outlines the mentor role system and how it differs from the teacher role in the CareerGuide AI platform. The mentor role is designed to accommodate a broader range of individuals who guide students in career decisions, including parents, guardians, and other mentors beyond traditional educators.

## Role Renaming Context
The platform originally had a "teacher" role, but this has been renamed to "mentor" to better reflect the expanded scope of individuals who can guide students. This change encompasses:
- Parents and guardians who wish to monitor their child's academic progress and career decisions
- Community leaders and volunteers who provide career guidance
- Former educators who now work in mentoring roles
- Career counselors and advisors

## Mentor Role Implementation

### 1. Authentication and Registration
- Mentors register through the same signup process as students
- During registration, mentors must specify:
  - How many students they plan to guide ("1-5", "6-20", "21-50", "50+")
  - Their role type ("individual", "classroom", "school", "organization")

### 2. Dashboard Structure
The Mentor Dashboard has been designed to accommodate mentors managing varying numbers of students:
- For small groups (1-5 students): Direct access to individual student profiles and career insights
- For larger groups (6-20+ students): Class-based management with bulk operations
- For institutional mentors (school/organization): Dashboard with school-level analytics

### 3. Student Management Features
Mentors can manage students in several ways:
- **Class-based Management**: Create and manage classes with multiple students
- **Individual Student View**: Access detailed profiles and career recommendations for specific students
- **Bulk Operations**: Upload grades and student information in batches
- **Career Insights**: Generate personalized mentorship insights for student career decisions

## System Flow Differences from Teacher Role

### 1. Student Enrollment Process
Unlike the previous teacher system where students were enrolled through school-based processes:
- Mentors can add students directly by UPI number or through bulk upload
- Students don't need to be enrolled through a school system
- The mentor can manage students regardless of school affiliation

### 2. Data Access and Sharing
- Mentors have direct access to student data without school administrative overhead
- Student data is accessible through the mentor's personal dashboard
- Career recommendations are tailored to the mentor's relationship with the student

### 3. Class Management
- Mentors can create classes with flexible student enrollment
- No requirement for school-based class structures
- Support for multiple class types (individual, classroom, group, organization)

## Database Schema Changes

### Profile Updates
The `profiles` table now includes:
- `mentor_student_count`: Number of students the mentor plans to guide
- `mentor_type`: Type of mentoring role (individual, classroom, school, organization)

### Class Management
- Classes can be created independently of school structure
- The `classes` table retains `teacher_id` but now refers to mentor
- Student enrollment through `class_enrollments` table

## Mentor Dashboard Features

### 1. Class Management
- Create, view, and manage multiple classes
- View student counts per class
- Class-based grade management
- Bulk student addition via UPI

### 2. Student Insights
- Individual student career recommendations
- Career pathway visualization
- Academic performance tracking
- Mentor-specific insights and guidance

### 3. Resource Management
- Grade upload capabilities
- Student communication tools
- Career guidance resources
- Progress tracking tools

## User Experience Considerations

### 1. Role-Specific Views
Different mentor types have different dashboard experiences:
- **Individual Mentors**: Focus on single student relationships
- **Classroom Teachers**: Manage multiple students in a class setting
- **School Coordinators**: Oversee student groups within institutions
- **Organization Leaders**: Manage mentorship programs across organizations

### 2. Scalability Features
- Support for mentors managing small (1-5) to large (50+) student groups
- Flexible class creation and management
- Batch operations for managing multiple students efficiently
- Resource allocation based on mentor capacity

## Integration Points

### 1. Authentication Context
- AuthContext now recognizes 'mentor' role
- Profile data includes mentor-specific fields
- Role-based access control for mentor features

### 2. Data Services
- ClassService modified to work with mentor IDs instead of teacher IDs
- GradeUploadService adapted for mentor-based grading
- SubscriptionService handles mentor-specific billing

### 3. UI Components
- SignupForm updated to include mentor-specific fields
- Dashboard components tailored for mentor workflows
- Student management interfaces adjusted for mentor perspective

## Migration Considerations

### 1. Existing Teacher Data
- All existing teacher profiles are migrated to mentor profiles
- Teacher-specific data is preserved in the mentor profile structure
- No disruption to existing student data

### 2. User Experience
- Redirects from teacher routes to mentor routes
- Updated UI copy and navigation
- Maintained functionality with new terminology

## Security and Permissions

### 1. Data Access Controls
- Mentors only see students they are directly managing
- Parent/guardian mentors see their own children's data
- Institutional mentors see data for their assigned groups
- Administrative controls for school coordinators

### 2. Privacy Considerations
- Student data remains protected under existing privacy policies
- Mentor access limited to students they are directly responsible for
- Audit trails maintained for all student data access

## Future Enhancements

### 1. Enhanced Mentor Tools
- Advanced analytics for mentor performance
- Collaboration features with other mentors
- Resource sharing capabilities
- Mentor training and certification pathways

### 2. Scalability Improvements
- Better support for large mentor networks
- Automated assignment of students to mentors
- Dynamic capacity management
- Performance monitoring for mentor activities

## Technical Implementation Notes

### 1. Code Base Changes
- Updated role type definitions in TypeScript interfaces
- Modified authentication logic to recognize mentor role
- Updated routing to use /mentor instead of /teacher
- Modified database queries to reference mentor instead of teacher

### 2. Component Adaptations
- MentorDashboard.tsx redesigned for mentor-specific workflows
- Class management components updated for mentor context
- Student insight components adapted for mentor perspective
- SignupForm.tsx modified to collect mentor-specific information

## Testing Scenarios

### 1. Role-Based Access
- Verify mentor can access mentor dashboard
- Confirm mentor cannot access student-only features without proper authorization
- Test navigation between mentor and student dashboards

### 2. Student Management
- Verify mentor can create and manage classes
- Test bulk student enrollment
- Confirm student data access restrictions

### 3. Data Flow
- Validate student data synchronization between mentor and student views
- Test grade upload functionality
- Verify career recommendation generation for mentor-managed students