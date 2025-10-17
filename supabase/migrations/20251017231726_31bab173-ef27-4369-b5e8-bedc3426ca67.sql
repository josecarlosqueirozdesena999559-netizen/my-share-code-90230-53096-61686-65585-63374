-- Força atualização dos tipos do Supabase
-- Adiciona um comentário nas tabelas para forçar regeneração
COMMENT ON TABLE public.profiles IS 'Perfis de usuários do sistema';
COMMENT ON TABLE public.shared_files IS 'Arquivos compartilhados com códigos temporários';
COMMENT ON TABLE public.file_permissions IS 'Permissões de acesso a arquivos privados';