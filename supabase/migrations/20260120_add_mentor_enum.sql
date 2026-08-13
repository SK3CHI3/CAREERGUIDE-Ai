-- Migration 1: Add mentor enum value
-- This must be committed before the enum value can be used

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'mentor';

COMMENT ON TYPE user_role IS 'User roles: student, admin, school, teacher, mentor (mentor is the new replacement for teacher)';
