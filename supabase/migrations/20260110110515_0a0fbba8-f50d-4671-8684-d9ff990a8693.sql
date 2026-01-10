-- Fix: Change the UPDATE policy to PERMISSIVE so soft-delete works
-- First drop the existing restrictive policy
DROP POLICY IF EXISTS "Teachers and admins can update modules" ON public.modules;

-- Create a PERMISSIVE update policy for teachers and admins
CREATE POLICY "Teachers and admins can update modules" 
ON public.modules 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (true);