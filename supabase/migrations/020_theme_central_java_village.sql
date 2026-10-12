-- Central Java Village theme (premium adat): catalog row. Run once in the Supabase SQL editor.
-- Idempotent: safe to re-run (insert is skipped when the row exists).

insert into theme_catalog (theme, code, tier, category, is_active, price, position)
values ('central-java-village', 'CJV', 'premium', 'adat', true, 199000, 3)
on conflict (theme) do nothing;

update theme_catalog
set code = 'CJV', tier = 'premium', category = 'adat'
where theme = 'central-java-village' and (code is null or tier = 'basic' or category = 'klasik');
