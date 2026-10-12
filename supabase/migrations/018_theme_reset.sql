-- Theme roster reset (2026-10-12): wipe all themes, keep zero-theme roster.
-- Run once in the Supabase SQL editor. Existing invitations keep their stored
-- theme value (text column, no constraint) and render with the neutral fallback.
-- Image files in src/assets/images/ are kept untouched for the rebuild.

delete from theme_catalog;

