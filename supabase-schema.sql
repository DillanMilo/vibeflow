-- =============================================
-- VIBEFLOW DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- PROFILES TABLE
-- =====================
-- Stores user profile information (auto-created on signup)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PROJECTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT DEFAULT '',
  color TEXT DEFAULT '#e5a54b',
  created_at BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT projects_name_length CHECK (char_length(name) <= 255)
);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- =====================
-- KANBAN CARDS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.kanban_cards (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in-progress', 'complete')),
  priority TEXT CHECK (priority IS NULL OR priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT cards_title_length CHECK (char_length(title) <= 500)
);
CREATE INDEX IF NOT EXISTS idx_cards_project_id ON public.kanban_cards(project_id);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.kanban_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_status ON public.kanban_cards(project_id, status, position);

-- =====================
-- TODO ITEMS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS public.todo_items (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT todos_text_length CHECK (char_length(text) <= 1000)
);
CREATE INDEX IF NOT EXISTS idx_todos_project_id ON public.todo_items(project_id);
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todo_items(user_id);

-- =====================
-- ROW LEVEL SECURITY (RLS)
-- =====================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_items ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only read/update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Projects: Users can only access their own projects
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
CREATE POLICY "Users can insert own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- Kanban Cards: Users can only access cards in their projects
DROP POLICY IF EXISTS "Users can view own cards" ON public.kanban_cards;
CREATE POLICY "Users can view own cards" ON public.kanban_cards
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own cards" ON public.kanban_cards;
CREATE POLICY "Users can insert own cards" ON public.kanban_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cards" ON public.kanban_cards;
CREATE POLICY "Users can update own cards" ON public.kanban_cards
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cards" ON public.kanban_cards;
CREATE POLICY "Users can delete own cards" ON public.kanban_cards
  FOR DELETE USING (auth.uid() = user_id);

-- Todo Items: Users can only access todos in their projects
DROP POLICY IF EXISTS "Users can view own todos" ON public.todo_items;
CREATE POLICY "Users can view own todos" ON public.todo_items
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own todos" ON public.todo_items;
CREATE POLICY "Users can insert own todos" ON public.todo_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own todos" ON public.todo_items;
CREATE POLICY "Users can update own todos" ON public.todo_items
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own todos" ON public.todo_items;
CREATE POLICY "Users can delete own todos" ON public.todo_items
  FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- FUNCTIONS & TRIGGERS
-- =====================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_projects ON public.projects;
CREATE TRIGGER set_updated_at_projects
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_cards ON public.kanban_cards;
CREATE TRIGGER set_updated_at_cards
  BEFORE UPDATE ON public.kanban_cards
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_todos ON public.todo_items;
CREATE TRIGGER set_updated_at_todos
  BEFORE UPDATE ON public.todo_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================
-- REALTIME PUBLICATION
-- =====================
-- Enable realtime for all tables

-- First check if tables are already in the publication
DO $$
BEGIN
  -- Add projects if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'projects'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
  END IF;

  -- Add kanban_cards if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'kanban_cards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kanban_cards;
  END IF;

  -- Add todo_items if not already in publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'todo_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.todo_items;
  END IF;
END $$;

-- =====================
-- DONE!
-- =====================
-- Your database is now ready for Vibeflow!
