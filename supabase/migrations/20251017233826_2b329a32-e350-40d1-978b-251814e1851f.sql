
-- Remove a política antiga que estava muito restritiva
DROP POLICY IF EXISTS "Authenticated users can download private files with permission" ON storage.objects;

-- Nova política: usuários autenticados podem baixar arquivos privados se seu username está nas permissões
CREATE POLICY "Authenticated users can download private files with permission"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'shared-files' 
  AND EXISTS (
    SELECT 1 
    FROM public.shared_files sf 
    WHERE sf.file_path = storage.objects.name 
    AND sf.visibility = 'private'
    AND sf.expire_at > now()
    AND EXISTS (
      SELECT 1
      FROM public.file_permissions fp
      JOIN public.profiles p ON p.username = fp.username
      WHERE fp.shared_file_id = sf.id
      AND p.id = auth.uid()
    )
  )
);
