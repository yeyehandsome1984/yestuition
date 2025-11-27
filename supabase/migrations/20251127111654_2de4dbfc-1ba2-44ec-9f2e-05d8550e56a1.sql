-- Add soft delete columns to subjects, modules, and attachments
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance on deleted_at queries
CREATE INDEX IF NOT EXISTS idx_subjects_deleted_at ON public.subjects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_modules_deleted_at ON public.modules(deleted_at);
CREATE INDEX IF NOT EXISTS idx_attachments_deleted_at ON public.attachments(deleted_at);

-- Update RLS policies to exclude soft-deleted records
DROP POLICY IF EXISTS "Anyone can view subjects" ON public.subjects;
CREATE POLICY "Anyone can view subjects" 
ON public.subjects 
FOR SELECT 
USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Anyone can view modules" ON public.modules;
CREATE POLICY "Anyone can view modules" 
ON public.modules 
FOR SELECT 
USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Anyone can view attachments" ON public.attachments;
CREATE POLICY "Anyone can view attachments" 
ON public.attachments 
FOR SELECT 
USING (deleted_at IS NULL);