
-- 1. Garantir que username seja único (CONSTRAINT já existe, mas vamos reforçar)
-- Adiciona uma constraint adicional para garantir unicidade case-insensitive
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_lower ON public.profiles (LOWER(username));

-- 2. Atualizar a função handle_new_user para garantir username único
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Pega o username do metadata ou gera um baseado no ID
  base_username := COALESCE(
    new.raw_user_meta_data->>'username',
    'user_' || substr(new.id::text, 1, 8)
  );
  
  final_username := base_username;
  
  -- Se o username já existe, adiciona um número até encontrar um disponível
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(final_username)) LOOP
    counter := counter + 1;
    final_username := base_username || counter::text;
  END LOOP;
  
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, final_username);
  
  RETURN new;
END;
$$;

-- 3. Corrigir as políticas RLS de storage para arquivos privados
-- Remove as políticas antigas
DROP POLICY IF EXISTS "Authenticated users can download private files with permission" ON storage.objects;
DROP POLICY IF EXISTS "Users can view files with valid code and permissions" ON storage.objects;

-- Política para arquivos PRIVADOS: usuários autenticados podem baixar se tiverem permissão
CREATE POLICY "Download private files with permission"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'shared-files' 
  AND EXISTS (
    SELECT 1 
    FROM public.shared_files sf
    JOIN public.file_permissions fp ON fp.shared_file_id = sf.id
    JOIN public.profiles p ON p.username = fp.username
    WHERE sf.file_path = storage.objects.name 
    AND sf.visibility = 'private'
    AND sf.expire_at > now()
    AND p.id = auth.uid()
  )
);

-- 4. Verificar política para arquivos públicos (deve permitir download anônimo)
-- Essa política já deve existir, mas vamos garantir
DROP POLICY IF EXISTS "Anyone can download public files by code" ON storage.objects;

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
