alter table invitation_settings add column if not exists guest_names text not null default '';
alter table invitation_settings add column if not exists share_template text not null default '';
