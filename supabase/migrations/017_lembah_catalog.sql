-- Lembah theme (premium scenic): catalog row. Run once in the Supabase SQL editor.
-- Idempotent: safe to re-run (insert is skipped when the row exists).

insert into theme_catalog (theme, code, tier, category, is_active, price, position)
values ('lembah', 'LMB', 'premium', 'mewah', true, 199000, 12)
on conflict (theme) do nothing;

update theme_catalog
set code = 'LMB', tier = 'premium', category = 'mewah'
where theme = 'lembah' and (code is null or tier = 'basic' or category = 'klasik');
