
-- Remove TODAS as políticas de storage que podem depender da coluna visibility
DROP POLICY IF EXISTS "Anyone can download public files by code" ON storage.objects;
DROP POLICY IF EXISTS "Download private files with permission" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files they uploaded" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Remove TODAS as políticas da tabela shared_files
DROP POLICY IF EXISTS "Anyone can view public files by code" ON public.shared_files;
DROP POLICY IF EXISTS "Users can delete their own shared files" ON public.shared_files;
DROP POLICY IF EXISTS "Users can insert their own shared files" ON public.shared_files;
DROP POLICY IF EXISTS "Users can view private files if permitted" ON public.shared_files;
DROP POLICY IF EXISTS "Users can view public files by code" ON public.shared_files;
DROP POLICY IF EXISTS "Users can view their own shared files" ON public.shared_files;

-- Remove a função de verificação de permissão
DROP FUNCTION IF EXISTS public.user_has_file_permission(uuid);

-- Remove a tabela de permissões
DROP TABLE IF EXISTS public.file_permissions CASCADE;

-- Remove o default da coluna visibility
ALTER TABLE public.shared_files ALTER COLUMN visibility DROP DEFAULT;

-- Agora pode alterar a coluna visibility
ALTER TABLE public.shared_files 
  ALTER COLUMN visibility TYPE TEXT;

-- Drop o tipo enum
DROP TYPE IF EXISTS public.file_visibility CASCADE;

-- Define novo valor padrão como 'public'
ALTER TABLE public.shared_files 
  ALTER COLUMN visibility SET DEFAULT 'public';

-- Atualiza todos os arquivos existentes para public
UPDATE public.shared_files SET visibility = 'public';

-- Recria as políticas simplificadas para shared_files
CREATE POLICY "Anyone can view public files by code"
ON public.shared_files
FOR SELECT
TO public
USING (expire_at > now());

CREATE POLICY "Users can view their own shared files"
ON public.shared_files
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shared files"
ON public.shared_files
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared files"
ON public.shared_files
FOR DELETE
USING (auth.uid() = user_id);

-- Recria as políticas simplificadas para storage (apenas público)
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
    AND sf.expire_at > now()
  )
);

CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'shared-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view files they uploaded"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'shared-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'shared-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
