# ShareBox - Sistema de Compartilhamento Seguro de Arquivos

Sistema moderno de compartilhamento de arquivos com códigos temporários, controle de permissões e criptografia.

## 🚀 Funcionalidades

- **Autenticação Completa**: Sistema de login/cadastro com validação de username em tempo real
- **Upload de Arquivos**: Suporte para PDF, DOC, TXT, XLS, imagens (máx 50MB)
- **Códigos Únicos**: Geração automática de códigos de 6 caracteres
- **Controle de Acesso**:
  - Compartilhamento público (qualquer um com o código)
  - Compartilhamento privado (apenas usuários específicos)
- **Expiração Automática**: Arquivos e códigos expiram após 24 horas
- **Interface Moderna**: Design minimalista com animações suaves
- **Gerenciamento**: Painel para visualizar e deletar compartilhamentos

## 🛠️ Tecnologias

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Lovable Cloud (Supabase)
- **Autenticação**: Supabase Auth
- **Storage**: Supabase Storage
- **Database**: PostgreSQL com RLS

## 🎨 Design System

- Cor principal: Azul indigo profundo (#1e293b)
- Fundo: Branco/Cinza claro
- Gradientes sutis e sombras elegantes
- Animações de fade-in e scale
- Tipografia moderna e clean

## 📦 Estrutura do Banco

### Tabelas
- `profiles`: Perfis de usuário com username único
- `shared_files`: Arquivos compartilhados com códigos
- `file_permissions`: Permissões para arquivos privados

### Políticas RLS
- Validação completa de acesso
- Suporte a compartilhamento público e privado
- Proteção contra acesso não autorizado

## 🔧 Edge Functions

### cleanup-expired-files
Função para limpar arquivos expirados automaticamente.

## 🚦 Como Usar

1. **Cadastro**: Crie uma conta com email, senha e username único
2. **Upload**: 
   - Escolha um arquivo
   - Defina visibilidade (público/privado)
   - Para privado, adicione usernames permitidos
   - Obtenha o código de 6 caracteres
3. **Download**:
   - Entre com seu código
   - Baixe os arquivos disponíveis
4. **Gerenciar**: Visualize e delete seus compartilhamentos

## 🔐 Segurança

- Todos os dados criptografados
- Row Level Security (RLS) em todas as tabelas
- Validação de permissões no banco de dados
- Storage privado com políticas de acesso
- Auto-exclusão após 24 horas

## 📝 Desenvolvido com Lovable

Este projeto foi desenvolvido usando Lovable Cloud, que fornece:
- Backend completo sem configuração
- Banco de dados PostgreSQL
- Autenticação de usuários
- Storage de arquivos
- Edge Functions serverless

---

**URL do Projeto**: https://lovable.dev/projects/f121356b-b057-4697-8248-f643e63bd0a8