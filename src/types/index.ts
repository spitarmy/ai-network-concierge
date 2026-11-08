// AI人脈コンシェルジュ — 全ドメイン型定義（正本準拠）

export type TenantId = string;
export type PersonId = string;
export type MeetingId = string;

export interface Tenant {
  id: TenantId;
  name: string;
  plan_tier: 'standard' | 'premium';
  monthly_budget_jpy: number;
  current_spend_jpy: number;
  is_budget_throttled: boolean;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  tenant_id: TenantId;
  role: 'owner' | 'admin' | 'member';
}

export type PersonStatus = 'active' | 'provisional' | 'archived' | 'deleted';
export type CategoryTag = string;

export interface Person {
  id: PersonId;
  tenant_id: TenantId;
  display_name: string;
  phonetic_name: string;
  status: PersonStatus;
  category_tags: CategoryTag[];
  avatar_url?: string;
  primary_phone?: string;
  primary_email?: string;
  office_address?: string;
  service_areas: string[];
  meeting_count: number;
  last_interacted_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  tenant_id: TenantId;
  name: string;
  corporate_number?: string;
  website_url?: string;
  headquarters_address?: string;
  summary?: string;
}

export interface OrganizationMembership {
  id: string;
  tenant_id: TenantId;
  person_id: PersonId;
  organization_id: string;
  organization_name: string;
  title: string;
  department?: string;
  is_current: boolean;
  started_on?: string;
  ended_on?: string;
}

export interface BusinessOffering {
  id: string;
  tenant_id: TenantId;
  person_id: PersonId;
  organization_id?: string;
  service_title: string;
  target_clients: string;
  specialties: string;
  service_area: string;
  is_active: boolean;
}

export interface BNIRegion {
  id: string;
  prefecture: string;
  region_code: string;
  region_name: string;
}

export interface BNIChapter {
  id: string;
  region_id: string;
  chapter_name: string;
  meeting_day: string;
  meeting_time: string;
  is_verified: boolean;
}

export type BNIMembershipStatus = 'active' | 'transferred' | 'alumni' | 'visitor';

export interface BNIMembership {
  id: string;
  tenant_id: TenantId;
  person_id: PersonId;
  chapter_id: string;
  chapter_name: string;
  region_name: string;
  category: string;
  role_history?: string;
  status: BNIMembershipStatus;
  joined_on: string;
  left_on?: string;
  transfer_reason?: string;
}

export type MeetingType = '1to1' | 'business_meeting' | 'internal_meeting' | 'networking' | 'other';
export type MeetingProvider = 'zoom' | 'google_meet' | 'in_person' | 'phone' | 'other';
export type ConsentStatus = 'pending' | 'granted' | 'rejected' | 'revoked';
export type ConsentMethod = 'in_person_verbal' | 'form_signed' | 'zoom_audio_prompt' | 'bot_chat_acknowledged' | 'manual_override';

export interface Meeting {
  id: MeetingId;
  tenant_id: TenantId;
  title: string;
  meeting_type: MeetingType;
  provider: MeetingProvider;
  meeting_url?: string;
  meeting_code?: string;
  scheduled_start_at: string;
  scheduled_end_at?: string;
  raw_invite_text?: string;
  host_type: 'self' | 'external' | 'unknown';
  recording_status: 'not_applicable' | 'awaiting_consent' | 'consent_obtained' | 'recording' | 'completed' | 'failed' | 'refused';
  participant_ids: PersonId[];
  created_at: string;
}

export interface ConsentRecord {
  id: string;
  tenant_id: TenantId;
  meeting_id: MeetingId;
  person_id?: PersonId;
  person_name: string;
  status: ConsentStatus;
  consent_method: ConsentMethod;
  evidence_text?: string;
  recorded_at: string;
  revoked_at?: string;
}

export interface MeetingRecording {
  id: string;
  tenant_id: TenantId;
  meeting_id: MeetingId;
  storage_path: string;
  duration_seconds: number;
  file_size_bytes: number;
  expires_at: string;
  is_pinned_permanently: boolean;
  is_deleted: boolean;
}

export interface SpeakerUtterance {
  id: string;
  speaker_label: string; // e.g. "話者A", "話者B"
  resolved_person_id?: PersonId;
  resolved_person_name?: string;
  start_seconds: number;
  end_seconds: number;
  text: string;
  confidence: number;
}

export interface MeetingTranscript {
  id: string;
  tenant_id: TenantId;
  meeting_id: MeetingId;
  language: string;
  full_text: string;
  summary: string;
  utterances: SpeakerUtterance[];
  created_at: string;
}

export type FactCategory = 'topic' | 'promise' | 'request' | 'background' | 'preference' | 'conflict';
export type FactSourceType = 'meeting_speech' | 'card_ocr' | 'web_research' | 'manual_edit';
export type FactVerificationStatus = 'verified' | 'reported' | 'inferred' | 'needs_review' | 'disputed' | 'obsolete';
export type FactVisibility = 'private' | 'referral_eligible' | 'public';

export interface Fact {
  id: string;
  tenant_id: TenantId;
  person_id: PersonId;
  fact_category: FactCategory;
  fact_key: string;
  fact_value: string;
  source_type: FactSourceType;
  source_id?: string;
  source_evidence?: string;
  confidence: number;
  verification_status: FactVerificationStatus;
  visibility: FactVisibility;
  valid_from: string;
  valid_until?: string;
  created_at: string;
}

export interface CardScan {
  id: string;
  tenant_id: TenantId;
  matched_person_id?: PersonId;
  image_url: string;
  back_image_url?: string;
  raw_extracted: {
    person_name?: string;
    phonetic_name?: string;
    company_name?: string;
    department?: string;
    title?: string;
    phone_numbers: string[];
    email?: string;
    postal_code?: string;
    address?: string;
    website_url?: string;
  };
  ambiguous_fields: {
    field_name: string;
    raw_detected_text: string;
    confidence: number;
    reason: string;
  }[];
  status: 'processing' | 'completed' | 'needs_review';
  created_at: string;
}

export type ReviewQueueType = 'speaker_identification' | 'card_ocr_ambiguous' | 'person_deduplication' | 'conflicting_facts' | 'unregistered_person';

export interface ReviewQueueItem {
  id: string;
  tenant_id: TenantId;
  queue_type: ReviewQueueType;
  target_id: string;
  title: string;
  description: string;
  candidate_payload: Record<string, any>;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
}

export interface PersonRelationship {
  id: string;
  tenant_id: TenantId;
  from_person_id: PersonId;
  to_person_id: PersonId;
  relationship_type: string;
  is_ai_inferred: boolean;
  confidence: number;
  evidence_text: string;
  source_meeting_id?: MeetingId;
}

export type ReferralStatus = 'suggested' | 'consent_pending' | 'sent' | 'declined' | 'in_progress' | 'completed';

export interface Referral {
  id: string;
  tenant_id: TenantId;
  referrer_person_id: PersonId;
  candidate_person_id: PersonId;
  target_person_id: PersonId;
  recommendation_reason: string;
  breakdown: {
    area_match: string;
    specialty_match: string;
    privacy_checked: boolean;
    track_record: string;
  };
  draft_message: string;
  status: ReferralStatus;
  sent_at?: string;
  outcome?: {
    type: 'meeting_held' | 'contract_won' | 'no_deal' | 'pending';
    amount_jpy?: number;
    notes?: string;
    confirmed_by_user: boolean;
  };
  created_at: string;
}

export interface AICostEntry {
  id: string;
  tenant_id: TenantId;
  service_category: 'bot_minutes' | 'audio_transcribe' | 'llm_tokens' | 'ocr_pages' | 'web_search' | 'storage_bytes';
  provider: string;
  units_consumed: number;
  cost_jpy: number;
  description: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id: TenantId;
  action: string;
  resource_type: string;
  resource_id: string;
  diff_payload?: Record<string, any>;
  created_at: string;
}

export interface OAuthIntegrationConfig {
  zoom: {
    client_id: string;
    client_secret: string;
    account_id?: string;
    webhook_secret_token?: string;
    is_connected: boolean;
    last_tested_at?: string;
  };
  google: {
    client_id: string;
    client_secret: string;
    is_connected: boolean;
    last_tested_at?: string;
  };
}
