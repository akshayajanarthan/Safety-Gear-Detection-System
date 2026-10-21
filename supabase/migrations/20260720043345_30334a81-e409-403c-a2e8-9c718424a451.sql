
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin','doctor','radiologist','researcher','patient');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  hospital TEXT,
  specialty TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles select all authed" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles select own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Auto-provision profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  desired_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);

  desired_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.app_role,
    'doctor'::public.app_role
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, desired_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Patients
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  age INT,
  gender TEXT,
  blood_group TEXT,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  diabetes BOOLEAN DEFAULT false,
  hypertension BOOLEAN DEFAULT false,
  previous_tumor BOOLEAN DEFAULT false,
  surgeries TEXT,
  medications TEXT,
  family_history TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patients read authed" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "patients insert own" ON public.patients FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "patients update own or admin" ON public.patients FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "patients delete own or admin" ON public.patients FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR public.has_role(auth.uid(),'admin'));

-- MRI scans
CREATE TABLE public.mri_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  original_filename TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mri_scans TO authenticated;
GRANT ALL ON public.mri_scans TO service_role;
ALTER TABLE public.mri_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mri read authed" ON public.mri_scans FOR SELECT TO authenticated USING (true);
CREATE POLICY "mri insert own" ON public.mri_scans FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "mri delete own or admin" ON public.mri_scans FOR DELETE TO authenticated
  USING (auth.uid() = uploaded_by OR public.has_role(auth.uid(),'admin'));

-- Predictions
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES public.mri_scans(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tumor_type TEXT NOT NULL,
  confidence NUMERIC NOT NULL,
  risk_level TEXT NOT NULL,
  probabilities JSONB NOT NULL,
  observation TEXT,
  reasoning TEXT,
  symptoms JSONB,
  recommended_tests JSONB,
  treatments JSONB,
  affected_region TEXT,
  model_version TEXT DEFAULT 'NeuroMind-CNN-v3.2',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.predictions TO authenticated;
GRANT ALL ON public.predictions TO service_role;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "predictions read authed" ON public.predictions FOR SELECT TO authenticated USING (true);
CREATE POLICY "predictions insert own" ON public.predictions FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER patients_updated BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Storage policies for mri-scans bucket (public read, authenticated write)
CREATE POLICY "mri scans public read" ON storage.objects FOR SELECT USING (bucket_id = 'mri-scans');
CREATE POLICY "mri scans authed insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'mri-scans' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "mri scans owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'mri-scans' AND auth.uid()::text = (storage.foldername(name))[1]);
