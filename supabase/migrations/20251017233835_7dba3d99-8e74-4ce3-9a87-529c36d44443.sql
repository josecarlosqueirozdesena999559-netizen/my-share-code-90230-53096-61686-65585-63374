
-- Corrige o search_path das funções para segurança

-- Atualiza a função handle_new_user
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

-- Atualiza a função generate_share_code
CREATE OR REPLACE FUNCTION public.generate_share_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
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

-- Atualiza a função validate_expiration
CREATE OR REPLACE FUNCTION public.validate_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.expire_at <= NOW() THEN
    RAISE EXCEPTION 'Expiration date must be in the future';
  END IF;
  RETURN NEW;
END;
$$;
