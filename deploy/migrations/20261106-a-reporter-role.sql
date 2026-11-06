-- Apply first, on its own (enum values cannot be used in the same transaction they are added).
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'reporter';
