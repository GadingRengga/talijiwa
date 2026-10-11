-- Theme roster reset (2026-10-10): wipe all themes, keep single Floral #1.
-- Run once in the Supabase SQL editor. Existing invitations keep their stored
-- theme value (text column, no constraint) and render with Floral via fallback.

delete from theme_catalog where theme <> 'floral';

insert into theme_catalog (theme, code, tier, category, is_active, price, position)
values ('floral', 'FLR', 'basic', 'floral', true, 149000, 1)
on conflict (theme) do nothing;

update theme_catalog
set code = 'FLR', tier = 'basic', category = 'floral', is_active = true, price = 149000, position = 1
where theme = 'floral';
