create extension if not exists "pg_trgm";

create type user_role as enum (
  'owner','senior_manager','distribution_manager',
  'booking_agent','social_media_manager','podcast_producer','read_only'
);
create type release_status as enum ('draft','in_review','scheduled','live','archived');
create type heat_status as enum ('pending','building','warm','hot','critical','closed');
create type booking_status as enum ('enquiry','pending','confirmed','cancelled','completed');
create type contract_status as enum ('not_sent','sent','signed','cancelled');
create type invoice_status as enum ('draft','sent','viewed','paid','overdue','cancelled');
create type review_status as enum ('pending','approved','rejected');
create type contact_type as enum ('dj','producer','label','venue','promoter','press','artist','industry');
create type campaign_platform as enum ('soundcloud','apple_music','dropbox','wetransfer','beatport','instagram','twitter','tiktok','facebook','youtube');
create type campaign_status as enum ('draft','scheduled','sent','failed');
create type social_post_status as enum ('draft','scheduled','published','failed');
create type podcast_status as enum ('draft','scheduled','published','archived');
create type task_urgency as enum ('now','today','this_week','someday');
create type automation_trigger as enum (
  'promo_window_opens','no_download_48h','no_review_5d','heat_window_72h',
  'booking_confirmed','invoice_overdue_7d','invoice_overdue_14d',
  'release_goes_live','travel_unbooked_30d'
);

create table staff (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role user_role not null default 'read_only',
  avatar_url text,
  is_active boolean not null default true,
  last_login_at timestamptz,
  onboarded_at timestamptz,
  acceptable_use_signed_at timestamptz,
  acceptable_use_ip text,
  invited_by uuid references staff(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique,
  phone text,
  type contact_type not null default 'dj',
  organisation text,
  city text,
  country text,
  country_code char(2),
  bio text,
  instagram_handle text,
  soundcloud_url text,
  website text,
  is_on_promo_list boolean not null default false,
  is_trusted boolean not null default false,
  is_high_value boolean not null default false,
  is_sf_artist boolean not null default false,
  promo_tier integer default 1,
  total_downloads integer not null default 0,
  total_reviews integer not null default 0,
  avg_rating numeric(3,2),
  response_rate numeric(5,2),
  last_active_at timestamptz,
  notes text,
  slack_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table contact_tags (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  unique(contact_id, tag)
);

create table releases (
  id uuid primary key default gen_random_uuid(),
  catalogue_number text not null unique,
  title text not null,
  artist_name text not null,
  label text not null default 'Shine Frequency',
  status release_status not null default 'draft',
  release_date date,
  promo_window_start date,
  promo_window_end date,
  heat_status heat_status not null default 'pending',
  format text not null default 'EP',
  total_tracks integer not null default 0,
  total_size_mb numeric(10,2) not null default 0,
  genre text,
  bpm_range text,
  key_notes text,
  artwork_url text,
  dropbox_folder_url text,
  dropbox_folder_id text,
  soundcloud_playlist_url text,
  soundcloud_embed_code text,
  wetransfer_url text,
  apple_music_url text,
  beatport_url text,
  description text,
  internal_notes text,
  created_by uuid references staff(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tracks (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references releases(id) on delete cascade,
  position text not null,
  title text not null,
  duration_seconds integer,
  file_size_mb numeric(8,2),
  bpm integer,
  key text,
  isrc text,
  dropbox_file_url text,
  dropbox_file_id text,
  soundcloud_track_url text,
  soundcloud_track_id text,
  download_count integer not null default 0,
  play_count integer not null default 0,
  review_count integer not null default 0,
  avg_rating numeric(3,2),
  charted_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table promo_lists (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references releases(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  invited_at timestamptz not null default now(),
  downloaded_at timestamptz,
  reviewed_at timestamptz,
  download_count integer not null default 0,
  tracks_downloaded integer[] default '{}',
  access_token text unique default gen_random_uuid()::text,
  token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique(release_id, contact_id)
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references releases(id) on delete cascade,
  track_id uuid references tracks(id),
  contact_id uuid not null references contacts(id),
  promo_list_id uuid references promo_lists(id),
  status review_status not null default 'pending',
  rating integer check (rating >= 1 and rating <= 5),
  body text,
  charted boolean not null default false,
  chart_name text,
  approved_by uuid references staff(id),
  approved_at timestamptz,
  rejected_reason text,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table download_events (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references releases(id),
  track_id uuid references tracks(id),
  contact_id uuid not null references contacts(id),
  promo_list_id uuid references promo_lists(id),
  delivery_method text not null default 'dropbox',
  file_size_mb numeric(8,2),
  ip_address inet,
  user_agent text,
  downloaded_at timestamptz not null default now()
);

create table artists (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id),
  stage_name text not null unique,
  real_name text,
  email text,
  phone text,
  agent_notes text,
  standard_fee numeric(10,2),
  currency char(3) default 'GBP',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references artists(id),
  venue_name text not null,
  venue_city text not null,
  venue_country text not null default 'UK',
  event_date date not null,
  set_time text,
  set_length_minutes integer,
  fee numeric(10,2),
  currency char(3) not null default 'GBP',
  deposit_amount numeric(10,2),
  deposit_paid_at timestamptz,
  status booking_status not null default 'enquiry',
  contract_status contract_status not null default 'not_sent',
  contract_sent_at timestamptz,
  contract_signed_at timestamptz,
  contract_url text,
  rider_url text,
  rider_received_at timestamptz,
  travel_booked boolean not null default false,
  hotel_booked boolean not null default false,
  internal_notes text,
  contact_name text,
  contact_email text,
  managed_by uuid references staff(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  booking_id uuid references bookings(id),
  contact_id uuid references contacts(id),
  recipient_name text not null,
  recipient_email text,
  recipient_address text,
  line_items jsonb not null default '[]',
  subtotal numeric(10,2) not null default 0,
  tax_rate numeric(5,2) not null default 0,
  tax_amount numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  currency char(3) not null default 'GBP',
  status invoice_status not null default 'draft',
  issued_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  viewed_at timestamptz,
  view_count integer not null default 0,
  payment_reference text,
  notes text,
  pdf_url text,
  created_by uuid references staff(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references releases(id) on delete cascade,
  name text not null,
  platform campaign_platform not null,
  status campaign_status not null default 'draft',
  scheduled_at timestamptz,
  sent_at timestamptz,
  recipient_count integer,
  open_count integer,
  click_count integer,
  error_message text,
  payload jsonb,
  created_by uuid references staff(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table social_posts (
  id uuid primary key default gen_random_uuid(),
  release_id uuid references releases(id),
  platform campaign_platform not null,
  status social_post_status not null default 'draft',
  caption text not null,
  media_url text,
  hashtags text[],
  scheduled_at timestamptz,
  published_at timestamptz,
  platform_post_id text,
  like_count integer,
  comment_count integer,
  share_count integer,
  reach integer,
  error_message text,
  created_by uuid references staff(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table podcast_shows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  apple_music_id text,
  soundcloud_url text,
  spotify_url text,
  artwork_url text,
  is_active boolean not null default true,
  episode_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table podcast_episodes (
  id uuid primary key default gen_random_uuid(),
  show_id uuid not null references podcast_shows(id) on delete cascade,
  episode_number integer not null,
  title text not null,
  description text,
  guest_name text,
  duration_seconds integer,
  file_url text,
  file_size_mb numeric(8,2),
  status podcast_status not null default 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  apple_music_episode_id text,
  soundcloud_track_id text,
  spotify_episode_id text,
  play_count integer not null default 0,
  created_by uuid references staff(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id),
  staff_id uuid references staff(id),
  direction text not null check (direction in ('inbound','outbound')),
  channel text not null default 'portal',
  body text not null,
  is_read boolean not null default false,
  read_at timestamptz,
  slack_ts text,
  slack_channel text,
  attachments jsonb default '[]',
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  urgency task_urgency not null default 'today',
  due_at timestamptz,
  completed_at timestamptz,
  assigned_to uuid references staff(id),
  related_release_id uuid references releases(id),
  related_booking_id uuid references bookings(id),
  related_invoice_id uuid references invoices(id),
  related_contact_id uuid references contacts(id),
  auto_generated boolean not null default false,
  automation_trigger automation_trigger,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table automations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trigger automation_trigger not null,
  is_active boolean not null default true,
  message_template text,
  last_ran_at timestamptz,
  run_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references staff(id),
  actor_email text,
  action text not null,
  module text not null,
  record_id uuid,
  record_type text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  session_id text,
  created_at timestamptz not null default now()
);

create rule audit_log_no_update as on update to audit_log do instead nothing;
create rule audit_log_no_delete as on delete to audit_log do instead nothing;

create index idx_contacts_email on contacts(email);
create index idx_contacts_type on contacts(type);
create index idx_contacts_country on contacts(country_code);
create index idx_contacts_promo on contacts(is_on_promo_list);
create index idx_contacts_name_search on contacts using gin(full_name gin_trgm_ops);
create index idx_releases_status on releases(status);
create index idx_releases_catalogue on releases(catalogue_number);
create index idx_releases_heat on releases(heat_status);
create index idx_tracks_release on tracks(release_id);
create index idx_promo_lists_release on promo_lists(release_id);
create index idx_promo_lists_contact on promo_lists(contact_id);
create index idx_reviews_release on reviews(release_id);
create index idx_reviews_status on reviews(status);
create index idx_download_events_release on download_events(release_id);
create index idx_download_events_contact on download_events(contact_id);
create index idx_download_events_time on download_events(downloaded_at);
create index idx_bookings_date on bookings(event_date);
create index idx_bookings_status on bookings(status);
create index idx_invoices_status on invoices(status);
create index idx_invoices_due on invoices(due_at);
create index idx_audit_log_actor on audit_log(actor_id);
create index idx_audit_log_time on audit_log(created_at);
create index idx_audit_log_module on audit_log(module);
create index idx_messages_contact on messages(contact_id);
create index idx_tasks_assigned on tasks(assigned_to);
create index idx_tasks_urgency on tasks(urgency);
create index idx_social_posts_scheduled on social_posts(scheduled_at);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_staff_updated before update on staff for each row execute function update_updated_at();
create trigger trg_contacts_updated before update on contacts for each row execute function update_updated_at();
create trigger trg_releases_updated before update on releases for each row execute function update_updated_at();
create trigger trg_tracks_updated before update on tracks for each row execute function update_updated_at();
create trigger trg_reviews_updated before update on reviews for each row execute function update_updated_at();
create trigger trg_bookings_updated before update on bookings for each row execute function update_updated_at();
create trigger trg_invoices_updated before update on invoices for each row execute function update_updated_at();
create trigger trg_campaigns_updated before update on campaigns for each row execute function update_updated_at();
create trigger trg_social_posts_updated before update on social_posts for each row execute function update_updated_at();
create trigger trg_tasks_updated before update on tasks for each row execute function update_updated_at();
create trigger trg_automations_updated before update on automations for each row execute function update_updated_at();

alter table staff enable row level security;
alter table contacts enable row level security;
alter table releases enable row level security;
alter table tracks enable row level security;
alter table promo_lists enable row level security;
alter table reviews enable row level security;
alter table download_events enable row level security;
alter table artists enable row level security;
alter table bookings enable row level security;
alter table invoices enable row level security;
alter table campaigns enable row level security;
alter table social_posts enable row level security;
alter table podcast_shows enable row level security;
alter table podcast_episodes enable row level security;
alter table messages enable row level security;
alter table tasks enable row level security;
alter table automations enable row level security;
alter table audit_log enable row level security;

create policy "staff_read_own" on staff for select using (auth.uid() = auth_user_id);
create policy "staff_read_all" on staff for select using (
  exists (select 1 from staff s where s.auth_user_id = auth.uid() and s.role in ('owner','senior_manager'))
);
create policy "contacts_read" on contacts for select using (
  exists (select 1 from staff where auth_user_id = auth.uid() and is_active = true)
);
create policy "contacts_write" on contacts for all using (
  exists (select 1 from staff where auth_user_id = auth.uid() and role in ('owner','senior_manager','distribution_manager') and is_active = true)
);
create policy "releases_read" on releases for select using (
  exists (select 1 from staff where auth_user_id = auth.uid() and is_active = true)
);
create policy "releases_write" on releases for all using (
  exists (select 1 from staff where auth_user_id = auth.uid() and role in ('owner','senior_manager','distribution_manager') and is_active = true)
);
create policy "audit_log_read" on audit_log for select using (
  exists (select 1 from staff where auth_user_id = auth.uid() and role in ('owner','senior_manager','read_only'))
);

insert into automations (name, trigger, is_active, message_template) values
  ('Auto-send Dropbox links on promo window open','promo_window_opens',true,'Hey {first_name}, {release_title} is now available. Your private link: {dropbox_url}'),
  ('Chase non-downloaders at 48h','no_download_48h',true,'Hey {first_name} — {release_title} is waiting for you. Grab your copy: {dropbox_url}'),
  ('Chase non-reviewers at 5 days before close','no_review_5d',true,'Hey {first_name} — the promo window for {release_title} closes in 5 days. Would love your review.'),
  ('Heat warning to Sharon at 72h remaining','heat_window_72h',true,null),
  ('Send contract on booking confirmed','booking_confirmed',true,null),
  ('Invoice overdue reminder at 7 days','invoice_overdue_7d',true,'Reminder: Invoice {invoice_number} for £{amount} is now 7 days overdue.'),
  ('Invoice overdue reminder at 14 days','invoice_overdue_14d',true,'Final reminder: Invoice {invoice_number} for £{amount} is now 14 days overdue.'),
  ('Remind Sharon to schedule social posts','release_goes_live',true,null),
  ('Flag unbooked travel at 30 days','travel_unbooked_30d',true,null);

insert into podcast_shows (name, description) values
  ('Shine Frequency Radio','The flagship weekly mix series from Shine Frequency'),
  ('SF Late Night Series','Monthly deep cuts and extended sets from the Shine Frequency roster');
