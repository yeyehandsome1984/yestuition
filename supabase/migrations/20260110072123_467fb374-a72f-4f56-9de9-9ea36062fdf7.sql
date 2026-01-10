-- Drop and recreate the UPDATE policy for modules to properly handle soft deletes
DROP POLICY IF EXISTS "Teachers and admins can update modules" ON public.modules;

CREATE POLICY "Teachers and admins can update modules" 
ON public.modules 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));