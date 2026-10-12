-- Adat Jawa theme (2026-10-11): second roster entry, premium tier.
-- Run once in the Supabase SQL editor. Pure-code artwork (no assets).

insert into theme_catalog (theme, code, tier, category, is_active, price, position)
values ('jawa', 'JW', 'premium', 'adat', true, 249000, 2)
on conflict (theme) do nothing;

update theme_catalog
set code = 'JW', tier = 'premium', category = 'adat', is_active = true, price = 249000, position = 2
where theme = 'jawa';
