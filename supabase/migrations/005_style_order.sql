alter table invitation_settings add column if not exists style jsonb not null default '{}'::jsonb;
alter table invitation_settings add column if not exists section_order jsonb not null default '[]'::jsonb;
