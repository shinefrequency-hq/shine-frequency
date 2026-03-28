export type UserRole =
  | 'owner'
  | 'senior_manager'
  | 'distribution_manager'
  | 'booking_agent'
  | 'social_media_manager'
  | 'podcast_producer'
  | 'read_only'

export type ReleaseStatus = 'draft' | 'in_review' | 'scheduled' | 'live' | 'archived'
export type HeatStatus = 'pending' | 'building' | 'warm' | 'hot' | 'critical' | 'closed'
export type BookingStatus = 'enquiry' | 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type ContractStatus = 'not_sent' | 'sent' | 'signed' | 'cancelled'
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled'
export type ReviewStatus = 'pending' | 'approved' | 'rejected'
export type ContactType = 'dj' | 'producer' | 'label' | 'venue' | 'promoter' | 'press' | 'artist' | 'industry'
export type CampaignPlatform = 'soundcloud' | 'apple_music' | 'dropbox' | 'wetransfer' | 'beatport' | 'instagram' | 'twitter' | 'tiktok' | 'facebook' | 'youtube'
export type CampaignStatus = 'draft' | 'scheduled' | 'sent' | 'failed'
export type SocialPostStatus = 'draft' | 'scheduled' | 'published' | 'failed'
export type PodcastStatus = 'draft' | 'scheduled' | 'published' | 'archived'
export type TaskUrgency = 'now' | 'today' | 'this_week' | 'someday'
export type AutomationTrigger =
  | 'promo_window_opens'
  | 'no_download_48h'
  | 'no_review_5d'
  | 'heat_window_72h'
  | 'booking_confirmed'
  | 'invoice_overdue_7d'
  | 'invoice_overdue_14d'
  | 'release_goes_live'
  | 'travel_unbooked_30d'

export interface Staff {
  id: string
  auth_user_id: string | null
  email: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  is_active: boolean
  last_login_at: string | null
  onboarded_at: string | null
  acceptable_use_signed_at: string | null
  acceptable_use_ip: string | null
  invited_by: string | null
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  type: ContactType
  organisation: string | null
  city: string | null
  country: string | null
  country_code: string | null
  bio: string | null
  instagram_handle: string | null
  soundcloud_url: string | null
  website: string | null
  is_on_promo_list: boolean
  is_trusted: boolean
  is_high_value: boolean
  is_sf_artist: boolean
  promo_tier: number | null
  total_downloads: number
  total_reviews: number
  avg_rating: number | null
  response_rate: number | null
  last_active_at: string | null
  notes: string | null
  slack_user_id: string | null
  created_at: string
  updated_at: string
}

export interface ContactTag {
  id: string
  contact_id: string
  tag: string
  created_at: string
}

export interface Release {
  id: string
  catalogue_number: string
  title: string
  artist_name: string
  label: string
  status: ReleaseStatus
  release_date: string | null
  promo_window_start: string | null
  promo_window_end: string | null
  heat_status: HeatStatus
  format: string
  total_tracks: number
  total_size_mb: number
  genre: string | null
  bpm_range: string | null
  key_notes: string | null
  artwork_url: string | null
  dropbox_folder_url: string | null
  dropbox_folder_id: string | null
  soundcloud_playlist_url: string | null
  soundcloud_embed_code: string | null
  wetransfer_url: string | null
  apple_music_url: string | null
  beatport_url: string | null
  description: string | null
  internal_notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Track {
  id: string
  release_id: string
  position: string
  title: string
  duration_seconds: number | null
  file_size_mb: number | null
  bpm: number | null
  key: string | null
  isrc: string | null
  dropbox_file_url: string | null
  dropbox_file_id: string | null
  soundcloud_track_url: string | null
  soundcloud_track_id: string | null
  download_count: number
  play_count: number
  review_count: number
  avg_rating: number | null
  charted_count: number
  created_at: string
  updated_at: string
}

export interface PromoList {
  id: string
  release_id: string
  contact_id: string
  invited_at: string
  downloaded_at: string | null
  reviewed_at: string | null
  download_count: number
  tracks_downloaded: number[]
  access_token: string | null
  token_expires_at: string | null
  created_at: string
}

export interface Review {
  id: string
  release_id: string
  track_id: string | null
  contact_id: string
  promo_list_id: string | null
  status: ReviewStatus
  rating: number | null
  body: string | null
  charted: boolean
  chart_name: string | null
  approved_by: string | null
  approved_at: string | null
  rejected_reason: string | null
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface DownloadEvent {
  id: string
  release_id: string
  track_id: string | null
  contact_id: string
  promo_list_id: string | null
  delivery_method: string
  file_size_mb: number | null
  ip_address: string | null
  user_agent: string | null
  downloaded_at: string
}

export interface Artist {
  id: string
  contact_id: string | null
  stage_name: string
  real_name: string | null
  email: string | null
  phone: string | null
  agent_notes: string | null
  standard_fee: number | null
  currency: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  artist_id: string
  venue_name: string
  venue_city: string
  venue_country: string
  event_date: string
  set_time: string | null
  set_length_minutes: number | null
  fee: number | null
  currency: string
  deposit_amount: number | null
  deposit_paid_at: string | null
  status: BookingStatus
  contract_status: ContractStatus
  contract_sent_at: string | null
  contract_signed_at: string | null
  contract_url: string | null
  rider_url: string | null
  rider_received_at: string | null
  travel_booked: boolean
  hotel_booked: boolean
  internal_notes: string | null
  contact_name: string | null
  contact_email: string | null
  managed_by: string | null
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  booking_id: string | null
  contact_id: string | null
  recipient_name: string
  recipient_email: string | null
  recipient_address: string | null
  line_items: LineItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  currency: string
  status: InvoiceStatus
  issued_at: string | null
  due_at: string | null
  paid_at: string | null
  viewed_at: string | null
  view_count: number
  payment_reference: string | null
  notes: string | null
  pdf_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface LineItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface Campaign {
  id: string
  release_id: string
  name: string
  platform: CampaignPlatform
  status: CampaignStatus
  scheduled_at: string | null
  sent_at: string | null
  recipient_count: number | null
  open_count: number | null
  click_count: number | null
  error_message: string | null
  payload: Record<string, unknown> | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface SocialPost {
  id: string
  release_id: string | null
  platform: CampaignPlatform
  status: SocialPostStatus
  caption: string
  media_url: string | null
  hashtags: string[] | null
  scheduled_at: string | null
  published_at: string | null
  platform_post_id: string | null
  like_count: number | null
  comment_count: number | null
  share_count: number | null
  reach: number | null
  error_message: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface PodcastShow {
  id: string
  name: string
  description: string | null
  apple_music_id: string | null
  soundcloud_url: string | null
  spotify_url: string | null
  artwork_url: string | null
  is_active: boolean
  episode_count: number
  created_at: string
  updated_at: string
}

export interface PodcastEpisode {
  id: string
  show_id: string
  episode_number: number
  title: string
  description: string | null
  guest_name: string | null
  duration_seconds: number | null
  file_url: string | null
  file_size_mb: number | null
  status: PodcastStatus
  scheduled_at: string | null
  published_at: string | null
  apple_music_episode_id: string | null
  soundcloud_track_id: string | null
  spotify_episode_id: string | null
  play_count: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  contact_id: string | null
  staff_id: string | null
  direction: 'inbound' | 'outbound'
  channel: string
  body: string
  is_read: boolean
  read_at: string | null
  slack_ts: string | null
  slack_channel: string | null
  attachments: unknown[]
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  urgency: TaskUrgency
  due_at: string | null
  completed_at: string | null
  assigned_to: string | null
  related_release_id: string | null
  related_booking_id: string | null
  related_invoice_id: string | null
  related_contact_id: string | null
  auto_generated: boolean
  automation_trigger: AutomationTrigger | null
  created_at: string
  updated_at: string
}

export interface Automation {
  id: string
  name: string
  trigger: AutomationTrigger
  is_active: boolean
  message_template: string | null
  last_ran_at: string | null
  run_count: number
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  actor_id: string | null
  actor_email: string | null
  action: string
  module: string
  record_id: string | null
  record_type: string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  session_id: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      staff: { Row: Staff; Insert: Partial<Staff>; Update: Partial<Staff> }
      contacts: { Row: Contact; Insert: Partial<Contact>; Update: Partial<Contact> }
      contact_tags: { Row: ContactTag; Insert: Partial<ContactTag>; Update: Partial<ContactTag> }
      releases: { Row: Release; Insert: Partial<Release>; Update: Partial<Release> }
      tracks: { Row: Track; Insert: Partial<Track>; Update: Partial<Track> }
      promo_lists: { Row: PromoList; Insert: Partial<PromoList>; Update: Partial<PromoList> }
      reviews: { Row: Review; Insert: Partial<Review>; Update: Partial<Review> }
      download_events: { Row: DownloadEvent; Insert: Partial<DownloadEvent>; Update: Partial<DownloadEvent> }
      artists: { Row: Artist; Insert: Partial<Artist>; Update: Partial<Artist> }
      bookings: { Row: Booking; Insert: Partial<Booking>; Update: Partial<Booking> }
      invoices: { Row: Invoice; Insert: Partial<Invoice>; Update: Partial<Invoice> }
      campaigns: { Row: Campaign; Insert: Partial<Campaign>; Update: Partial<Campaign> }
      social_posts: { Row: SocialPost; Insert: Partial<SocialPost>; Update: Partial<SocialPost> }
      podcast_shows: { Row: PodcastShow; Insert: Partial<PodcastShow>; Update: Partial<PodcastShow> }
      podcast_episodes: { Row: PodcastEpisode; Insert: Partial<PodcastEpisode>; Update: Partial<PodcastEpisode> }
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> }
      tasks: { Row: Task; Insert: Partial<Task>; Update: Partial<Task> }
      automations: { Row: Automation; Insert: Partial<Automation>; Update: Partial<Automation> }
      audit_log: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> }
    }
  }
}
