-- Run this by itself in Supabase SQL Editor before publishing ejidal properties.
-- PostgreSQL must commit a new enum value before another query can use it.

ALTER TYPE property_category ADD VALUE IF NOT EXISTS 'ejidal' AFTER 'terreno';
