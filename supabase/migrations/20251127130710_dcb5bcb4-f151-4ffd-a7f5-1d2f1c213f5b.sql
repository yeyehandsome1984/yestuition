-- Add category column to attachments table
ALTER TABLE public.attachments 
ADD COLUMN category text NOT NULL DEFAULT 'Prelim & A level';

-- Add check constraint for valid categories
ALTER TABLE public.attachments
ADD CONSTRAINT attachments_category_check 
CHECK (category IN ('Tutorial & Note', 'Prelim & A level', 'Revision', 'WA', 'Others'));