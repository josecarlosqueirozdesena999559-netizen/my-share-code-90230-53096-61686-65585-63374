-- Remove políticas antigas conflitantes
DROP POLICY IF EXISTS "Users can view files with valid code and permissions" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can download public files with valid code" ON storage.objects;

-- Política 1: Qualquer pessoa (mesmo não autenticada) pode baixar arquivos PÚBLICOS com código válido
CREATE POLICY "Anyone can download public files by code"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'shared-files' 
  AND EXISTS (
    SELECT 1 
    FROM public.shared_files sf 
    WHERE sf.file_path = storage.objects.name 
    AND sf.visibility = 'public'
    AND sf.expire_at > now()
  )
);

-- Política 2: Usuários autenticados podem baixar arquivos PRIVADOS se tiverem permissão
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