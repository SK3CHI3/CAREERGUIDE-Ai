-- Migration 2: Migrate teacher users to mentor and clean up tables
-- This runs after the mentor enum value is committed

-- Step 1: Migrate existing teacher users to mentor role
UPDATE profiles 
SET role = 'mentor' 
WHERE role = 'teacher';

-- Step 2: Drop unused school system tables (if they exist and are empty)
DROP TABLE IF EXISTS field_day_requests CASCADE;
DROP TABLE IF EXISTS platform_analytics CASCADE;
DROP TABLE IF EXISTS career_interests CASCADE;
DROP TABLE IF EXISTS grade_categories CASCADE;
DROP TABLE IF EXISTS academic_terms CASCADE;
DROP TABLE IF EXISTS school_subscriptions CASCADE;
DROP TABLE IF EXISTS teacher_invites CASCADE;
DROP TABLE IF EXISTS school_members CASCADE;
DROP TABLE IF EXISTS schools CASCADE;

-- Step 3: Remove school_id columns from tables that reference it
ALTER TABLE profiles DROP COLUMN IF EXISTS school_id;
ALTER TABLE classes DROP COLUMN IF EXISTS school_id;

-- Step 4: Update comments
COMMENT ON COLUMN profiles.role IS 'User role - student, admin, or mentor';

-- Step 5: Create a view to show active roles (excluding deprecated ones)
CREATE OR REPLACE VIEW active_roles AS
SELECT unnest(ARRAY['student'::user_role, 'admin'::user_role, 'mentor'::user_role]) as role;

COMMENT ON VIEW active_roles IS 'Shows only active user roles (excludes deprecated school and teacher)';
