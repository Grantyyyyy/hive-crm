-- Add per-user brand color preference for the Pipeline brand color pilot.
ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS brand_color TEXT NOT NULL DEFAULT 'teal';

ALTER TABLE public.app_users
  DROP CONSTRAINT IF EXISTS app_users_brand_color_check;

ALTER TABLE public.app_users
  ADD CONSTRAINT app_users_brand_color_check
  CHECK (brand_color IN (
    'teal',
    'emerald',
    'sky',
    'blue',
    'indigo',
    'violet',
    'rose',
    'red',
    'orange',
    'amber'
  ));
