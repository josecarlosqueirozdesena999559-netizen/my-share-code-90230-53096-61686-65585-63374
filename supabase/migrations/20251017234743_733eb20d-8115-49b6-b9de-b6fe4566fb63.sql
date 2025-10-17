
-- Remove TODAS as políticas da tabela shared_files primeiro
DROP POLICY IF EXISTS "Anyone can view public files by code" ON public.shared_files;
DROP POLICY IF EXISTS "Users can delete their own shared files" ON public.shared_files;
DROP POLICY IF EXISTS "Users can insert their own shared files" ON public.shared_files;
DROP POLICY IF EXISTS "Users can view private files if permitted" ON public.shared_files;
DROP POLICY IF EXISTS "Users can view public files by code" ON public.shared_files;
DROP POLICY IF EXISTS "Users can view their own shared files" ON public.shared_files;

-- Remove políticas de storage
DROP POLICY IF EXISTS "Download private files with permission" ON storage.objects;

-- Remove a função de verificação de permissão
DROP FUNCTION IF EXISTS public.user_has_file_permission(uuid);

-- Remove a tabela de permissões
DROP TABLE IF EXISTS public.file_permissions CASCADE;

-- Agora pode alterar a coluna visibility
ALTER TABLE public.shared_files 
  ALTER COLUMN visibility TYPE TEXT;

DROP TYPE IF EXISTS public.file_visibility;

-- Define valor padrão como 'public'
ALTER TABLE public.shared_files 
  ALTER COLUMN visibility SET DEFAULT 'public';

-- Atualiza todos os arquivos existentes para public
UPDATE public.shared_files SET visibility = 'public';

-- Recria as políticas simplificadas (apenas público)
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
