-- Create module_questions table for Q&A feature
CREATE TABLE public.module_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  answered_by UUID REFERENCES auth.users(id),
  answered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.module_questions ENABLE ROW LEVEL SECURITY;

-- Anyone can view questions and answers
CREATE POLICY "Anyone can view questions"
  ON public.module_questions
  FOR SELECT
  USING (true);

-- Authenticated users can create questions
CREATE POLICY "Users can create questions"
  ON public.module_questions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own questions
CREATE POLICY "Users can update own questions"
  ON public.module_questions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Teachers and admins can answer questions
CREATE POLICY "Teachers can answer questions"
  ON public.module_questions
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_module_questions_updated_at
  BEFORE UPDATE ON public.module_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();