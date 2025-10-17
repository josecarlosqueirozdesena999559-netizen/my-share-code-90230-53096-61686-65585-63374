-- Permite que qualquer pessoa (mesmo não autenticada) possa buscar arquivos públicos por código
CREATE POLICY "Anyone can view public files by code"
ON public.shared_files
FOR SELECT
TO public
USING (
  visibility = 'public'
  AND expire_at > now()
);