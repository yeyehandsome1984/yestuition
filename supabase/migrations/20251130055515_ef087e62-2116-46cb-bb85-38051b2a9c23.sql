-- Add subject_id to attachments table for subject-level attachments
ALTER TABLE attachments ADD COLUMN subject_id uuid REFERENCES subjects(id);

-- Create index for better query performance
CREATE INDEX idx_attachments_subject_id ON attachments(subject_id);

-- Update existing attachments to set subject_id based on their module's subject
UPDATE attachments
SET subject_id = modules.subject_id
FROM modules
WHERE attachments.module_id = modules.id
AND attachments.subject_id IS NULL;