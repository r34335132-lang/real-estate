-- Run this first, by itself, in Supabase SQL Editor.
-- Postgres requires committing a new enum value before using it anywhere else.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'buyer';
