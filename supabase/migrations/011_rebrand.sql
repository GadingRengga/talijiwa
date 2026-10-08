-- Rebrand WedInvitation -> Talijiwa for rows seeded before the rename.

update site_settings set value = 'Undangan Pernikahan Digital Elegan — Talijiwa'
where key = 'seo_title' and value like '%WedInvitation%';
