-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create profiles table with unique username
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create enum for file visibility
CREATE TYPE public.file_visibility AS ENUM ('public', 'private');

-- Create shared_files table
CREATE TABLE public.shared_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  visibility public.file_visibility DEFAULT 'public' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expire_at TIMESTAMPTZ NOT NULL
);

-- Create file_permissions table (for private files)
CREATE TABLE public.file_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_file_id UUID REFERENCES public.shared_files(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(shared_file_id, username)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_permissions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Shared files policies
CREATE POLICY "Users can view their own shared files"
  ON public.shared_files FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shared files"
  ON public.shared_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view public files by code"
  ON public.shared_files FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Users can view private files if permitted"
  ON public.shared_files FOR SELECT
  USING (
    visibility = 'private' AND 
    EXISTS (
      SELECT 1 FROM public.file_permissions fp
      INNER JOIN public.profiles p ON p.username = fp.username
      WHERE fp.shared_file_id = shared_files.id
      AND p.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own shared files"
  ON public.shared_files FOR DELETE
  USING (auth.uid() = user_id);

-- File permissions policies
CREATE POLICY "Users can view permissions for their files"
  ON public.file_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_files sf
      WHERE sf.id = shared_file_id AND sf.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert permissions for their files"
  ON public.file_permissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shared_files sf
      WHERE sf.id = shared_file_id AND sf.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete permissions for their files"
  ON public.file_permissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.shared_files sf
      WHERE sf.id = shared_file_id AND sf.user_id = auth.uid()
    )
  );

-- Create storage bucket for files
INSERT INTO storage.buckets (id, name, public)
VALUES ('shared-files', 'shared-files', false);

-- Storage policies
CREATE POLICY "Users can upload their own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'shared-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view files they uploaded"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'shared-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view files with valid code and permissions"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'shared-files' AND
    EXISTS (
      SELECT 1 FROM public.shared_files sf
      WHERE sf.file_path = name
      AND (
        sf.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM public.file_permissions fp
          INNER JOIN public.profiles p ON p.username = fp.username
          WHERE fp.shared_file_id = sf.id AND p.id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'shared-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8))
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate unique 6-character code
CREATE OR REPLACE FUNCTION public.generate_share_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$;

-- Function to validate expiration (for trigger)
CREATE OR REPLACE FUNCTION public.validate_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.expire_at <= NOW() THEN
    RAISE EXCEPTION 'Expiration date must be in the future';
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to validate expiration
CREATE TRIGGER validate_shared_file_expiration
  BEFORE INSERT OR UPDATE ON public.shared_files
  FOR EACH ROW EXECUTE FUNCTION public.validate_expiration();

-- Create index for faster queries
CREATE INDEX idx_shared_files_code ON public.shared_files(code);
CREATE INDEX idx_shared_files_expire_at ON public.shared_files(expire_at);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_file_permissions_username ON public.file_permissions(username);