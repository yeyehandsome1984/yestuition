-- Make module_id nullable in attachments table to support optional module selection
ALTER TABLE public.attachments ALTER COLUMN module_id DROP NOT NULL;