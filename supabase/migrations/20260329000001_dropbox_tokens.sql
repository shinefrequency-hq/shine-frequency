-- Add Dropbox token storage to staff table
alter table staff add column if not exists dropbox_access_token text;
alter table staff add column if not exists dropbox_refresh_token text;
