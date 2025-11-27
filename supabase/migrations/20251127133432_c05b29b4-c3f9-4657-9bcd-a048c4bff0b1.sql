-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true);

-- Create storage bucket for content images (for rich text editor)
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-images', 'content-images', true);

-- RLS policies for attachments bucket
CREATE POLICY "Anyone can view attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'attachments');

CREATE POLICY "Teachers and admins can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'attachments' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
);

CREATE POLICY "Teachers and admins can delete attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'attachments' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
);

-- RLS policies for content-images bucket
CREATE POLICY "Anyone can view content images"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-images');

CREATE POLICY "Teachers and admins can upload content images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'content-images' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
);

CREATE POLICY "Teachers and admins can delete content images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'content-images' AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
);

-- Create junction table for attachment-module many-to-many relationship
CREATE TABLE public.attachment_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attachment_id UUID NOT NULL REFERENCES public.attachments(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(attachment_id, module_id)
);

-- Enable RLS on junction table
ALTER TABLE public.attachment_modules ENABLE ROW LEVEL SECURITY;

-- RLS policies for attachment_modules
CREATE POLICY "Anyone can view attachment-module links"
ON public.attachment_modules FOR SELECT
USING (true);

CREATE POLICY "Teachers and admins can create attachment-module links"
ON public.attachment_modules FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Teachers and admins can delete attachment-module links"
ON public.attachment_modules FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

-- Migrate existing attachments that have module_id to junction table
INSERT INTO public.attachment_modules (attachment_id, module_id)
SELECT id, module_id
FROM public.attachments
WHERE module_id IS NOT NULL;

-- Add RLS policy for teachers and admins to update attachments
CREATE POLICY "Teachers and admins can update attachments"
ON public.attachments FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));