-- Migration: Split subjects into jss_subjects and ss_subjects
-- This addresses the critical bug where Junior Secondary students were being shown
-- Senior Secondary subjects in subjects_to_prioritise

-- Step 1: Add new columns
ALTER TABLE career_fields ADD COLUMN IF NOT EXISTS jss_subjects TEXT[] DEFAULT '{}';
ALTER TABLE career_fields ADD COLUMN IF NOT EXISTS ss_subjects TEXT[] DEFAULT '{}';

-- Step 2: Migrate existing subjects to ss_subjects
UPDATE career_fields 
SET ss_subjects = subjects 
WHERE subjects IS NOT NULL AND array_length(subjects, 1) > 0;

-- Step 3: Populate jss_subjects with appropriate precursor subjects
-- These are the 12 core Junior Secondary subjects that lead to each career field

UPDATE career_fields 
SET jss_subjects = CASE 
  -- STEM fields
  WHEN cbc_pathway = 'STEM' AND cbc_track = 'Pure Sciences' THEN 
    ARRAY['Mathematics', 'Integrated Science', 'Agriculture & Nutrition', 'Pre-Technical & Pre-Career Studies']
  WHEN cbc_pathway = 'STEM' AND cbc_track = 'Applied Sciences' THEN 
    ARRAY['Mathematics', 'Integrated Science', 'Pre-Technical & Pre-Career Studies', 'Agriculture & Nutrition']
  WHEN cbc_pathway = 'STEM' AND cbc_track = 'Technical Studies' THEN 
    ARRAY['Mathematics', 'Integrated Science', 'Pre-Technical & Pre-Career Studies']
  
  -- Social Sciences fields
  WHEN cbc_pathway = 'Social Sciences' AND cbc_track = 'Languages & Literature' THEN 
    ARRAY['English', 'Kiswahili', 'Social Studies', 'Religious Education (CRE/IRE/HRE)']
  WHEN cbc_pathway = 'Social Sciences' AND cbc_track = 'Humanities & Business Studies' THEN 
    ARRAY['English', 'Social Studies', 'Business Studies', 'Religious Education (CRE/IRE/HRE)']
  
  -- Arts & Sports Science fields
  WHEN cbc_pathway = 'Arts & Sports Science' AND cbc_track = 'Visual Arts' THEN 
    ARRAY['Creative Arts and Sports', 'English', 'Mathematics']
  WHEN cbc_pathway = 'Arts & Sports Science' AND cbc_track = 'Performing Arts' THEN 
    ARRAY['Creative Arts and Sports', 'English', 'Kiswahili']
  WHEN cbc_pathway = 'Arts & Sports Science' AND cbc_track = 'Sports Science' THEN 
    ARRAY['Creative Arts and Sports', 'Health Education', 'Life Skills Education']
  
  -- Default fallback
  ELSE ARRAY['Mathematics', 'English', 'Integrated Science', 'Social Studies']
END;

-- Step 4: Drop the old subjects column (after data migration is complete)
ALTER TABLE career_fields DROP COLUMN IF EXISTS subjects;

-- Step 5: Add comments for clarity
COMMENT ON COLUMN career_fields.jss_subjects IS 'Junior Secondary subjects (Grades 7-9) - 12 core subjects that lead to this career field';
COMMENT ON COLUMN career_fields.ss_subjects IS 'Senior Secondary subjects (Grades 10-12) - pathway-specific subjects for this career field';
