-- Rename description column to key_concept in modules table
ALTER TABLE public.modules RENAME COLUMN description TO key_concept;

-- Add prelim_year_tested and a_level_year_tested columns to modules table
ALTER TABLE public.modules 
ADD COLUMN prelim_year_tested TEXT,
ADD COLUMN a_level_year_tested TEXT;