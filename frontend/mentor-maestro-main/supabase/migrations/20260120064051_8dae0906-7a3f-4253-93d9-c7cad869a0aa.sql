-- Create enum for pipeline stages
CREATE TYPE public.pipeline_stage AS ENUM (
  'onboarding',
  'concept_generation',
  'concept_review',
  'structure_development',
  'structure_review',
  'email_sequence',
  'production',
  'launch_ready'
);

-- Create enum for content status
CREATE TYPE public.content_status AS ENUM (
  'draft',
  'in_review',
  'approved',
  'rejected'
);

-- Create enum for document types
CREATE TYPE public.document_type AS ENUM (
  'onboarding_doc',
  'hook_analysis',
  'transcript',
  'video',
  'audio',
  'slide_deck',
  'other'
);

-- Create profiles table for mentor comprehensive data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Basic info
  full_name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  
  -- Business info
  company_name TEXT,
  website_url TEXT,
  niche TEXT,
  
  -- Comprehensive onboarding fields
  method_description TEXT,
  target_audience TEXT,
  audience_pain_points TEXT,
  transformation_promise TEXT,
  unique_mechanism TEXT,
  personal_story TEXT,
  philosophy TEXT,
  key_objections TEXT,
  testimonials TEXT,
  
  -- Pipeline tracking
  current_stage pipeline_stage DEFAULT 'onboarding',
  stage_started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  type document_type NOT NULL,
  file_url TEXT NOT NULL,
  file_size TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create webinar concepts table
CREATE TABLE public.webinar_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  version INTEGER DEFAULT 1,
  status content_status DEFAULT 'draft',
  
  -- Concept content
  big_idea TEXT,
  hooks TEXT,
  secret_structure TEXT,
  mechanism TEXT,
  narrative_angle TEXT,
  offer_transition TEXT,
  
  -- AI evaluation
  ai_evaluation TEXT,
  ai_improvements TEXT,
  
  -- Mentor feedback
  mentor_feedback TEXT,
  
  is_final BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create webinar structure table (slide-by-slide)
CREATE TABLE public.webinar_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  concept_id UUID REFERENCES public.webinar_concepts(id) ON DELETE SET NULL,
  
  version INTEGER DEFAULT 1,
  status content_status DEFAULT 'draft',
  
  -- Structure content (JSON for flexibility)
  slides JSONB,
  total_slides INTEGER DEFAULT 0,
  
  -- AI evaluation
  ai_evaluation TEXT,
  
  -- Mentor feedback
  mentor_feedback TEXT,
  
  is_final BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create email sequences table
CREATE TABLE public.email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  sequence_type TEXT NOT NULL, -- pre_webinar, post_webinar, sales, replay
  status content_status DEFAULT 'draft',
  
  -- Email content (JSON array of emails)
  emails JSONB,
  email_count INTEGER DEFAULT 0,
  
  -- AI evaluation
  ai_evaluation TEXT,
  
  is_final BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinar_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinar_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles (users can only access their own)
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for documents
CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for webinar_concepts
CREATE POLICY "Users can view own concepts"
  ON public.webinar_concepts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own concepts"
  ON public.webinar_concepts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own concepts"
  ON public.webinar_concepts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own concepts"
  ON public.webinar_concepts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for webinar_structures
CREATE POLICY "Users can view own structures"
  ON public.webinar_structures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own structures"
  ON public.webinar_structures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own structures"
  ON public.webinar_structures FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own structures"
  ON public.webinar_structures FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for email_sequences
CREATE POLICY "Users can view own email sequences"
  ON public.email_sequences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email sequences"
  ON public.email_sequences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email sequences"
  ON public.email_sequences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own email sequences"
  ON public.email_sequences FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Mentor'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webinar_concepts_updated_at
  BEFORE UPDATE ON public.webinar_concepts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webinar_structures_updated_at
  BEFORE UPDATE ON public.webinar_structures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_sequences_updated_at
  BEFORE UPDATE ON public.email_sequences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();