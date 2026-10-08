-- Tema baru tidak lagi memerlukan migration: kolom theme menjadi text.
alter table invitations alter column theme drop default;
alter table invitations alter column theme type text using theme::text;
alter table invitations alter column theme set default 'classic';
drop type if exists theme_id;
