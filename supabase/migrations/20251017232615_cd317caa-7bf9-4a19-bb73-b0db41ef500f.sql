-- Adiciona política para permitir download anônimo de arquivos públicos com código válido
CREATE POLICY "Anyone can download public files with valid code"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'shared-files' 
  AND EXISTS (
    SELECT 1 
    FROM shared_files sf 
    WHERE sf.file_path = objects.name 
    AND sf.visibility = 'public'
    AND sf.expire_at > now()
  )
);