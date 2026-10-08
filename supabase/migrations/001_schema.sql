-- Talijiwa: schema, indexes, triggers. Run in order: 001 -> 002 -> 003.
create extension if not exists pgcrypto;

create type invitation_status as enum ('draft', 'published', 'archived');
create type theme_id as enum ('classic', 'minimal', 'floral', 'luxury');
create type attendance as enum ('attending', 'not_attending');
create type gift_type as enum ('bank_transfer', 'cash', 'e_wallet', 'other');
create type couple_role as enum ('bride', 'groom');
create type gift_account_kind as enum ('bank', 'e_wallet');

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- Admin accounts. Rows are inserted MANUALLY (see docs/DATABASE.md); never from a signup trigger.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'admin' check (role = 'admin'),
  created_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  phone text not null default '',
  email text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table invitations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers (id) on delete restrict,
  title text not null default '' check (char_length(title) <= 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  status invitation_status not null default 'draft',
  theme theme_id not null default 'classic',
  greeting text not null default '',
  opening_text text not null default '',
  closing_text text not null default '',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table invitation_couples (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references invitations (id) on delete cascade,
  role couple_role not null,
  name text not null default '',
  nickname text not null default '',
  father text not null default '',
  mother text not null default '',
  photo_path text not null default '',
  instagram text not null default '',
  unique (invitation_id, role)
);

create table invitation_events (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references invitations (id) on delete cascade,
  position int not null default 0,
  name text not null default '',
  event_date date,
  start_time time,
  end_time time,
  venue text not null default '',
  address text not null default '',
  maps_url text not null default ''
);

create table invitation_stories (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references invitations (id) on delete cascade,
  title text not null default '',
  story_date date,
  description text not null default '',
  image_path text not null default ''
);

create table invitation_gallery (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references invitations (id) on delete cascade,
  position int not null default 0,
  image_path text not null,
  caption text not null default '',
  is_cover boolean not null default false
);
-- At most one cover per invitation.
create unique index invitation_gallery_one_cover on invitation_gallery (invitation_id) where is_cover;

create table gift_accounts (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references invitations (id) on delete cascade,
  kind gift_account_kind not null,
  provider text not null default '',
  account_number text not null default '',
  account_holder text not null default ''
);

create table invitation_settings (
  invitation_id uuid primary key references invitations (id) on delete cascade,
  sections jsonb not null default '{}'::jsonb,
  rsvp_deadline date,
  music_enabled boolean not null default false,
  music_url text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  seo_noindex boolean not null default false,
  show_in_portfolio boolean not null default false
);

create table rsvps (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references invitations (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  whatsapp text not null check (whatsapp ~ '^[0-9]{10,15}$'),
  guest_count int not null default 1 check (guest_count between 1 and 20),
  attendance attendance not null,
  message text not null default '' check (char_length(message) <= 500),
  created_at timestamptz not null default now()
);

create table guest_messages (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references invitations (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  message text not null check (char_length(message) between 3 and 500),
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table gift_confirmations (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references invitations (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  gift_type gift_type not null,
  amount numeric(14, 0) check (amount is null or amount >= 0),
  message text not null default '' check (char_length(message) <= 500),
  created_at timestamptz not null default now()
);

-- No raw IP addresses. visitor_hash is a random per-browser id.
create table invitation_views (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references invitations (id) on delete cascade,
  visitor_hash text not null check (char_length(visitor_hash) <= 64),
  user_agent text not null default '' check (char_length(user_agent) <= 300),
  referrer text not null default '' check (char_length(referrer) <= 300),
  created_at timestamptz not null default now()
);

-- Indexes (invitations.slug is already unique-indexed)
create index invitations_customer_id_idx on invitations (customer_id);
create index invitations_status_idx on invitations (status);
create index invitation_events_invitation_id_idx on invitation_events (invitation_id);
create index invitation_stories_invitation_id_idx on invitation_stories (invitation_id);
create index invitation_gallery_invitation_id_idx on invitation_gallery (invitation_id);
create index gift_accounts_invitation_id_idx on gift_accounts (invitation_id);
create index rsvps_invitation_id_idx on rsvps (invitation_id);
create index guest_messages_invitation_id_idx on guest_messages (invitation_id);
create index gift_confirmations_invitation_id_idx on gift_confirmations (invitation_id);
create index invitation_views_invitation_id_idx on invitation_views (invitation_id, created_at);

create trigger customers_updated_at before update on customers for each row execute function set_updated_at();
create trigger invitations_updated_at before update on invitations for each row execute function set_updated_at();
