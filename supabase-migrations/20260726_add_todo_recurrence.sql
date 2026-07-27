-- Run once in the Supabase SQL Editor for the existing Vibeflow project.
-- This migration is idempotent and is safe to run again.

ALTER TABLE public.todo_items
  ADD COLUMN IF NOT EXISTS recurrence TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS due_date DATE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'todo_items_recurrence_check'
      AND conrelid = 'public.todo_items'::regclass
  ) THEN
    ALTER TABLE public.todo_items
      ADD CONSTRAINT todo_items_recurrence_check
      CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly', 'yearly'));
  END IF;
END $$;
