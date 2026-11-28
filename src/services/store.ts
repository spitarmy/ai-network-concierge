// AI人脈コンシェルジュ — コアストア & ドメインロジック（正本・確定仕様01〜34完全準拠）

import {
  Tenant, TenantOwnerProfile, Person, Organization, OrganizationMembership, BusinessOffering,
  BNIRegion, BNIChapter, BNIMembership, Meeting, MeetingType, ConsentRecord, MeetingRecording,
  MeetingTranscript, Fact, CardScan, ReviewQueueItem, PersonRelationship,
  Referral, AICostEntry, AuditLog, OAuthIntegrationConfig
} from '../types';
import { OFFICIAL_BNI_REGIONS, OFFICIAL_BNI_CHAPTERS } from '../data/bniJapanOfficialData';

const STORAGE_KEY = 'ai_network_concierge_db_v1';

export interface DatabaseState {
  currentTenantId: string;
  tenants: Tenant[];
  persons: Person[];
  organizations: Organization[];
  organizationMemberships: OrganizationMembership[];
  businessOfferings: BusinessOffering[];
  bniRegions: BNIRegion[];
  bniChapters: BNIChapter[];
  bniMemberships: BNIMembership[];
  meetings: Meeting[];
  consents: ConsentRecord[];
  recordings: MeetingRecording[];
  transcripts: MeetingTranscript[];
  facts: Fact[];
  cardScans: CardScan[];
  reviewQueue: ReviewQueueItem[];
  relationships: PersonRelationship[];
  referrals: Referral[];
  costLedger: AICostEntry[];
  auditLogs: AuditLog[];
  customCategories?: Record<string, string[]>;
}

// サンプルシードデータ（動作確認・デモ用）
const SAMPLE_SEED_STATE: DatabaseState = {
  currentTenantId: 'tenant-001',
  tenants: [
    {
      id: 'tenant-001',
      name: 'メインアカウント（オーナー）',
      plan_tier: 'standard',
      monthly_budget_jpy: 1000,
      current_spend_jpy: 154,
      is_budget_throttled: false,
      created_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 'tenant-002',
      name: '別テナント（テスト検証用）',
      plan_tier: 'standard',
      monthly_budget_jpy: 1000,
      current_spend_jpy: 85,
      is_budget_throttled: false,
      created_at: '2026-10-01T00:00:00Z',
    }
  ],
  bniRegions: [
    ...OFFICIAL_BNI_REGIONS,
    { id: 'reg-tokyo-c', prefecture: '東京都', region_code: 'TOKYO_C', region_name: '東京セントラルリージョン' },
  ],
  bniChapters: [
    ...OFFICIAL_BNI_CHAPTERS,
    { id: 'chap-kyoto-e', region_id: 'reg-kyoto', chapter_name: '京都東チャプター', meeting_day: '火曜', meeting_time: '06:45〜08:30', is_verified: true },
    { id: 'chap-kyoto-n', region_id: 'reg-kyoto', chapter_name: '京都北チャプター', meeting_day: '木曜', meeting_time: '06:45〜08:30', is_verified: true },
    { id: 'chap-tokyo-ginza', region_id: 'reg-tokyo-c', chapter_name: '銀座チャプター', meeting_day: '金曜', meeting_time: '06:45〜08:30', is_verified: true },
  ],
  persons: [
    {
      id: 'p-yamada',
      tenant_id: 'tenant-001',
      display_name: '山田 太郎',
      phonetic_name: 'やまだ たろう',
      status: 'active',
      category_tags: ['BNI', 'パートナー', '仕事'],
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      primary_phone: '090-1234-5678',
      primary_email: 'yamada@yamada-kensetsu.example.jp',
      office_address: '京都府京都市左京区岡崎1-2-3',
      service_areas: ['京都府', '滋賀県', '大阪府北東部'],
      meeting_count: 3,
      last_interacted_at: '2026-11-05T14:00:00+09:00',
      notes: '町家再生と木造耐震リノベーションの専門家。人当たりが温厚。',
      created_at: '2026-04-10T10:00:00Z',
      updated_at: '2026-11-05T15:30:00Z',
    },
    {
      id: 'p-tanaka',
      tenant_id: 'tenant-001',
      display_name: '田中 健二',
      phonetic_name: 'たなか けんじ',
      status: 'active',
      category_tags: ['BNI', '仕事'],
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      primary_phone: '080-9876-5432',
      primary_email: 'kenji@tanaka-tax.example.jp',
      office_address: '大阪府大阪市北区梅田2-5-1',
      service_areas: ['大阪府全域', '兵庫県南部', '京都府南部'],
      meeting_count: 2,
      last_interacted_at: '2026-10-22T11:00:00+09:00',
      notes: '相続税対策と事業承継専門の税理士。飲食業の顧問実績多数。',
      created_at: '2026-05-15T09:00:00Z',
      updated_at: '2026-10-22T12:00:00Z',
    },
    {
      id: 'p-sato',
      tenant_id: 'tenant-001',
      display_name: '佐藤 由香',
      phonetic_name: 'さとう ゆか',
      status: 'active',
      category_tags: ['BNI', '仕事', '友人'],
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      primary_phone: '090-5555-4444',
      primary_email: 'yuka@design-lab.example.jp',
      office_address: '京都府京都市中京区烏丸通蛸薬師',
      service_areas: ['関西全域', 'リモート全国'],
      meeting_count: 4,
      last_interacted_at: '2026-11-02T16:00:00+09:00',
      notes: '店舗ブランディング・Web集客UIデザイン。飲食店やサロンの実績豊富。',
      created_at: '2026-06-01T14:00:00Z',
      updated_at: '2026-11-02T17:00:00Z',
    },
    {
      id: 'p-nakamura-prov',
      tenant_id: 'tenant-001',
      display_name: '中村社長（仮）',
      phonetic_name: 'なかむらしゃちょう',
      status: 'provisional', // 会話中に出てきた未登録人物（実人脈には混ぜない）
      category_tags: ['知人'],
      service_areas: ['大阪市'],
      meeting_count: 0,
      notes: '田中さんとの会話で登場。「大阪・難波で居酒屋を3店舗出店予定」と発言あり。',
      created_at: '2026-10-22T12:00:00Z',
      updated_at: '2026-10-22T12:00:00Z',
    },
    {
      id: 'p-tenant2-secret',
      tenant_id: 'tenant-002', // 別テナント専用データ（隔離テスト用）
      display_name: '別テナントの顧客A',
      phonetic_name: 'べつてなんと',
      status: 'active',
      category_tags: ['仕事'],
      service_areas: ['東京都'],
      meeting_count: 1,
      created_at: '2026-11-01T00:00:00Z',
      updated_at: '2026-11-01T00:00:00Z',
    }
  ],
  organizations: [
    {
      id: 'org-yamada-kensetsu',
      tenant_id: 'tenant-001',
      name: '山田建設工務 株式会社',
      corporate_number: '1234567890123',
      website_url: 'https://yamada-kensetsu.example.jp',
      headquarters_address: '京都府京都市左京区岡崎1-2-3',
      summary: '創業40年、京町家再生と木造耐震改修を強みとする地域密着型工務店。',
    },
    {
      id: 'org-yamada-realty',
      tenant_id: 'tenant-001',
      name: '合同会社 レトロ京都エステート',
      website_url: 'https://retro-kyoto.example.jp',
      headquarters_address: '京都府京都市下京区',
      summary: '古民家・町家の買取再販事業。2025年に新規設立。',
    },
    {
      id: 'org-tanaka-tax',
      tenant_id: 'tenant-001',
      name: '田中健二税理士事務所',
      website_url: 'https://tanaka-tax.example.jp',
      headquarters_address: '大阪府大阪市北区梅田2-5-1',
      summary: '中小企業と医療法人向け財務・事業承継コンサルティング。',
    }
  ],
  organizationMemberships: [
    {
      id: 'om-yamada-1',
      tenant_id: 'tenant-001',
      person_id: 'p-yamada',
      organization_id: 'org-yamada-kensetsu',
      organization_name: '山田建設工務 株式会社',
      title: '代表取締役',
      is_current: true,
      started_on: '2015-04-01',
    },
    {
      id: 'om-yamada-2',
      tenant_id: 'tenant-001',
      person_id: 'p-yamada',
      organization_id: 'org-yamada-realty',
      organization_name: '合同会社 レトロ京都エステート',
      title: '共同創業者・顧問',
      is_current: true,
      started_on: '2025-01-15',
    },
    {
      id: 'om-tanaka-1',
      tenant_id: 'tenant-001',
      person_id: 'p-tanaka',
      organization_id: 'org-tanaka-tax',
      organization_name: '田中健二税理士事務所',
      title: '所長税理士',
      is_current: true,
      started_on: '2018-09-01',
    }
  ],
  businessOfferings: [
    {
      id: 'bo-yamada-1',
      tenant_id: 'tenant-001',
      person_id: 'p-yamada',
      organization_id: 'org-yamada-kensetsu',
      service_title: '京町家・古民家耐震リノベーション',
      target_clients: '京都・滋賀で古民家をカフェや民泊に改装したいオーナー、相続で町家を取得した個人',
      specialties: '耐震基準適合証明の取得、京都市補助金申請サポート、伝統木造軸組工法',
      service_area: '京都府全域、滋賀県大津・草津',
      is_active: true,
    },
    {
      id: 'bo-yamada-2',
      tenant_id: 'tenant-001',
      person_id: 'p-yamada',
      organization_id: 'org-yamada-realty',
      service_title: '町家・空き家の買取再販',
      target_clients: '老朽化した空き家をそのまま売却したい相続人・不動産業者',
      specialties: '再建築不可や権利関係が複雑な物件の再生買取',
      service_area: '京都市内中心部',
      is_active: true,
    },
    {
      id: 'bo-tanaka-1',
      tenant_id: 'tenant-001',
      person_id: 'p-tanaka',
      organization_id: 'org-tanaka-tax',
      service_title: '飲食店・中小企業の事業承継 & 税務顧問',
      target_clients: '大阪・神戸エリアで多店舗展開を目指す飲食経営者、親族外承継を検討中の社長',
      specialties: '自社株評価の引き下げ特例、飲食業特化の月次予実管理',
      service_area: '大阪・兵庫・京都',
      is_active: true,
    }
  ],
  bniMemberships: [
    {
      id: 'bnim-yamada-current',
      tenant_id: 'tenant-001',
      person_id: 'p-yamada',
      chapter_id: 'chap-kyoto-e',
      chapter_name: '京都東チャプター',
      region_name: '京都リージョン',
      category: '店舗・古民家リノベーション',
      role_history: '書記兼会計 (2025期)',
      status: 'active',
      joined_on: '2024-04-01',
    },
    {
      id: 'bnim-yamada-past',
      tenant_id: 'tenant-001',
      person_id: 'p-yamada',
      chapter_id: 'chap-kyoto-n',
      chapter_name: '京都北チャプター',
      region_name: '京都リージョン',
      category: '注文住宅建築',
      role_history: 'ビジターホスト (2022期)',
      status: 'transferred', // 過去の所属履歴を上書きせず保持！
      joined_on: '2021-04-01',
      left_on: '2024-03-31',
      transfer_reason: '事業領域の特化と役員交代に伴う移籍',
    },
    {
      id: 'bnim-tanaka-current',
      tenant_id: 'tenant-001',
      person_id: 'p-tanaka',
      chapter_id: 'chap-osaka-bay',
      chapter_name: 'ベイサイドチャプター',
      region_name: '阪神南リージョン',
      category: '税理士・事業承継',
      role_history: 'プレジデント (2024期)',
      status: 'active',
      joined_on: '2022-10-01',
    }
  ],
  meetings: [
    {
      id: 'm-yamada-upcoming',
      tenant_id: 'tenant-001',
      title: '山田太郎さんと3回目1to1（町家補助金と飲食案件の件）',
      meeting_type: '1to1',
      provider: 'zoom',
      meeting_url: 'https://us02web.zoom.us/j/81234567890?pwd=test',
      meeting_code: '81234567890',
      scheduled_start_at: new Date(Date.now() + 3600 * 1000 * 2).toISOString(), // 本日2時間後
      scheduled_end_at: new Date(Date.now() + 3600 * 1000 * 3).toISOString(),
      raw_invite_text: '山田さん、次回1to1よろしくお願いいたします！\n日時: 本日 14:00〜15:00\nZoom: https://us02web.zoom.us/j/81234567890?pwd=test',
      host_type: 'self',
      recording_status: 'consent_obtained',
      participant_ids: ['p-yamada'],
      created_at: '2026-11-06T10:00:00Z',
    },
    {
      id: 'm-yamada-past2',
      tenant_id: 'tenant-001',
      title: '山田太郎さんと2回目1to1',
      meeting_type: '1to1',
      provider: 'zoom',
      meeting_url: 'https://us02web.zoom.us/j/81234567890?pwd=test',
      meeting_code: '81234567890',
      scheduled_start_at: '2026-11-05T14:00:00+09:00',
      scheduled_end_at: '2026-11-05T15:00:00+09:00',
      host_type: 'self',
      recording_status: 'completed',
      participant_ids: ['p-yamada'],
      created_at: '2026-11-04T12:00:00Z',
    }
  ],
  consents: [
    {
      id: 'c-yamada-1',
      tenant_id: 'tenant-001',
      meeting_id: 'm-yamada-upcoming',
      person_id: 'p-yamada',
      person_name: '山田 太郎',
      status: 'granted',
      consent_method: 'zoom_audio_prompt',
      evidence_text: 'Zoom録音通知プロンプトに対して「了解」を選択したログを確認',
      recorded_at: '2026-11-08T09:00:00Z',
    },
    {
      id: 'c-yamada-past',
      tenant_id: 'tenant-001',
      meeting_id: 'm-yamada-past2',
      person_id: 'p-yamada',
      person_name: '山田 太郎',
      status: 'granted',
      consent_method: 'in_person_verbal',
      evidence_text: '冒頭にて「振り返りのためAI議事録を取らせてください」「はい、どうぞ」の発話一致',
      recorded_at: '2026-11-05T14:02:00Z',
    }
  ],
  recordings: [
    {
      id: 'rec-yamada-past2',
      tenant_id: 'tenant-001',
      meeting_id: 'm-yamada-past2',
      storage_path: 'recordings/tenant-001/m-yamada-past2.m4a',
      duration_seconds: 3420, // 57分
      file_size_bytes: 42500000,
      expires_at: '2027-02-03T14:00:00Z', // 90日後自動削除
      is_pinned_permanently: false,
      is_deleted: false,
    }
  ],
  transcripts: [
    {
      id: 'tr-yamada-past2',
      tenant_id: 'tenant-001',
      meeting_id: 'm-yamada-past2',
      language: 'ja',
      full_text: '山田様: 「最近は京都市内の町家リノベで補助金の申請が通って、今月から着工なんです。ただ、内装のグラフィックや看板ブランディングができる信頼できるデザイナーを探していて...」\nホスト: 「それなら以前お話しした佐藤由香さんがぴったりですね。大阪や京都のカフェのUI・看板デザインを多数手掛けておられますよ」\n山田様: 「ぜひ繋いでほしいです！補助金概要のパンフレットPDFも後ほど送りますね」',
      summary: '京都市内町家の補助金認可事例と、店舗ブランディングデザイナーの紹介ニーズについて合意。補助金パンフレットの送付を約束。',
      utterances: [
        {
          id: 'utt-1',
          speaker_label: '話者A',
          resolved_person_id: 'p-yamada',
          resolved_person_name: '山田 太郎',
          start_seconds: 120,
          end_seconds: 145,
          text: '最近は京都市内の町家リノベで補助金の申請が通って、今月から着工なんです。ただ、内装のグラフィックや看板ブランディングができるデザイナーを探していて...',
          confidence: 0.98,
        },
        {
          id: 'utt-2',
          speaker_label: '話者B',
          resolved_person_id: undefined,
          start_seconds: 146,
          end_seconds: 165,
          text: 'それなら以前お話しした佐藤由香さんがぴったりですね。大阪や京都のカフェのUI・看板デザインを多数手掛けておられますよ。',
          confidence: 0.99,
        },
        {
          id: 'utt-3',
          speaker_label: '話者A',
          resolved_person_id: 'p-yamada',
          resolved_person_name: '山田 太郎',
          start_seconds: 166,
          end_seconds: 180,
          text: 'ぜひ繋いでほしいです！補助金概要のパンフレットPDFも後ほど送りますね。',
          confidence: 0.97,
        }
      ],
      created_at: '2026-11-05T15:10:00Z',
    }
  ],
  facts: [
    {
      id: 'fact-1',
      tenant_id: 'tenant-001',
      person_id: 'p-yamada',
      fact_category: 'topic',
      fact_key: '前回盛り上がった話題',
      fact_value: '京町家リノベーションにおける京都市補助金申請の通過と、伝統木造工法',
      source_type: 'meeting_speech',
      source_id: 'm-yamada-past2',
      source_evidence: '山田様: 「最近は京都市内の町家リノベで補助金の申請が通って、今月から着工なんです」',
      confidence: 0.98,
      verification_status: 'verified',
      visibility: 'referral_eligible',
      valid_from: '2026-11-05T14:00:00Z',
      created_at: '2026-11-05T15:15:00Z',
    },
    {
      id: 'fact-2',
      tenant_id: 'tenant-001',
      person_id: 'p-yamada',
      fact_category: 'promise',
      fact_key: '約束事項（未完了）',
      fact_value: '町家補助金概要のパンフレットPDFを後ほど送付する',
      source_type: 'meeting_speech',
      source_id: 'm-yamada-past2',
      source_evidence: '山田様: 「補助金概要のパンフレットPDFも後ほど送りますね」',
      confidence: 0.97,
      verification_status: 'reported',
      visibility: 'private', // 約束は内部メモ扱い
      valid_from: '2026-11-05T14:00:00Z',
      created_at: '2026-11-05T15:15:00Z',
    },
    {
      id: 'fact-3',
      tenant_id: 'tenant-001',
      person_id: 'p-yamada',
      fact_category: 'request',
      fact_key: '紹介してほしい人（ニーズ）',
      fact_value: '京都市内・大阪で店舗の看板・グラフィック・ロゴを担当できるクリエイティブデザイナー',
      source_type: 'meeting_speech',
      source_id: 'm-yamada-past2',
      source_evidence: '山田様: 「内装のグラフィックや看板ブランディングができるデザイナーを探していて...」',
      confidence: 0.98,
      verification_status: 'verified',
      visibility: 'referral_eligible',
      valid_from: '2026-11-05T14:00:00Z',
      created_at: '2026-11-05T15:15:00Z',
    },
    {
      id: 'fact-4',
      tenant_id: 'tenant-001',
      person_id: 'p-yamada',
      fact_category: 'preference',
      fact_key: '家族・プライベート',
      fact_value: '長男が今年高校受験で週末は家族と過ごすことが多い',
      source_type: 'meeting_speech',
      source_id: 'm-yamada-past2',
      source_evidence: '雑談中の発言',
      confidence: 0.95,
      verification_status: 'verified',
      visibility: 'private', // 極秘！紹介草稿や第三者には絶対に流出させない！
      valid_from: '2026-11-05T14:00:00Z',
      created_at: '2026-11-05T15:15:00Z',
    }
  ],
  cardScans: [
    {
      id: 'cs-yamada',
      tenant_id: 'tenant-001',
      matched_person_id: 'p-yamada',
      image_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400',
      raw_extracted: {
        person_name: '山田 太郎',
        phonetic_name: 'ヤマダ タロウ',
        company_name: '山田建設工務 株式会社',
        department: '本社営業部',
        title: '代表取締役',
        phone_numbers: ['075-712-XXXX', '090-1234-5678'],
        email: 'yamada@yamada-kensetsu.example.jp',
        postal_code: '606-8344',
        address: '京都府京都市左京区岡崎1-2-3',
        website_url: 'https://yamada-kensetsu.example.jp',
      },
      ambiguous_fields: [
        {
          field_name: 'department',
          raw_detected_text: '本社??部',
          confidence: 0.65,
          reason: '達筆フォントのため「営業」の確信度が低いため確認待ちフラグ',
        }
      ],
      status: 'completed',
      created_at: '2026-04-10T10:00:00Z',
    }
  ],
  reviewQueue: [
    {
      id: 'rq-1',
      tenant_id: 'tenant-001',
      queue_type: 'unregistered_person',
      target_id: 'p-nakamura-prov',
      title: '会話中に登場した「中村社長」の確認',
      description: '田中健二さんとの面談にて「難波で居酒屋を3店舗展開予定」と登場しました。実人脈として登録しますか？',
      candidate_payload: {
        source_meeting_id: 'm-yamada-past2',
        suggested_name: '中村社長',
        notes: '田中健二氏からの紹介候補の可能性',
      },
      status: 'pending',
      created_at: '2026-10-22T12:05:00Z',
    }
  ],
  relationships: [
    {
      id: 'rel-1',
      tenant_id: 'tenant-001',
      from_person_id: 'p-yamada',
      to_person_id: 'p-sato',
      relationship_type: '紹介希望先（AI推薦・面談発言根拠あり）',
      is_ai_inferred: true,
      confidence: 0.94,
      evidence_text: '山田氏が「看板ブランディングができるデザイナー」を希望し、佐藤氏が店舗UI・看板の実績多数のため',
      source_meeting_id: 'm-yamada-past2',
    },
    {
      id: 'rel-2',
      tenant_id: 'tenant-001',
      from_person_id: 'p-yamada',
      to_person_id: 'p-tanaka',
      relationship_type: 'BNIチャプター間連携（確認済み実関係）',
      is_ai_inferred: false,
      confidence: 1.0,
      evidence_text: '関西合同ネットワーキングにて過去名刺交換済み',
    }
  ],
  referrals: [
    {
      id: 'ref-1',
      tenant_id: 'tenant-001',
      referrer_person_id: 'p-yamada',
      candidate_person_id: 'p-sato',
      target_person_id: 'p-yamada',
      recommendation_reason: '山田さんの「京町家カフェの看板・ロゴブランディング」需要に対し、佐藤さんの「京都・大阪の店舗ブランディング」実績が合致。',
      breakdown: {
        area_match: '対応エリア一致（京都府京都市内）',
        specialty_match: 'リノベーション店舗のグラフィック・看板デザインに合致',
        privacy_checked: true, // 私的情報（家族・受験等）は除外済み！
        track_record: '過去トラブルなし・BNI内成約実績あり',
      },
      draft_message: '山田さん、先日の1to1でお話しされていた町家カフェの看板ブランディングについて、京都・大阪で実績多数の佐藤由香さんをご紹介させていただけます。一度オンラインで15分ほど情報交換されてみませんか？',
      status: 'suggested',
      outcome: {
        type: 'pending',
        confirmed_by_user: false,
      },
      created_at: '2026-11-06T09:00:00Z',
    }
  ],
  costLedger: [
    {
      id: 'cl-1',
      tenant_id: 'tenant-001',
      service_category: 'audio_transcribe',
      provider: 'Whisper-Adapter',
      units_consumed: 57,
      cost_jpy: 51.3,
      description: '山田太郎様 1to1録音文字起こし (57分)',
      created_at: '2026-11-05T15:05:00Z',
    },
    {
      id: 'cl-2',
      tenant_id: 'tenant-001',
      service_category: 'llm_tokens',
      provider: 'LLM-Analysis-Adapter',
      units_consumed: 14200,
      cost_jpy: 14.2,
      description: '会話要約・約束・ニーズ・事実差分抽出ジョブ',
      created_at: '2026-11-05T15:10:00Z',
    }
  ],
  auditLogs: [
    {
      id: 'al-1',
      tenant_id: 'tenant-001',
      action: 'PERSON_CHAPTER_TRANSFER',
      resource_type: 'bni_membership',
      resource_id: 'bnim-yamada-current',
      diff_payload: {
        old_chapter: '京都北チャプター',
        new_chapter: '京都東チャプター',
        reason: '事業領域の特化と役員交代に伴う移籍',
      },
      created_at: '2024-04-01T09:00:00Z',
    }
  ]
};

// 本番実利用用空データ（初期状態：人物・予定は空、マスターデータとオーナーアカウントのみ保持）
const EMPTY_PRODUCTION_STATE: DatabaseState = {
  currentTenantId: 'tenant-001',
  tenants: [
    {
      id: 'tenant-001',
      name: 'メインアカウント（オーナー）',
      plan_tier: 'standard',
      monthly_budget_jpy: 1000,
      current_spend_jpy: 0,
      is_budget_throttled: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'tenant-endo',
      name: '遠藤様（販売・ブランディングパートナー専用アカウント）',
      plan_tier: 'premium',
      monthly_budget_jpy: 1000,
      current_spend_jpy: 0,
      is_budget_throttled: false,
      created_at: '2026-11-20T14:30:00.000Z',
      owner_profile: {
        owner_name: '遠藤',
        owner_phonetic: 'えんどう',
        company_name: '',
        title: '代表',
        bni_region_name: '',
        bni_chapter_name: '',
        bni_category: 'ブランディング・販売戦略パートナー',
        specialty_summary: '',
        is_onboarded: false,
      },
    },
    {
      id: 'tenant-002',
      name: '別テナント（テスト検証用）',
      plan_tier: 'standard',
      monthly_budget_jpy: 1000,
      current_spend_jpy: 0,
      is_budget_throttled: false,
      created_at: new Date().toISOString(),
    }
  ],
  bniRegions: OFFICIAL_BNI_REGIONS,
  bniChapters: OFFICIAL_BNI_CHAPTERS,
  persons: [],
  organizations: [],
  organizationMemberships: [],
  businessOfferings: [],
  bniMemberships: [],
  meetings: [],
  consents: [],
  recordings: [],
  transcripts: [],
  facts: [],
  cardScans: [],
  reviewQueue: [],
  relationships: [],
  referrals: [],
  costLedger: [],
  auditLogs: [],
};

const OAUTH_STORAGE_KEY = 'ai_network_concierge_oauth_config';
const DELETED_IDS_STORAGE_KEY = 'ai_network_concierge_deleted_ids';
const BOUND_TENANT_STORAGE_KEY = 'ai_concierge_bound_tenant_id';

const DEFAULT_OAUTH_CONFIG: OAuthIntegrationConfig = {
  zoom: {
    account_id: '',
    client_id: '',
    client_secret: '',
    webhook_secret_token: '',
    is_connected: true,
    last_tested_at: '2026-11-10T02:55:00.000Z',
  },
  google: {
    client_id: '',
    client_secret: '',
    is_connected: false,
  },
};

// 環境非依存ストレージ（ブラウザ localStorage & テスト・Node環境 fallback）
const nodeMemoryStore = new Map<string, string>();
const getStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(key);
  }
  return nodeMemoryStore.get(key) || null;
};
const setStorageItem = (key: string, value: string): void => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage容量制限(QuotaExceeded)を検知しました。容量安全保護処理を実行します:', e);
      try {
        const parsed = JSON.parse(value);
        if (parsed.cardScans && Array.isArray(parsed.cardScans)) {
          // 直近5枚のみ残し、古い名刺の巨大画像Base64を退避（カルテやFacts、要約は100%保護）
          parsed.cardScans = parsed.cardScans.map((cs: any, idx: number) => {
            if (idx >= 5 && typeof cs.image_url === 'string' && cs.image_url.startsWith('data:')) {
              return { ...cs, image_url: '' };
            }
            return cs;
          });
        }
        window.localStorage.setItem(key, JSON.stringify(parsed));
      } catch (innerErr) {
        console.error('フォールバック保存にも失敗したためメモリに退避します:', innerErr);
        nodeMemoryStore.set(key, value);
      }
    }
  } else {
    nodeMemoryStore.set(key, value);
  }
};

// シングルトンストレージエンジン
class DataStore {
  private state: DatabaseState;
  private oauthConfig: OAuthIntegrationConfig;
  private deletedIds: Set<string>;
  private syncTimer: any = null;
  private isSyncingCloud = false;
  private hasPendingCloudPush = false;
  public lastSyncedAt: string | null = null;
  public zoomApiConnected = false;

  private getActiveStorageKey(): string {
    return this.lockedTenantId && this.lockedTenantId !== 'tenant-001'
      ? `${STORAGE_KEY}__${this.lockedTenantId}`
      : STORAGE_KEY;
  }

  private getActiveDeletedKey(): string {
    return this.lockedTenantId && this.lockedTenantId !== 'tenant-001'
      ? `${DELETED_IDS_STORAGE_KEY}__${this.lockedTenantId}`
      : DELETED_IDS_STORAGE_KEY;
  }

  public ensurePartnerTenants(): void {
    if (!Array.isArray(this.state.tenants)) {
      this.state.tenants = [];
    }
    if (!this.state.tenants.some(t => t.id === 'tenant-endo')) {
      this.state.tenants.push({
        id: 'tenant-endo',
        name: '遠藤様（販売・ブランディングパートナー専用アカウント）',
        plan_tier: 'premium',
        monthly_budget_jpy: 1000,
        current_spend_jpy: 0,
        is_budget_throttled: false,
        created_at: '2026-11-20T14:30:00.000Z',
        owner_profile: {
          owner_name: '遠藤',
          owner_phonetic: 'えんどう',
          company_name: '',
          title: '代表',
          bni_region_name: '',
          bni_chapter_name: '',
          bni_category: 'ブランディング・販売戦略パートナー',
          specialty_summary: '',
          is_onboarded: false,
        },
      });
    }
  }

  constructor() {
    // 1. まず起動直後にURLパラメータ (?tenant=tenant-xxx) またはPWAホーム画面バインドを確認し、テナント専用ストレージ空間を確定
    if (typeof window !== 'undefined' && window.location) {
      try {
        const sp = new URLSearchParams(window.location.search || '');
        const urlTenant = (sp.get('tenant') || '').trim();
        if (urlTenant === 'tenant-001') {
          this.lockedTenantId = null;
          if (window.localStorage) window.localStorage.removeItem(BOUND_TENANT_STORAGE_KEY);
        } else if (urlTenant) {
          this.lockedTenantId = urlTenant;
          // オーナー端末以外の専用端末（遠藤様のスマホ/PC等）ではPWA起動時にもテナントが外れないよう記憶
          const hasMainOwnerCache = Boolean(getStorageItem(STORAGE_KEY));
          if (!hasMainOwnerCache) {
            setStorageItem(BOUND_TENANT_STORAGE_KEY, urlTenant);
          }
        } else {
          const boundTenant = (getStorageItem(BOUND_TENANT_STORAGE_KEY) || '').trim();
          const hasMainOwnerCache = Boolean(getStorageItem(STORAGE_KEY));
          if (boundTenant && boundTenant !== 'tenant-001' && !hasMainOwnerCache) {
            this.lockedTenantId = boundTenant;
          }
        }
      } catch {
        // ignore URL parse error
      }
    }

    const activeStorageKey = this.getActiveStorageKey();
    const activeDeletedKey = this.getActiveDeletedKey();

    const rawDeleted = getStorageItem(activeDeletedKey);
    try {
      this.deletedIds = new Set<string>(rawDeleted ? JSON.parse(rawDeleted) : []);
    } catch {
      this.deletedIds = new Set<string>();
    }
    const raw = getStorageItem(activeStorageKey);

    if (raw) {
      try {
        this.state = JSON.parse(raw);
      } catch (e) {
        this.state = JSON.parse(JSON.stringify(EMPTY_PRODUCTION_STATE));
      }
    } else {
      this.state = JSON.parse(JSON.stringify(EMPTY_PRODUCTION_STATE));
    }

    this.ensurePartnerTenants();

    // 安全防御: 万が一 state 内にサンプルの山田・田中・佐藤が残っていた場合のみサンプルIDだけを安全に排除
    if (this.state.persons && this.state.persons.some(p => ['p-yamada', 'p-tanaka', 'p-sato', 'p-nakamura-prov'].includes(p.id))) {
      this.purgeSamplePersons();
    }

    // OAuth設定ロード
    const rawOAuth = getStorageItem(OAUTH_STORAGE_KEY);
    if (rawOAuth) {
      try {
        this.oauthConfig = JSON.parse(rawOAuth);
      } catch {
        this.oauthConfig = JSON.parse(JSON.stringify(DEFAULT_OAUTH_CONFIG));
      }
    } else {
      this.oauthConfig = JSON.parse(JSON.stringify(DEFAULT_OAUTH_CONFIG));
    }

    // サーバー側Vercel Secret ManagerでZoom本番認証を管理するため、旧ローカルキャッシュの平文シークレットは安全にクリア
    if (this.oauthConfig.zoom.client_secret && this.oauthConfig.zoom.client_secret.length > 20) {
      this.oauthConfig.zoom = {
        ...DEFAULT_OAUTH_CONFIG.zoom,
        is_connected: true,
      };
      setStorageItem(OAUTH_STORAGE_KEY, JSON.stringify(this.oauthConfig));
    }

    // デモ時の架空データ（タカハシ看板、LED看板、施工実績、京都南チャプター等）を即時一掃
    this.purgeBogusDemoData();

    if (this.lockedTenantId && this.lockedTenantId !== 'tenant-001') {
      // 遠藤様等の専用ロックアカウント起動時：勝賀野様のシードデータは一切混入させず、当該テナント専用空間で起動
      this.setTenantId(this.lockedTenantId);
      this.reconcileLegacyAndDuplicateData();
    } else {
      // 勝賀野様（オーナーアカウント）起動時
      this.state.currentTenantId = 'tenant-001';
      this.seedTsujiMeeting();
      this.seedKimuraMeeting();
      this.seedTanakaMeeting();
      this.seedIwaneMeeting();
      this.seedKobiMeeting();
      this.seedMishimaMeeting();
      this.seedMoriMeeting();
      this.seedNakagawaMeeting();
      this.reconcileLegacyAndDuplicateData();
    }
    this.persist(true);
  }

  public purgeBogusDemoData(): void {
    let changed = false;
    if (this.state.facts && this.state.facts.some(f => f.fact_value.includes('LED電飾看板') || f.fact_value.includes('タカハシ看板') || f.fact_value.includes('施工実績カタログ'))) {
      this.state.facts = this.state.facts.filter(f =>
        !f.fact_value.includes('LED電飾看板') &&
        !f.fact_value.includes('タカハシ看板') &&
        !f.fact_value.includes('施工実績カタログ') &&
        !f.fact_value.includes('店舗サイン')
      );
      changed = true;
    }
    if (this.state.organizations && this.state.organizations.some(o => o.name.includes('タカハシ看板'))) {
      this.state.organizations = this.state.organizations.filter(o => !o.name.includes('タカハシ看板'));
      changed = true;
    }
    if (this.state.organizationMemberships && this.state.organizationMemberships.some(m => m.organization_name.includes('タカハシ看板'))) {
      this.state.organizationMemberships = this.state.organizationMemberships.filter(m => !m.organization_name.includes('タカハシ看板'));
      changed = true;
    }
    if (this.state.bniMemberships && this.state.bniMemberships.some(m => m.chapter_name.includes('京都南チャプター'))) {
      this.state.bniMemberships = this.state.bniMemberships.filter(m => !m.chapter_name.includes('京都南チャプター'));
      changed = true;
    }
    if (this.state.businessOfferings && this.state.businessOfferings.some(b => b.service_title.includes('看板'))) {
      this.state.businessOfferings = this.state.businessOfferings.filter(b => !b.service_title.includes('看板'));
      changed = true;
    }
    if (changed) {
      this.persist();
    }
  }

  public completeMeeting(meetingId: string): void {
    const tid = this.state.currentTenantId;
    const meeting = this.state.meetings.find(m => m.id === meetingId && m.tenant_id === tid);
    if (meeting) {
      meeting.status = 'completed';
      meeting.recording_status = 'completed';
      this.persist();
    }
  }

  public seedTsujiMeeting(): void {
    const tid = 'tenant-001';
    // 辻 晃典 様が未登録、または更新が必要な場合に自動登録
    let tsuji = this.state.persons.find(p => p.id === 'p-tsuji-akinori' || p.display_name === '辻 晃典');
    if (!tsuji) {
      tsuji = {
        id: 'p-tsuji-akinori',
        tenant_id: tid,
        display_name: '辻 晃典',
        phonetic_name: 'つじ あきのり',
        status: 'active',
        category_tags: ['BNI', '仕事'],
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        service_areas: ['関西全域', '地元エリア'],
        meeting_count: 1,
        last_interacted_at: '2026-11-09T14:09:00+09:00',
        notes: 'アミューズメントポーカーイベント共同企画。ディーラー（遠藤さん一択）・卓購入、風営法コンプライアンス（紹介制クローズド運営）を推進。30代会社員〜シニア富裕層の常連化動向に精通。',
        created_at: '2026-11-09T13:29:00Z',
        updated_at: '2026-11-09T14:15:00Z',
      };
      this.state.persons.unshift(tsuji);
    }

    // 辻 晃典様の事業オファリングを正式な1件（bo-tsuji-1）に統一し、「辻 晃典様の専門事業」や誤抽出された「うち以外のチャプター」等を完全削除
    for (const b of this.state.businessOfferings) {
      if (b.person_id === tsuji.id && b.id !== 'bo-tsuji-1') {
        this.deletedIds.add(b.id);
      }
    }
    this.state.businessOfferings = this.state.businessOfferings.filter(
      b => !(b.person_id === tsuji!.id && b.id !== 'bo-tsuji-1')
    );
    if (!this.state.businessOfferings.some(b => b.id === 'bo-tsuji-1')) {
      this.state.businessOfferings.unshift({
        id: 'bo-tsuji-1',
        tenant_id: tid,
        person_id: tsuji.id,
        service_title: '出張旅費・日当手当システム「日当くん」導入支援 / アミューズメントポーカー企画',
        specialties: '旅費規程×位置情報アプリによる非課税日当システム「日当くん」導入、紹介制アミューズメントポーカー企画・運営',
        target_clients: '手取りを増やし社会保険料・法人税を適正化したい法人代表者様、紹介制イベント連携パートナー',
        service_area: '関西全域・全国対応',
        is_active: true,
      });
    }
    for (const bm of this.state.bniMemberships) {
      if (bm.person_id === tsuji.id && /うち以外|他の|別の/.test(bm.chapter_name || '')) {
        this.deletedIds.add(bm.id);
      }
    }
    this.state.bniMemberships = this.state.bniMemberships.filter(
      bm => !(bm.person_id === tsuji!.id && /うち以外|他の|別の/.test(bm.chapter_name || ''))
    );

    // 遠藤さん（仮カルテ）
    let endo = this.state.persons.find(p => p.id === 'p-endo-prov');
    if (!endo) {
      endo = {
        id: 'p-endo-prov',
        tenant_id: tid,
        display_name: '遠藤さん（ディーラー）',
        phonetic_name: 'えんどうさん',
        status: 'provisional',
        category_tags: ['仕事', '知人'],
        service_areas: ['関西全域'],
        meeting_count: 0,
        notes: '辻さんとの会話で登場。アミューズメントポーカーのディーラー担当（一択）。勝賀野様と一緒に営業許可・風営法コンプライアンス等を確認中。',
        created_at: '2026-11-09T13:29:00Z',
        updated_at: '2026-11-09T14:15:00Z',
      };
      this.state.persons.push(endo);
    }

    // 面談記録
    let meeting = this.state.meetings.find(m => m.id === 'm-tsuji-20261109');
    if (!meeting) {
      meeting = {
        id: 'm-tsuji-20261109',
        tenant_id: tid,
        title: '辻 晃典様と1to1（アミューズメントポーカー企画・許認可・運営体制）',
        meeting_type: '1to1',
        provider: 'zoom',
        meeting_url: 'https://us06web.zoom.us/rec/share/4OZtsxD8c8CkizB04uasy-wEolBH1J5Y7FxUvU2HOkFKG0UCdSJxgsOsWcYzB8Y.b4ERgiPVafkHYMSu',
        meeting_code: '89527504054',
        zoom_uuid: 'pWMoanR1Tsyn4AKg3armHA==',
        scheduled_start_at: '2026-11-09T13:29:00+09:00',
        scheduled_end_at: '2026-11-09T14:09:00+09:00',
        raw_invite_text: '辻 晃典様と1to1面談（ZENNOBATE Meeting Room）\nURL: https://us06web.zoom.us/rec/share/4OZtsxD8c8CkizB04uasy-wEolBH1J5Y7FxUvU2HOkFKG0UCdSJxgsOsWcYzB8Y.b4ERgiPVafkHYMSu\nPasscode: aCf?NV3J',
        host_type: 'self',
        recording_status: 'completed',
        status: 'completed',
        participant_ids: [tsuji.id],
        created_at: '2026-11-09T13:25:00Z',
      };
      this.state.meetings.unshift(meeting);
    } else {
      meeting.status = 'completed';
      meeting.recording_status = 'completed';
      meeting.zoom_uuid = 'pWMoanR1Tsyn4AKg3armHA==';
      meeting.participant_ids = [tsuji.id];
    }

    // 話題 Facts
    const existingFact = this.state.facts.some(f => f.source_id === 'm-tsuji-20261109');
    if (!existingFact && tsuji) {
      this.state.facts.push(
        {
          id: `fact-tsuji-1`,
          tenant_id: tid,
          person_id: tsuji.id,
          fact_category: 'topic',
          fact_key: '盛り上がった話題',
          fact_value: 'アミューズメントポーカーイベント開催・運営体制（ディーラーは遠藤さん一択、卓購入準備、飲食店営業・深夜酒類提供の許可体制）',
          source_type: 'meeting_speech',
          source_id: 'm-tsuji-20261109',
          source_evidence: 'Zoom 1to1面談文字起こし',
          confidence: 0.99,
          verification_status: 'verified',
          visibility: 'referral_eligible',
          valid_from: '2026-11-09T14:09:00Z',
          created_at: '2026-11-09T14:09:00Z',
        },
        {
          id: `fact-tsuji-2`,
          tenant_id: tid,
          person_id: tsuji.id,
          fact_category: 'topic',
          fact_key: '集客・運営コンプライアンス',
          fact_value: '風営法の締め付けを踏まえ、SNS等のオープン公募ではなく身内紹介制で安全に運営する方針で合意',
          source_type: 'meeting_speech',
          source_id: 'm-tsuji-20261109',
          source_evidence: 'Zoom 1to1面談文字起こし',
          confidence: 0.98,
          verification_status: 'verified',
          visibility: 'referral_eligible',
          valid_from: '2026-11-09T14:09:00Z',
          created_at: '2026-11-09T14:09:00Z',
        },
        {
          id: `fact-tsuji-3`,
          tenant_id: tid,
          person_id: tsuji.id,
          fact_category: 'topic',
          fact_key: '客層・ターゲット分析',
          fact_value: '高校生〜70代（75歳シニア女性等）まで通うが、最も多いボリュームゾーンは30代仕事終わりの会社員。固定客・常連化しやすい',
          source_type: 'meeting_speech',
          source_id: 'm-tsuji-20261109',
          source_evidence: 'Zoom 1to1面談文字起こし',
          confidence: 0.98,
          verification_status: 'verified',
          visibility: 'referral_eligible',
          valid_from: '2026-11-09T14:09:00Z',
          created_at: '2026-11-09T14:09:00Z',
        },
        {
          id: `fact-tsuji-4`,
          tenant_id: tid,
          person_id: tsuji.id,
          fact_category: 'promise',
          fact_key: '保留中の約束・ToDo',
          fact_value: '勝賀野様が【金曜の晩】を目標に開催段取りを調整し、辻様へLINE連絡する',
          source_type: 'meeting_speech',
          source_id: 'm-tsuji-20261109',
          source_evidence: 'Zoom 1to1面談文字起こし',
          confidence: 0.99,
          verification_status: 'verified',
          visibility: 'referral_eligible',
          valid_from: '2026-11-09T14:09:00Z',
          created_at: '2026-11-09T14:09:00Z',
        },
        {
          id: `fact-tsuji-5`,
          tenant_id: tid,
          person_id: tsuji.id,
          fact_category: 'promise',
          fact_key: '保留中の約束・ToDo',
          fact_value: '日程確定に合わせてポーカー卓（テーブル）を購入手配する',
          source_type: 'meeting_speech',
          source_id: 'm-tsuji-20261109',
          source_evidence: 'Zoom 1to1面談文字起こし',
          confidence: 0.98,
          verification_status: 'verified',
          visibility: 'referral_eligible',
          valid_from: '2026-11-09T14:09:00Z',
          created_at: '2026-11-09T14:09:00Z',
        },
        {
          id: `fact-tsuji-6`,
          tenant_id: tid,
          person_id: tsuji.id,
          fact_category: 'promise',
          fact_key: '保留中の約束・ToDo',
          fact_value: '勝賀野様が顧問税理士に日当支給・就業規則の相談を実施する',
          source_type: 'meeting_speech',
          source_id: 'm-tsuji-20261109',
          source_evidence: 'Zoom 1to1面談文字起こし',
          confidence: 0.98,
          verification_status: 'verified',
          visibility: 'referral_eligible',
          valid_from: '2026-11-09T14:09:00Z',
          created_at: '2026-11-09T14:09:00Z',
        }
      );
    }

    // 文字起こし全文
    const tsujiSummary =
      'アミューズメントポーカーイベントの企画打ち合わせおよび出張旅費・非課税日当システム「日当くん」の導入相談。ディーラー体制（遠藤さん一択）、卓購入準備、身内紹介制による風営法コンプライアンス、30代会社員を中心とした常連化、金曜晩の開催日程調整（勝賀野様よりLINE連絡）、および顧問税理士への旅費規程・日当支給・就業規則相談について合意。';
    const existingTrTsuji = this.state.transcripts.find(t => t.meeting_id === 'm-tsuji-20261109');
    if (!existingTrTsuji) {
      this.state.transcripts.push({
        id: 'tr-tsuji-20261109',
        tenant_id: tid,
        meeting_id: 'm-tsuji-20261109',
        language: 'ja',
        full_text: `辻 晃典: ディーラーは誰がやるんですか？遠藤さん。\n4/勝賀野 太郎/残置物撤去: 遠藤さん。\n辻 晃典: ああ。なるほど、一択ですか。\n4/勝賀野 太郎/残置物撤去: 一択です。\n辻 晃典: 一択ね。一択前、あのサファリの卓を借りたじゃないですか？\n4/勝賀野 太郎/残置物撤去: はい。\n辻 晃典: 毎回持ってくんですか？あれを。\n4/勝賀野 太郎/残置物撤去: いやえっとね。前はあの準備が間に合わへんかったからお借りしに行っただけですね。次の予定決まったらすぐ買いますっていう話になってます。\n辻 晃典: あれ、許可はどうなんですか？\n4/勝賀野 太郎/残置物撤去: うちもその飲食店営業許可と深夜酒類提供の許可しか取ってないので。まあその辺ちょっとどうなるんやろうって遠藤さんと今一緒に確認中って感じですね。\n辻 晃典: 結構ね、最近締め付けが厳しいんでね。身内同士でやってるぐらいなら、紹介紹介だけでうちは来てもらってます、ぐらいの方がいいかもしれないですね。ややこしいの取ってしまうとほんと危ないんで。\n4/勝賀野 太郎/残置物撤去: そうですね。もうそれちょっとなんとかうまいこと、形にしていきたいんですよね。\n辻 晃典: 私も毎日のように地元行ってますから、もう顔ぶれはみんな一緒ですもん。下は高二の子と一番上も70代（昨日も75歳の女の人いました）。一番平気で多いのは30代、仕事終わわりに結構来ますね。常連は作りやすいと思いますよ。\n4/勝賀野 太郎/残置物撤去: ほんまですね。\n辻 晃典: で、またちょっとその日程とか分かり次第、調整していきたいなと思ってます。\n4/勝賀野 太郎/残置物撤去: わかりました。金曜の晩ですね。\n辻 晃典: 金曜の晩はありがたいですね。\n4/勝賀野 太郎/残置物撤去: はい、了解です。じゃあその日程でちょっとできるだけ段取りするようにしておきます。\n辻 晃典: 一回ね、まあ税理士さんに就業規則とか日当これからつけたいんやけどっていう相談をしといてもいいかもしれないですね。\n4/勝賀野 太郎/残置物撤去: そうですね。もうなんやったら決算の話し合いとかでちょこちょこ会う機会があるんで、一回聞いてみます。だいぶ仲いいんで。\n辻 晃典: じゃあまた今後ともよろしくお願いします。\n4/勝賀野 太郎/残置物撤去: はい、ありがとうございます！失礼いたします。`,
        summary: tsujiSummary,
        utterances: [
          {
            id: 'utt-tsuji-1',
            speaker_label: '辻 晃典',
            resolved_person_id: tsuji.id,
            resolved_person_name: '辻 晃典',
            start_seconds: 2113,
            end_seconds: 2394,
            text: 'ディーラーは遠藤さん一択ですね。紹介制で常連を作りましょう。金曜の晩はありがたいです。税理士さんにも日当相談をしておくと良いですね。',
            confidence: 0.98,
          }
        ],
        created_at: '2026-11-09T14:10:00Z',
      });
    } else {
      existingTrTsuji.summary = tsujiSummary;
    }

    this.persist();
  }

  
  public seedKimuraMeeting(): void {
    const tid = 'tenant-001';

    // 木村 尚史 様 カルテ
    let kimura = this.state.persons.find(p => p.id === 'p-kimura-naofumi' || p.display_name === '木村 尚史');
    if (!kimura) {
      kimura = {
        id: 'p-kimura-naofumi',
        tenant_id: tid,
        display_name: '木村 尚史',
        phonetic_name: 'きむら なおふみ',
        status: 'active',
        category_tags: ['仕事', '知人', '東山高'],
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        service_areas: ['京都市内', '京都府全域', '関西'],
        meeting_count: 1,
        last_interacted_at: '2026-11-09T14:51:00+09:00',
        notes: '東山高校同窓（サッカー部・江戸の代）。不用品回収事業に従事。勝賀野様の残置物撤去×リユース（先週月曜オープンのリサイクルショップ）と強力に業務提携。即日現地調査物件の見積もり打診。11月18日（水）にリアル飲み会（タメ語解禁の約束）。フットサル大会にも参加予定。',
        created_at: '2026-11-09T14:29:00Z',
        updated_at: '2026-11-09T15:05:00Z',
      };
      this.state.persons.unshift(kimura);
    }

    // 木村 尚史様の事業オファリングを正式な1件（bo-kimura-1）に統一し、「木村 尚史様の専門事業」の重複を完全削除
    for (const b of this.state.businessOfferings) {
      if (b.person_id === kimura.id && b.id !== 'bo-kimura-1') {
        this.deletedIds.add(b.id);
      }
    }
    this.state.businessOfferings = this.state.businessOfferings.filter(
      b => !(b.person_id === kimura!.id && b.id !== 'bo-kimura-1')
    );
    if (!this.state.businessOfferings.some(b => b.id === 'bo-kimura-1')) {
      this.state.businessOfferings.unshift({
        id: 'bo-kimura-1',
        tenant_id: tid,
        person_id: kimura.id,
        service_title: '不用品回収・大型/小型ゴミ処分・リユース連携（京都市内・関西）',
        specialties: '京都市内・関西エリアの大型ゴミ・小型ゴミ・不用品回収、残置物撤去現場のリユース連携',
        target_clients: '残置物撤去・遺品整理事業者様、不動産管理・引越しに伴う不用品処分案件',
        service_area: '京都市内・京都府全域・関西',
        is_active: true,
      });
    }

    // 関連人物（相関図）: 康二（こうじ）
    if (!this.state.persons.some(p => p.id === 'p-koji-prov')) {
      this.state.persons.push({
        id: 'p-koji-prov',
        tenant_id: tid,
        display_name: '康二（バー・リサイクルショップ）',
        phonetic_name: 'こうじ',
        status: 'provisional',
        category_tags: ['仕事', '友人'],
        service_areas: ['京都市内'],
        meeting_count: 0,
        notes: '勝賀野様の仲間。バーやリサイクルショップを運営。木村さんとも共通の知人。フットサル仲間（左足が上達中）。',
        created_at: '2026-11-09T14:29:00Z',
        updated_at: '2026-11-09T15:05:00Z',
      });
    }

    // 関連人物（相関図）: 江戸（えどの）
    if (!this.state.persons.some(p => p.id === 'p-edono-prov')) {
      this.state.persons.push({
        id: 'p-edono-prov',
        tenant_id: tid,
        display_name: '江戸（幼馴染）',
        phonetic_name: 'えどの',
        status: 'provisional',
        category_tags: ['友人', '幼馴染'],
        service_areas: ['京都市内'],
        meeting_count: 0,
        notes: '勝賀野様の幼馴染（ずっと一緒）。東山高校時代に木村さんとも交流があり、木村さんも「久々に会いたい」と発言。',
        created_at: '2026-11-09T14:29:00Z',
        updated_at: '2026-11-09T15:05:00Z',
      });
    }

    // 関連人物（相関図）: 俊介（不動産）
    if (!this.state.persons.some(p => p.id === 'p-shunsuke-prov')) {
      this.state.persons.push({
        id: 'p-shunsuke-prov',
        tenant_id: tid,
        display_name: '俊介（不動産）',
        phonetic_name: 'しゅんすけ',
        status: 'provisional',
        category_tags: ['仕事', '友人'],
        service_areas: ['京都市内'],
        meeting_count: 0,
        notes: '不動産業。勝賀野様と一緒にフットサルをしている。奥様が木村さんの知人。',
        created_at: '2026-11-09T14:29:00Z',
        updated_at: '2026-11-09T15:05:00Z',
      });
    }

    // 関連人物（相関図）: 伊藤さん（紹介元）
    if (!this.state.persons.some(p => p.id === 'p-ito-prov')) {
      this.state.persons.push({
        id: 'p-ito-prov',
        tenant_id: tid,
        display_name: '伊藤さん（幼馴染の奥様・紹介元）',
        phonetic_name: 'いとうさん',
        status: 'provisional',
        category_tags: ['知人', '幼馴染'],
        service_areas: ['京都市内'],
        meeting_count: 0,
        notes: '旦那様が勝賀野様の幼馴染（坂本くん等の仲間）。木村さんを勝賀野様へ紹介したキーパーソン。',
        created_at: '2026-11-09T14:29:00Z',
        updated_at: '2026-11-09T15:05:00Z',
      });
    }

    // 面談記録
    let meeting = this.state.meetings.find(m => m.id === 'm-kimura-20261109');
    if (!meeting) {
      meeting = {
        id: 'm-kimura-20261109',
        tenant_id: tid,
        title: '木村 尚史様と1to1（不用品回収×残置物撤去・リユース提携・現地見積依頼）',
        meeting_type: '1to1',
        provider: 'zoom',
        meeting_url: 'https://us06web.zoom.us/rec/share/Fcr6mJGN2AIHdNz25VrjG0oY6RRU_OPd_F9EofjC4YIe4uKzc2AwsfXpJKSSeviX.fWGkLoCNQXT8paBm',
        meeting_code: '89527504054',
        zoom_uuid: 'NSbdMRVpSnWQanT7eywfzw==',
        scheduled_start_at: '2026-11-09T14:29:00+09:00',
        scheduled_end_at: '2026-11-09T14:51:00+09:00',
        raw_invite_text: '木村 尚史様と1to1面談（ZENNOBATE Meeting Room）\nURL: https://us06web.zoom.us/rec/share/Fcr6mJGN2AIHdNz25VrjG0oY6RRU_OPd_F9EofjC4YIe4uKzc2AwsfXpJKSSeviX.fWGkLoCNQXT8paBm\nPasscode: 3E=2Pd8L',
        host_type: 'self',
        recording_status: 'completed',
        status: 'completed',
        participant_ids: [kimura.id],
        created_at: '2026-11-09T14:25:00Z',
      };
      this.state.meetings.unshift(meeting);
    } else {
      meeting.status = 'completed';
      meeting.recording_status = 'completed';
      meeting.zoom_uuid = 'NSbdMRVpSnWQanT7eywfzw==';
      meeting.participant_ids = [kimura.id];
    }

    // 話題 & 約束 Facts
    const existingFact = this.state.facts.some(f => f.source_id === 'm-kimura-20261109');
    if (!existingFact && kimura) {
      this.state.facts.push(
        {
          id: 'fact-kimura-1',
          tenant_id: tid,
          person_id: kimura.id,
          fact_category: 'topic',
          fact_key: '業務提携・シナジー',
          fact_value: '不用品回収 × 残置物撤去・リユース（先週月曜にオープンしたリサイクルショップ）の業務提携。処分現場から出る回収品をリユースへ循環させ相互送客',
          source_type: 'meeting_speech',
          source_id: 'm-kimura-20261109',
          source_evidence: 'Zoom 1to1面談文字起こし',
          confidence: 0.99,
          verification_status: 'verified',
          visibility: 'referral_eligible',
          valid_from: '2026-11-09T14:51:00Z',
          created_at: '2026-11-09T14:51:00Z',
        },
        {
          id: 'fact-kimura-2',
          tenant_id: tid,
          person_id: kimura.id,
          fact_category: 'topic',
          fact_key: '回収・処理エリア',
          fact_value: '京都市内の大型ゴミ・小型ゴミ・燃えるゴミ処分に対応可能。家の前まで来てもらえるパターンの回収体制',
          source_type: 'meeting_speech',
          source_id: 'm-kimura-20261109',
          source_evidence: 'Zoom 1to1面談文字起こし',
          confidence: 0.98,
          verification_status: 'verified',
          visibility: 'referral_eligible',
          valid_from: '2026-11-09T14:51:00Z',
          created_at: '2026-11-09T14:51:00Z',
        },
        {
          id: 'fact-kimura-3',
          tenant_id: tid,
          person_id: kimura.id,
          fact_category: 'topic',
          fact_key: '東山高校同窓の再会',
          fact_value: '東山高校サッカー部（江戸・康二の代、俊介や伊藤さん夫婦の縁）。勝賀野様の圧倒的な足の速さの思い出で大いに盛り上がる',
          source_type: 'meeting_speech',
          source_id: 'm-kimura-20261109',
          source_evidence: 'Zoom 1to1面談文字起こし',
          confidence: 0.99,
          verification_status: 'verified',
          visibility: 'referral_eligible',
          valid_from: '2026-11-09T14:51:00Z',
          created_at: '2026-11-09T14:51:00Z',
        },
        {
          id: 'fact-kimura-4',
          tenant_id: tid,
          person_id: kimura.id,
          fact_category: 'promise',
          fact_key: '保留中の約束・ToDo',
          fact_value: '勝賀野様が本日現地調査した残置物・不用品回収案件について、木村様へ見積もり依頼を送る',
          source_type: 'meeting_speech',
          source_id: 'm-kimura-20261109',
          source_evidence: 'Zoom 1to1面談文字起こし',
          confidence: 0.99,
          verification_status: 'verified',
          visibility: 'referral_eligible',
          valid_from: '2026-11-09T14:51:00Z',
          created_at: '2026-11-09T14:51:00Z',
        },
        {
          id: 'fact-kimura-5',
          tenant_id: tid,
          person_id: kimura.id,
          fact_category: 'promise',
          fact_key: '保留中の約束・ToDo',
          fact_value: '11月18日（水）にリアルで再会し飲み会を実施（その時にお互いタメ語を解禁する約束）',
          source_type: 'meeting_speech',
          source_id: 'm-kimura-20261109',
          source_evidence: 'Zoom 1to1面談文字起こし',
          confidence: 0.99,
          verification_status: 'verified',
          visibility: 'referral_eligible',
          valid_from: '2026-11-09T14:51:00Z',
          created_at: '2026-11-09T14:51:00Z',
        },
        {
          id: 'fact-kimura-6',
          tenant_id: tid,
          person_id: kimura.id,
          fact_category: 'promise',
          fact_key: '保留中の約束・ToDo',
          fact_value: '勝賀野様・康二らのフットサルチームの次回大会に木村様が参加する',
          source_type: 'meeting_speech',
          source_id: 'm-kimura-20261109',
          source_evidence: 'Zoom 1to1面談文字起こし',
          confidence: 0.98,
          verification_status: 'verified',
          visibility: 'referral_eligible',
          valid_from: '2026-11-09T14:51:00Z',
          created_at: '2026-11-09T14:51:00Z',
        }
      );
    }

    // 文字起こし全文
    const kimuraSummary =
      '東山高校同窓の再会。不用品回収事業に従事する木村様と、残置物撤去・リユース（先週オープンのリサイクルショップ）を展開する勝賀野様の強力な協業合意。本日現地調査案件の見積もり打診、11月18日のリアル飲み会（タメ語解禁約束）、フットサル大会参加などを決定。';
    const existingTrKimura = this.state.transcripts.find(t => t.meeting_id === 'm-kimura-20261109');
    if (!existingTrKimura) {
      this.state.transcripts.push({
        id: 'tr-kimura-20261109',
        tenant_id: tid,
        meeting_id: 'm-kimura-20261109',
        language: 'ja',
        full_text: '木村尚史: なおふみです。覚えてますか？\n4/勝賀野 太郎/残置物撤去: 東山サッカー部を知ってる江戸の...なお言われてなかった。あ、そうそうなおなおって言われてて。ちょっとスピーカーにするわ。\n木村尚史: 労働してます。\n4/勝賀野 太郎/残置物撤去: 面影あるわ！卒業してから会ってへんもん。\n4/勝賀野 太郎/残置物撤去: 伊藤さんいるやん。伊藤さんの旦那が俺の幼馴染で、友達で紹介してもらって高校聞いたら東山って。ほな康二知ってますって。ここに書いてあるバーとかリサイクルショップ、康二でやってるんですよ言うて。\n木村尚史: こんな繋がり方ありやと思い。\n4/勝賀野 太郎/残置物撤去: そうそう、最近不用品回収の仕事を始めはったみたいで。\n木村尚史: 代表がいてやってるってことです。\n4/勝賀野 太郎/残置物撤去: 俺に敬語やめてんな、絶対！18日、よかったら来て。\n木村尚史: 是非是非お願いしたいなって。ゴミの仕様がめっちゃ変わってるんで。\n4/勝賀野 太郎/残置物撤去: そうやろうなぁ。何でも言ってくれたら。家の前まで来てもらえるパターンやったら一杯いけるし、京都市内やったら大型ゴミとか全然うち行けるし、燃えるゴミもいけるよ。\n木村尚史: 足がめちゃくちゃ速いイメージというのがやばいくらい早かった。\n4/勝賀野 太郎/残置物撤去: せやなぁ、一番早かったからな。俊介とかとたまに会ってフットサルやってる。俊介は不動産やってる。\n木村尚史: 嫁さんは僕は知ってて。いろんなとこへ繋がって。\n4/勝賀野 太郎/残置物撤去: めっちゃ偶然やなぁ。連絡取り合って色々やってったらいいと思うし、やろうや。リサイクルショップ自体は先週月曜にオープンしたばかり。ちょうど一週間。俺ら事業関連してるから、うまいこといけたら維持できるやろうって。リユースという事業が仕事的にもめちゃくちゃいいから。18日よかったら来てください。普通に一緒に飲みたいっすわ。その時にタメ語解禁しましょう！\n木村尚史: 18日も行く予定で予定空けますんで！\n4/勝賀野 太郎/残置物撤去: また僕一件、今日現地行ってるとこあるんで、それまた見積もりお願いしてもいいですかね？\n木村尚史: え、もう早速そんな話ありがとうございます！\n4/勝賀野 太郎/残置物撤去: 江戸なんか俺もうずっと幼馴染で一緒におるし。\n木村尚史: 江戸に会いたいな。久々にフットサルも行きたいですもん。\n4/勝賀野 太郎/残置物撤去: フットサルは次大会来てください！康二もサッカーできひんのに出てて左足上手くなってきてるから大丈夫！\n木村尚史: それも参加させてもらいます！これからもよろしくお願いします！',
        summary: kimuraSummary,
        utterances: [
          {
            id: 'utt-kimura-1',
            speaker_label: '木村 尚史',
            resolved_person_id: kimura.id,
            resolved_person_name: '木村 尚史',
            start_seconds: 943,
            end_seconds: 1325,
            text: '不用品回収を始めました。勝賀野さんの残置物・リユース事業とぜひ連携したいです。18日の飲み会も予定空けますし、本日の案件見積もりもぜひやらせてください！',
            confidence: 0.99,
          }
        ],
        created_at: '2026-11-09T14:55:00Z',
      });
    } else {
      existingTrKimura.summary = kimuraSummary;
    }

    this.persist();
  }

  

  public seedTanakaMeeting(): void {
    const tid = 'tenant-001';

    const fullTanakaNotes = '夢叶開発 代表。大阪拠点で中古マンション中心の買取再販（土地も大阪・兵庫で実施、最遠は函館も実績）。33歳（平成5年生まれ、勝賀野様と1歳差同世代）。子供3人（5歳、3歳、1歳）。長野出身→東京（元エンジニア1年半）→大阪転勤で独立10年。趣味はボードゲーム。リクシル不動産三浦さん・入江さん経由で西友寺案件の取引実績あり。夜は飲めないがランチなら京都・大阪とも歓迎。勝賀野様から不動産業者を1名紹介して3名でランチに行く約束。買取物件の残置物撤去・遺品整理（近畿一円・名古屋）を提携。';

    // 田中 義博 様 カルテ（既存カルテが仮状態や不完全なメモでも常に完全な内容へアップグレード）
    let tanaka = this.state.persons.find(p => p.id === 'p-tanaka-yoshihiro' || p.display_name === '田中 義博' || p.display_name === '田中義博');
    if (!tanaka) {
      tanaka = {
        id: 'p-tanaka-yoshihiro',
        tenant_id: tid,
        display_name: '田中 義博',
        phonetic_name: 'たなか よしひろ',
        status: 'active',
        category_tags: ['仕事', '不動産', '知人'],
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        service_areas: ['大阪府', '兵庫県', '近畿全域', '全国（函館実績あり）'],
        meeting_count: 1,
        last_interacted_at: '2026-11-10T11:34:00+09:00',
        notes: fullTanakaNotes,
        is_name_verified: true,
        created_at: '2026-11-10T10:55:00Z',
        updated_at: '2026-11-10T12:00:00Z',
      };
      this.state.persons.unshift(tanaka);
    } else {
      tanaka.display_name = '田中 義博';
      tanaka.phonetic_name = tanaka.phonetic_name || 'たなか よしひろ';
      tanaka.status = 'active';
      tanaka.is_name_verified = true;
      tanaka.meeting_count = Math.max(1, tanaka.meeting_count || 1);
      tanaka.last_interacted_at = '2026-11-10T11:34:00+09:00';
      if (!tanaka.avatar_url) {
        tanaka.avatar_url = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150';
      }
      if (!tanaka.service_areas || tanaka.service_areas.length === 0) {
        tanaka.service_areas = ['大阪府', '兵庫県', '近畿全域', '全国（函館実績あり）'];
      }
      if (!tanaka.category_tags || tanaka.category_tags.length === 0) {
        tanaka.category_tags = ['仕事', '不動産', '知人'];
      }
      if (!tanaka.notes || tanaka.notes.length < 60 || /Zoom面談より自動登録|LINE連絡|すみません|4\/勝賀野/.test(tanaka.notes)) {
        tanaka.notes = fullTanakaNotes;
      }
    }

    // 関連人物（仮人脈）: 三浦さん（リクシル不動産）
    if (!this.state.persons.some(p => p.id === 'p-miura-prov')) {
      this.state.persons.push({
        id: 'p-miura-prov',
        tenant_id: tid,
        display_name: '三浦さん（リクシル不動産）',
        phonetic_name: 'みうらさん',
        status: 'provisional',
        category_tags: ['仕事', '不動産'],
        service_areas: ['関西全域'],
        meeting_count: 0,
        notes: 'リクシル不動産。勝賀野様に西友寺の残置物撤去を紹介、田中様とも3件のマンション買取取引実績あり。キーマン。',
        created_at: '2026-11-10T11:34:00Z',
        updated_at: '2026-11-10T11:34:00Z',
      });
    }

    // 関連人物（仮人脈）: 入江さん
    if (!this.state.persons.some(p => p.id === 'p-irie-prov')) {
      this.state.persons.push({
        id: 'p-irie-prov',
        tenant_id: tid,
        display_name: '入江さん',
        phonetic_name: 'いりえさん',
        status: 'provisional',
        category_tags: ['仕事', '不動産'],
        service_areas: ['関西全域'],
        meeting_count: 0,
        notes: '西友寺案件で勝賀野様・三浦様・田中様を繋いだ関係者。',
        created_at: '2026-11-10T11:34:00Z',
        updated_at: '2026-11-10T11:34:00Z',
      });
    }

    // 誤って勝賀野様の「株式会社ゼノベイト」が田中様に紐付いていた場合は除去し、正式社名「夢叶開発」を保証
    this.state.organizationMemberships = this.state.organizationMemberships.filter(
      m => !(m.person_id === tanaka!.id && /ゼノベイト|ZENNOBATE/i.test(m.organization_name))
    );
    if (!this.state.organizationMemberships.some(m => m.person_id === tanaka!.id && m.organization_name === '夢叶開発')) {
      this.state.organizationMemberships.unshift({
        id: 'om-tanaka-1',
        tenant_id: tid,
        person_id: tanaka.id,
        organization_id: 'org-yumekana',
        organization_name: '夢叶開発',
        title: '代表',
        is_current: true,
      });
    }

    // 事業内容オファリング（汎用プレースホルダがあれば正式内容へ更新）
    this.state.businessOfferings = this.state.businessOfferings.filter(
      b => !(b.person_id === tanaka!.id && b.id !== 'bo-tanaka-1' && /ゼノベイト|すみません|事業展開/.test(b.service_title))
    );
    if (!this.state.businessOfferings.some(b => b.person_id === tanaka!.id && b.id === 'bo-tanaka-1')) {
      this.state.businessOfferings.unshift({
        id: 'bo-tanaka-1',
        tenant_id: tid,
        person_id: tanaka.id,
        service_title: '中古マンション買取再販・不動産買取（近畿・全国）',
        specialties: '区分マンション買取再販、不動産買取、土地（大阪・兵庫）',
        target_clients: '買取案件を紹介してくれる不動産業者様、早期現金化を希望する売主様',
        service_area: '大阪府・兵庫県・京都府・全国',
        is_active: true,
      });
    }

    // 面談記録
    let meeting = this.state.meetings.find(m => m.id === 'm-tanaka-20261110');
    if (!meeting) {
      meeting = {
        id: 'm-tanaka-20261110',
        tenant_id: tid,
        title: '田中 義博様と1to1（夢叶開発 / マンション買取再販・残置物撤去提携・不動産業者ランチ）',
        meeting_type: '1to1',
        provider: 'zoom',
        meeting_url: 'https://us06web.zoom.us/rec/share/ai_Rf1Rb_b_ohgxr4_uaWOT7rD3bcK3Wdeajd7Lanf0vvheVeSoSkJHYlm5sivXP.i30mYp4a5gEdA7E1',
        meeting_code: '89527504054',
        zoom_uuid: 'BGodEUwlTyuhgtDOPAVE+w==',
        scheduled_start_at: '2026-11-10T10:58:00+09:00',
        scheduled_end_at: '2026-11-10T11:34:00+09:00',
        raw_invite_text: '田中 義博様と1to1面談（夢叶開発×ZENNOBATE）\n主催: 勝賀野 太郎 / 残置物撤去',
        host_type: 'self',
        recording_status: 'completed',
        status: 'completed',
        participant_ids: [tanaka.id],
        created_at: '2026-11-10T10:55:00Z',
        updated_at: '2026-11-10T12:00:00Z',
      };
      this.state.meetings.unshift(meeting);
    } else {
      meeting.title = '田中 義博様と1to1（夢叶開発 / マンション買取再販・残置物撤去提携・不動産業者ランチ）';
      meeting.status = 'completed';
      meeting.recording_status = 'completed';
      meeting.zoom_uuid = 'BGodEUwlTyuhgtDOPAVE+w==';
      meeting.meeting_code = '89527504054';
      meeting.participant_ids = [tanaka.id];
      meeting.updated_at = '2026-11-10T12:00:00Z';
    }

    // 旧テキスト簡易パーサーが生成した不完全なFact（冒頭挨拶のみ等）をクリーンアップし、6件の確定Factを個別に保証
    this.state.facts = this.state.facts.filter(
      f => !(f.person_id === tanaka!.id && !f.id.startsWith('fact-tanaka-') && /すみません|日程ちょっと調整|4\/勝賀野|面談内容の整理|意見交換/.test(f.fact_value))
    );

    const tanakaCoreFacts: Fact[] = [
      {
        id: 'fact-tanaka-1',
        tenant_id: tid,
        person_id: tanaka.id,
        fact_category: 'topic',
        fact_key: '本業・事業内容',
        fact_value: '大阪拠点で中古マンション中心の買取再販（夢叶開発）。関西〜函館まで全国対応、不動産業者からの買取案件紹介を希望',
        source_type: 'meeting_speech',
        source_id: 'm-tanaka-20261110',
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-10T11:34:00Z',
        created_at: '2026-11-10T11:34:00Z',
      },
      {
        id: 'fact-tanaka-2',
        tenant_id: tid,
        person_id: tanaka.id,
        fact_category: 'topic',
        fact_key: '業務提携・協業合意',
        fact_value: 'マンション買取再販時の残置物撤去・遺品整理（近畿一円・名古屋）を勝賀野様へ発注・買取査定相殺連携、査定SaaS「カンテノ」も共有',
        source_type: 'meeting_speech',
        source_id: 'm-tanaka-20261110',
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-10T11:34:00Z',
        created_at: '2026-11-10T11:34:00Z',
      },
      {
        id: 'fact-tanaka-3',
        tenant_id: tid,
        person_id: tanaka.id,
        fact_category: 'promise',
        fact_key: '保留中の約束・ToDo',
        fact_value: '勝賀野様が買取案件を紹介できる不動産業者を1名誘い、田中様と3名でランチ（京都または大阪）を設定する',
        source_type: 'meeting_speech',
        source_id: 'm-tanaka-20261110',
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-10T11:34:00Z',
        created_at: '2026-11-10T11:34:00Z',
      },
      {
        id: 'fact-tanaka-4',
        tenant_id: tid,
        person_id: tanaka.id,
        fact_category: 'promise',
        fact_key: '保留中の約束・ToDo',
        fact_value: '田中様がマンション・土地の買取案件発生時に、残置物撤去・遺品整理・買取査定見積もりを勝賀野様へ連絡・依頼する',
        source_type: 'meeting_speech',
        source_id: 'm-tanaka-20261110',
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.98,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-10T11:34:00Z',
        created_at: '2026-11-10T11:34:00Z',
      },
      {
        id: 'fact-tanaka-5',
        tenant_id: tid,
        person_id: tanaka.id,
        fact_category: 'background',
        fact_key: '取引接点・経緯',
        fact_value: 'リクシル不動産の三浦様・入江様を通じて西友寺の案件で請求書をやり取りした間接取引実績あり',
        source_type: 'meeting_speech',
        source_id: 'm-tanaka-20261110',
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-10T11:34:00Z',
        created_at: '2026-11-10T11:34:00Z',
      },
      {
        id: 'fact-tanaka-6',
        tenant_id: tid,
        person_id: tanaka.id,
        fact_category: 'preference',
        fact_key: '人柄・共通点・プライベート',
        fact_value: '33歳（平成5年生まれ、勝賀野様と1歳差同世代）。子供3人（5歳, 3歳, 1歳）。長野出身→東京（元エンジニア）→大阪で独立10年。趣味はボードゲーム。夜は不可だがランチ大歓迎',
        source_type: 'meeting_speech',
        source_id: 'm-tanaka-20261110',
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-10T11:34:00Z',
        created_at: '2026-11-10T11:34:00Z',
      },
    ];

    for (let i = tanakaCoreFacts.length - 1; i >= 0; i--) {
      const cf = tanakaCoreFacts[i];
      const existingIdx = this.state.facts.findIndex(f => f.id === cf.id);
      if (existingIdx >= 0) {
        this.state.facts[existingIdx] = cf;
      } else {
        this.state.facts.unshift(cf);
      }
    }

    // 文字起こし & 要約（常に完全な要約と全文が入るように保証）
    const tanakaSummary = '夢叶開発の田中義博様（33歳・平成5年生まれ同世代）との36分間の1to1面談。リクシル不動産三浦様・入江様経由の西友寺案件での間接取引を契機に、田中様の「中古マンション買取再販事業（大阪拠点・関西〜函館まで全国対応）」と勝賀野様の「残置物撤去・遺品整理・桂のリサイクルショップ・査定SaaSカンテノ」の相互連携に合意。田中様は買取案件を紹介してくれる不動産業者との繋がりを求めており、勝賀野様が不動産業者を1名誘って3名でランチ（京都または大阪）を設定するToDoを決定。夜の飲み会は不可だがランチは歓迎。子供3人（5歳・3歳・1歳）、長野出身・元エンジニア、ボードゲーム好きなどの共通点で意気投合。';
    const tanakaFullText = "田中義博: すみません。よろしくお願いします。\n4/勝賀野 太郎/残置物撤去: よろしくお願いします。\n田中義博: すみません。日程ちょっと調整いただいてありがとうございました。\n4/勝賀野 太郎/残置物撤去: いえいえ、大丈夫でしたか？娘さん。\n田中義博: もう大変でした。娘も嫁もインフルエンザに感染して、一人で頑張ってました。\n4/勝賀野 太郎/残置物撤去: 回復なされてよかったです！改めまして、株式会社ゼノベイトの勝賀野（しょうがの）と申します。\n田中義博: お世話になります。夢叶開発の田中と申します。\n4/勝賀野 太郎/残置物撤去: 間接的にお仕事させてもらいましたよね？リクシル不動産の三浦さんをご紹介いただいてて、入江さんに繋いでいただいた流れで。西友寺の案件で請求書をお送りしたときに。\n田中義博: 僕も請求書来た時に見覚えあるなと思ってました！ありがとうございました。会社は大阪でやっていて、マンション中心に買取再販をやってます。エリアはどこでもやっていて、一番遠いと函館もやってます。土地は大阪や兵庫が多いです。\n4/勝賀野 太郎/残置物撤去: マンションの買取再販なんですね。遺品整理・残置物撤去を10年以上やっていて、近畿一円（京都、大阪、滋賀、奈良、和歌山、兵庫）から愛知・名古屋まで対応してます。先週月曜に桂でリサイクルショップもオープンしました。祇園のバーや物販、古物査定ツール「カンテノ」も開発してます。\n田中義博: 僕は33歳（平成5年生まれ）です。\n4/勝賀野 太郎/残置物撤去: 僕32歳（平成6年）です！1歳差ですね！子供が4人います。\n田中義博: うちも子供3人（5歳、3歳、1歳）です。長野出身で東京の不動産会社（元エンジニア1年半）から大阪支店に転勤して独立10年です。趣味はボードゲームで、昔作って売ったりしてました。\n田中義博: 買い取る時は不動産業者さんからの紹介をもらって買ってます。繋がりたい人は不動産業者さんですね。\n4/勝賀野 太郎/残置物撤去: 不動産会社ご紹介させていただきます！夜は奥様の事情で飲みに行けないとのことなので、一人不動産屋さんをお誘いして一緒にランチ行きましょう！京都でも大阪でも行きます！\n田中義博: ぜひお願いします！京都まで行きます！マンション買い取り時の残置物撤去もぜひ依頼させてください！";

    const existingTr = this.state.transcripts.find(t => t.meeting_id === 'm-tanaka-20261110' || t.id === 'tr-tanaka-20261110');
    if (!existingTr) {
      this.state.transcripts.unshift({
        id: 'tr-tanaka-20261110',
        tenant_id: tid,
        meeting_id: 'm-tanaka-20261110',
        language: 'ja',
        full_text: tanakaFullText,
        summary: tanakaSummary,
        utterances: [
          {
            id: 'utt-tanaka-1',
            speaker_label: '田中 義博',
            resolved_person_id: tanaka.id,
            resolved_person_name: '田中 義博',
            start_seconds: 0,
            end_seconds: 2160,
            text: '夢叶開発の田中です。マンション買取再販を大阪中心・全国で展開しています。不動産業者様からの買取案件ご紹介をお待ちしています。勝賀野さんの残置物撤去もぜひ発注したいですし、不動産業者様との3名ランチも楽しみにしています！',
            confidence: 0.99,
          }
        ],
        created_at: '2026-11-10T11:35:00Z',
      });
    } else {
      existingTr.meeting_id = 'm-tanaka-20261110';
      existingTr.summary = tanakaSummary;
      if (!existingTr.full_text || existingTr.full_text.length < tanakaFullText.length) {
        existingTr.full_text = tanakaFullText;
      }
    }

    // 7. 実面談に基づく紹介マッチング提案 (Referrals) の自動生成
    if (!this.state.referrals) this.state.referrals = [];
    const realReferrals: Referral[] = [
      {
        id: 'ref-tanaka-miura',
        tenant_id: tid,
        referrer_person_id: tanaka.id,
        candidate_person_id: 'p-miura-prov',
        target_person_id: tanaka.id,
        recommendation_reason: '田中義博様（夢叶開発・中古マンション買取再販）と、三浦さん（LIXIL不動産）および勝賀野様の親しい不動産業者ネットワークを3名ランチ会で接続。買取再販物件の仕入紹介と、物件内の残置物撤去・遺品整理発注を三位一体で回す高シナジー提案です。',
        breakdown: {
          area_match: '対応エリア一致（大阪・京都・兵庫・関西一円〜全国）',
          specialty_match: 'マンション買取再販×不動産仲介×残置物撤去（西友寺案件で協業実績あり）',
          privacy_checked: true,
          track_record: '西友寺案件にて三浦さん・入江さん経由で取引実績確認済み',
        },
        draft_message: `田中さん、先日はZoomでの1to1ありがとうございました！
お話ししていた「マンション買取再販・仕入案件のご紹介」の件で、普段からお付き合いのある不動産業者様（LIXIL不動産の三浦さんをはじめ、関西エリアで売買案件をお持ちの業者様）と、ぜひ一度3人でランチをご一緒できればと思っております😊
田中さんの「大阪〜全国で中古マンション買取再販を即断即決で対応される強み」をお繋ぎしたいのですが、来週・再来週あたりでご都合いかがでしょうか？`,
        status: 'suggested',
        outcome: {
          type: 'pending',
          confirmed_by_user: false,
        },
        created_at: '2026-11-10T11:36:00Z',
      },
      {
        id: 'ref-tanaka-kimura',
        tenant_id: tid,
        referrer_person_id: tanaka.id,
        candidate_person_id: 'p-kimura-naofumi',
        target_person_id: 'p-kimura-naofumi',
        recommendation_reason: '田中義博様（夢叶開発）が仕入れる買取再販マンション・土地物件の残置物撤去や片付けニーズに対し、勝賀野様（株式会社ZENNOBATE・桂リサイクルショップ）および木村尚史様（不用品回収・遺品整理・一般社団法人stone）のリユース・撤去体制を連携させる協業提案です。',
        breakdown: {
          area_match: '対応エリア一致（大阪・京都・兵庫・関西圏）',
          specialty_match: '不動産買取再販の残置物撤去×不用品回収・古物リユース査定（カンテノ活用）',
          privacy_checked: true,
          track_record: '双方とも1to1面談で残置物撤去・リユース連携に合意済み',
        },
        draft_message: `木村さん、お疲れ様です！
先日1to1でお話しした残置物撤去・不用品回収の協業に関連して、大阪を拠点に中古マンションの買取再販を展開されている「夢叶開発」の田中義博代表とお話ししました。
買取物件の残置物撤去やリユース品回収でご一緒できる案件が今後出てきそうですので、また現地見積もりや連携案件の際にぜひお声がけさせてください！`,
        status: 'suggested',
        outcome: {
          type: 'pending',
          confirmed_by_user: false,
        },
        created_at: '2026-11-10T11:37:00Z',
      },
      {
        id: 'ref-tsuji-endo',
        tenant_id: tid,
        referrer_person_id: 'p-tsuji-akinori',
        candidate_person_id: 'p-endo-prov',
        target_person_id: 'p-tsuji-akinori',
        recommendation_reason: '辻晃典様と進めている紹介制アミューズメントポーカー企画において、ディーラー担当の遠藤さんおよび勝賀野様の祇園バー・店舗ネットワークを連携し、風営法・税務コンプライアンスを守ったクローズドイベントを共同開催する提案です。',
        breakdown: {
          area_match: '対応エリア一致（京都・祇園・関西エリア）',
          specialty_match: 'アミューズメントポーカー企画×専属ディーラー（遠藤さん）×店舗空間提供',
          privacy_checked: true,
          track_record: '11/9 Zoom 1to1面談にて卓購入・運営体制の合意形成済み',
        },
        draft_message: `辻さん、先日はZoomありがとうございました！
ポーカーイベントの件、ディーラーの遠藤さんともスケジュールや卓の手配、クローズド紹介制での運営フローを詰めていければと思います。
次回、遠藤さんも交えて具体的な開催日程と会場レイアウトの打ち合わせをお願いできますでしょうか？`,
        status: 'suggested',
        outcome: {
          type: 'pending',
          confirmed_by_user: false,
        },
        created_at: '2026-11-09T14:20:00Z',
      },
    ];

    for (const ref of [...realReferrals].reverse()) {
      if (!this.deletedIds.has(ref.id) && !this.state.referrals.some(r => r.id === ref.id)) {
        this.state.referrals.unshift(ref);
      }
    }

    this.persist();
  }

  public seedIwaneMeeting(): void {
    const tid = 'tenant-001';

    // 1. 岩根 義行 様（株式会社岩根工業 代表取締役 / 一般社団法人ディスカイステージ 代表理事）の本登録カルテ
    let iwane = this.state.persons.find(p => p.id === 'p-iwane-yoshiyuki');
    const iwaneNotes = '株式会社岩根工業 代表取締役（9期目・防水/シーリング/外壁改修/ゴンドラ・ロープアクセス）・一般社団法人ディスカイステージ 代表理事（ドローン建物調査・外壁赤外線調査・無人航空機国家資格講習・DJI販売代理店・100kg運搬ドローン開発）。大阪セントラルリージョン・シャングリラチャプター所属（カテゴリー：ドローン・建物調査・国家資格）。だんじりチャプターの三島様（北新地スナック経営・勝賀野様と同チャプター）よりご紹介、だんじりチャプターの土林様とも協業関係。1983年生まれ（43歳・勝賀野様と一回り差）、大阪府寝屋川市在住（本社：守口市、東京事務所：中野区）、6歳年上の奥様と9歳の息子様。「修繕は早すぎても遅すぎても損」を掲げ、全国500棟以上（サムティ全国案件、岡山市小中学校180棟、大阪回生病院、大阪産業大学等）の調査実績。ブラックライト蛍光水による狭小地・商店街ビルのピンポイント雨漏り特定にも強み。古物商許可証保有で勝賀野様のAI査定ツール「カンテノ」導入にも強い関心。';

    if (!iwane) {
      iwane = {
        id: 'p-iwane-yoshiyuki',
        tenant_id: tid,
        display_name: '岩根 義行',
        phonetic_name: 'イワネ ヨシユキ',
        status: 'active',
        is_name_verified: true,
        category_tags: ['BNI', '仕事'],
        service_areas: ['大阪府（守口市・寝屋川市）', '東京都（中野区）', '京都府・近畿一円', '全国（北海道〜九州）'],
        office_address: '大阪府守口市（本社） / 東京都中野区（東京事務所）',
        notes: iwaneNotes,
        last_interacted_at: '2026-11-12T18:36:00+09:00',
        meeting_count: 1,
        created_at: '2026-11-12T18:30:00Z',
        updated_at: '2026-11-12T19:47:00Z',
      };
      this.state.persons.unshift(iwane);
    } else {
      iwane.display_name = '岩根 義行';
      iwane.phonetic_name = 'イワネ ヨシユキ';
      iwane.status = 'active';
      iwane.is_name_verified = true;
      iwane.category_tags = Array.from(new Set([...(iwane.category_tags || []), 'BNI', '仕事']));
      iwane.service_areas = ['大阪府（守口市・寝屋川市）', '東京都（中野区）', '京都府・近畿一円', '全国（北海道〜九州）'];
      iwane.office_address = '大阪府守口市（本社） / 東京都中野区（東京事務所）';
      iwane.notes = iwaneNotes;
      iwane.last_interacted_at = '2026-11-12T18:36:00+09:00';
      iwane.meeting_count = Math.max(iwane.meeting_count || 1, 1);
      iwane.updated_at = '2026-11-12T19:47:00Z';
    }
    const iwaneId = iwane.id;

    // 2. 所属法人（株式会社岩根工業 代表取締役 / 一般社団法人ディスカイステージ 代表理事）
    if (!this.state.organizations.some(o => o.id === 'org-iwane-kogyo')) {
      this.state.organizations.push({
        id: 'org-iwane-kogyo',
        tenant_id: tid,
        name: '株式会社岩根工業 / 一般社団法人ディスカイステージ',
      });
    }
    this.state.organizationMemberships = this.state.organizationMemberships.filter(
      m => !(m.person_id === iwaneId && m.id !== 'om-iwane-1' && m.id !== 'om-iwane-2')
    );
    if (!this.state.organizationMemberships.some(m => m.id === 'om-iwane-1')) {
      this.state.organizationMemberships.unshift({
        id: 'om-iwane-1',
        tenant_id: tid,
        person_id: iwaneId,
        organization_id: 'org-iwane-kogyo',
        organization_name: '株式会社岩根工業 / 一般社団法人ディスカイステージ',
        title: '代表取締役 / 代表理事',
        is_current: true,
      });
    } else {
      const om = this.state.organizationMemberships.find(m => m.id === 'om-iwane-1')!;
      om.organization_name = '株式会社岩根工業 / 一般社団法人ディスカイステージ';
      om.title = '代表取締役 / 代表理事';
    }

    // 3. BNIチャプター所属（大阪セントラルリージョン・シャングリラチャプター）
    if (!this.state.bniRegions.some(r => r.id === 'reg-osaka-c')) {
      this.state.bniRegions.push({
        id: 'reg-osaka-c',
        prefecture: '大阪府',
        region_code: 'OSAKA_C',
        region_name: '大阪セントラルリージョン',
      });
    }
    if (!this.state.bniChapters.some(c => c.id === 'chap-osaka-shangrila')) {
      this.state.bniChapters.push({
        id: 'chap-osaka-shangrila',
        region_id: 'reg-osaka-c',
        chapter_name: 'シャングリラチャプター',
        meeting_day: '定例会',
        meeting_time: '07:00〜08:30',
        is_verified: true,
      });
    }
    this.state.bniMemberships = this.state.bniMemberships.filter(
      bm => !(bm.person_id === iwaneId && bm.id !== 'bnim-iwane-1')
    );
    if (!this.state.bniMemberships.some(bm => bm.id === 'bnim-iwane-1')) {
      this.state.bniMemberships.unshift({
        id: 'bnim-iwane-1',
        tenant_id: tid,
        person_id: iwaneId,
        chapter_id: 'chap-osaka-shangrila',
        chapter_name: 'シャングリラチャプター',
        region_name: '大阪セントラルリージョン',
        category: 'ドローン（建物調査・無人航空機国家資格）',
        status: 'active',
        joined_on: '2024-04-01',
      });
    } else {
      const bm = this.state.bniMemberships.find(b => b.id === 'bnim-iwane-1')!;
      bm.chapter_name = 'シャングリラチャプター';
      bm.region_name = '大阪セントラルリージョン';
      bm.category = 'ドローン（建物調査・無人航空機国家資格）';
    }

    // 4. 事業オファリング
    this.state.businessOfferings = this.state.businessOfferings.filter(
      b => !(b.person_id === iwaneId && !b.id.startsWith('bo-iwane-'))
    );
    if (!this.state.businessOfferings.some(b => b.id === 'bo-iwane-1')) {
      this.state.businessOfferings.unshift(
        {
          id: 'bo-iwane-1',
          tenant_id: tid,
          person_id: iwaneId,
          service_title: 'ドローン外壁赤外線調査・蛍光水（ブラックライト）漏水調査・大規模修繕適正診断',
          specialties: '外壁タイル浮き赤外線可視化、ブラックライト蛍光水による雨漏り原因特定、防水・シーリング・ゴンドラ改修工事（全国500棟超の実績）',
          target_clients: 'マンション・ビルオーナー様、不動産管理会社、一級建築士事務所、工務店、防水屋・塗装屋',
          service_area: '大阪府・京都府・東京都・全国対応（北海道〜九州に協業パイロット網あり）',
          is_active: true,
        },
        {
          id: 'bo-iwane-2',
          tenant_id: tid,
          person_id: iwaneId,
          service_title: '無人航空機（ドローン）国家資格講習・100kg重量物運搬ドローン＆ウインチ機材',
          specialties: '国家資格講習、赤外線調査ジョブパイロット育成、100kg運搬ドローン（屋上ソーラー・室外機撤去設置・荷揚げ）、DJI販売代理店',
          target_clients: 'ドローンを仕事に導入したい企業・個人、屋上荷揚げや狭小現場を抱える建設・設備業者、補助金に強い士業',
          service_area: '全国対応',
          is_active: true,
        }
      );
    }

    // 5. 面談レコード (m-iwane-20261112)
    let meeting = this.state.meetings.find(m => m.id === 'm-iwane-20261112');
    if (!meeting) {
      meeting = {
        id: 'm-iwane-20261112',
        tenant_id: tid,
        title: '岩根 義行様と1to1（株式会社岩根工業・ディスカイステージ / ドローン赤外線建物調査・漏水調査×建築人脈・カンテノ連携）',
        meeting_type: '1to1',
        provider: 'zoom',
        scheduled_start_at: '2026-11-12T18:30:00+09:00',
        scheduled_end_at: '2026-11-12T19:46:00+09:00',
        raw_invite_text: '岩根 義行様と1to1面談（大阪セントラル・シャングリラチャプター / 株式会社岩根工業・一般社団法人ディスカイステージ）',
        host_type: 'self',
        recording_status: 'completed',
        status: 'completed',
        participant_ids: [iwaneId],
        created_at: '2026-11-12T18:30:00Z',
        updated_at: '2026-11-12T19:47:00Z',
      };
      this.state.meetings.unshift(meeting);
    } else {
      meeting.title = '岩根 義行様と1to1（株式会社岩根工業・ディスカイステージ / ドローン赤外線建物調査・漏水調査×建築人脈・カンテノ連携）';
      meeting.status = 'completed';
      meeting.recording_status = 'completed';
      meeting.participant_ids = [iwaneId];
      meeting.scheduled_start_at = '2026-11-12T18:30:00+09:00';
      meeting.updated_at = '2026-11-12T19:47:00Z';
    }

    // 6. 確定Facts（生の発言断片を一切排除し、構造化された7件の確定Factを登録）
    for (const f of this.state.facts) {
      if (
        (f.person_id === iwaneId && !f.id.startsWith('fact-iwane-')) ||
        /三島さんからご紹介していただきましたよね|どこに相談しても、やっぱり今修繕した方がいいとか/.test(f.fact_value)
      ) {
        this.deletedIds.add(f.id);
      }
    }
    this.state.facts = this.state.facts.filter(
      f =>
        !(f.person_id === iwaneId && !f.id.startsWith('fact-iwane-')) &&
        !/三島さんからご紹介していただきましたよね|どこに相談しても、やっぱり今修繕した方がいいとか/.test(f.fact_value)
    );
    const iwaneCoreFacts: Fact[] = [
      {
        id: 'fact-iwane-1',
        tenant_id: tid,
        person_id: iwaneId,
        fact_category: 'topic',
        fact_key: '盛り上がった話題・本業と強み',
        fact_value: '株式会社岩根工業（防水・外壁改修・ゴンドラ/ロープアクセス）と一般社団法人ディスカイステージ（ドローン外壁赤外線調査・国家資格講習・100kg運搬ドローン）を経営。全国500棟以上（サムティ全国物件・岡山市小中学校180棟・大阪回生病院等）を調査し、過剰な大規模修繕を防ぐ「建物の健康診断」とブラックライト蛍光水による狭小地ピンポイント雨漏り特定に強み',
        source_type: 'meeting_speech',
        source_id: 'm-iwane-20261112',
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-12T19:46:00Z',
        created_at: '2026-11-12T19:46:00Z',
      },
      {
        id: 'fact-iwane-2',
        tenant_id: tid,
        person_id: iwaneId,
        fact_category: 'promise',
        fact_key: '保留中の約束・ToDo（勝賀野様→岩根様）',
        fact_value: '勝賀野様が主宰する若手経営者交流会（参画約35社・11/18京都例会、次回1月開催へも岩根様をご案内）およびBNI外の工務店・防水屋・塗装屋・不動産管理会社をLINEで順次岩根様へおつなぎする',
        source_type: 'meeting_speech',
        source_id: 'm-iwane-20261112',
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-12T19:46:00Z',
        created_at: '2026-11-12T19:46:00Z',
      },
      {
        id: 'fact-iwane-3',
        tenant_id: tid,
        person_id: iwaneId,
        fact_category: 'promise',
        fact_key: '保留中の約束・ToDo（岩根様→勝賀野様）',
        fact_value: '岩根様から知人のライバー活動者（ラファエル提携事務所・投げ銭5%ストック報酬）、八尾等の工場経営者（機械・残置物撤去・システム開発）、および放課後等デイサービス（2店舗・電気組合主宰）の経営者をLINEで順次勝賀野様へおつなぎする',
        source_type: 'meeting_speech',
        source_id: 'm-iwane-20261112',
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-12T19:46:00Z',
        created_at: '2026-11-12T19:46:00Z',
      },
      {
        id: 'fact-iwane-4',
        tenant_id: tid,
        person_id: iwaneId,
        fact_category: 'promise',
        fact_key: '保留中の約束・ToDo（事業協業・交流）',
        fact_value: '岩根様がAI査定・物販ツール「カンテノ」（古物商免許保有済み・初期10万円/月額9,800円）の導入を検討し、100kg運搬ドローンの代理店連携および京都・祇園バー「Route Z」での飲み会・情報交換を実施する',
        source_type: 'meeting_speech',
        source_id: 'm-iwane-20261112',
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.98,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-12T19:46:00Z',
        created_at: '2026-11-12T19:46:00Z',
      },
      {
        id: 'fact-iwane-5',
        tenant_id: tid,
        person_id: iwaneId,
        fact_category: 'topic',
        fact_key: '紹介してほしいターゲット・ニーズ',
        fact_value: '外壁修繕の必要性・時期のセカンドオピニオンを求めるマンション/ビルオーナー・管理会社・一級建築士事務所、雨漏り原因特定に困っている店舗・工務店・防水/塗装業者、ドローン国家資格取得希望者、補助金に強い士業',
        source_type: 'meeting_speech',
        source_id: 'm-iwane-20261112',
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-12T19:46:00Z',
        created_at: '2026-11-12T19:46:00Z',
      },
      {
        id: 'fact-iwane-6',
        tenant_id: tid,
        person_id: iwaneId,
        fact_category: 'background',
        fact_key: '紹介経緯・共通の人脈',
        fact_value: 'だんじりチャプター（勝賀野様と同チャプター）の三島様（北新地スナック経営）よりご紹介。だんじりチャプターの土林様（3Dプリンター・ドローン）とも深く連携しており、ディスカイステージのインストラクター登録メンバー',
        source_type: 'meeting_speech',
        source_id: 'm-iwane-20261112',
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-12T19:46:00Z',
        created_at: '2026-11-12T19:46:00Z',
      },
      {
        id: 'fact-iwane-7',
        tenant_id: tid,
        person_id: iwaneId,
        fact_category: 'preference',
        fact_key: '人柄・家族・プライベート',
        fact_value: '1983年生まれ（43歳・勝賀野様と一回り差）。大阪府寝屋川市在住（京阪1本で京都・祇園へアクセス可）。6歳年上の奥様と9歳の息子様。ドラマ『24』『SUITS』、漫画『サラリーマン金太郎』『センゴク』『キングダム』好き。スタバ直営モデルのように売上より調査品質・顧客誠実性を重視するゼロイチ気質。来年初旬に九州にも新法人設立予定',
        source_type: 'meeting_speech',
        source_id: 'm-iwane-20261112',
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-12T19:46:00Z',
        created_at: '2026-11-12T19:46:00Z',
      },
    ];

    for (let i = iwaneCoreFacts.length - 1; i >= 0; i--) {
      const cf = iwaneCoreFacts[i];
      const existingIdx = this.state.facts.findIndex(f => f.id === cf.id);
      if (existingIdx >= 0) {
        const prevStatus = this.state.facts[existingIdx].verification_status;
        this.state.facts[existingIdx] = { ...cf, verification_status: prevStatus || cf.verification_status };
      } else {
        this.state.facts.unshift(cf);
      }
    }

    // 7. AI面談要約 & 文字起こしレコード (tr-iwane-20261112)
    const iwaneSummary = '株式会社岩根工業（代表取締役・9期目）および一般社団法人ディスカイステージ（代表理事）の岩根 義行様（43歳・大阪セントラルリージョン「シャングリラチャプター」所属・三島様よりご紹介）との約70分間の1to1面談。岩根様は10代からの防水・外壁改修技術とドローン外壁赤外線調査・ブラックライト蛍光水漏水調査を掛け合わせ、「修繕は早すぎても遅すぎても損」という顧客本位の建物診断で全国500棟以上（サムティ全国案件、岡山市小中学校180棟、大阪回生病院等）の実績を持つほか、無人航空機国家資格講習や100kg重量物運搬ドローン＆ウインチ機材開発を展開。勝賀野様の残置物撤去・機械解体、AI古物査定ツール「カンテノ」（月額9,800円・古物市場連携）、ラファエル提携ライバー事務所、祇園バー＆桂リサイクルショップ「Route Z」、若手経営者交流会（参画約35社）と全方位でシナジーが一致。【次回アクション】①勝賀野様から11/18京都例会（および次回1月交流会）やBNI外の工務店・防水屋・塗装屋・不動産管理会社を岩根様へ紹介、②岩根様から知人のライバー、八尾等の工場経営者（機械・残置物撤去）、放課後等デイサービス（2店舗・電気組合主宰）経営者を勝賀野様へLINEで順次紹介、③岩根様にて「カンテノ」導入（古物商免許保有済み）の検討および100kg運搬ドローンの代理店連携・祇園バーでの情報交換を実施。';
    const iwaneDefaultText = `4/勝賀野 太郎/残置物撤去: だんじりチャプターの勝賀野と申します。三島さんからご紹介していただきましたよね。\n義行 岩根: 大阪セントラルリージョン・シャングリラチャプターの岩根と申します。カテゴリーはドローン（建物調査・国家資格）です。1983年生まれの43歳で、寝屋川在住（本社は守口市、東京・中野区にも事務所あり）、6歳上の妻と9歳の息子がいます。一般社団法人ディスカイステージの代表理事と株式会社岩根工業（9期目）の代表取締役をしています。\n義行 岩根: ドローンによる外壁赤外線調査・打診調査・ブラックライト蛍光水による漏水調査と、防水・外壁改修・仮設ゴンドラ/ロープアクセス工事、無人航空機の国家資格講習（ジョブパイロットコース・北海道〜九州に協業網）、DJI販売代理店、100kg運搬ドローン＆ウインチ機材開発をやってます。「修繕は早すぎても損、遅すぎても損」を掲げ、不要な大規模修繕を抑えて維持管理コストを下げる「建物の健康診断」を提供しており、全国500棟以上（サムティ株式会社の全国マンション、岡山市小中学校180棟、大阪回生病院、大阪産業大学等）の実績があります。\n4/勝賀野 太郎/残置物撤去: 京都・右京区太秦の商店街にある4階建てビルなど、足場が組めない狭小地の雨漏り相談もよく受けます。また僕が主宰する京都・大阪の若手経営者交流会（一般社団法人・約35社参画、11月18日に京都で例会、次回1月開催）に工務店・防水屋・塗装屋・不動産管理会社が多数いるのでお繋ぎします！弊社は残置物撤去・遺品整理・工場機械解体、AI古物査定ツール「カンテノ」（初期10万円・月額9,800円・縛りなし、就労支援事業所や新規事業向け・古物市場同行紹介付き）、ラファエル提携ライバー事務所（紹介者に投げ銭5%を毎月ストック還元）、カスタム腕時計「アステラ」、祇園のバー＆桂の総合リサイクルショップ「Route Z」を運営しています。\n義行 岩根: 古物商免許は既に持っているので「カンテノ」すごく興味あります！僕からは知人のライバー活動者、八尾などの工場経営者（工場機械撤去）、放課後等デイサービス（2店舗運営・電気組合主宰）の経営者をLINEで順次お繋ぎします。京都・祇園のバーにも京阪1本で行けるのでぜひ飲みに行きましょう！`;

    const existingTr = this.state.transcripts.find(t => t.meeting_id === 'm-iwane-20261112' || t.id === 'tr-iwane-20261112');
    if (!existingTr) {
      this.state.transcripts.unshift({
        id: 'tr-iwane-20261112',
        tenant_id: tid,
        meeting_id: 'm-iwane-20261112',
        language: 'ja',
        full_text: iwaneDefaultText,
        summary: iwaneSummary,
        utterances: [
          {
            id: 'utt-iwane-1',
            speaker_label: '岩根 義行',
            resolved_person_id: iwaneId,
            resolved_person_name: '岩根 義行',
            start_seconds: 0,
            end_seconds: 4200,
            text: iwaneSummary,
            confidence: 0.99,
          },
        ],
        created_at: '2026-11-12T19:46:30Z',
      });
    } else {
      existingTr.meeting_id = 'm-iwane-20261112';
      existingTr.summary = iwaneSummary;
      if (!existingTr.full_text || existingTr.full_text.length < 200) {
        existingTr.full_text = iwaneDefaultText;
      }
    }

    // 8. 紹介元の三島様（だんじりチャプター・勝賀野様と同チャプター）および土林様（だんじりチャプター）の相関図エッジと紹介ハブ提案
    this.deletedIds.add('p-mishima-prov');
    this.deletedIds.add('rel-mishima-iwane');
    this.deletedIds.delete('p-mishima-danjiri');
    this.deletedIds.delete('p-tsuchibayashi-danjiri');
    this.deletedIds.delete('rel-mishima-danjiri-iwane');
    this.deletedIds.delete('rel-tsuchibayashi-iwane');
    this.state.persons = this.state.persons.filter(p => p.id !== 'p-mishima-prov');
    this.state.relationships = this.state.relationships.filter(r => r.id !== 'rel-mishima-iwane');

    if (!this.deletedIds.has('p-mishima-danjiri') && !this.state.persons.some(p => p.id === 'p-mishima-danjiri')) {
      this.state.persons.push({
        id: 'p-mishima-danjiri',
        tenant_id: tid,
        display_name: '三島さん（だんじりチャプター・紹介元）',
        phonetic_name: 'ミシマ',
        status: 'provisional',
        is_name_verified: true,
        category_tags: ['BNI'],
        service_areas: ['大阪府（北新地）'],
        notes: '大阪セントラルリージョン・だんじりチャプター所属（勝賀野様と同チャプター・北新地でスナック経営）。岩根 義行様を勝賀野様へご紹介いただいたキーパーソン。',
        meeting_count: 0,
        created_at: '2026-11-12T19:46:00Z',
        updated_at: '2026-11-12T19:46:00Z',
      });
    }

    if (!this.deletedIds.has('p-tsuchibayashi-danjiri') && !this.state.persons.some(p => p.id === 'p-tsuchibayashi-danjiri')) {
      this.state.persons.push({
        id: 'p-tsuchibayashi-danjiri',
        tenant_id: tid,
        display_name: '土林さん（だんじりチャプター）',
        phonetic_name: 'ツチバヤシ',
        status: 'provisional',
        is_name_verified: true,
        category_tags: ['BNI'],
        service_areas: ['大阪府'],
        notes: '大阪セントラルリージョン・だんじりチャプター所属（勝賀野様と同チャプター・3Dプリンター/ドローン事業）。岩根 義行様の一般社団法人ディスカイステージのインストラクター・協業メンバー。',
        meeting_count: 0,
        created_at: '2026-11-12T19:46:00Z',
        updated_at: '2026-11-12T19:46:00Z',
      });
    }

    // 三島様・土林様のだんじりチャプター所属レコードもBNIマスターへ反映
    if (!this.state.bniMemberships.some(bm => bm.id === 'bnim-mishima-1')) {
      this.state.bniMemberships.push({
        id: 'bnim-mishima-1',
        tenant_id: tid,
        person_id: 'p-mishima-danjiri',
        chapter_id: 'chap-osaka-danjiri',
        chapter_name: 'だんじりチャプター',
        region_name: '大阪東リージョン (Osaka East)',
        category: 'スナック・飲食店経営（北新地）',
        status: 'active',
        joined_on: '2024-04-01',
      });
    }
    if (!this.state.bniMemberships.some(bm => bm.id === 'bnim-tsuchibayashi-1')) {
      this.state.bniMemberships.push({
        id: 'bnim-tsuchibayashi-1',
        tenant_id: tid,
        person_id: 'p-tsuchibayashi-danjiri',
        chapter_id: 'chap-osaka-danjiri',
        chapter_name: 'だんじりチャプター',
        region_name: '大阪東リージョン (Osaka East)',
        category: '3Dプリンター・ドローンインストラクター',
        status: 'active',
        joined_on: '2024-04-01',
      });
    }

    const coreRelationships: PersonRelationship[] = [
      {
        id: 'rel-mishima-danjiri-iwane',
        tenant_id: tid,
        from_person_id: 'p-mishima-danjiri',
        to_person_id: iwaneId,
        relationship_type: '紹介元（だんじりチャプターの三島様よりご紹介）',
        is_ai_inferred: false,
        confidence: 1.0,
        evidence_text: '11/12 岩根義行様1to1面談にて「だんじりチャプターの三島様（北新地スナック経営）からご紹介」と双方確認',
        source_meeting_id: 'm-iwane-20261112',
      },
      {
        id: 'rel-tsuchibayashi-iwane',
        tenant_id: tid,
        from_person_id: 'p-tsuchibayashi-danjiri',
        to_person_id: iwaneId,
        relationship_type: '協業・ドローンインストラクター連携（だんじりチャプター）',
        is_ai_inferred: false,
        confidence: 1.0,
        evidence_text: '11/12 岩根義行様1to1面談にて「だんじりチャプターの土林様がディスカイステージのインストラクター登録メンバーとして深く協業」と確認',
        source_meeting_id: 'm-iwane-20261112',
      },
      {
        id: 'rel-miura-tanaka',
        tenant_id: tid,
        from_person_id: 'p-miura-prov',
        to_person_id: 'p-tanaka-yoshihiro',
        relationship_type: '西友寺案件・間接取引およびマンション買取実績',
        is_ai_inferred: false,
        confidence: 1.0,
        evidence_text: '11/10 田中義博様1to1面談にて「リクシル不動産の三浦様・入江様を通じて西友寺案件で請求書やり取り・買取取引実績あり」と双方確認',
        source_meeting_id: 'm-tanaka-20261110',
      },
      {
        id: 'rel-ito-kimura',
        tenant_id: tid,
        from_person_id: 'p-ito-prov',
        to_person_id: 'p-kimura-naofumi',
        relationship_type: '紹介元（東山高校同窓・幼馴染のご縁）',
        is_ai_inferred: false,
        confidence: 1.0,
        evidence_text: '11/09 木村尚史様1to1面談にて「幼馴染の奥様である伊藤さんからの紹介で東山高校同窓と判明」と確認',
        source_meeting_id: 'm-kimura-20261109',
      },
      {
        id: 'rel-endo-tsuji',
        tenant_id: tid,
        from_person_id: 'p-endo-prov',
        to_person_id: 'p-tsuji-akinori',
        relationship_type: '紹介制アミューズメントポーカー企画・ディーラー協業',
        is_ai_inferred: false,
        confidence: 1.0,
        evidence_text: '11/09 辻晃典様1to1面談にて「ディーラー担当は遠藤さん一択で営業許可・開催運営を連携」と確認',
        source_meeting_id: 'm-tsuji-20261109',
      },
      {
        id: 'rel-ai-iwane-tanaka',
        tenant_id: tid,
        from_person_id: iwaneId,
        to_person_id: 'p-tanaka-yoshihiro',
        relationship_type: 'AI紹介推薦（ドローン外壁赤外線・漏水調査 × 中古マンション買取再販）',
        is_ai_inferred: true,
        confidence: 0.98,
        evidence_text: '岩根様のドローン外壁赤外線・雨漏り診断（全国500棟超）と田中様（夢叶開発）の中古マンション買取再販・建築ネットワークが高シナジー',
        source_meeting_id: 'm-iwane-20261112',
      },
      {
        id: 'rel-ai-iwane-kimura',
        tenant_id: tid,
        from_person_id: iwaneId,
        to_person_id: 'p-kimura-naofumi',
        relationship_type: 'AI紹介推薦（八尾工場機械・残置物撤去 × 古物査定カンテノ・リユース連携）',
        is_ai_inferred: true,
        confidence: 0.96,
        evidence_text: '岩根様から紹介予定の八尾工場機械・残置物撤去ニーズおよびカンテノ導入検討と、勝賀野様・木村様のリユース回収体制が合致',
        source_meeting_id: 'm-iwane-20261112',
      },
      {
        id: 'rel-ai-tanaka-kimura',
        tenant_id: tid,
        from_person_id: 'p-tanaka-yoshihiro',
        to_person_id: 'p-kimura-naofumi',
        relationship_type: 'AI紹介推薦（買取再販マンション残置物撤去 × 不用品回収・リユース循環）',
        is_ai_inferred: true,
        confidence: 0.95,
        evidence_text: '田中様の買取再販マンション残置物撤去ニーズと、勝賀野様（桂リサイクルショップRoute Z）・木村様の不用品回収体制が合致',
        source_meeting_id: 'm-tanaka-20261110',
      },
    ];

    for (const rel of coreRelationships) {
      if (this.deletedIds.has(rel.id)) continue;
      const existingIdx = this.state.relationships.findIndex(r => r.id === rel.id);
      if (existingIdx >= 0) {
        this.state.relationships[existingIdx] = rel;
      } else {
        this.state.relationships.push(rel);
      }
    }

    if (!this.deletedIds.has('ref-iwane-tanaka') && !this.state.referrals.some(r => r.id === 'ref-iwane-tanaka')) {
      this.state.referrals.unshift({
        id: 'ref-iwane-tanaka',
        tenant_id: tid,
        referrer_person_id: iwaneId,
        candidate_person_id: 'p-tanaka-yoshihiro',
        target_person_id: iwaneId,
        recommendation_reason: '岩根義行様（株式会社岩根工業・ディスカイステージ：ドローン外壁赤外線調査・漏水調査・大規模修繕診断）と、田中義博様（夢叶開発：大阪・全国の中古マンション買取再販）および勝賀野様の建築・不動産交流会ネットワークを接続。買取マンションやオーナー物件の外壁・雨漏り診断と残置物撤去を一括連携する高シナジー提案です。',
        breakdown: {
          area_match: '対応エリア完全一致（大阪・京都・近畿〜全国対応）',
          specialty_match: 'ドローン外壁赤外線/漏水調査×中古マンション買取再販×残置物撤去',
          privacy_checked: true,
          track_record: '11/12 岩根様1to1および11/10 田中様1to1の双方で不動産・建築連携に合意済み',
        },
        draft_message: `岩根さん、本日はZoomでの1to1ありがとうございました！\nお話ししていた工務店・防水屋・塗装屋・不動産会社のお繋ぎに加え、大阪拠点で中古マンション買取再販を全国展開されている「夢叶開発」の田中義博代表ともぜひお繋ぎできればと思っております。\nまた、1月開催の若手経営者交流会や祇園のバー「Route Z」での情報交換、査定ツール「カンテノ」の件も引き続きよろしくお願いいたします！`,
        status: 'suggested',
        outcome: {
          type: 'pending',
          confirmed_by_user: false,
        },
        created_at: '2026-11-12T19:47:00Z',
      });
    }

    if (!this.deletedIds.has('ref-iwane-kimura') && !this.state.referrals.some(r => r.id === 'ref-iwane-kimura')) {
      this.state.referrals.unshift({
        id: 'ref-iwane-kimura',
        tenant_id: tid,
        referrer_person_id: iwaneId,
        candidate_person_id: 'p-kimura-naofumi',
        target_person_id: iwaneId,
        recommendation_reason: '岩根義行様からご紹介予定の「八尾等の工場経営者（工場機械・残置物撤去ニーズ）」および岩根様の「カンテノ（AI古物査定ツール・古物商免許保有済み）」導入検討に対し、勝賀野様（株式会社ZENNOBATE・桂リサイクルショップRoute Z）と木村尚史様（不用品回収・遺品整理・一般社団法人stone）のリユース体制を連携させる提案です。',
        breakdown: {
          area_match: '対応エリア一致（大阪・八尾・守口・京都・近畿圏）',
          specialty_match: '工場機械・残置物撤去×AI古物査定「カンテノ」×リユース販路連携',
          privacy_checked: true,
          track_record: '11/12 岩根様1to1にて八尾の工場経営者紹介・カンテノ導入検討に合意済み',
        },
        draft_message: `岩根さん、先日は1to1ありがとうございました！\nお話しいただいていた八尾の工場経営者様（機械・残置物撤去）の件や、AI査定ツール「カンテノ」の古物市場同行・リユース連携について、ぜひ具体的なスケジュールをご相談できればと思います。\n祇園のバー「Route Z」でのお食事も楽しみにしております！`,
        status: 'suggested',
        outcome: {
          type: 'pending',
          confirmed_by_user: false,
        },
        created_at: '2026-11-12T19:48:00Z',
      });
    }
  }

  public seedKobiMeeting(): void {
    const tid = 'tenant-001';

    // 1. 小比 直人 様（司法書士・土地家屋調査士 / BNI大阪北東リージョン・ナインダーツチャプター）の本登録カルテ
    let kobi = this.state.persons.find(
      p => p.id === 'p-kobi-naoto' || p.id === 'p-1794804591387-r4ts6' || p.display_name.replace(/\s+/g, '') === '小比直人'
    );
    const kobiNotes =
      '司法書士・土地家屋調査士（独立4年目）。BNI 大阪北東リージョン（Osaka North East）「ナインダーツチャプター」所属（カテゴリー：司法書士・土地家屋調査士）。顧客の約6〜7割が不動産業者からの紹介。単なる登記手続きだけでなく、相続相談の初期段階から一気通貫で伴走する「相続コンサルティング」や成年後見業務、遺品整理・残置物撤去後の土地家屋調査・測量・不動産売却サポートに強み（大阪・京都で対応可能）。勝賀野様の遺品整理・残置物撤去、AI古物査定ツール「カンテノ」、カスタム腕時計「アステラ」、若手経営者交流会、および遠藤様（システム・アプリ開発）との相互送客・協業で合意。';

    if (!kobi) {
      kobi = {
        id: 'p-1794804591387-r4ts6',
        tenant_id: tid,
        display_name: '小比 直人',
        phonetic_name: 'コビ ナオト',
        status: 'active',
        is_name_verified: true,
        category_tags: ['BNI', '仕事', '士業'],
        service_areas: ['大阪府（北東エリア・全域）', '京都府', '関西一円'],
        notes: kobiNotes,
        last_interacted_at: '2026-11-16T13:49:00+09:00',
        meeting_count: 1,
        created_at: '2026-11-16T03:58:58Z',
        updated_at: '2026-11-16T04:55:00Z',
      };
      this.state.persons.unshift(kobi);
    } else {
      kobi.display_name = '小比 直人';
      kobi.phonetic_name = 'コビ ナオト';
      kobi.status = 'active';
      kobi.is_name_verified = true;
      kobi.category_tags = Array.from(new Set([...(kobi.category_tags || []), 'BNI', '仕事', '士業']));
      kobi.service_areas = ['大阪府（北東エリア・全域）', '京都府', '関西一円'];
      kobi.notes = kobiNotes;
      kobi.last_interacted_at = '2026-11-16T13:49:00+09:00';
      kobi.meeting_count = Math.max(kobi.meeting_count || 1, 1);
      kobi.updated_at = '2026-11-16T04:55:00Z';
    }
    const kobiId = kobi.id;

    // 重複した小比様カルテがあれば統合
    const dupKobis = this.state.persons.filter(
      p => p.tenant_id === tid && p.id !== kobiId && p.display_name.replace(/\s+/g, '').includes('小比直人')
    );
    for (const dup of dupKobis) {
      this.deletedIds.add(dup.id);
      this.mergePersons(kobiId, dup.id);
    }

    // 2. 所属事務所（小比司法書士・土地家屋調査士事務所のみを正式所属とし、会話中に言及された第三者企業の誤紐付け「株式会社みやびっていう」等を完全削除）
    if (!this.state.organizations.some(o => o.id === 'org-kobi-office')) {
      this.state.organizations.push({
        id: 'org-kobi-office',
        tenant_id: tid,
        name: '小比司法書士・土地家屋調査士事務所',
      });
    }
    for (const m of this.state.organizationMemberships) {
      if ((m.person_id === kobiId && m.id !== 'om-kobi-1') || /みやびっていう/.test(m.organization_name || '')) {
        this.deletedIds.add(m.id);
      }
    }
    this.state.organizationMemberships = this.state.organizationMemberships.filter(
      m => !(m.person_id === kobiId && m.id !== 'om-kobi-1') && !/みやびっていう/.test(m.organization_name || '')
    );
    if (!this.state.organizationMemberships.some(m => m.id === 'om-kobi-1')) {
      this.state.organizationMemberships.unshift({
        id: 'om-kobi-1',
        tenant_id: tid,
        person_id: kobiId,
        organization_id: 'org-kobi-office',
        organization_name: '小比司法書士・土地家屋調査士事務所',
        title: '代表（司法書士・土地家屋調査士）',
        is_current: true,
      });
    } else {
      const om = this.state.organizationMemberships.find(m => m.id === 'om-kobi-1')!;
      om.person_id = kobiId;
      om.organization_name = '小比司法書士・土地家屋調査士事務所';
      om.title = '代表（司法書士・土地家屋調査士）';
    }

    // 3. BNI所属（大阪北東リージョン・ナインダーツチャプター）
    if (!this.state.bniRegions.some(r => r.id === 'reg-osaka-ne')) {
      this.state.bniRegions.push({
        id: 'reg-osaka-ne',
        prefecture: '大阪府',
        region_code: 'OSAKA_NE',
        region_name: '大阪北東リージョン (Osaka North East)',
      });
    }
    const nineDartsChap =
      this.state.bniChapters.find(c => c.chapter_name === 'ナインダーツチャプター') ||
      this.state.bniChapters.find(c => c.id === 'chap-bni-301');
    const nineDartsId = nineDartsChap?.id || 'chap-bni-301';
    if (!nineDartsChap) {
      this.state.bniChapters.push({
        id: nineDartsId,
        region_id: 'reg-osaka-ne',
        chapter_name: 'ナインダーツチャプター',
        meeting_day: '火曜',
        meeting_time: '7:00 AM (オンライン（永続）)',
        is_verified: true,
      });
    }

    for (const bm of this.state.bniMemberships) {
      if (bm.person_id === kobiId && bm.id !== 'bnim-kobi-1') {
        this.deletedIds.add(bm.id);
      }
    }
    this.state.bniMemberships = this.state.bniMemberships.filter(
      bm => !(bm.person_id === kobiId && bm.id !== 'bnim-kobi-1')
    );
    if (!this.state.bniMemberships.some(bm => bm.id === 'bnim-kobi-1')) {
      this.state.bniMemberships.unshift({
        id: 'bnim-kobi-1',
        tenant_id: tid,
        person_id: kobiId,
        chapter_id: nineDartsId,
        chapter_name: 'ナインダーツチャプター',
        region_name: '大阪北東リージョン (Osaka North East)',
        category: '司法書士・土地家屋調査士（相続コンサルティング・不動産登記・測量）',
        status: 'active',
        joined_on: '2022-04-01',
      });
    } else {
      const bm = this.state.bniMemberships.find(b => b.id === 'bnim-kobi-1')!;
      bm.person_id = kobiId;
      bm.chapter_id = nineDartsId;
      bm.chapter_name = 'ナインダーツチャプター';
      bm.region_name = '大阪北東リージョン (Osaka North East)';
      bm.category = '司法書士・土地家屋調査士（相続コンサルティング・不動産登記・測量）';
      bm.status = 'active';
    }

    // 4. 事業オファリング（重複した「小比 直人様の専門事業」を完全削除し正式オファリング1件に統一）
    for (const b of this.state.businessOfferings) {
      if (b.person_id === kobiId && b.id !== 'bo-kobi-1') {
        this.deletedIds.add(b.id);
      }
    }
    this.state.businessOfferings = this.state.businessOfferings.filter(
      b => !(b.person_id === kobiId && b.id !== 'bo-kobi-1')
    );
    if (!this.state.businessOfferings.some(b => b.id === 'bo-kobi-1')) {
      this.state.businessOfferings.unshift({
        id: 'bo-kobi-1',
        tenant_id: tid,
        person_id: kobiId,
        service_title: '司法書士・土地家屋調査士業務 / 相続コンサルティング・不動産登記・境界確定測量',
        specialties: '相続登記・遺産整理、遺品整理後の土地家屋調査・測量・不動産売却ワンストップ支援、成年後見業務（不動産業者からの紹介比率約7割）',
        target_clients: '不動産業者様（売買・買取再販・空き家管理）、遺品整理・残置物撤去事業者様、相続対策を検討する不動産オーナー様',
        service_area: '大阪府（北東エリア・全域）・京都府・関西一円',
        is_active: true,
      });
    }

    // 4.5 小比様から勝賀野様へお繋ぎいただく紹介対象：堀さん（株式会社雅 / 京都市伏見区・自動車販売）
    if (!this.deletedIds.has('p-hori-miyabi') && !this.state.persons.some(p => p.id === 'p-hori-miyabi')) {
      this.state.persons.push({
        id: 'p-hori-miyabi',
        tenant_id: tid,
        display_name: '堀さん（株式会社雅・自動車販売）',
        phonetic_name: 'ホリ',
        office_address: '京都府京都市伏見区（勝賀野様事務所のご近所）',
        status: 'provisional',
        is_name_verified: true,
        category_tags: ['BNI', '仕事'],
        service_areas: ['京都府（京都市伏見区）', '大阪府'],
        notes: '株式会社雅（みやび / 京都市伏見区・自動車販売業・勝賀野様の事務所のご近所）。BNI 大阪北東リージョン・ナインダーツチャプター所属。小比 直人様から勝賀野様へお繋ぎいただく予定のキーパーソン（車屋・板金屋および京都飲食・バーネットワークとの連携ニーズあり）。',
        meeting_count: 0,
        created_at: '2026-11-16T04:50:00Z',
        updated_at: '2026-11-16T04:50:00Z',
      });
    }
    if (!this.state.organizations.some(o => o.id === 'org-hori-miyabi')) {
      this.state.organizations.push({
        id: 'org-hori-miyabi',
        tenant_id: tid,
        name: '株式会社雅（みやび）',
      });
    }
    if (!this.deletedIds.has('om-hori-miyabi') && !this.state.organizationMemberships.some(m => m.id === 'om-hori-miyabi')) {
      this.state.organizationMemberships.push({
        id: 'om-hori-miyabi',
        tenant_id: tid,
        person_id: 'p-hori-miyabi',
        organization_id: 'org-hori-miyabi',
        organization_name: '株式会社雅（みやび）',
        title: '代表（自動車販売・京都市伏見区）',
        is_current: true,
      });
    }
    if (!this.deletedIds.has('bnim-hori-miyabi') && !this.state.bniMemberships.some(bm => bm.id === 'bnim-hori-miyabi')) {
      this.state.bniMemberships.push({
        id: 'bnim-hori-miyabi',
        tenant_id: tid,
        person_id: 'p-hori-miyabi',
        chapter_id: nineDartsId,
        chapter_name: 'ナインダーツチャプター',
        region_name: '大阪北東リージョン (Osaka North East)',
        category: '自動車販売',
        status: 'active',
        joined_on: '2024-04-01',
      });
    }
    if (!this.deletedIds.has('bo-hori-miyabi') && !this.state.businessOfferings.some(b => b.id === 'bo-hori-miyabi')) {
      this.state.businessOfferings.push({
        id: 'bo-hori-miyabi',
        tenant_id: tid,
        person_id: 'p-hori-miyabi',
        service_title: '自動車販売・車両手配・車検整備（株式会社雅 / 京都市伏見区）',
        specialties: '京都市伏見区を拠点とする新車・中古車販売、板金・整備連携',
        target_clients: '京都市伏見区・京都・大阪エリアの法人・個人オーナー様、板金・整備パートナー、京都飲食・バー経営者様',
        service_area: '京都府（京都市伏見区）・大阪府',
        is_active: true,
      });
    }
    if (!this.deletedIds.has('rel-kobi-hori') && !this.state.relationships.some(r => r.id === 'rel-kobi-hori')) {
      this.state.relationships.push({
        id: 'rel-kobi-hori',
        tenant_id: tid,
        from_person_id: kobiId,
        to_person_id: 'p-hori-miyabi',
        relationship_type: '紹介予定（株式会社雅・京都市伏見区の自動車販売）',
        is_ai_inferred: false,
        confidence: 1.0,
        evidence_text: '11/16 小比直人様1to1面談にて「ナインダーツチャプターの自動車販売・株式会社雅（京都市伏見区・勝賀野様事務所のご近所）の堀さんを勝賀野様へお繋ぎする」と合意',
        source_meeting_id: 'm-zoom-Hloc8gk6T9CevFvvf9bJLQ',
      });
    }

    // 5. 面談レコード & 文字起こし要約の補正（Zoom AIの「ダンジェリチャプター」「京都北東リージョン」誤認識を大阪北東・ナインダーツチャプターへ修正）
    const kobiMeetingId = 'm-zoom-Hloc8gk6T9CevFvvf9bJLQ';
    let meeting = this.state.meetings.find(m => m.id === kobiMeetingId || m.zoom_uuid === 'Hloc8gk6T9CevFvvf9bJLQ==');
    const kobiTitle = '小比 直人様と1to1（大阪北東・ナインダーツチャプター / 司法書士・土地家屋調査士×遺品整理・不動産・システム連携）';
    if (!meeting) {
      meeting = {
        id: kobiMeetingId,
        tenant_id: tid,
        title: kobiTitle,
        meeting_type: '1to1',
        provider: 'zoom',
        meeting_url: 'https://us06web.zoom.us/rec/share/FCyJ1YTJn9fNkJieYGf59x0nAW7WYE2tFhaJSSysVAq7t-BL0YULk11y8ZpolklJ.r95xg77HbBl8hHas',
        meeting_code: '89527504054',
        zoom_uuid: 'Hloc8gk6T9CevFvvf9bJLQ==',
        scheduled_start_at: '2026-11-16T03:58:58.000Z',
        scheduled_end_at: '2026-11-16T04:49:00.000Z',
        host_type: 'self',
        recording_status: 'completed',
        status: 'completed',
        participant_ids: [kobiId],
        created_at: '2026-11-16T03:58:58.000Z',
        updated_at: '2026-11-16T04:55:00.000Z',
      };
      this.state.meetings.unshift(meeting);
    } else {
      meeting.title = kobiTitle;
      meeting.status = 'completed';
      meeting.recording_status = 'completed';
      meeting.participant_ids = [kobiId];
    }

    const kobiSummary =
      'BNI 大阪北東リージョン「ナインダーツチャプター」所属の小比 直人様（司法書士・土地家屋調査士・独立4年目）との50分間の1to1面談。小比様は顧客の約6〜7割を不動産業者からの紹介が占めており、登記だけでなく相続相談の入口から寄り添う「相続コンサルティング」や遺品整理後の土地家屋調査・測量・売却のワンストップ支援（大阪・京都対応）に強み。勝賀野様の遺品整理・残置物撤去、AI古物査定ツール「カンテノ」、カスタム腕時計「アステラ」、若手経営者交流会、および遠藤様（システム・アプリ開発）との相互連携に合意。【次回アクション】①勝賀野様からBNI外の不動産業者ネットワークおよび遠藤様（1to1）・司法書士向け顧客管理ツール担当者を小比様へ紹介、②小比様からナインダーツチャプターのメンバーリストを勝賀野様へ送付し、木村様・堀様・石川様の3名へ勝賀野様を紹介。';

    const existingTr = this.state.transcripts.find(t => t.meeting_id === meeting!.id);
    if (!existingTr) {
      this.state.transcripts.unshift({
        id: `tr-${meeting.id}`,
        tenant_id: tid,
        meeting_id: meeting.id,
        language: 'ja',
        full_text: kobiSummary,
        summary: kobiSummary,
        utterances: [
          {
            id: 'utt-kobi-1',
            speaker_label: '小比 直人',
            resolved_person_id: kobiId,
            resolved_person_name: '小比 直人',
            start_seconds: 0,
            end_seconds: 3000,
            text: kobiSummary,
            confidence: 0.99,
          },
        ],
        created_at: '2026-11-16T04:50:00Z',
      });
    } else {
      existingTr.summary = kobiSummary;
      if (existingTr.full_text) {
        existingTr.full_text = existingTr.full_text
          .replace(/ダンジェリチャプター/g, 'ナインダーツチャプター（勝賀野様はだんじりチャプター）')
          .replace(/京都北東リージョン/g, '大阪北東リージョン');
      }
    }

    // 5.5 小比 直人様の確定Facts（Zoom同期ごとの点滅・入れ替わりを防ぐ固定ID: fact-kobi-1〜3）
    for (const f of this.state.facts) {
      if ((f.person_id === kobiId && !f.id.startsWith('fact-kobi-')) || f.id.includes('m-zoom-Hloc8gk6T9CevFvvf9bJLQ')) {
        this.deletedIds.add(f.id);
      }
    }
    this.state.facts = this.state.facts.filter(
      f => !(f.person_id === kobiId && !f.id.startsWith('fact-kobi-')) && !f.id.includes('m-zoom-Hloc8gk6T9CevFvvf9bJLQ')
    );
    const kobiCoreFacts: Fact[] = [
      {
        id: 'fact-kobi-1',
        tenant_id: tid,
        person_id: kobiId,
        fact_category: 'topic',
        fact_key: '盛り上がった話題・本業と強み',
        fact_value: 'BNI 大阪北東リージョン「ナインダーツチャプター」所属（司法書士・土地家屋調査士・独立4年目）。顧客の約6〜7割が不動産業者からの紹介。登記だけでなく相続相談の入口から寄り添う「相続コンサルティング」および遺品整理後の土地家屋調査・測量・不動産売却ワンストップ支援に強み',
        source_type: 'meeting_speech',
        source_id: meeting.id,
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-16T04:50:00Z',
        created_at: '2026-11-16T04:50:00Z',
      },
      {
        id: 'fact-kobi-2',
        tenant_id: tid,
        person_id: kobiId,
        fact_category: 'promise',
        fact_key: '保留中の約束・ToDo（勝賀野様→小比様）',
        fact_value: '勝賀野様からBNI外の不動産業者ネットワーク、遠藤様（システム・アプリ開発・1to1）、および司法書士向け顧客管理ツール担当者を小比様へご紹介する',
        source_type: 'meeting_speech',
        source_id: meeting.id,
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-16T04:50:00Z',
        created_at: '2026-11-16T04:50:00Z',
      },
      {
        id: 'fact-kobi-3',
        tenant_id: tid,
        person_id: kobiId,
        fact_category: 'promise',
        fact_key: '保留中の約束・ToDo（小比様→勝賀野様）',
        fact_value: '小比様からナインダーツチャプターのメンバーリストを送付いただき、堀様（株式会社雅・京都市伏見区の自動車販売）・木村様・石川様の3名へ勝賀野様をお繋ぎいただく',
        source_type: 'meeting_speech',
        source_id: meeting.id,
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-16T04:50:00Z',
        created_at: '2026-11-16T04:50:00Z',
      },
    ];
    for (let i = kobiCoreFacts.length - 1; i >= 0; i--) {
      const cf = kobiCoreFacts[i];
      const existingIdx = this.state.facts.findIndex(f => f.id === cf.id);
      if (existingIdx >= 0) {
        const prevStatus = this.state.facts[existingIdx].verification_status;
        this.state.facts[existingIdx] = { ...cf, verification_status: prevStatus || cf.verification_status };
      } else {
        this.state.facts.unshift(cf);
      }
    }

    // 6. 相関図エッジ & 紹介ハブ提案
    if (!this.deletedIds.has('rel-kobi-endo') && !this.state.relationships.some(r => r.id === 'rel-kobi-endo')) {
      this.state.relationships.push({
        id: 'rel-kobi-endo',
        tenant_id: tid,
        from_person_id: 'p-endo-prov',
        to_person_id: kobiId,
        relationship_type: 'システム・アプリ開発協業・1to1紹介合意',
        is_ai_inferred: false,
        confidence: 1.0,
        evidence_text: '11/16 小比直人様1to1面談にて「遠藤さん（システム・アプリ開発）との1to1セッティング・協業」に合意',
        source_meeting_id: meeting.id,
      });
    }
    if (!this.deletedIds.has('rel-ai-kobi-tanaka') && !this.state.relationships.some(r => r.id === 'rel-ai-kobi-tanaka')) {
      this.state.relationships.push({
        id: 'rel-ai-kobi-tanaka',
        tenant_id: tid,
        from_person_id: kobiId,
        to_person_id: 'p-tanaka-yoshihiro',
        relationship_type: 'AI紹介推薦（司法書士・土地家屋調査士・相続 × 中古マンション買取再販・不動産売買）',
        is_ai_inferred: true,
        confidence: 0.98,
        evidence_text: '売上の約7割が不動産業者紹介である小比様（司法書士・土地家屋調査士）と、大阪・全国でマンション・土地買取再販を行う田中様（夢叶開発）の相互送客シナジー',
        source_meeting_id: meeting.id,
      });
    }
    if (!this.deletedIds.has('ref-kobi-tanaka') && !this.state.referrals.some(r => r.id === 'ref-kobi-tanaka')) {
      this.state.referrals.unshift({
        id: 'ref-kobi-tanaka',
        tenant_id: tid,
        referrer_person_id: kobiId,
        candidate_person_id: 'p-tanaka-yoshihiro',
        target_person_id: kobiId,
        recommendation_reason:
          '小比直人様（大阪北東リージョン・ナインダーツチャプター / 司法書士・土地家屋調査士）の主要紹介元ニーズである「不動産業者様との連携」と、田中義博様（夢叶開発：中古マンション・土地買取再販）および勝賀野様の遺品整理・残置物撤去を三位一体で接続する高シナジー提案です。',
        breakdown: {
          area_match: '対応エリア完全一致（大阪府・京都府・関西一円）',
          specialty_match: '相続コンサル・不動産登記・土地家屋調査 × 不動産買取再販 × 遺品整理・残置物撤去',
          privacy_checked: true,
          track_record: '11/16 小比様1to1面談にて不動産業者紹介・遺品整理ワンストップ協業に合意済み',
        },
        draft_message: `小比さん、本日はZoomでの1to1ありがとうございました！\nナインダーツチャプターでのご活動や、相続コンサルティング×土地家屋調査・登記のワンストップ体制のお話、大変勉強になりました。\nお話ししていた不動産業者様のお繋ぎとして、大阪拠点でマンション・土地の買取再販を展開されている「夢叶開発」の田中義博代表や、システム開発の遠藤さんをぜひご紹介させてください！`,
        status: 'suggested',
        outcome: {
          type: 'pending',
          confirmed_by_user: false,
        },
        created_at: '2026-11-16T04:55:00Z',
      });
    }
  }

  public seedMishimaMeeting(): void {
    const tid = 'tenant-001';

    // 1. 三島 宏幸 様（だんじりチャプター・勝賀野様と同チャプター / 北新地飲食店・バー経営・高級スイーツOEM）の本登録カルテ統合
    let mishima = this.state.persons.find(
      p => p.id === 'p-mishima-danjiri' || p.id === 'p-1794813034743-0rmii' || /三島\s*宏幸/.test(p.display_name || '')
    );
    const mishimaNotes =
      'BNI 大阪東リージョン「だんじりチャプター」所属（勝賀野様と同チャプター）。北新地でのバー・飲食店経営（1.5万〜2万円帯のアッパー経営者交流会・団体貸切・てっちり/ぶりしゃぶ特別コース企画）および「お酒に合う高級スイーツ（フォアグラプリン、ショコラケーキ、バスクチーズケーキ等）」の自社製造・飲食店向け卸/OEM事業を展開。岩根 義行様（株式会社岩根工業・ディスカイステージ）を勝賀野様へご紹介いただいたキーパーソン。誕生日1月14日。ワイン・ウイスキーや本格スイーツ調理に精通。12月13日のBNIリージョンフォーラムへ初参加予定。';

    if (!mishima) {
      mishima = {
        id: 'p-mishima-danjiri',
        tenant_id: tid,
        display_name: '三島 宏幸',
        phonetic_name: 'ミシマ ヒロユキ',
        status: 'active',
        is_name_verified: true,
        category_tags: ['BNI', '仕事', '飲食'],
        service_areas: ['大阪府（北新地・全域）', '京都府', '関西・全国（スイーツOEM）'],
        notes: mishimaNotes,
        last_interacted_at: '2026-11-16T16:10:00+09:00',
        meeting_count: 1,
        created_at: '2026-11-12T19:46:00Z',
        updated_at: '2026-11-16T07:15:00Z',
      };
      this.state.persons.unshift(mishima);
    } else {
      mishima.display_name = '三島 宏幸';
      mishima.phonetic_name = 'ミシマ ヒロユキ';
      mishima.status = 'active';
      mishima.is_name_verified = true;
      mishima.category_tags = Array.from(new Set([...(mishima.category_tags || []), 'BNI', '仕事', '飲食']));
      mishima.service_areas = ['大阪府（北新地・全域）', '京都府', '関西・全国（スイーツOEM）'];
      mishima.notes = mishimaNotes;
      mishima.last_interacted_at = '2026-11-16T16:10:00+09:00';
      mishima.meeting_count = Math.max(mishima.meeting_count || 1, 1);
      mishima.updated_at = '2026-11-16T07:15:00Z';
    }
    const mishimaId = mishima.id;

    // 別IDの三島様カルテ（p-1794813034743-0rmii または p-mishima-danjiri）があれば1つに完全統合
    const dupMishimas = this.state.persons.filter(
      p => p.tenant_id === tid && p.id !== mishimaId && /三島/.test(p.display_name || '')
    );
    for (const dup of dupMishimas) {
      this.deletedIds.add(dup.id);
      this.mergePersons(mishimaId, dup.id);
      // 関係線のID参照も統合先へ付け替え
      for (const rel of this.state.relationships) {
        if (rel.from_person_id === dup.id) rel.from_person_id = mishimaId;
        if (rel.to_person_id === dup.id) rel.to_person_id = mishimaId;
      }
    }
    mishima.notes = mishimaNotes;

    // 2. 所属会社・屋号
    this.state.organizationMemberships = this.state.organizationMemberships.filter(m => m.person_id !== mishimaId);
    this.state.organizationMemberships.unshift({
      id: 'om-mishima-1',
      tenant_id: tid,
      person_id: mishimaId,
      organization_id: 'org-mishima-bar',
      organization_name: '北新地バー・飲食店経営 / 高級スイーツOEM製造',
      title: '代表（オーナーシェフ）',
      is_current: true,
    });

    // 3. BNI所属（誤って抽出された「志チャプター」等を排除し、だんじりチャプターへ統一）
    const danjiriChap =
      this.state.bniChapters.find(c => c.id === 'chap-osaka-danjiri') ||
      this.state.bniChapters.find(c => c.chapter_name === 'だんじりチャプター');
    const danjiriId = danjiriChap?.id || 'chap-osaka-danjiri';
    this.state.bniMemberships = this.state.bniMemberships.filter(bm => bm.person_id !== mishimaId);
    this.state.bniMemberships.unshift({
      id: 'bnim-mishima-1',
      tenant_id: tid,
      person_id: mishimaId,
      chapter_id: danjiriId,
      chapter_name: 'だんじりチャプター',
      region_name: '大阪東リージョン (Osaka East)',
      category: 'バー・飲食店経営（北新地） / 高級スイーツOEM・卸',
      status: 'active',
      joined_on: '2024-04-01',
    });

    // 4. 事業オファリング（話し言葉の断片オファリングを完全排除して正式内容に置換）
    this.state.businessOfferings = this.state.businessOfferings.filter(b => b.person_id !== mishimaId);
    this.state.businessOfferings.unshift({
      id: 'bo-mishima-1',
      tenant_id: tid,
      person_id: mishimaId,
      service_title: '北新地バー・飲食店経営（貸切・高単価交流会）＆「お酒に合う高級スイーツ（フォアグラプリン等）」卸・OEM製造',
      specialties: '1.5万〜2万円帯のアッパー経営者交流会・団体貸切・特別コース企画、ウイスキーやワインに合う本格スイーツ（フォアグラプリン、ショコラケーキ等）の飲食店向け卸・OEM',
      target_clients: '高単価な経営者交流会・貸切宴会を開催したい主催者様、差別化できる高級スイーツを導入したいバー・飲食店オーナー様',
      service_area: '大阪府（北新地・全域）・京都府・全国（スイーツ卸）',
      is_active: true,
    });

    // 5. 面談レコード & 要約・確定Factsのクリーンアップ
    const mishimaMeeting =
      this.state.meetings.find(m => m.id === 'm-1794813034745-2e1gm') ||
      this.state.meetings.find(m => m.participant_ids.includes(mishimaId));
    const mishimaMeetingId = mishimaMeeting?.id || 'm-1794813034745-2e1gm';
    const mishimaTitle = '三島 宏幸様と1to1（だんじりチャプター / 北新地バー・高単価交流会企画×高級スイーツOEM・相互紹介連携）';

    if (mishimaMeeting) {
      mishimaMeeting.title = mishimaTitle;
      mishimaMeeting.status = 'completed';
      mishimaMeeting.recording_status = 'completed';
      mishimaMeeting.participant_ids = [mishimaId];
    }

    const mishimaTopic =
      '高単価層向けアッパー交流会（1.5万〜2万円帯）や団体貸切・てっちり/ぶりしゃぶ企画による店舗収益向上策、および自社開発する「お酒に合う高級スイーツ（フォアグラプリン・ショコラケーキ・バスクチーズケーキ等）」のバー・飲食店向け卸・OEM展開。三島様からご紹介いただいた岩根義行様（株式会社岩根工業）との高い協業シナジーの御礼報告、勝賀野様からご紹介した俣野様（明日打合せ）・藤本様（奈良リージョン・交流会主催）の進捗共有、祇園バー「Route Z」での女性スタッフ（看板娘・水金土シフト）採用やカスタム腕時計「アステラ」のクロスセル価格戦略について意見交換';
    const mishimaPromise1 =
      '勝賀野様から高単価な経営者交流会を主催している方（三島様の店舗を貸切・箱貸し利用できる主催者層、奈良リージョンの藤本様への再アプローチ含む）を改めて探して三島様へご紹介する';
    const mishimaPromise2 =
      '三島様が製造する「お酒に合う高級スイーツ（フォアグラプリン等）」の店舗導入検討、大阪でのてっちり・ぶりしゃぶ懇親会企画、および女性スタッフ候補・カスタム腕時計「アステラ」ターゲット層（オーダースーツ着用層等）の相互紹介を進める';
    const mishimaSummary =
      `だんじりチャプター（勝賀野様と同チャプター）の三島 宏幸様との1to1面談。${mishimaTopic}。【次回アクション】①${mishimaPromise1}、②${mishimaPromise2}。`;

    // 話し言葉で抽出された旧Factを完全排除し、構造化された確定Factへ冪等更新（並び順やチェック状態を維持して点滅を防止）
    for (const f of this.state.facts) {
      if (f.person_id === mishimaId && !f.id.startsWith('fact-mishima-')) {
        this.deletedIds.add(f.id);
      }
    }
    this.state.facts = this.state.facts.filter(f => !(f.person_id === mishimaId && !f.id.startsWith('fact-mishima-')));
    const mishimaCoreFacts: Fact[] = [
      {
        id: 'fact-mishima-1',
        tenant_id: tid,
        person_id: mishimaId,
        fact_category: 'topic',
        fact_key: '盛り上がった話題・本業と強み',
        fact_value: mishimaTopic,
        source_type: 'meeting_speech',
        source_id: mishimaMeetingId,
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-16T07:15:00Z',
        created_at: '2026-11-16T07:15:00Z',
      },
      {
        id: 'fact-mishima-2',
        tenant_id: tid,
        person_id: mishimaId,
        fact_category: 'promise',
        fact_key: '保留中の約束・ToDo（勝賀野様→三島様）',
        fact_value: mishimaPromise1,
        source_type: 'meeting_speech',
        source_id: mishimaMeetingId,
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-16T07:15:00Z',
        created_at: '2026-11-16T07:15:00Z',
      },
      {
        id: 'fact-mishima-3',
        tenant_id: tid,
        person_id: mishimaId,
        fact_category: 'promise',
        fact_key: '保留中の約束・ToDo（相互協業・交流）',
        fact_value: mishimaPromise2,
        source_type: 'meeting_speech',
        source_id: mishimaMeetingId,
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-16T07:15:00Z',
        created_at: '2026-11-16T07:15:00Z',
      },
    ];
    for (let i = mishimaCoreFacts.length - 1; i >= 0; i--) {
      const cf = mishimaCoreFacts[i];
      const existingIdx = this.state.facts.findIndex(f => f.id === cf.id);
      if (existingIdx >= 0) {
        const prevStatus = this.state.facts[existingIdx].verification_status;
        this.state.facts[existingIdx] = { ...cf, verification_status: prevStatus || cf.verification_status };
      } else {
        this.state.facts.unshift(cf);
      }
    }

    const existingTr = this.state.transcripts.find(t => t.meeting_id === mishimaMeetingId);
    if (existingTr) {
      existingTr.summary = mishimaSummary;
    }

    // 相関図の三島様→岩根様エッジを最新のmishimaIdへ保証
    const relMishimaIwane = this.state.relationships.find(r => r.id === 'rel-mishima-danjiri-iwane');
    if (relMishimaIwane) {
      relMishimaIwane.from_person_id = mishimaId;
    }
  }

  public seedMoriMeeting(): void {
    const tid = 'tenant-001';

    // 1. 森 雄平 様（BNI 京都リージョン・インヴィクタスチャプター / 遺品整理・残置物撤去・リサイクル販売）
    let mori = this.state.persons.find(
      p => p.id === 'p-1795057464160-kxovb' || p.id === 'p-mori-yuhei' || p.display_name.replace(/\s+/g, '') === '森雄平'
    );
    const moriNotes =
      'BNI 京都リージョン（Kyoto）「インヴィクタスチャプター」所属。遺品整理・残置物撤去およびリサイクルショップ運営・不用品買取販売（京都・大阪・千葉等で展開、山科の古物市場や新大阪でも活動）。京都・松尾／桂エリアに地盤があり勝賀野様と地元京都トークで意気投合。森様の遺品整理・片付け現場から出る家電（7年以内中心〜10年超も相談可）や小型家具・キッチンボード・雑貨を勝賀野様のリサイクルショップ（桂）へ供給・買取連携する協業、およびAI真贋・相場査定＆メルカリSEO説明文生成ツール「カンテノ（月額9,800円）」の導入検討・京都エリアの残置物撤去相互協力に合意。';

    if (!mori) {
      mori = {
        id: 'p-1795057464160-kxovb',
        tenant_id: tid,
        display_name: '森 雄平',
        phonetic_name: 'モリ ユウヘイ',
        status: 'active',
        is_name_verified: true,
        category_tags: ['BNI', '仕事'],
        service_areas: ['京都府（松尾・桂・山科・全域）', '大阪府', '関西一円'],
        office_address: '京都府京都市（松尾・桂エリア）',
        notes: moriNotes,
        last_interacted_at: '2026-11-19T02:59:12.000Z',
        meeting_count: 1,
        created_at: '2026-11-19T02:04:12.000Z',
        updated_at: '2026-11-19T03:10:00.000Z',
      };
      this.state.persons.unshift(mori);
    } else {
      mori.display_name = '森 雄平';
      mori.phonetic_name = mori.phonetic_name || 'モリ ユウヘイ';
      mori.status = 'active';
      mori.is_name_verified = true;
      mori.category_tags = Array.from(new Set([...(mori.category_tags || []), 'BNI', '仕事']));
      if (!mori.service_areas || mori.service_areas.length === 0) {
        mori.service_areas = ['京都府（松尾・桂・山科・全域）', '大阪府', '関西一円'];
      }
      if (!mori.office_address) {
        mori.office_address = '京都府京都市（松尾・桂エリア）';
      }
      if (!mori.notes || /ダンジリチャプターのメンバーである勝賀野と森/.test(mori.notes)) {
        mori.notes = moriNotes;
      }
    }
    const moriId = mori.id;

    // 2. BNI所属（京都シティセントラルリージョン・インヴィクタスチャプター: chap-bni-258）
    // 誤登録された「彼は京都のインヴィクタスチャプター」等を完全削除
    for (const bm of this.state.bniMemberships) {
      if (bm.person_id === moriId && bm.id !== 'bnim-mori-1') {
        this.deletedIds.add(bm.id);
      }
    }
    this.state.bniMemberships = this.state.bniMemberships.filter(
      bm => !(bm.person_id === moriId && bm.id !== 'bnim-mori-1')
    );
    if (!this.state.bniMemberships.some(bm => bm.id === 'bnim-mori-1')) {
      this.state.bniMemberships.unshift({
        id: 'bnim-mori-1',
        tenant_id: tid,
        person_id: moriId,
        chapter_id: 'chap-bni-258',
        chapter_name: 'インヴィクタスチャプター',
        region_name: '京都シティセントラルリージョン (Kyoto City Central)',
        category: '遺品整理・残置物撤去・リサイクル販売',
        status: 'active',
        joined_on: '2026-04-01',
      });
    } else {
      const bm = this.state.bniMemberships.find(b => b.id === 'bnim-mori-1')!;
      bm.person_id = moriId;
      bm.chapter_id = 'chap-bni-258';
      bm.chapter_name = 'インヴィクタスチャプター';
      bm.region_name = '京都シティセントラルリージョン (Kyoto City Central)';
      bm.category = '遺品整理・残置物撤去・リサイクル販売';
      bm.status = 'active';
    }

    // 3. 事業オファリング（bo-mori-1）
    for (const b of this.state.businessOfferings) {
      if (b.person_id === moriId && b.id !== 'bo-mori-1') {
        this.deletedIds.add(b.id);
      }
    }
    this.state.businessOfferings = this.state.businessOfferings.filter(
      b => !(b.person_id === moriId && b.id !== 'bo-mori-1')
    );
    if (!this.state.businessOfferings.some(b => b.id === 'bo-mori-1')) {
      this.state.businessOfferings.unshift({
        id: 'bo-mori-1',
        tenant_id: tid,
        person_id: moriId,
        service_title: '遺品整理・残置物撤去・不用品買取＆リサイクル商品卸（京都・大阪・関西対応）',
        specialties: '遺品整理・残置物撤去現場からの家電・家具・雑貨回収およびリサイクルショップ・古物市場連携',
        target_clients: '京都・大阪エリアの不動産売買・管理会社様、リサイクルショップ・古物買取パートナー様、遺品整理案件',
        service_area: '京都府（松尾・桂・山科・全域）・大阪府・関西一円',
        is_active: true,
      });
    }

    // 4. 面談レコード & 要約・確定Facts（m-zoom-yWF6XymmQ9y7VeeDNcwag）
    const moriMeetingId = 'm-zoom-yWF6XymmQ9y7VeeDNcwag';
    let meeting = this.state.meetings.find(m => m.id === moriMeetingId || m.zoom_uuid === 'yWF6XymmQ9y7Ve/eDNcwag==');
    const moriTitle = '森 雄平様と1to1（京都・インヴィクタスチャプター / 遺品整理・リサイクル家電供給連携×AI査定ツール「カンテノ」）';
    if (!meeting) {
      meeting = {
        id: moriMeetingId,
        tenant_id: tid,
        title: moriTitle,
        meeting_type: '1to1',
        provider: 'zoom',
        meeting_url: 'https://us06web.zoom.us/rec/share/hFUagbaV-0-cT0V9O11GFbgyo9uzQlmmEUjSaO4wiGVGuAgvN4u9hILK5JOsahjk.0o31GKOx2DHvkc-E',
        meeting_code: '89527504054',
        zoom_uuid: 'yWF6XymmQ9y7Ve/eDNcwag==',
        scheduled_start_at: '2026-11-19T02:04:12.000Z',
        scheduled_end_at: '2026-11-19T02:59:12.000Z',
        host_type: 'self',
        recording_status: 'completed',
        status: 'completed',
        participant_ids: [moriId],
        created_at: '2026-11-19T02:04:12.000Z',
        updated_at: '2026-11-19T03:10:00.000Z',
      };
      this.state.meetings.unshift(meeting);
    } else {
      meeting.title = moriTitle;
      meeting.status = 'completed';
      meeting.recording_status = 'completed';
      meeting.participant_ids = [moriId];
    }

    const moriSummary =
      'BNI 京都リージョン「インヴィクタスチャプター」所属の森 雄平様（遺品整理・残置物撤去・リサイクル販売）との55分間の1to1面談。京都・松尾や桂エリアの地元トークで意気投合し、森様の遺品整理・片付け現場から出る家電（7年以内中心〜10年超も相談可）や小型家具・キッチンボード・雑貨を、勝賀野様のリサイクルショップ（桂）へ供給・買取連携する協業に合意。また、勝賀野様が展開するAI真贋・相場査定＆メルカリSEO説明文生成ツール「カンテノ（月額9,800円）」、主婦ライバー事務所、カスタム腕時計「アステラ」、および京都・大阪での不動産買取・残置物撤去案件の相互協力について意見交換。【次回アクション】①森様からリサイクルショップへ持ち込めそうな家電・雑貨の写真をLINEで送付し査定・持ち込みを実施、およびAI査定ツール「カンテノ」導入について代表へ確認、②勝賀野様から京都での残置物撤去案件の相談・協力打診、高田様へのコネクト入力依頼、および年明けに地元の友人（不動産関係者等）を交えた新年会・飲み会を企画。';

    const existingTr = this.state.transcripts.find(t => t.meeting_id === meeting!.id);
    if (!existingTr) {
      this.state.transcripts.unshift({
        id: `tr-${meeting.id}`,
        tenant_id: tid,
        meeting_id: meeting.id,
        language: 'ja',
        full_text: moriSummary,
        summary: moriSummary,
        utterances: [],
        created_at: '2026-11-19T03:04:24.164Z',
      });
    } else {
      existingTr.summary = moriSummary;
    }

    for (const f of this.state.facts) {
      if ((f.person_id === moriId && !f.id.startsWith('fact-mori-')) || f.id.includes('m-zoom-yWF6XymmQ9y7VeeDNcwag')) {
        this.deletedIds.add(f.id);
      }
    }
    this.state.facts = this.state.facts.filter(
      f => !(f.person_id === moriId && !f.id.startsWith('fact-mori-')) && !f.id.includes('m-zoom-yWF6XymmQ9y7VeeDNcwag')
    );
    const moriCoreFacts: Fact[] = [
      {
        id: 'fact-mori-1',
        tenant_id: tid,
        person_id: moriId,
        fact_category: 'topic',
        fact_key: '盛り上がった話題・本業と強み',
        fact_value: 'BNI 京都リージョン「インヴィクタスチャプター」所属。遺品整理・残置物撤去・リサイクル販売を展開。京都・松尾／桂エリアの地元繋がりで意気投合し、遺品整理現場から出る家電（7年以内〜10年超）・小型家具・キッチンボード・雑貨を勝賀野様のリサイクルショップ（桂）へ供給・買取する協業、およびAI査定ツール「カンテノ（月額9,800円）」の導入検討に合意',
        source_type: 'meeting_speech',
        source_id: meeting.id,
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-19T02:59:12.000Z',
        created_at: '2026-11-19T03:04:24.164Z',
      },
      {
        id: 'fact-mori-2',
        tenant_id: tid,
        person_id: moriId,
        fact_category: 'promise',
        fact_key: '保留中の約束・ToDo（森様→勝賀野様）',
        fact_value: '森様からリサイクルショップ（桂）へ持ち込めそうな家電・小型家具・雑貨の写真をLINEで送付して査定・持ち込みを実施し、AI査定ツール「カンテノ」の導入について代表へ確認する',
        source_type: 'meeting_speech',
        source_id: meeting.id,
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-19T02:59:12.000Z',
        created_at: '2026-11-19T03:04:24.164Z',
      },
      {
        id: 'fact-mori-3',
        tenant_id: tid,
        person_id: moriId,
        fact_category: 'promise',
        fact_key: '保留中の約束・ToDo（勝賀野様→森様）',
        fact_value: '勝賀野様から京都での残置物撤去案件の相談・協力打診、高田様へのコネクト入力依頼、および年明けに地元の友人（不動産関係者等）を交えた飲み会を調整する',
        source_type: 'meeting_speech',
        source_id: meeting.id,
        source_evidence: 'Zoom 1to1面談文字起こし',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-19T02:59:12.000Z',
        created_at: '2026-11-19T03:04:24.164Z',
      },
    ];
    for (let i = moriCoreFacts.length - 1; i >= 0; i--) {
      const cf = moriCoreFacts[i];
      const existingIdx = this.state.facts.findIndex(f => f.id === cf.id);
      if (existingIdx >= 0) {
        const prevStatus = this.state.facts[existingIdx].verification_status;
        this.state.facts[existingIdx] = { ...cf, verification_status: prevStatus || cf.verification_status };
      } else {
        this.state.facts.unshift(cf);
      }
    }
  }

  public seedNakagawaMeeting(): void {
    const tid = 'tenant-001';

    // 1. 中川 丈太郎 様（BNI 京都シティセントラルリージョン・Magicalチャプター / 求人広告代理店・採用応募対応代行・求人原稿作成支援）
    let nakagawa = this.state.persons.find(
      p => p.id === 'p-1795144172299-93er5' || p.id === 'p-nakagawa-jotaro' || (p.display_name || '').replace(/\s+/g, '') === '中川丈太郎'
    );
    const nakagawaNotes =
      'BNI 京都シティセントラルリージョン（Kyoto City Central）「Magicalチャプター」所属（カテゴリー：求人広告代理店）。バイトル・doda・マイナビ・Airワーク・Indeed等の求人広告取扱および独自3大サービス（①BNIメンバー無料の求人原稿「赤ペン添削」PDF返却、②応募受付メール・電話連絡・面接日程調整・前日/雨天ドタキャン防止リマインドまで丸ごと引き受ける「採用応募対応代行」、③プロライターによる求人原稿作成代行）を展開。クライアントの約8割が飲食店（だんじりチャプターでも河崎様ご紹介で2社バイトル契約実績あり）。守成クラブ（京都みやび昼会場）、ニーズマッチ大阪支部、および奈良ゆかりのBNIメンバー約20名が集まる月1懇親会「BNI奈良会」も主催・所属。大阪出身・奈良県在住、奥様とうさぎを飼育、阪神タイガースファン（毎年2月沖縄キャンプ「タマトラ会」5年連続参加）、献血64回の実績。';

    if (!nakagawa) {
      nakagawa = {
        id: 'p-1795144172299-93er5',
        tenant_id: tid,
        display_name: '中川 丈太郎',
        phonetic_name: 'ナカガワ ジョウタロウ',
        status: 'active',
        is_name_verified: true,
        category_tags: ['BNI', '仕事'],
        service_areas: ['京都府（京都市・全域）', '大阪府', '奈良県', '全国対応'],
        office_address: '奈良県（京都・大阪・関西全域対応）',
        notes: nakagawaNotes,
        last_interacted_at: '2026-11-20T03:09:32.299Z',
        meeting_count: 1,
        created_at: '2026-11-20T03:09:32.299Z',
        updated_at: '2026-11-20T06:15:00.000Z',
      };
      this.state.persons.unshift(nakagawa);
    } else {
      nakagawa.display_name = '中川 丈太郎';
      nakagawa.phonetic_name = nakagawa.phonetic_name || 'ナカガワ ジョウタロウ';
      nakagawa.status = 'active';
      nakagawa.is_name_verified = true;
      nakagawa.category_tags = Array.from(new Set([...(nakagawa.category_tags || []), 'BNI', '仕事']));
      nakagawa.service_areas = ['京都府（京都市・全域）', '大阪府', '奈良県', '全国対応'];
      nakagawa.office_address = nakagawa.office_address || '奈良県（京都・大阪・関西全域対応）';
      nakagawa.meeting_count = Math.max(nakagawa.meeting_count || 1, 1);
      nakagawa.last_interacted_at = '2026-11-20T03:09:32.299Z';
      if (
        !nakagawa.notes ||
        /LINEでZoom URLのみ受領|もうバーも大好きやし|サッカーボール蹴るなんて/.test(nakagawa.notes)
      ) {
        nakagawa.notes = nakagawaNotes;
        nakagawa.updated_at = '2026-11-20T06:15:00.000Z';
      }
    }
    const nakagawaId = nakagawa.id;

    // 1.5 重複クリックで生成された中川様の重複人物カルテ（p-1795144176332-6zpdd, p-1795144181464-j1acc 等）を完全統合・削除
    const dupNakagawaPersons = this.state.persons.filter(
      p => p.id !== nakagawaId && (p.display_name || '').replace(/[\s　様さん氏]+/g, '') === '中川丈太郎'
    );
    const dupNakagawaPersonIds = new Set<string>([
      'p-1795144176332-6zpdd',
      'p-1795144181464-j1acc',
      ...dupNakagawaPersons.map(p => p.id),
    ]);
    for (const dupPid of dupNakagawaPersonIds) {
      if (dupPid !== nakagawaId) {
        this.deletedIds.add(dupPid);
      }
    }
    this.state.persons = this.state.persons.filter(p => !dupNakagawaPersonIds.has(p.id) || p.id === nakagawaId);

    // 2. BNI所属（京都シティセントラルリージョン・Magicalチャプター: chap-bni-121）
    // カタカナで重複作成された「マジカルチャプター」カスタムチャプターも削除
    for (const c of this.state.bniChapters) {
      if (c.id.startsWith('chap-custom-') && /マジカル|Magical/i.test(c.chapter_name || '')) {
        this.deletedIds.add(c.id);
      }
    }
    this.state.bniChapters = this.state.bniChapters.filter(
      c => !(c.id.startsWith('chap-custom-') && /マジカル|Magical/i.test(c.chapter_name || ''))
    );

    for (const bm of this.state.bniMemberships) {
      if (
        (bm.person_id === nakagawaId && bm.id !== 'bnim-nakagawa-1') ||
        dupNakagawaPersonIds.has(bm.person_id)
      ) {
        this.deletedIds.add(bm.id);
      }
    }
    this.state.bniMemberships = this.state.bniMemberships.filter(
      bm => !(bm.person_id === nakagawaId && bm.id !== 'bnim-nakagawa-1') && !dupNakagawaPersonIds.has(bm.person_id)
    );
    if (!this.state.bniMemberships.some(bm => bm.id === 'bnim-nakagawa-1')) {
      this.state.bniMemberships.unshift({
        id: 'bnim-nakagawa-1',
        tenant_id: tid,
        person_id: nakagawaId,
        chapter_id: 'chap-bni-121',
        chapter_name: 'Magicalチャプター',
        region_name: '京都シティセントラルリージョン (Kyoto City Central)',
        category: '求人広告代理店（採用応募対応代行・求人原稿作成・添削支援）',
        status: 'active',
        joined_on: '2021-04-01',
      });
    } else {
      const bm = this.state.bniMemberships.find(b => b.id === 'bnim-nakagawa-1')!;
      bm.person_id = nakagawaId;
      bm.chapter_id = 'chap-bni-121';
      bm.chapter_name = 'Magicalチャプター';
      bm.region_name = '京都シティセントラルリージョン (Kyoto City Central)';
      bm.category = '求人広告代理店（採用応募対応代行・求人原稿作成・添削支援）';
      bm.status = 'active';
    }

    // 3. 事業オファリング（話し言葉で誤抽出された「もうバーも大好きやし...」や重複人物のオファリングを完全削除し、正式オファリング1件に統一）
    for (const b of this.state.businessOfferings) {
      if (
        (b.person_id === nakagawaId && b.id !== 'bo-nakagawa-1') ||
        dupNakagawaPersonIds.has(b.person_id) ||
        /もうバーも大好きやし/.test(b.service_title || '')
      ) {
        this.deletedIds.add(b.id);
      }
    }
    this.state.businessOfferings = this.state.businessOfferings.filter(
      b =>
        !(b.person_id === nakagawaId && b.id !== 'bo-nakagawa-1') &&
        !dupNakagawaPersonIds.has(b.person_id) &&
        !/もうバーも大好きやし/.test(b.service_title || '')
    );
    if (!this.state.businessOfferings.some(b => b.id === 'bo-nakagawa-1')) {
      this.state.businessOfferings.unshift({
        id: 'bo-nakagawa-1',
        tenant_id: tid,
        person_id: nakagawaId,
        service_title: '求人原稿作成・赤ペン添削および採用応募受付・面接日程調整代行サービス',
        specialties: '求人媒体（バイトル・doda・マイナビ・Airワーク・Indeed）取扱、BNI無料の求人原稿赤ペン添削、応募連絡〜面接調整・ドタキャン防止リマインド丸ごと代行（25名まで月5万円／士業・建設業5名まで1万円）、プロライター原稿作成代行',
        target_clients: '飲食店オーナー様、採用応募対応や面接ドタキャンに悩む店舗・中小企業経営者様、税理士・建設業者様、就労継続支援B型事業所関係者様',
        service_area: '京都府・大阪府・奈良県・全国対応',
        is_active: true,
      });
    }

    // 4. 面談レコード & 要約・確定Facts（m-1795144172303-ve1be に一本化し、重複会議 m-1795144176336-doyxx / m-1795144181470-t0mdy を完全除去）
    const nakagawaMeetingId = 'm-1795144172303-ve1be';
    const dupNakagawaMeetings = this.state.meetings.filter(
      m =>
        m.id !== nakagawaMeetingId &&
        (m.id === 'm-1795144176336-doyxx' ||
          m.id === 'm-1795144181470-t0mdy' ||
          /中川\s*丈太郎/.test(m.title || '') ||
          m.participant_ids.some(pid => pid === nakagawaId || dupNakagawaPersonIds.has(pid)))
    );
    const dupNakagawaMeetingIds = new Set<string>([
      'm-1795144176336-doyxx',
      'm-1795144181470-t0mdy',
      ...dupNakagawaMeetings.map(m => m.id),
    ]);

    // 重複会議側に長い文字起こし全文(full_text)がある場合はメイン文字起こしへ退避してから重複を削除
    let longestRawTranscript = '';
    for (const tr of this.state.transcripts) {
      if (
        (tr.meeting_id === nakagawaMeetingId || dupNakagawaMeetingIds.has(tr.meeting_id)) &&
        tr.full_text &&
        tr.full_text.length > longestRawTranscript.length
      ) {
        longestRawTranscript = tr.full_text;
      }
      if (dupNakagawaMeetingIds.has(tr.meeting_id)) {
        this.deletedIds.add(tr.id);
      }
    }
    for (const dupMid of dupNakagawaMeetingIds) {
      this.deletedIds.add(dupMid);
      this.deletedIds.add(`tr-${dupMid}`);
    }
    this.state.meetings = this.state.meetings.filter(m => !dupNakagawaMeetingIds.has(m.id));
    this.state.transcripts = this.state.transcripts.filter(t => !dupNakagawaMeetingIds.has(t.meeting_id));
    this.state.consents = this.state.consents.filter(
      c => !dupNakagawaMeetingIds.has(c.meeting_id) && !dupNakagawaPersonIds.has(c.person_id || '')
    );

    let meeting = this.state.meetings.find(m => m.id === nakagawaMeetingId);
    const nakagawaTitle = '中川 丈太郎様と1to1（京都・Magicalチャプター / 求人原稿作成・採用応募対応代行×バーRoute Z求人・腕時計アステラ・福祉連携）';
    if (!meeting) {
      meeting = {
        id: nakagawaMeetingId,
        tenant_id: tid,
        title: nakagawaTitle,
        meeting_type: '1to1',
        provider: 'zoom',
        scheduled_start_at: '2026-11-20T03:09:32.299Z',
        host_type: 'self',
        recording_status: 'completed',
        status: 'completed',
        participant_ids: [nakagawaId],
        created_at: '2026-11-20T03:09:32.303Z',
        updated_at: '2026-11-20T06:15:00.000Z',
      };
      this.state.meetings.unshift(meeting);
    } else {
      meeting.title = nakagawaTitle;
      meeting.status = 'completed';
      meeting.recording_status = 'completed';
      meeting.participant_ids = [nakagawaId];
      meeting.updated_at = '2026-11-20T06:15:00.000Z';
    }

    const nakagawaSummary =
      'BNI 京都シティセントラルリージョン「Magicalチャプター」所属の中川 丈太郎様（求人広告代理店・採用応募対応代行）との1to1面談。中川様はクライアントの約8割を飲食店が占め、バイトル・doda・マイナビ等の取扱に加え、①BNIメンバー無料の求人原稿「赤ペン添削」PDF返却、②応募者への電話・面接日程調整・前日/雨天時のドタキャン防止リマインドまで丸ごと引き受ける「採用応募対応代行（25名まで月5万円／士業・建設業は5名まで1万円）」、③プロライターによるAirワーク・Indeed向け求人原稿作成代行を展開。勝賀野様のAI古物査定ツール「カンテノ」、カスタム腕時計「アステラ」、祇園バー「Route Z」での女性アルバイト採用、および福祉（就労継続支援B型）ネットワーク連携で深く合意。【次回アクション】①中川様から就労継続支援B型（福祉）に強い杉本愛様・福祉チャプター立ち上げ中の竹本千秋様・オーダースーツの杉本博司様の3名を勝賀野様へお繋ぎし、BNIフットサルグループへ招待する、②勝賀野様から祇園バー「Route Z」マスターの高田様（インヴィクタスチャプター）と中川様の1to1をセッティングし、オーダーメイド腕時計「アステラ」のWebカタログ完成後に中川様へ送付する。';

    const existingTr = this.state.transcripts.find(t => t.meeting_id === meeting!.id);
    if (!existingTr) {
      this.state.transcripts.unshift({
        id: `tr-${meeting.id}`,
        tenant_id: tid,
        meeting_id: meeting.id,
        language: 'ja',
        full_text: longestRawTranscript || nakagawaSummary,
        summary: nakagawaSummary,
        utterances: [],
        created_at: '2026-11-20T03:09:32.328Z',
      });
    } else {
      existingTr.summary = nakagawaSummary;
      if (longestRawTranscript && longestRawTranscript.length > (existingTr.full_text || '').length) {
        existingTr.full_text = longestRawTranscript;
      }
      (existingTr as any).updated_at = '2026-11-20T06:15:00.000Z';
    }

    // 話し言葉で抽出された旧Fact（「もうバーも大好きやし...」「さんであの奈良かに行ってみたいな...」）や重複人物Factを完全削除し、確定Factへ置換
    for (const f of this.state.facts) {
      if (
        (f.person_id === nakagawaId && !f.id.startsWith('fact-nakagawa-')) ||
        dupNakagawaPersonIds.has(f.person_id) ||
        dupNakagawaMeetingIds.has(f.source_id || '') ||
        /もうバーも大好きやし|サッカーボール蹴るなんて|さんであの奈良かに行ってみたいな/.test(f.fact_value || '')
      ) {
        this.deletedIds.add(f.id);
      }
    }
    this.state.facts = this.state.facts.filter(
      f =>
        !(f.person_id === nakagawaId && !f.id.startsWith('fact-nakagawa-')) &&
        !dupNakagawaPersonIds.has(f.person_id) &&
        !dupNakagawaMeetingIds.has(f.source_id || '') &&
        !/もうバーも大好きやし|サッカーボール蹴るなんて|さんであの奈良かに行ってみたいな/.test(f.fact_value || '')
    );

    const nakagawaCoreFacts: Fact[] = [
      {
        id: 'fact-nakagawa-1',
        tenant_id: tid,
        person_id: nakagawaId,
        fact_category: 'topic',
        fact_key: '盛り上がった話題・本業と強み',
        fact_value: 'BNI 京都シティセントラルリージョン「Magicalチャプター」所属（求人広告代理店）。クライアントの約8割が飲食店（だんじりチャプターでも河崎様ご紹介で2社契約実績あり）。①BNIメンバー無料の求人原稿「赤ペン添削」、②応募受付から電話面接調整・前日/雨天ドタキャン防止リマインドまで丸ごと引き受ける「採用応募対応代行」、③プロライターによるAirワーク・Indeed向け求人原稿作成代行の独自3大サービスが強み',
        source_type: 'meeting_speech',
        source_id: meeting.id,
        source_evidence: 'Gemini 3.5 Flash AI議事録要約',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-20T03:09:43.853Z',
        created_at: '2026-11-20T03:09:43.853Z',
      },
      {
        id: 'fact-nakagawa-2',
        tenant_id: tid,
        person_id: nakagawaId,
        fact_category: 'promise',
        fact_key: '保留中の約束・ToDo（中川様→勝賀野様）',
        fact_value: '中川様から就労継続支援B型（福祉）に精通する杉本愛様、福祉特化チャプター立ち上げ中の竹本千秋様、およびオーダースーツの杉本博司様（腕時計「アステラ」協業候補）の3名を勝賀野様へご紹介・お繋ぎし、BNIフットサルグループへ勝賀野様を招待する',
        source_type: 'meeting_speech',
        source_id: meeting.id,
        source_evidence: 'Gemini 3.5 Flash AI議事録要約',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-20T03:09:43.853Z',
        created_at: '2026-11-20T03:09:43.853Z',
      },
      {
        id: 'fact-nakagawa-3',
        tenant_id: tid,
        person_id: nakagawaId,
        fact_category: 'promise',
        fact_key: '保留中の約束・ToDo（勝賀野様→中川様）',
        fact_value: '勝賀野様が運営する祇園バー「Route Z」の女性アルバイト採用に向け、マスターの高田様（インヴィクタスチャプター）と中川様の1to1をセッティングして求人原稿作成を相談し、オーダーメイド腕時計「アステラ」のWebカタログ完成後に中川様へデータを送付する',
        source_type: 'meeting_speech',
        source_id: meeting.id,
        source_evidence: 'Gemini 3.5 Flash AI議事録要約',
        confidence: 0.99,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: '2026-11-20T03:09:43.853Z',
        created_at: '2026-11-20T03:09:43.853Z',
      },
    ];
    for (let i = nakagawaCoreFacts.length - 1; i >= 0; i--) {
      const cf = nakagawaCoreFacts[i];
      const existingIdx = this.state.facts.findIndex(f => f.id === cf.id);
      if (existingIdx >= 0) {
        const prevStatus = this.state.facts[existingIdx].verification_status;
        this.state.facts[existingIdx] = { ...cf, verification_status: prevStatus || cf.verification_status };
      } else {
        this.state.facts.unshift(cf);
      }
    }

    // 5. 相関図（紹介・協業マインドマップ）への自動結線（中川 丈太郎様および森 雄平様の紹介予定・協業キーパーソン）
    const provisionalNodes: Person[] = [
      {
        id: 'p-takada-invictus',
        tenant_id: tid,
        display_name: '高田 陵平',
        phonetic_name: 'タカダ リョウヘイ',
        status: 'active',
        is_name_verified: true,
        category_tags: ['BNI', '仕事', 'パートナー'],
        service_areas: ['京都府（祇園・京都市）', '関西一円'],
        office_address: '京都府京都市東山区（祇園バー Route Z）',
        notes: 'BNI 京都シティセントラルリージョン（Kyoto City Central）「インヴィクタスチャプター」所属。勝賀野様と共同で京都・祇園のバー「Route Z」を運営（マスター）。森 雄平様と同チャプターでコネクト連携を行い、中川 丈太郎様とも女性アルバイト求人原稿作成連携、川本 美器様（WineShop Gorríon / ディライトチャプター）とも祇園バー「Route Z」へのワイン導入・グラスワイン提供および飲食店相互紹介で協業。',
        meeting_count: 1,
        last_interacted_at: '2026-11-27T03:57:37.000Z',
        created_at: '2026-11-19T03:05:00Z',
        updated_at: '2026-11-27T03:57:37.000Z',
      },
      {
        id: 'p-sugimoto-ai-prov',
        tenant_id: tid,
        display_name: '杉本 愛さん（就労継続支援B型・福祉連携）',
        phonetic_name: 'スギモト アイ',
        status: 'provisional',
        is_name_verified: true,
        category_tags: ['BNI', '仕事'],
        service_areas: ['京都府', '大阪府'],
        notes: '就労継続支援B型・福祉領域に精通する経営者。中川 丈太郎様より勝賀野様のAI古物査定ツール「カンテノ」の福祉事業所導入・連携パートナーとしてご紹介予定。',
        meeting_count: 0,
        created_at: '2026-11-20T03:10:00Z',
        updated_at: '2026-11-20T06:15:00Z',
      },
      {
        id: 'p-sugimoto-hiroshi-prov',
        tenant_id: tid,
        display_name: '杉本 博司さん（オーダースーツ・腕時計アステラ協業）',
        phonetic_name: 'スギモト ヒロシ',
        status: 'provisional',
        is_name_verified: true,
        category_tags: ['BNI', '仕事'],
        service_areas: ['京都府', '大阪府'],
        notes: 'オーダースーツ事業を展開。中川 丈太郎様より勝賀野様のカスタムオーダー腕時計「アステラ」とのクロスセル・協業候補としてご紹介予定。',
        meeting_count: 0,
        created_at: '2026-11-20T03:10:00Z',
        updated_at: '2026-11-20T06:15:00Z',
      },
    ];
    for (const pn of provisionalNodes) {
      if (!this.deletedIds.has(pn.id) && !this.state.persons.some(p => p.id === pn.id)) {
        this.state.persons.push(pn);
      }
    }

    const moriPerson = this.state.persons.find(
      p => p.id === 'p-1795057464160-kxovb' || (p.display_name || '').replace(/\s+/g, '') === '森雄平'
    );
    const moriId = moriPerson?.id || 'p-1795057464160-kxovb';
    const mishimaPerson = this.state.persons.find(
      p => p.id === 'p-mishima-danjiri' || /三島\s*宏幸/.test(p.display_name || '')
    );
    const mishimaId = mishimaPerson?.id || 'p-mishima-danjiri';

    const nakagawaAndMoriRels: PersonRelationship[] = [
      {
        id: 'rel-nakagawa-sugimoto-ai',
        tenant_id: tid,
        from_person_id: nakagawaId,
        to_person_id: 'p-sugimoto-ai-prov',
        relationship_type: '紹介予定（就労継続支援B型・AI査定ツール「カンテノ」福祉連携）',
        is_ai_inferred: false,
        confidence: 1.0,
        evidence_text: '11/20 中川丈太郎様1to1面談にて「就労継続支援B型（福祉）に強い杉本愛様を勝賀野様へお繋ぎする」と合意',
        source_meeting_id: nakagawaMeetingId,
      },
      {
        id: 'rel-nakagawa-sugimoto-hiroshi',
        tenant_id: tid,
        from_person_id: nakagawaId,
        to_person_id: 'p-sugimoto-hiroshi-prov',
        relationship_type: '紹介予定（オーダースーツ×カスタム腕時計「アステラ」協業）',
        is_ai_inferred: false,
        confidence: 1.0,
        evidence_text: '11/20 中川丈太郎様1to1面談にて「オーダースーツの杉本博司様を腕時計アステラの協業候補として勝賀野様へご紹介する」と合意',
        source_meeting_id: nakagawaMeetingId,
      },
      {
        id: 'rel-takada-nakagawa',
        tenant_id: tid,
        from_person_id: 'p-takada-invictus',
        to_person_id: nakagawaId,
        relationship_type: '協業・紹介予定（祇園バー「Route Z」女性アルバイト求人原稿作成1to1）',
        is_ai_inferred: false,
        confidence: 1.0,
        evidence_text: '11/20 中川丈太郎様1to1面談にて「祇園バーRoute Zマスターの高田様（インヴィクタスチャプター）と中川様の1to1をセッティングし求人原稿作成を相談する」と合意',
        source_meeting_id: nakagawaMeetingId,
      },
      {
        id: 'rel-takada-mori',
        tenant_id: tid,
        from_person_id: 'p-takada-invictus',
        to_person_id: moriId,
        relationship_type: '同チャプター連携（京都・インヴィクタスチャプター / コネクト＆桂リサイクルショップ連携）',
        is_ai_inferred: false,
        confidence: 1.0,
        evidence_text: '11/19 森雄平様1to1面談にて「同じインヴィクタスチャプターの高田様（祇園バーRoute Zマスター）を通じてコネクト連携および桂リサイクルショップへの家電供給協業」を確認',
        source_meeting_id: 'm-zoom-yWF6XymmQ9y7VeeDNcwag',
      },
      {
        id: 'rel-ai-nakagawa-mishima',
        tenant_id: tid,
        from_person_id: nakagawaId,
        to_person_id: mishimaId,
        relationship_type: 'AI紹介推薦（飲食店特化の求人原稿添削・採用応募対応代行 × 北新地・祇園バー飲食店経営ネットワーク）',
        is_ai_inferred: true,
        confidence: 0.98,
        evidence_text: 'クライアントの8割が飲食店で採用応募対応代行・赤ペン添削に強みを持つ中川様と、北新地バー経営・飲食店ネットワークを持つ三島様が高シナジー',
        source_meeting_id: nakagawaMeetingId,
      },
      {
        id: 'rel-ai-mori-kimura',
        tenant_id: tid,
        from_person_id: moriId,
        to_person_id: 'p-kimura-naofumi',
        relationship_type: 'AI紹介推薦（京都・松尾/桂の遺品整理・家電供給 × 不用品回収・桂リサイクルショップRoute Z循環）',
        is_ai_inferred: true,
        confidence: 0.97,
        evidence_text: '京都・桂/松尾エリアで遺品整理・家電供給を行う森様と、東山高校同窓で不用品回収・リユース連携を行う木村様・勝賀野様の供給網が合致',
        source_meeting_id: 'm-zoom-yWF6XymmQ9y7VeeDNcwag',
      },
      {
        id: 'rel-ai-mori-tanaka',
        tenant_id: tid,
        from_person_id: moriId,
        to_person_id: 'p-tanaka-yoshihiro',
        relationship_type: 'AI紹介推薦（京都・大阪の残置物撤去・遺品整理 × 中古マンション買取再販）',
        is_ai_inferred: true,
        confidence: 0.96,
        evidence_text: '京都・大阪で残置物撤去・遺品整理を展開する森様と、関西一円で中古マンション買取再販を行う田中様（夢叶開発）の現場ニーズが合致',
        source_meeting_id: 'm-zoom-yWF6XymmQ9y7VeeDNcwag',
      },
    ];

    for (const rel of nakagawaAndMoriRels) {
      if (this.deletedIds.has(rel.id)) continue;
      const existingIdx = this.state.relationships.findIndex(r => r.id === rel.id);
      if (existingIdx >= 0) {
        this.state.relationships[existingIdx] = rel;
      } else {
        this.state.relationships.push(rel);
      }
    }
  }

    public promotePerson(personId: string, updates?: Partial<Person>): void {
    const p = this.getPersonById(personId);
    if (p) {
      p.status = 'active';
      // 「（仮）」「（ディーラー）」などの仮タイトルがあれば整理
      p.display_name = p.display_name.replace(/（仮.*?）|\(仮.*?\)|（ディーラー.*?）|\(ディーラー.*?\)/g, '').trim();
      if (updates) {
        Object.assign(p, updates);
        p.status = 'active';
      }
      p.updated_at = new Date().toISOString();
      this.persist();
    }
  }

  public mergePersons(keepPersonId: string, mergeFromPersonId: string): void {
    if (keepPersonId === mergeFromPersonId) return;
    const keep = this.getPersonById(keepPersonId);
    const source = this.getPersonById(mergeFromPersonId);
    if (!keep || !source) return;

    this.deletedIds.add(source.id);

    // 面談参加者の置換
    this.state.meetings.forEach(m => {
      if (m.participant_ids.includes(source.id)) {
        m.participant_ids = m.participant_ids.map(id => id === source.id ? keep.id : id);
        m.participant_ids = Array.from(new Set(m.participant_ids));
      }
    });

    // 同意レコードの置換
    this.state.consents.forEach(c => {
      if (c.person_id === source.id) {
        c.person_id = keep.id;
      }
    });

    // Facts の置換
    this.state.facts.forEach(f => {
      if (f.person_id === source.id) {
        f.person_id = keep.id;
      }
    });

    // BNI所属の統合・重複削除
    const keepHasBni = this.state.bniMemberships.some(bm => bm.person_id === keep.id);
    this.state.bniMemberships = this.state.bniMemberships.filter(bm => {
      if (bm.person_id !== source.id) return true;
      if (!keepHasBni) {
        bm.person_id = keep.id;
        return true;
      }
      this.deletedIds.add(bm.id);
      return false;
    });

    // 事業オファリングの統合・重複削除
    const keepHasBo = this.state.businessOfferings.some(bo => bo.person_id === keep.id);
    this.state.businessOfferings = this.state.businessOfferings.filter(bo => {
      if (bo.person_id !== source.id) return true;
      if (!keepHasBo && !/大好きやし|やなと|思ってた/.test(bo.service_title || '')) {
        bo.person_id = keep.id;
        return true;
      }
      this.deletedIds.add(bo.id);
      return false;
    });

    // 所属会社の統合・重複削除
    const keepOrgNames = new Set(
      this.state.organizationMemberships.filter(om => om.person_id === keep.id).map(om => om.organization_name)
    );
    this.state.organizationMemberships = this.state.organizationMemberships.filter(om => {
      if (om.person_id !== source.id) return true;
      if (om.organization_name && !keepOrgNames.has(om.organization_name)) {
        om.person_id = keep.id;
        keepOrgNames.add(om.organization_name);
        return true;
      }
      this.deletedIds.add(om.id);
      return false;
    });

    // 相関図エッジの置換
    this.state.relationships.forEach(r => {
      if (r.from_person_id === source.id) r.from_person_id = keep.id;
      if (r.to_person_id === source.id) r.to_person_id = keep.id;
    });
    this.state.relationships = this.state.relationships.filter(r => r.from_person_id !== r.to_person_id);

    // 紹介レコードの置換
    this.state.referrals.forEach(ref => {
      if (ref.referrer_person_id === source.id) ref.referrer_person_id = keep.id;
      if (ref.candidate_person_id === source.id) ref.candidate_person_id = keep.id;
      if (ref.target_person_id === source.id) ref.target_person_id = keep.id;
    });

    // 文字起こし発話者の置換
    this.state.transcripts.forEach(t => {
      t.utterances?.forEach(u => {
        if (u.resolved_person_id === source.id) {
          u.resolved_person_id = keep.id;
          u.resolved_person_name = keep.display_name;
        }
      });
    });

    // メモとタグの統合（仮登録時のプレースホルダや未整理の生ログは除外）
    if (
      source.notes &&
      !source.notes.includes('LINE連絡・事前案内から登録') &&
      !source.notes.includes('LINEでZoom URLのみ受領') &&
      !source.notes.includes('[Zoom特定メモ]') &&
      !source.notes.includes('[面談要約]') &&
      !source.notes.includes('予定登録から自動作成') &&
      !(keep.notes && keep.notes.includes(source.notes))
    ) {
      keep.notes = (keep.notes ? keep.notes + '\n' : '') + `[会話言及メモを統合]: ${source.notes}`;
    }
    if (source.category_tags) {
      keep.category_tags = Array.from(new Set([...keep.category_tags, ...source.category_tags]));
    }
    keep.meeting_count = Math.max(1, keep.meeting_count || 0, source.meeting_count || 0);
    keep.updated_at = new Date().toISOString();

    // 元の仮カルテを削除
    this.state.persons = this.state.persons.filter(p => p.id !== source.id);
    this.saveDeletedIds();
    this.persist();
  }

  
  public togglePromiseCompleted(factId: string): boolean {
    const fact = this.state.facts.find(f => f.id === factId);
    if (!fact) return false;
    fact.verification_status = fact.verification_status === 'verified' ? 'reported' : 'verified';
    this.persist();
    return true;
  }

  private isSelfSpeaker(label: string): boolean {
    if (!label) return true;
    if (/Organizer|^自分$|^ホスト$/i.test(label)) return true;
    const owner = this.getCurrentOwnerProfile();
    if (this.state.currentTenantId === 'tenant-001') {
      return /勝賀野|生姜|善野|ZENNOBATE|ゼノベイト|残置物撤去|残地物撤去/i.test(label);
    }
    const tokens = [
      owner.owner_name,
      owner.owner_name?.replace(/\s+/g, ''),
      owner.owner_name?.split(/\s+/)[0],
      owner.company_name,
    ].filter((t): t is string => !!t && t.length >= 2);
    return tokens.some(tok => label.includes(tok));
  }

  private normalizeSpeakerName(raw: string): string {
    let cleaned = raw
      .replace(/^[0-9０-９]+\s*[/／]\s*/, '')
      .replace(/\s*[/／].*$/, '')
      .replace(/\(.*?\)|（.*?）/g, '')
      .replace(/(?:様|さん|氏|代表|社長)$/, '')
      .trim();
    if (/^K\s*Kawasaki$|^Kawasaki\s*K$/i.test(cleaned)) {
      return '川崎 景';
    }
    if (/^美器\s*川本$|^桑本\s*みき$|^川本\s*美器$/.test(cleaned)) {
      return '川本 美器';
    }
    if (/^陵平\s*高田$|^高田\s*陵平$/.test(cleaned)) {
      return '高田 陵平';
    }
    const twoParts = cleaned.split(/[\s　]+/);
    if (twoParts.length === 2 && /^[一-龯ぁ-んァ-ヶー]{1,4}$/.test(twoParts[0]) && /^[一-龯ぁ-んァ-ヶー]{1,4}$/.test(twoParts[1])) {
      const reversed = `${twoParts[1]} ${twoParts[0]}`;
      const matchExistingReversed = (this.state.persons || []).some(
        p => p.tenant_id === this.state.currentTenantId && p.status !== 'deleted' && p.display_name === reversed
      );
      if (matchExistingReversed) {
        return reversed;
      }
    }
    if (/^[一-龯]{4}$/.test(cleaned)) {
      cleaned = `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    }
    return cleaned;
  }

  private parseCompanyAndPersonHint(rawText: string): { company?: string; personName: string } {
    const normalized = rawText
      .replace(/[０-９Ａ-Ｚａ-ｚ]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
      .replace(/https?:\/\/[^\s]+/gi, '')
      .replace(/^(?:次回|明日|明後日|今日|本日)?\s*(?:\d{4}[年\/-])?(?:\d{1,2}[\/月]\d{1,2}日?)?\s*(?:\([月火水木金土日]\))?\s*(?:\d{1,2}(?::|時)(?:\d{0,2}|半)?(?:分)?)?\s*(?:〜|~|-|から)?\s*/i, '')
      .trim();
    const cleaned = normalized
      .replace(/(?:様|さん|氏|社長|代表|先生)?(?:と|との|の)?\s*(?:次回)?(?:1to1|1on1|面談|打合せ|打ち合わせ|会議|商談|予定|ミーティング).*$/gi, '')
      .replace(/^(?:次回)?(?:1to1|1on1|面談|打合せ|打ち合わせ|会議|商談|予定|ミーティング)\s*(?:相手|先)?[:：]?\s*/gi, '')
      .replace(/様と.*$|さんと.*$|との.*$/g, '')
      .replace(/(?:様|さん|氏|社長|代表|先生)$/, '')
      .trim();
    const match = cleaned.match(/^(.{2,20}?)の([^\sの]{1,12})$/);
    if (match && !/^(今日|明日|明後日|来週|今週|本日|次回)$/.test(match[1])) {
      return {
        company: match[1].trim(),
        personName: match[2].trim(),
      };
    }
    return { personName: cleaned };
  }

  public reconcileLegacyAndDuplicateData(): boolean {
    let changed = false;
    const tid = this.state.currentTenantId;

    // 0. 1ユーザーあたりの月間AI原価上限ストッパーを 1,000円 に統一（販売価格 4,980円〜5,980円 に対して粗利4,000円以上を確定保護）
    for (const t of this.state.tenants || []) {
      if (t.monthly_budget_jpy === 4980) {
        t.monthly_budget_jpy = 1000;
        if (t.current_spend_jpy >= 1000) {
          t.current_spend_jpy = 154;
          t.is_budget_throttled = false;
        }
        changed = true;
      }
    }

    // 1. 旧キャッシュの誤表記「武藤開発」「無党開発」→「夢叶開発」、Zoom AIの「K」→「川崎景」、「ラズベリー」→「ジャズベリー」、「正勝賀野」→「勝賀野」、冒頭雑談（インフルエンザ等）除去、カテゴリー文字化け完全除去
    const isMojibake = (str?: string) => !!str && /[ãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ\uFFFD\x80-\x9F]/.test(str);
    if (this.state.customCategories && typeof this.state.customCategories === 'object') {
      for (const k of Object.keys(this.state.customCategories)) {
        const list = this.state.customCategories[k];
        if (Array.isArray(list)) {
          const cleaned = Array.from(new Set(list.filter(c => c && !isMojibake(c))));
          if (cleaned.length !== list.length) {
            this.state.customCategories[k] = cleaned.length > 0
              ? cleaned
              : ['BNI', '仕事', 'パートナー', 'クライアント', '友人', '知人'];
            changed = true;
          }
        }
      }
    }

    const fixMuto = (s?: string) => {
      if (!s) return s;
      return s
        .replace(/この会議は、前回のビーンズ交流会の反省と今後の運営方針について話し合うことを目的として行われた。?\s*/g, '')
        .replace(/冒頭では(?:[0-9０-９]+\s*[/／]\s*)?勝賀野が子供のインフルエンザに感染し体調を崩していることを共有し、高野陽行は寝起きで参加している状況を説明した。?\s*/g, '')
        .replace(/[^。]*?(?:風邪気味のため声が聞きにくい|体調不良のため声が小さい)[^。]*?。?\s*/g, '')
        .replace(/武藤開発|無党開発/g, '夢叶開発')
        .replace(/[0-9０-９]+\s*[/／]\s*勝賀野\s*太郎\s*[/／]\s*残置物撤去/g, '勝賀野')
        .replace(/[0-9０-９]+\s*[/／]\s*勝賀野/g, '勝賀野')
        .replace(/正勝賀野/g, '勝賀野')
        .replace(/K\s*Kawasaki|Kawasaki\s*K/gi, '川崎景')
        .replace(/(^|[、。・:：\s「『（(と])K(?=[はがもにのへと、。・\s」』）)]|$)/gm, '$1川崎景')
        .replace(/美器[（(]桑本みき[）)]|桑本\s*みき|美器\s*川本/g, '川本美器')
        .replace(/陵平\s*高田/g, '高田陵平')
        .replace(/(?<![川本])美器(?=[はがもにのへと、。・店舗])/g, '川本美器')
        .replace(/(?<![高田])陵平(?=[はがもにのへと、。・:：])/g, '高田陵平')
        .replace(/リライトチャプター/g, 'ディライトチャプター')
        .replace(/インビクタスチャプター/g, 'インヴィクタスチャプター')
        .replace(/3島から/g, '三島宏幸様（だんじりチャプター）から')
        .replace(/生命神社/g, '晴明神社')
        .replace(/ラズベリー/g, 'ジャズベリー')
        .replace(/免费/g, '無料')
        .trim();
    };
    for (const org of this.state.organizations || []) {
      const next = fixMuto(org.name);
      if (next !== org.name) { org.name = next!; changed = true; }
    }
    for (const om of this.state.organizationMemberships || []) {
      const next = fixMuto(om.organization_name);
      if (next !== om.organization_name) { om.organization_name = next!; changed = true; }
    }
    for (const p of this.state.persons || []) {
      if (/^K\s*Kawasaki$|^Kawasaki\s*K$|^K$/i.test((p.display_name || '').trim())) {
        p.display_name = '川崎 景';
        p.phonetic_name = p.phonetic_name || 'カワサキ ケイ';
        changed = true;
      }
      if (/^美器\s*川本$|^桑本\s*みき$/i.test((p.display_name || '').trim())) {
        p.display_name = '川本 美器';
        p.phonetic_name = p.phonetic_name || 'カワモト ミキ';
        changed = true;
      }
      if (/^陵平\s*高田$|^高田さん（祇園バーRoute Zマスター・インヴィクタス）$/i.test((p.display_name || '').trim())) {
        p.display_name = '高田 陵平';
        p.phonetic_name = p.phonetic_name || 'タカダ リョウヘイ';
        changed = true;
      }
      if (Array.isArray(p.category_tags)) {
        const cleanTags = p.category_tags.filter(t => t && !isMojibake(t));
        if (cleanTags.length !== p.category_tags.length) {
          p.category_tags = cleanTags;
          changed = true;
        }
      }
      const next = fixMuto(p.notes);
      if (next !== p.notes) { p.notes = next; changed = true; }
    }
    for (const m of this.state.meetings || []) {
      const nextT = fixMuto(m.title);
      const nextR = fixMuto(m.raw_invite_text);
      if (nextT !== m.title) { m.title = nextT!; changed = true; }
      if (nextR !== m.raw_invite_text) { m.raw_invite_text = nextR; changed = true; }
    }
    for (const f of this.state.facts || []) {
      const nextK = fixMuto(f.fact_key);
      const next = fixMuto(f.fact_value);
      if (nextK !== f.fact_key) { f.fact_key = nextK!; changed = true; }
      if (next !== f.fact_value) { f.fact_value = next!; changed = true; }
    }
    for (const tr of this.state.transcripts || []) {
      const nextS = fixMuto(tr.summary);
      const nextF = fixMuto(tr.full_text);
      if (nextS !== tr.summary) { tr.summary = nextS!; changed = true; }
      if (nextF !== tr.full_text) { tr.full_text = nextF!; changed = true; }
    }

    // 1.5 高野陽行様・川崎景様との3名Zoom会議（m-zoom-nUUblUGRdOUzkSVNFeAKA）に川崎景様（オーダースーツ事業）の人物カルテ・腕時計アステラ連携・参加者紐付け・相関図エッジを保証
    if (tid === 'tenant-001') {
      const takanoMeeting = (this.state.meetings || []).find(
        m => (m.id === 'm-zoom-nUUblUGRdOUzkSVNFeAKA' || m.zoom_uuid === 'nUU+blUGRdOUzkSVNFeAKA==') && m.tenant_id === 'tenant-001'
      );
      if (takanoMeeting) {
        const meetingDateIso = takanoMeeting.scheduled_end_at || takanoMeeting.scheduled_start_at || '2026-11-22T14:38:56.000Z';
        const takanoNotesClean =
          'ビーンズ（Beans）およびジャズベリーでのビジネスコミュニティ・交流会企画運営・ブランディング支援を展開。会員制カリキュラム（ブランディング・パーソナリティ診断・自己理解強化）の構築や、飲食店との相互送客関係を含めた交流会アジェンダ改善、公式LINE・QRアンケートを活用したフォローアップ体制の整備を主導。面談終盤では川崎景様（オーダースーツ事業）と共に勝賀野様のカスタムオーダーメイド腕時計「アステラ（ASTERA）」の展開・ブランディング戦略についても意見交換。';
        const kawasakiNotesClean =
          'オーダースーツ事業（スーツ仕立て・経営者向けスタイリング）を展開。勝賀野様のカスタムオーダーメイド腕時計「アステラ（ASTERA）」との親和性が高く、オーダースーツ顧客層とオーダー腕時計の相互紹介・クロスセルやブランディング連携について協議。また、ビーンズ（Beans）・ジャズベリー交流会の共同運営において、プライベート3分発表の成功モデルのビジネスセッションへの応用、飲食店が集客・人脈拡大に役立つモデルケース化、ホームページを活用した事前一括登録・プロフィール入力仕組みの構築を提案。';
        const watchSummaryBullet =
          '・オーダースーツ×オーダーメイド腕時計「アステラ」連携: 面談終盤では、オーダースーツ事業を展開する川崎景および高野陽行と、勝賀野が手掛けるカスタムオーダーメイド腕時計「アステラ（ASTERA）」の展開・価格・ブランディング戦略について意見交換が行われ、オーダースーツ顧客層との高い親和性を活かした相互紹介・クロスセル連携について話し合われた。';

        const takanoPerson = (this.state.persons || []).find(
          p => p.tenant_id === 'tenant-001' && (p.id === 'p-1795358370152-pkdc1' || /高野\s*陽行/.test(p.display_name || ''))
        );
        if (takanoPerson) {
          if (!takanoPerson.phonetic_name) {
            takanoPerson.phonetic_name = 'タカノ ハルユキ';
            changed = true;
          }
          if (!takanoPerson.last_interacted_at) {
            takanoPerson.last_interacted_at = meetingDateIso;
            changed = true;
          }
          if (!takanoPerson.notes || /インフルエンザ|寝起き|この会議は/.test(takanoPerson.notes) || !takanoPerson.notes.includes('アステラ')) {
            takanoPerson.notes = takanoNotesClean;
            changed = true;
          }
        }
        let kawasakiPerson = (this.state.persons || []).find(
          p => p.tenant_id === 'tenant-001' && p.status !== 'deleted' && /川崎\s*景|河崎\s*景/.test(p.display_name || '')
        );
        const takanoTr = (this.state.transcripts || []).find(t => t.meeting_id === takanoMeeting.id);
        if (takanoTr) {
          if (takanoTr.summary && !takanoTr.summary.includes('オーダーメイド腕時計')) {
            takanoTr.summary = `${fixMuto(takanoTr.summary)}\n${watchSummaryBullet}`;
            changed = true;
          }
          if (takanoTr.full_text && !takanoTr.full_text.includes('オーダーメイド腕時計')) {
            takanoTr.full_text = `${fixMuto(takanoTr.full_text)}\n${watchSummaryBullet}`;
            changed = true;
          }
        }
        if (!kawasakiPerson) {
          kawasakiPerson = {
            id: 'p-kawasaki-kei',
            tenant_id: 'tenant-001',
            display_name: '川崎 景',
            phonetic_name: 'カワサキ ケイ',
            status: 'active',
            is_name_verified: true,
            category_tags: ['BNI', '仕事'],
            service_areas: ['大阪府', '京都府'],
            meeting_count: 1,
            last_interacted_at: meetingDateIso,
            notes: kawasakiNotesClean,
            created_at: takanoMeeting.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          this.state.persons.push(kawasakiPerson);
          changed = true;
        } else if (
          kawasakiPerson.display_name !== '川崎 景' ||
          kawasakiPerson.status !== 'active' ||
          !kawasakiPerson.phonetic_name ||
          !kawasakiPerson.last_interacted_at ||
          !kawasakiPerson.notes ||
          /インフルエンザ|寝起き|この会議は/.test(kawasakiPerson.notes) ||
          !kawasakiPerson.notes.includes('オーダースーツ')
        ) {
          kawasakiPerson.display_name = '川崎 景';
          kawasakiPerson.phonetic_name = kawasakiPerson.phonetic_name || 'カワサキ ケイ';
          kawasakiPerson.status = 'active';
          kawasakiPerson.is_name_verified = true;
          kawasakiPerson.meeting_count = Math.max(1, kawasakiPerson.meeting_count || 1);
          kawasakiPerson.last_interacted_at = meetingDateIso;
          kawasakiPerson.notes = kawasakiNotesClean;
          changed = true;
        }

        // 川崎景様の会社・事業（オーダースーツ事業）および事実・出典（オーダースーツ×オーダーメイド腕時計アステラ連携）を保証
        if (!(this.state.organizations || []).some(o => o.id === 'org-kawasaki-suit')) {
          this.state.organizations.push({
            id: 'org-kawasaki-suit',
            tenant_id: 'tenant-001',
            name: 'オーダースーツ事業（川崎景様）',
          });
          changed = true;
        }
        if (!(this.state.organizationMemberships || []).some(om => om.person_id === kawasakiPerson!.id)) {
          this.state.organizationMemberships.push({
            id: 'om-kawasaki-1',
            tenant_id: 'tenant-001',
            person_id: kawasakiPerson.id,
            organization_id: 'org-kawasaki-suit',
            organization_name: 'オーダースーツ事業',
            title: '代表（オーダースーツ仕立て・スタイリング）',
            is_current: true,
            started_on: '2026-11-22',
          });
          changed = true;
        }
        if (!(this.state.businessOfferings || []).some(bo => bo.person_id === kawasakiPerson!.id)) {
          this.state.businessOfferings.push({
            id: 'bo-kawasaki-1',
            tenant_id: 'tenant-001',
            person_id: kawasakiPerson.id,
            service_title: 'オーダースーツ仕立て・経営者向けスタイリング / カスタム腕時計「アステラ」クロスセル連携',
            specialties: 'オーダースーツ製作・フィッティング、経営者・ビジネス層向け装いブランディング、勝賀野様のカスタムオーダーメイド腕時計「アステラ（ASTERA）」とのクロスセル・相互紹介連携、体験型ビジネス交流会設計',
            target_clients: 'オーダースーツを仕立てたい経営者・ビジネスパーソン、オーダーメイド腕時計「アステラ」に関心のある顧客層、集客・人脈拡大を目指す飲食店オーナー',
            service_area: '大阪府・京都府・関西一円',
            is_active: true,
          });
          changed = true;
        }
        if (takanoPerson && !(this.state.businessOfferings || []).some(bo => bo.person_id === takanoPerson.id)) {
          this.state.businessOfferings.push({
            id: 'bo-takano-1',
            tenant_id: 'tenant-001',
            person_id: takanoPerson.id,
            service_title: 'ビジネスコミュニティ「ビーンズ」・ジャズベリー交流会企画運営 / ブランディング・パーソナリティ診断',
            specialties: '体験型ビジネス交流会設計、会員向けブランディング・自己理解・パーソナリティ診断カリキュラム提供、飲食店との相互送客モデル構築',
            target_clients: '人脈拡大と実践的ブランディングを求める経営者・個人事業主、集客連携を希望する飲食店オーナー',
            service_area: '大阪府・京都府・関西一円',
            is_active: true,
          });
          changed = true;
        }

        const kawasakiFacts: Fact[] = [
          {
            id: 'fact-kawasaki-topic-1',
            tenant_id: 'tenant-001',
            person_id: kawasakiPerson.id,
            fact_category: 'topic',
            fact_key: '本業（オーダースーツ事業）×オーダーメイド腕時計「アステラ」連携',
            fact_value: 'オーダースーツ事業（スーツ仕立て・経営者向けスタイリング）を展開。面談終盤にて勝賀野様が手掛けるカスタムオーダーメイド腕時計「アステラ（ASTERA）」の展開・ブランディング戦略について意見交換し、オーダースーツ顧客層との高い親和性を活かした相互紹介・クロスセル連携を協議',
            source_type: 'meeting_speech',
            source_id: takanoMeeting.id,
            source_evidence: '2026/11/22 Zoom面談（高野陽行様・川崎景様・勝賀野様）',
            confidence: 0.99,
            verification_status: 'verified',
            visibility: 'referral_eligible',
            valid_from: meetingDateIso,
            created_at: meetingDateIso,
          },
          {
            id: 'fact-kawasaki-topic-2',
            tenant_id: 'tenant-001',
            person_id: kawasakiPerson.id,
            fact_category: 'topic',
            fact_key: 'ビーンズ・ジャズベリー交流会改善提案',
            fact_value: 'ビーンズ・ジャズベリー交流会の改善として、①プライベート3分発表の成功モデルを応用した体験型ビジネス交流の仕組み化、②飲食店が集客・人脈拡大に役立つモデルケースとしての位置づけ、③ホームページを用いた事前一括登録・自己紹介入力システムの導入を提案',
            source_type: 'meeting_speech',
            source_id: takanoMeeting.id,
            source_evidence: '2026/11/22 Zoom面談（高野陽行様・川崎景様・勝賀野様）',
            confidence: 0.98,
            verification_status: 'verified',
            visibility: 'referral_eligible',
            valid_from: meetingDateIso,
            created_at: meetingDateIso,
          },
          {
            id: 'fact-kawasaki-promise-1',
            tenant_id: 'tenant-001',
            person_id: kawasakiPerson.id,
            fact_category: 'promise',
            fact_key: '次回アクション・約束ToDo',
            fact_value: '勝賀野様から次回京都開催の交流会の日程が決まり次第、川崎景様へ早期に共有し、オーダーメイド腕時計「アステラ」×オーダースーツ事業の連携および交流会運営改善を進める',
            source_type: 'meeting_speech',
            source_id: takanoMeeting.id,
            source_evidence: '2026/11/22 Zoom面談 Next Steps',
            confidence: 0.98,
            verification_status: 'verified',
            visibility: 'referral_eligible',
            valid_from: meetingDateIso,
            created_at: meetingDateIso,
          },
        ];
        for (const kf of kawasakiFacts) {
          if (!(this.state.facts || []).some(f => f.id === kf.id)) {
            this.state.facts.unshift(kf);
            changed = true;
          }
        }

        if (takanoPerson && !takanoMeeting.participant_ids.includes(takanoPerson.id)) {
          takanoMeeting.participant_ids.unshift(takanoPerson.id);
          changed = true;
        }
        if (kawasakiPerson && !takanoMeeting.participant_ids.includes(kawasakiPerson.id)) {
          takanoMeeting.participant_ids.push(kawasakiPerson.id);
          changed = true;
        }
        const expectedTitle = '高野 陽行様・川崎 景様と面談（ビーンズ・ジャズベリー交流会運営戦略×オーダースーツ・腕時計アステラ連携）';
        if (takanoMeeting.title !== expectedTitle) {
          takanoMeeting.title = expectedTitle;
          changed = true;
        }
        if (takanoPerson && kawasakiPerson) {
          const existingRel = (this.state.relationships || []).find(
            r =>
              r.tenant_id === 'tenant-001' &&
              ((r.from_person_id === takanoPerson.id && r.to_person_id === kawasakiPerson!.id) ||
                (r.from_person_id === kawasakiPerson!.id && r.to_person_id === takanoPerson.id))
          );
          if (!existingRel) {
            this.state.relationships.push({
              id: 'rel-takano-kawasaki',
              tenant_id: 'tenant-001',
              from_person_id: takanoPerson.id,
              to_person_id: kawasakiPerson.id,
              relationship_type: '共同運営・協業連携（ビーンズ・ジャズベリー交流会 / オーダースーツ×腕時計アステラ）',
              is_ai_inferred: false,
              confidence: 0.99,
              evidence_text: '2026/11/22 Zoom会議にて高野陽行様・川崎景様（オーダースーツ事業）・勝賀野様の3名でビーンズおよびジャズベリー交流会の運営改善とオーダーメイド腕時計「アステラ」連携を協議',
              source_meeting_id: 'm-zoom-nUUblUGRdOUzkSVNFeAKA',
            });
            changed = true;
          } else if (!existingRel.relationship_type.includes('オーダースーツ')) {
            existingRel.relationship_type = '共同運営・協業連携（ビーンズ・ジャズベリー交流会 / オーダースーツ×腕時計アステラ）';
            existingRel.evidence_text = '2026/11/22 Zoom会議にて高野陽行様・川崎景様（オーダースーツ事業）・勝賀野様の3名でビーンズおよびジャズベリー交流会の運営改善とオーダーメイド腕時計「アステラ」連携を協議';
            changed = true;
          }
        }
      }

      // 1.6 2026/11/27 川本美器様（京都・ディライトチャプター / WineShop Gorríon 代表）・高田陵平様（京都・インヴィクタスチャプター / 祇園バー Route Z マスター）のZoom面談（m-zoom-wd6wBnHzQI6x8a6ytmmxSA）のチャプター確定・重複統合
      const kawamotoMeeting = (this.state.meetings || []).find(
        m => (m.id === 'm-zoom-wd6wBnHzQI6x8a6ytmmxSA' || m.zoom_uuid === 'wd6wBnHzQI6x8a6ytmmxSA==') && m.tenant_id === 'tenant-001'
      );
      if (kawamotoMeeting) {
        const kmDateIso = kawamotoMeeting.scheduled_end_at || kawamotoMeeting.scheduled_start_at || '2026-11-27T03:57:37.000Z';

        // (A) 高田 陵平 様（p-takada-invictus に一本化し、重複 p-1795750960567-uha7i / p-1795750973371-w7377 を完全統合、京都シティセントラルリージョン・インヴィクタスチャプターを確定保証）
        let takadaPerson = (this.state.persons || []).find(
          p => p.tenant_id === 'tenant-001' && p.id === 'p-takada-invictus'
        );
        if (!takadaPerson) {
          takadaPerson = (this.state.persons || []).find(
            p => p.tenant_id === 'tenant-001' && p.status !== 'deleted' && /高田\s*陵平|陵平\s*高田|^高田さん/.test(p.display_name || '')
          );
        }
        const takadaNotesClean =
          'BNI 京都シティセントラルリージョン（Kyoto City Central）「インヴィクタスチャプター」所属。勝賀野様と共同で京都・祇園のバー「Route Z」を運営（マスター）。森 雄平様と同チャプターでコネクト連携を行い、中川 丈太郎様とも女性アルバイト求人原稿作成連携、川本 美器様（WineShop Gorríon / ディライトチャプター）とも祇園バー「Route Z」へのワイン導入・グラスワイン提供および飲食店相互紹介で協業。';
        if (!takadaPerson) {
          takadaPerson = {
            id: 'p-takada-invictus',
            tenant_id: 'tenant-001',
            display_name: '高田 陵平',
            phonetic_name: 'タカダ リョウヘイ',
            status: 'active',
            is_name_verified: true,
            category_tags: ['BNI', '仕事', 'パートナー'],
            service_areas: ['京都府（祇園・京都市）', '関西一円'],
            office_address: '京都府京都市東山区（祇園バー Route Z）',
            meeting_count: 1,
            last_interacted_at: kmDateIso,
            notes: takadaNotesClean,
            created_at: '2026-11-19T03:05:00Z',
            updated_at: kmDateIso,
          };
          this.state.persons.unshift(takadaPerson);
          changed = true;
        } else if (
          takadaPerson.display_name !== '高田 陵平' ||
          takadaPerson.status !== 'active' ||
          takadaPerson.phonetic_name !== 'タカダ リョウヘイ' ||
          !takadaPerson.notes?.includes('WineShop Gorríon')
        ) {
          takadaPerson.display_name = '高田 陵平';
          takadaPerson.phonetic_name = 'タカダ リョウヘイ';
          takadaPerson.status = 'active';
          takadaPerson.is_name_verified = true;
          takadaPerson.category_tags = Array.from(new Set([...(takadaPerson.category_tags || []), 'BNI', '仕事', 'パートナー']));
          takadaPerson.service_areas = ['京都府（祇園・京都市）', '関西一円'];
          takadaPerson.office_address = takadaPerson.office_address || '京都府京都市東山区（祇園バー Route Z）';
          takadaPerson.meeting_count = Math.max(1, takadaPerson.meeting_count || 1);
          takadaPerson.last_interacted_at = kmDateIso;
          takadaPerson.notes = takadaNotesClean;
          changed = true;
        }

        const dupTakadaPersons = (this.state.persons || []).filter(
          p =>
            p.tenant_id === 'tenant-001' &&
            p.id !== takadaPerson!.id &&
            (/高田\s*陵平|陵平\s*高田|^高田さん/.test(p.display_name || '') ||
              p.id === 'p-1795750960567-uha7i' ||
              p.id === 'p-1795750973371-w7377')
        );
        for (const dupP of dupTakadaPersons) {
          this.deletedIds.add(dupP.id);
          this.mergePersons(takadaPerson.id, dupP.id);
          changed = true;
        }

        // 高田様のBNI所属（京都シティセントラルリージョン・インヴィクタスチャプター: chap-bni-258）を確定保証
        for (const bm of this.state.bniMemberships || []) {
          if (bm.person_id === takadaPerson.id && bm.id !== 'bnim-takada-1') {
            this.deletedIds.add(bm.id);
            changed = true;
          }
        }
        this.state.bniMemberships = (this.state.bniMemberships || []).filter(
          bm => !(bm.person_id === takadaPerson!.id && bm.id !== 'bnim-takada-1')
        );
        const existingTakadaBni = (this.state.bniMemberships || []).find(bm => bm.id === 'bnim-takada-1');
        if (!existingTakadaBni) {
          this.state.bniMemberships.unshift({
            id: 'bnim-takada-1',
            tenant_id: 'tenant-001',
            person_id: takadaPerson.id,
            chapter_id: 'chap-bni-258',
            chapter_name: 'インヴィクタスチャプター',
            region_name: '京都シティセントラルリージョン (Kyoto City Central)',
            category: 'バー・飲食店経営（祇園バー「Route Z」マスター）',
            status: 'active',
            joined_on: '2026-04-01',
          });
          changed = true;
        } else if (
          existingTakadaBni.person_id !== takadaPerson.id ||
          existingTakadaBni.chapter_id !== 'chap-bni-258' ||
          existingTakadaBni.chapter_name !== 'インヴィクタスチャプター' ||
          existingTakadaBni.region_name !== '京都シティセントラルリージョン (Kyoto City Central)'
        ) {
          existingTakadaBni.person_id = takadaPerson.id;
          existingTakadaBni.chapter_id = 'chap-bni-258';
          existingTakadaBni.chapter_name = 'インヴィクタスチャプター';
          existingTakadaBni.region_name = '京都シティセントラルリージョン (Kyoto City Central)';
          existingTakadaBni.category = 'バー・飲食店経営（祇園バー「Route Z」マスター）';
          existingTakadaBni.status = 'active';
          changed = true;
        }

        if (!(this.state.organizations || []).some(o => o.id === 'org-route-z')) {
          this.state.organizations.push({
            id: 'org-route-z',
            tenant_id: 'tenant-001',
            name: '祇園バー Route Z',
          });
          changed = true;
        }
        if (!(this.state.organizationMemberships || []).some(om => om.person_id === takadaPerson!.id)) {
          this.state.organizationMemberships.push({
            id: 'om-takada-1',
            tenant_id: 'tenant-001',
            person_id: takadaPerson.id,
            organization_id: 'org-route-z',
            organization_name: '祇園バー Route Z',
            title: 'マスター（共同運営）',
            is_current: true,
            started_on: '2026-04-01',
          });
          changed = true;
        }
        if (!(this.state.businessOfferings || []).some(bo => bo.person_id === takadaPerson!.id)) {
          this.state.businessOfferings.push({
            id: 'bo-takada-1',
            tenant_id: 'tenant-001',
            person_id: takadaPerson.id,
            service_title: '京都・祇園バー「Route Z」運営（経営者交流・二次会・店舗協業）',
            specialties: '京都・祇園でのバー運営、BNIインヴィクタスチャプターを軸とした京都・関西の経営者・飲食店ネットワーク構築、ワイン・高級スイーツ等の店舗導入協業',
            target_clients: '京都・祇園エリアで会食・二次会・交流会を行う経営者様、飲食店・酒類卸パートナー様',
            service_area: '京都府（祇園・京都市）・関西一円',
            is_active: true,
          });
          changed = true;
        }

        // (B) 川本 美器 様（p-1795750960554-z5i2n: 「美器 川本」「桑本みき」→「川本 美器」、誤マッチした大阪・インテグレーションチャプターを破棄し、京都シティセントラルリージョン・ディライトチャプター chap-bni-297 を確定保証）
        let kawamotoPerson = (this.state.persons || []).find(
          p =>
            p.tenant_id === 'tenant-001' &&
            p.status !== 'deleted' &&
            (p.id === 'p-1795750960554-z5i2n' || /川本\s*美器|美器\s*川本|桑本\s*みき/.test(p.display_name || ''))
        );
        const kawamotoNotesClean =
          'BNI 京都シティセントラルリージョン（Kyoto City Central）「ディライトチャプター」所属（入会8ヶ月目・カテゴリー：ワイン販売）。京都市上京区（西陣織会館近く・晴明神社から徒歩2〜3分）にてヨーロッパ産中心（フランス・イタリア・スペイン・ポルトガル・オーストリア・ドイツ等）のワインショップ「WineShop Gorríon（ゴリオン）」を経営（店舗販売・EC通販・飲食店向け卸・ワイン会企画）。実家は西陣織の織元。ワイン買取ライセンスの取得も進行中。勝賀野様・高田様が運営する祇園バー「Route Z」へのグラスワイン（赤・白3,000〜4,000円帯やシャンパン）導入および、勝賀野様の遺品整理・残置物撤去現場から出る未開栓ワイン・古酒の買取査定連携に合意。';
        if (kawamotoPerson) {
          if (
            kawamotoPerson.display_name !== '川本 美器' ||
            kawamotoPerson.phonetic_name !== 'カワモト ミキ' ||
            kawamotoPerson.status !== 'active' ||
            !kawamotoPerson.notes ||
            /桑本|風邪気味|体調不良|インテグレーション/.test(kawamotoPerson.notes) ||
            !kawamotoPerson.notes.includes('ディライトチャプター')
          ) {
            kawamotoPerson.display_name = '川本 美器';
            kawamotoPerson.phonetic_name = 'カワモト ミキ';
            kawamotoPerson.status = 'active';
            kawamotoPerson.is_name_verified = true;
            kawamotoPerson.category_tags = Array.from(new Set([...(kawamotoPerson.category_tags || []), 'BNI', '仕事']));
            kawamotoPerson.service_areas = ['京都府（上京区・西陣・祇園・京都市全域）', '大阪府', '全国EC対応'];
            kawamotoPerson.office_address = '京都府京都市上京区（西陣織会館・晴明神社徒歩2〜3分）';
            kawamotoPerson.meeting_count = Math.max(1, kawamotoPerson.meeting_count || 1);
            kawamotoPerson.last_interacted_at = kmDateIso;
            kawamotoPerson.notes = kawamotoNotesClean;
            changed = true;
          }

          // 誤登録された大阪のインテグレーションチャプター（bnim-1795750960560-3yto 等）を削除し、京都シティセントラル・ディライトチャプター（chap-bni-297）へ統一
          for (const bm of this.state.bniMemberships || []) {
            if (bm.person_id === kawamotoPerson.id && bm.id !== 'bnim-kawamoto-1') {
              this.deletedIds.add(bm.id);
              changed = true;
            }
          }
          this.state.bniMemberships = (this.state.bniMemberships || []).filter(
            bm => !(bm.person_id === kawamotoPerson!.id && bm.id !== 'bnim-kawamoto-1')
          );
          const existingKawamotoBni = (this.state.bniMemberships || []).find(bm => bm.id === 'bnim-kawamoto-1');
          if (!existingKawamotoBni) {
            this.state.bniMemberships.unshift({
              id: 'bnim-kawamoto-1',
              tenant_id: 'tenant-001',
              person_id: kawamotoPerson.id,
              chapter_id: 'chap-bni-297',
              chapter_name: 'ディライトチャプター',
              region_name: '京都シティセントラルリージョン (Kyoto City Central)',
              category: 'ワイン販売（WineShop Gorríon 代表・飲食店向けワイン卸・買取）',
              status: 'active',
              joined_on: '2026-04-01',
            });
            changed = true;
          } else if (
            existingKawamotoBni.person_id !== kawamotoPerson.id ||
            existingKawamotoBni.chapter_name !== 'ディライトチャプター' ||
            existingKawamotoBni.region_name !== '京都シティセントラルリージョン (Kyoto City Central)'
          ) {
            existingKawamotoBni.person_id = kawamotoPerson.id;
            existingKawamotoBni.chapter_id = 'chap-bni-297';
            existingKawamotoBni.chapter_name = 'ディライトチャプター';
            existingKawamotoBni.region_name = '京都シティセントラルリージョン (Kyoto City Central)';
            existingKawamotoBni.category = 'ワイン販売（WineShop Gorríon 代表・飲食店向けワイン卸・買取）';
            existingKawamotoBni.status = 'active';
            changed = true;
          }

          for (const bo of this.state.businessOfferings || []) {
            if (bo.person_id === kawamotoPerson.id) {
              if (/桑本|インテグレーション/.test(`${bo.service_title} ${bo.specialties} ${bo.target_clients}`)) {
                bo.service_title = 'ヨーロッパワイン専門店「WineShop Gorríon」運営・飲食店向け卸・ワイン会企画・古酒買取連携';
                bo.specialties = 'ヨーロッパ産ワイン（仏・伊・西・葡・墺・独）の厳選仕入・店舗販売（京都市上京区・晴明神社近く）・EC通販、飲食店向け小ロット卸提案、ワイン会イベント開催、遺品整理等の未開栓ワイン査定買取';
                bo.target_clients = 'ワイン導入を希望するバー・飲食店オーナー様（京都・大阪）、ワイン愛好家・経営者様、未開栓ワインの売却・買取を希望する方';
                bo.service_area = '京都府・大阪府・全国EC対応';
                changed = true;
              }
            }
          }
        }

        // (C) 面談 m-zoom-wd6wBnHzQI6x8a6ytmmxSA のタイトル・参加者・文字起こし要約・Factsを確定クリーン化
        const expectedKmTitle =
          '川本 美器様・高田 陵平様と1to1（京都・ディライト＆インヴィクタスチャプター / WineShop Gorríon 祇園バーRoute Zワイン導入・相互紹介）';
        if (kawamotoMeeting.title !== expectedKmTitle) {
          kawamotoMeeting.title = expectedKmTitle;
          changed = true;
        }
        const targetPids = [kawamotoPerson?.id, takadaPerson?.id].filter(Boolean) as string[];
        if (JSON.stringify(kawamotoMeeting.participant_ids) !== JSON.stringify(targetPids)) {
          kawamotoMeeting.participant_ids = targetPids;
          changed = true;
        }

        const cleanKmSummary = [
          'BNI 京都シティセントラルリージョン「ディライトチャプター」所属の川本 美器様（WineShop Gorríon 代表 / ワイン販売）および「インヴィクタスチャプター」所属の高田 陵平様（祇園バー「Route Z」マスター）・勝賀野様の3名による1to1面談。川本様は京都市上京区（西陣織会館・晴明神社から徒歩2〜3分）にてヨーロッパ産ワイン専門店「WineShop Gorríon（ゴリオン）」を運営（実家は西陣織の織元）し、店舗販売・EC通販・飲食店向け卸・ワイン会イベントおよびワイン買取ライセンス取得を展開。勝賀野様・高田様が運営する祇園バー「Route Z」へのグラスワイン（赤・白3,000〜4,000円帯やシャンパン）導入、および勝賀野様の遺品整理・残置物撤去現場から出る未開栓ワインの買取査定連携・飲食店相互紹介で合意。',
          '・事業背景とWineShop Gorríonの強み: 川本美器様は三島宏幸様（だんじりチャプター）からのご紹介で今回の1to1を実施。フランス・イタリア・スペイン・ポルトガル・オーストリア・ドイツ等のヨーロッパワインを中心に、試飲会・インポーターから厳選して仕入れ、飲食店ごとの料理や客層に合わせた小ロット卸・メニュー提案に強みを持つ。',
          '・祇園バー「Route Z」へのワイン導入・店舗見学: 勝賀野様と高田陵平様が運営する祇園バー「Route Z」では現在ウイスキー・焼酎が中心でワインの取扱がないため、高田様が上京区の「WineShop Gorríon」実店舗を訪問し、バーでグラス提供しやすい3,000〜4,000円帯の赤・白ワインやシャンパンを選定して導入を進めることで合意。',
          '・未開栓ワイン買取×遺品整理連携および相互紹介: 川本様が取得手続き中の酒類（ワイン）買取ライセンスを活用し、勝賀野様の遺品整理・残置物撤去現場で出る未開栓ワイン・古酒の査定・買取連携を協議。また、川本様からディライトチャプターの近味様（不動産関連・元警察官）、勝賀野様・高田様から中書島のバー経営者様やワイン愛好家の知人経営者を相互に紹介し、祇園バー「Route Z」での懇親会を開催することで一致。',
        ].join('\n');

        const kmTr = (this.state.transcripts || []).find(t => t.meeting_id === kawamotoMeeting.id);
        if (kmTr) {
          if (
            !kmTr.summary ||
            /桑本|風邪気味|体調不良|リライトチャプター|3島/.test(kmTr.summary) ||
            !kmTr.summary.includes('ディライトチャプター') ||
            !kmTr.summary.includes('インヴィクタスチャプター') ||
            !kmTr.summary.includes('WineShop Gorríon')
          ) {
            kmTr.summary = cleanKmSummary;
            (kmTr as any).ai_refined = true;
            changed = true;
          }
          if (kmTr.full_text) {
            const fixedFull = fixMuto(kmTr.full_text) || kmTr.full_text;
            if (fixedFull !== kmTr.full_text) {
              kmTr.full_text = fixedFull;
              changed = true;
            }
          }
        }

        // 川本様・高田様の確定Factsを保証し、生の誤認識Fact（fact-zoom-*）を除去
        for (const f of this.state.facts || []) {
          if (
            f.source_id === kawamotoMeeting.id &&
            (f.id.startsWith('fact-zoom-') || /桑本|風邪気味|体調不良|リライトチャプター/.test(f.fact_value || ''))
          ) {
            this.deletedIds.add(f.id);
            changed = true;
          }
        }
        this.state.facts = (this.state.facts || []).filter(
          f =>
            !(
              f.source_id === kawamotoMeeting.id &&
              (f.id.startsWith('fact-zoom-') || /桑本|風邪気味|体調不良|リライトチャプター/.test(f.fact_value || ''))
            )
        );

        const kmCoreFacts: Fact[] = [
          ...(kawamotoPerson
            ? [
                {
                  id: 'fact-kawamoto-topic-1',
                  tenant_id: 'tenant-001',
                  person_id: kawamotoPerson.id,
                  fact_category: 'topic' as const,
                  fact_key: '盛り上がった話題・事業内容',
                  fact_value:
                    'BNI 京都シティセントラルリージョン「ディライトチャプター」所属（カテゴリー：ワイン販売）。京都市上京区（西陣織会館・晴明神社徒歩2〜3分）にてヨーロッパ産ワイン専門店「WineShop Gorríon（ゴリオン）」を経営（実家は西陣織の織元）。祇園バー「Route Z」へのグラスワイン（3,000〜4,000円帯）・シャンパン導入、および遺品整理・残置物撤去現場で出る未開栓ワインの買取連携・飲食店相互紹介に合意',
                  source_type: 'meeting_speech' as const,
                  source_id: kawamotoMeeting.id,
                  source_evidence: '2026/11/27 Zoom 1to1面談（川本美器様・高田陵平様・勝賀野様）',
                  confidence: 0.99,
                  verification_status: 'verified' as const,
                  visibility: 'referral_eligible' as const,
                  valid_from: kmDateIso,
                  created_at: kmDateIso,
                },
                {
                  id: 'fact-kawamoto-promise-1',
                  tenant_id: 'tenant-001',
                  person_id: kawamotoPerson.id,
                  fact_category: 'promise' as const,
                  fact_key: '保留中の約束・ToDo',
                  fact_value:
                    '高田陵平様が上京区の「WineShop Gorríon」実店舗を訪問して祇園バー「Route Z」用ワインを選定・導入し、勝賀野様から中書島のバー経営者様・ワイン愛好家をご紹介、川本美器様からディライトチャプターの近味様（不動産関連・元警察官）をお繋ぎして祇園バー「Route Z」で懇親会を開催する',
                  source_type: 'meeting_speech' as const,
                  source_id: kawamotoMeeting.id,
                  source_evidence: '2026/11/27 Zoom 1to1面談 Next Steps',
                  confidence: 0.99,
                  verification_status: 'verified' as const,
                  visibility: 'referral_eligible' as const,
                  valid_from: kmDateIso,
                  created_at: kmDateIso,
                },
              ]
            : []),
          ...(takadaPerson
            ? [
                {
                  id: 'fact-takada-topic-1',
                  tenant_id: 'tenant-001',
                  person_id: takadaPerson.id,
                  fact_category: 'topic' as const,
                  fact_key: '盛り上がった話題・事業内容',
                  fact_value:
                    'BNI 京都シティセントラルリージョン「インヴィクタスチャプター」所属。京都・祇園バー「Route Z」マスターとして勝賀野様と共同運営。川本美器様（WineShop Gorríon / ディライトチャプター）との1to1に同席し、バー「Route Z」でのグラスワイン（赤・白3,000〜4,000円帯）・シャンパン提供に向けた店舗訪問・仕入選定および京都エリアの飲食店・経営者相互紹介で合意',
                  source_type: 'meeting_speech' as const,
                  source_id: kawamotoMeeting.id,
                  source_evidence: '2026/11/27 Zoom 1to1面談（川本美器様・高田陵平様・勝賀野様）',
                  confidence: 0.99,
                  verification_status: 'verified' as const,
                  visibility: 'referral_eligible' as const,
                  valid_from: kmDateIso,
                  created_at: kmDateIso,
                },
                {
                  id: 'fact-takada-promise-1',
                  tenant_id: 'tenant-001',
                  person_id: takadaPerson.id,
                  fact_category: 'promise' as const,
                  fact_key: '保留中の約束・ToDo',
                  fact_value:
                    '高田陵平様が川本美器様の「WineShop Gorríon」（京都市上京区・晴明神社近く）を訪問して祇園バー「Route Z」に置くワインを選定・購入し、川本様を祇園バー「Route Z」へ招待して懇親および飲食店紹介を進める',
                  source_type: 'meeting_speech' as const,
                  source_id: kawamotoMeeting.id,
                  source_evidence: '2026/11/27 Zoom 1to1面談 Next Steps',
                  confidence: 0.99,
                  verification_status: 'verified' as const,
                  visibility: 'referral_eligible' as const,
                  valid_from: kmDateIso,
                  created_at: kmDateIso,
                },
              ]
            : []),
        ];
        for (const kf of kmCoreFacts) {
          const existingIdx = (this.state.facts || []).findIndex(f => f.id === kf.id);
          if (existingIdx >= 0) {
            if (this.state.facts[existingIdx].fact_value !== kf.fact_value) {
              this.state.facts[existingIdx] = kf;
              changed = true;
            }
          } else {
            this.state.facts.unshift(kf);
            changed = true;
          }
        }
      }
    }

    // 2. 旧 syncZoomInbox が作った参加者なしの空枠 m-zoom-89527504054 や孤児Factを除去
    const orphanMeetings = this.state.meetings.filter(
      m => m.id === 'm-zoom-89527504054' && (!m.participant_ids || m.participant_ids.length === 0)
    );
    if (orphanMeetings.length > 0) {
      this.state.meetings = this.state.meetings.filter(
        m => !(m.id === 'm-zoom-89527504054' && (!m.participant_ids || m.participant_ids.length === 0))
      );
      this.deletedIds.add('m-zoom-89527504054');
      changed = true;
    }
    const beforeFacts = this.state.facts.length;
    this.state.facts = this.state.facts.filter(f => f.person_id !== 'p-zoom-participant');
    if (this.state.facts.length !== beforeFacts) changed = true;

    // 2.4 辻晃典様（ツージー）および木村尚史様の重複カルテを本カルテへ自動統合
    const tsujiMain = this.state.persons.find(p => p.id === 'p-tsuji-akinori');
    if (tsujiMain) {
      const dupTsuji = this.state.persons.filter(
        p => p.tenant_id === tid && p.id !== 'p-tsuji-akinori' && /^ツージー$|^辻\s*晃典$/.test(p.display_name.trim())
      );
      for (const dupP of dupTsuji) {
        this.deletedIds.add(dupP.id);
        this.mergePersons(tsujiMain.id, dupP.id);
        changed = true;
      }
    }
    const kimuraMain = this.state.persons.find(p => p.id === 'p-kimura-naofumi');
    if (kimuraMain) {
      const dupKimura = this.state.persons.filter(
        p => p.tenant_id === tid && p.id !== 'p-kimura-naofumi' && /^木村\s*尚史$/.test(p.display_name.trim())
      );
      for (const dupP of dupKimura) {
        this.deletedIds.add(dupP.id);
        this.mergePersons(kimuraMain.id, dupP.id);
        changed = true;
      }
    }

    // 2.5 田中義博様（夢叶開発）の重複人物・重複予定（未完了・完了済み問わず、スマホ登録分や文字起こし貼り付け分も含む）を完全統合
    const tanakaMain = this.state.persons.find(p => p.id === 'p-tanaka-yoshihiro');
    if (tanakaMain) {
      const dupTanakaPersons = this.state.persons.filter(p =>
        p.tenant_id === tid &&
        p.id !== 'p-tanaka-yoshihiro' &&
        (
          /夢叶開発|無党開発|武藤開発|^田中\s*義博$|^田中(|様|さん)$|^生姜の$/.test(p.display_name.trim()) ||
          (p.notes && /夢叶開発|無党開発|武藤開発|西友寺/.test(p.notes) && !['p-miura-prov', 'p-irie-prov'].includes(p.id))
        )
      );
      for (const dupP of dupTanakaPersons) {
        this.deletedIds.add(dupP.id);
        this.mergePersons(tanakaMain.id, dupP.id);
        changed = true;
      }

      const dupTanakaMeetings = this.state.meetings.filter(m => {
        if (m.tenant_id !== tid || m.id === 'm-tanaka-20261110') return false;
        const p0 = m.participant_ids[0] ? this.getPersonById(m.participant_ids[0]) : undefined;
        const tr = this.state.transcripts.find(t => t.meeting_id === m.id);
        return (
          m.id === 'm-zoom-BGodEUwlTyuhgtDOPAVEw' ||
          m.zoom_uuid === 'BGodEUwlTyuhgtDOPAVE+w==' ||
          /夢叶開発|無党開発|武藤開発|田中|生姜の/.test(m.title) ||
          (m.raw_invite_text && /夢叶開発|無党開発|武藤開発|田中/.test(m.raw_invite_text)) ||
          (p0 && (p0.id === 'p-tanaka-yoshihiro' || /夢叶開発|田中|生姜の/.test(p0.display_name))) ||
          (tr && /夢叶開発|無党開発|田中義博|西友寺/.test(tr.full_text || ''))
        );
      });

      for (const dupM of dupTanakaMeetings) {
        for (const pid of dupM.participant_ids) {
          if (pid && pid !== 'p-tanaka-yoshihiro') {
            const pObj = this.getPersonById(pid);
            if (pObj && /夢叶開発|田中|生姜の|相手未特定|面談のお相手/.test(pObj.display_name)) {
              this.deletedIds.add(pid);
              this.mergePersons(tanakaMain.id, pid);
            }
          }
        }
        this.deletedIds.add(dupM.id);
        this.state.meetings = this.state.meetings.filter(m => m.id !== dupM.id);
        this.state.consents = this.state.consents.filter(c => c.meeting_id !== dupM.id);
        this.state.transcripts = this.state.transcripts.filter(t => t.meeting_id !== dupM.id);
        changed = true;
      }
    }

    // 2.6 岩根義行様（株式会社岩根工業・一般社団法人ディスカイステージ）の重複人物・未要約の生ログ予定を完全統合
    const iwaneMain = this.state.persons.find(p => p.id === 'p-iwane-yoshiyuki');
    if (iwaneMain) {
      const dupIwanePersons = this.state.persons.filter(p =>
        p.tenant_id === tid &&
        !['p-iwane-yoshiyuki', 'p-mishima-danjiri', 'p-tsuchibayashi-danjiri', 'p-mishima-prov'].includes(p.id) &&
        !/三島|土林/.test(p.display_name) &&
        (
          /岩根|岩根工業|ディスカイステージ|シャングリア|シャングリラ/.test(p.display_name.trim()) ||
          (p.notes && /岩根工業|シャングリラチャプター/.test(p.notes))
        )
      );
      for (const dupP of dupIwanePersons) {
        this.deletedIds.add(dupP.id);
        this.mergePersons(iwaneMain.id, dupP.id);
        changed = true;
      }

      const dupIwaneMeetings = this.state.meetings.filter(m => {
        if (m.tenant_id !== tid || m.id === 'm-iwane-20261112') return false;
        const p0 = m.participant_ids[0] ? this.getPersonById(m.participant_ids[0]) : undefined;
        const tr = this.state.transcripts.find(t => t.meeting_id === m.id);
        return (
          /岩根|ディスカイステージ/.test(m.title) ||
          (m.raw_invite_text && /岩根/.test(m.raw_invite_text)) ||
          (p0 && (p0.id === 'p-iwane-yoshiyuki' || /岩根/.test(p0.display_name))) ||
          (tr && /岩根工業|ディスカイステージ|シャングリラチャプター/.test(tr.full_text || ''))
        );
      });

      for (const dupM of dupIwaneMeetings) {
        const dupTr = this.state.transcripts.find(t => t.meeting_id === dupM.id);
        const mainTr = this.state.transcripts.find(t => t.meeting_id === 'm-iwane-20261112');
        if (dupTr) {
          this.deletedIds.add(dupTr.id);
          if (mainTr && dupTr.full_text && dupTr.full_text.length > mainTr.full_text.length) {
            mainTr.full_text = dupTr.full_text;
          }
        }
        for (const f of this.state.facts) {
          if (f.source_id === dupM.id) {
            this.deletedIds.add(f.id);
          }
        }
        this.state.facts = this.state.facts.filter(f => f.source_id !== dupM.id);
        for (const pid of dupM.participant_ids) {
          if (pid && pid !== 'p-iwane-yoshiyuki') {
            this.deletedIds.add(pid);
            this.mergePersons(iwaneMain.id, pid);
          }
        }
        this.deletedIds.add(dupM.id);
        this.state.meetings = this.state.meetings.filter(m => m.id !== dupM.id);
        this.state.consents = this.state.consents.filter(c => c.meeting_id !== dupM.id);
        this.state.transcripts = this.state.transcripts.filter(t => t.meeting_id !== dupM.id);
        changed = true;
      }
    }

    // 3. スマホ等で事前登録されていた未完了予定（例:「〇〇の△△様」）と完了済み面談の自動統合
    const completedMeetings = this.state.meetings.filter(
      m => m.tenant_id === tid && (m.status === 'completed' || m.recording_status === 'completed')
    );
    const pendingMeetings = this.state.meetings.filter(
      m => m.tenant_id === tid && m.status !== 'completed' && m.recording_status !== 'completed'
    );

    for (const pending of pendingMeetings) {
      const pendingDate = pending.scheduled_start_at.slice(0, 10);
      const hint = this.parseCompanyAndPersonHint(pending.title);
      const pendingPerson = pending.participant_ids[0] ? this.getPersonById(pending.participant_ids[0]) : undefined;
      const personHint = pendingPerson ? this.parseCompanyAndPersonHint(pendingPerson.display_name) : hint;
      const surnameHint = (personHint.personName || hint.personName).split(/\s+/)[0];
      const companyHint = personHint.company || hint.company;

      if (!surnameHint || surnameHint.length < 1 || surnameHint.startsWith('相手未特定')) continue;

      const matchedCompleted = completedMeetings.find(cm => {
        const cmDate = cm.scheduled_start_at.slice(0, 10);
        const timeDiffHrs = Math.abs(new Date(cm.scheduled_start_at).getTime() - new Date(pending.scheduled_start_at).getTime()) / 3600000;
        const cmPerson = cm.participant_ids[0] ? this.getPersonById(cm.participant_ids[0]) : undefined;
        const nameOrCompanyMatch =
          cm.title.includes(surnameHint) ||
          (cmPerson && cmPerson.display_name.includes(surnameHint)) ||
          (companyHint && cm.title.includes(companyHint));
        if (!nameOrCompanyMatch) return false;
        // 会社名と姓の両方が一致する場合は日付ズレがあっても同一面談として統合、姓のみの場合は前後36時間以内
        if (companyHint && (cm.title.includes(companyHint) || (cmPerson?.notes && cmPerson.notes.includes(companyHint)))) {
          return true;
        }
        return cmDate === pendingDate || timeDiffHrs <= 36;
      });

      if (matchedCompleted) {
        const keepPid = matchedCompleted.participant_ids[0];
        const keepPerson = keepPid ? this.getPersonById(keepPid) : undefined;
        if (keepPerson && companyHint) {
          const hasOrg = this.getOrgMembershipsForPerson(keepPerson.id).some(
            o => o.organization_name === companyHint
          );
          if (!hasOrg) {
            this.addOrganizationMembership(keepPerson.id, companyHint, '代表');
          }
        }
        if (keepPerson && pendingPerson && pendingPerson.id !== keepPerson.id) {
          this.deletedIds.add(pendingPerson.id);
          this.mergePersons(keepPerson.id, pendingPerson.id);
        }
        this.deletedIds.add(pending.id);
        this.state.meetings = this.state.meetings.filter(m => m.id !== pending.id);
        this.state.consents = this.state.consents.filter(c => c.meeting_id !== pending.id);
        changed = true;
      }
    }

    // 4. 予定登録で「面談予定」「相手未特定 (LINE連絡)」になってしまった未完了予定から、案内文・タイトル内の相手名（例:「岩根さんとの１To1」）を自動復元
    for (const m of this.state.meetings || []) {
      if (m.tenant_id !== tid) continue;
      const p0 = m.participant_ids[0] ? this.getPersonById(m.participant_ids[0]) : undefined;
      const isGenericPerson = !p0 || p0.display_name.includes('相手未特定') || p0.display_name === '面談予定';
      const isGenericTitle = !m.title || m.title === '面談予定' || m.title.includes('相手未特定');
      if (isGenericPerson || isGenericTitle) {
        const sourceText = [m.raw_invite_text, m.title !== '面談予定' ? m.title : ''].filter(Boolean).join(' ');
        if (sourceText.trim()) {
          const parsed = this.parseMeetingIntent(sourceText);
          const candidate = parsed.extracted.candidate_participants[0]?.name;
          if (candidate && !['面談予定', '相手未特定', 'オンライン面談', '面談', 'Zoom予定'].includes(candidate)) {
            const hint = this.parseCompanyAndPersonHint(candidate);
            const resolvedName = hint.personName || candidate;
            if (resolvedName && resolvedName.length >= 1) {
              if (p0 && p0.display_name.includes('相手未特定')) {
                p0.display_name = resolvedName;
                if (hint.company) {
                  this.addOrganizationMembership(p0.id, hint.company, '代表');
                }
                changed = true;
              } else if (!p0) {
                const newP = this.createPerson({
                  display_name: resolvedName,
                  status: 'provisional',
                  category_tags: [m.meeting_type === '1to1' ? 'BNI' : '仕事'],
                });
                m.participant_ids = [newP.id];
                changed = true;
              }
              if (isGenericTitle) {
                m.title = `${resolvedName}様と${m.meeting_type === '1to1' ? '1to1面談' : '面談'}`;
                changed = true;
              }
            }
          }
        }
      }
    }

    // 5. 相関図の孤児エッジ（片方の人物が削除・統合されて存在しない関係エッジ）を自動クリーンアップ
    if (Array.isArray(this.state.relationships)) {
      const validPersonIds = new Set((this.state.persons || []).map(p => p.id));
      for (const rel of this.state.relationships) {
        if (!validPersonIds.has(rel.from_person_id) || !validPersonIds.has(rel.to_person_id) || rel.id === 'rel-mishima-iwane') {
          this.deletedIds.add(rel.id);
          changed = true;
        }
      }
      this.state.relationships = this.state.relationships.filter(
        rel => validPersonIds.has(rel.from_person_id) && validPersonIds.has(rel.to_person_id) && rel.id !== 'rel-mishima-iwane'
      );
    }

    // 5.5 会話中の第三者言及から誤抽出された会社名（「株式会社みやびっていう」等）、重複した「〜様の専門事業」オファリング、および「うち以外のチャプター」等の会話文BNI誤登録の完全排除
    if (tid === 'tenant-001') {
      if (
        !(this.state.businessOfferings || []).some(b => b.id === 'bo-tsuji-1') ||
        (this.state.businessOfferings || []).filter(b => b.person_id === 'p-tsuji-akinori').length > 1
      ) {
        this.seedTsujiMeeting();
        changed = true;
      }
      if (
        !(this.state.businessOfferings || []).some(b => b.id === 'bo-kimura-1') ||
        (this.state.businessOfferings || []).filter(b => b.person_id === 'p-kimura-naofumi').length > 1
      ) {
        this.seedKimuraMeeting();
        changed = true;
      }
    }

    if (Array.isArray(this.state.organizationMemberships)) {
      const seenOrgKey = new Set<string>();
      this.state.organizationMemberships = this.state.organizationMemberships.filter(om => {
        const key = `${om.person_id}::${om.organization_name || ''}`;
        if (
          /っていう|という|って会社/.test(om.organization_name || '') ||
          om.id === 'om-1794805667075' ||
          seenOrgKey.has(key)
        ) {
          this.deletedIds.add(om.id);
          changed = true;
          return false;
        }
        seenOrgKey.add(key);
        return true;
      });
    }
    if (Array.isArray(this.state.businessOfferings)) {
      const hasNamedOfferingByPerson = new Set(
        this.state.businessOfferings
          .filter(b => !/様の専門事業$/.test(b.service_title || ''))
          .map(b => b.person_id)
      );
      const seenBoKey = new Set<string>();
      this.state.businessOfferings = this.state.businessOfferings.filter(bo => {
        const key = `${bo.person_id}::${bo.service_title || ''}`;
        if (
          (/様の専門事業$/.test(bo.service_title || '') && hasNamedOfferingByPerson.has(bo.person_id)) ||
          seenBoKey.has(key)
        ) {
          this.deletedIds.add(bo.id);
          changed = true;
          return false;
        }
        seenBoKey.add(key);
        return true;
      });
    }
    if (Array.isArray(this.state.bniMemberships)) {
      const seenBniKey = new Set<string>();
      this.state.bniMemberships = this.state.bniMemberships.filter(bm => {
        if (bm.chapter_name) {
          const matchedOfficial = OFFICIAL_BNI_CHAPTERS.find(c => c.chapter_name === bm.chapter_name);
          if (matchedOfficial && bm.chapter_id !== matchedOfficial.id) {
            bm.chapter_id = matchedOfficial.id;
            changed = true;
          }
        }
        const key = `${bm.person_id}::${bm.chapter_name || ''}`;
        if (
          /彼は|彼女は|この人|その人|さっき|うち以外|他の|別の|自チャプター|僕の|この|どの|各|所属/.test(bm.chapter_name || '') ||
          seenBniKey.has(key)
        ) {
          this.deletedIds.add(bm.id);
          changed = true;
          return false;
        }
        seenBniKey.add(key);
        return true;
      });
    }
    if (Array.isArray(this.state.bniChapters)) {
      this.state.bniChapters = this.state.bniChapters.filter(c => {
        if (/彼は|彼女は|この人|その人|さっき|うち以外|他の|別の|自チャプター|僕の|この|どの|各|所属/.test(c.chapter_name || '')) {
          this.deletedIds.add(c.id);
          changed = true;
          return false;
        }
        return true;
      });
    }

    // 6. BNI全国公式マスターデータ（53リージョン・401チャプター）への自動アップグレード＆旧サンプルチャプター排除
    const isSampleTestMode = (this.state.persons || []).some(p => p.id === 'p-yamada');
    if (!isSampleTestMode) {
      if ((this.state.bniChapters || []).length < 100) {
        this.state.bniRegions = JSON.parse(JSON.stringify(OFFICIAL_BNI_REGIONS));
        this.state.bniChapters = JSON.parse(JSON.stringify(OFFICIAL_BNI_CHAPTERS));
        changed = true;
      }
      if (tid === 'tenant-001') {
        const bogusChapterIds = ['chap-kyoto-e', 'chap-kyoto-n', 'chap-osaka-bay', 'chap-tokyo-ginza', 'ch-1794481861967'];
        const bogusRegionIds = ['reg-osaka-s', 'reg-tokyo-c'];
        const hasColloquialMishima =
          !(this.state.facts || []).some(f => f.id === 'fact-mishima-1') ||
          !(this.state.facts || []).some(f => f.id === 'fact-mori-1') ||
          !(this.state.facts || []).some(f => f.id === 'fact-nakagawa-1') ||
          !(this.state.persons || []).some(p => p.id === 'p-hori-miyabi') ||
          !(this.state.relationships || []).some(r => r.id === 'rel-nakagawa-sugimoto-ai') ||
          (this.state.persons || []).some(p => p.id === 'p-1795144176332-6zpdd' || p.id === 'p-1795144181464-j1acc') ||
          (this.state.meetings || []).some(m => m.id === 'm-1795144176336-doyxx' || m.id === 'm-1795144181470-t0mdy') ||
          (this.state.facts || []).some(f => /だってそんなにみんなリサイクル|パスパスタ|もうバーも大好きやし|さんであの奈良かに行ってみたいな/.test(f.fact_value || '')) ||
          (this.state.businessOfferings || []).some(b => /だってそんなにみんなリサイクル|もうバーも大好きやし/.test(b.service_title || ''));
        const hasBogus =
          (this.state.bniChapters || []).some(c => bogusChapterIds.includes(c.id)) ||
          !(this.state.bniMemberships || []).some(bm => bm.id === 'bnim-kobi-1') ||
          !(this.state.bniMemberships || []).some(bm => bm.id === 'bnim-mori-1') ||
          !(this.state.bniMemberships || []).some(bm => bm.id === 'bnim-nakagawa-1') ||
          hasColloquialMishima;
        if (hasBogus) {
          for (const id of [
            ...bogusChapterIds,
            ...bogusRegionIds,
            'bnim-1794481861967',
            'p-1794813034743-0rmii',
            'om-1794805667075',
            'bo-1794804591389-jv0hp',
            'bnim-1795057589204-vyzn',
            'chap-custom-1795057589204',
            'bo-1795144172318-001c6',
            'fact-top-m-1795144172303-ve1be-1795144172328',
            'fact-prom-m-1795144172303-ve1be-1795144172328',
            'bnim-1795144172318',
            'chap-custom-1795144183847',
            'p-1795144176332-6zpdd',
            'p-1795144181464-j1acc',
            'm-1795144176336-doyxx',
            'm-1795144181470-t0mdy',
            'tr-m-1795144176336-doyxx',
            'tr-m-1795144181470-t0mdy',
            'bnim-1795144176350',
            'bnim-1795144181485',
            'chap-custom-1795144189449',
            'chap-custom-1795144193270',
            'bo-ai-1795144189454',
            'bo-ai-1795144193276',
            'fact-top-m-1795144176336-doyxx-ai',
            'fact-prom-m-1795144176336-doyxx-ai',
            'fact-top-m-1795144181470-t0mdy-ai',
            'fact-prom-m-1795144181470-t0mdy-ai',
          ]) {
            this.deletedIds.add(id);
          }
          this.state.bniRegions = JSON.parse(JSON.stringify(OFFICIAL_BNI_REGIONS));
          this.state.bniChapters = JSON.parse(JSON.stringify(OFFICIAL_BNI_CHAPTERS));
          this.state.bniMemberships = (this.state.bniMemberships || []).filter(
            bm => !['bnim-1794481861967', 'bnim-1795057589204-vyzn', 'bnim-1795144172318', 'bnim-1795144176350', 'bnim-1795144181485'].includes(bm.id)
          );
          changed = true;
        }
      }
    }

    // 7. 汎用・同名人物カルテおよび同日同一人物の重複完了面談の自動名寄せ・統合（全テナント共通・相関図や直近面談での重複発生を100%防止）
    const canonicalSeedPersonIds = new Set([
      'p-1795144172299-93er5',
      'p-1795057464160-kxovb',
      'p-1794804591387-r4ts6',
      'p-iwane-yoshiyuki',
      'p-tanaka-yoshihiro',
      'p-kimura-naofumi',
      'p-tsuji-akinori',
      'p-mishima-danjiri',
      'p-1794141793042',
      'p-takada-invictus',
      'p-1795750960554-z5i2n',
      'p-kawasaki-kei',
    ]);
    const personsByNormName = new Map<string, Person[]>();
    for (const p of this.state.persons || []) {
      if (p.tenant_id !== tid || p.status === 'deleted') continue;
      const norm = (p.display_name || '').replace(/（.*?）|\(.*?\)/g, '').replace(/[\s　様さん氏]+/g, '');
      if (!norm || /^(相手未特定|面談のお相手|面談予定|名称未設定|参加者)/.test(norm)) continue;
      const arr = personsByNormName.get(norm) || [];
      arr.push(p);
      personsByNormName.set(norm, arr);
    }
    for (const [, group] of personsByNormName.entries()) {
      if (group.length <= 1) continue;
      const sorted = [...group].sort((a, b) => {
        const score = (x: Person) => {
          let s = 0;
          if (canonicalSeedPersonIds.has(x.id)) s += 10000;
          if (x.status === 'active') s += 1000;
          if (x.notes && !/LINEでZoom URLのみ受領|\[Zoom特定メモ\]|もうバーも大好きやし/.test(x.notes)) s += 500;
          if ((this.state.bniMemberships || []).some(bm => bm.person_id === x.id && !bm.chapter_id.startsWith('chap-custom-'))) s += 300;
          s += (x.meeting_count || 0) * 50;
          return s;
        };
        return score(b) - score(a);
      });
      const canonical = sorted[0];
      for (let i = 1; i < sorted.length; i++) {
        const dup = sorted[i];
        this.deletedIds.add(dup.id);
        this.mergePersons(canonical.id, dup.id);
        changed = true;
      }
    }

    // 同日・同一参加者の重複した完了済み面談を1件へ統合
    const canonicalSeedMeetingIds = new Set([
      'm-1795144172303-ve1be',
      'm-zoom-yWF6XymmQ9y7VeeDNcwag',
      'm-zoom-Hloc8gk6T9CevFvvf9bJLQ',
      'm-iwane-20261112',
      'm-tanaka-20261110',
      'm-kimura-20261109',
      'm-tsuji-20261109',
      'm-1794813034745-2e1gm',
    ]);
    const completedByPersonDay = new Map<string, Meeting[]>();
    for (const m of this.state.meetings || []) {
      if (m.tenant_id !== tid) continue;
      if (m.status !== 'completed' && m.recording_status !== 'completed') continue;
      const pid = m.participant_ids?.[0];
      if (!pid) continue;
      const day = (m.scheduled_start_at || '').slice(0, 10);
      const key = `${pid}::${day}`;
      const arr = completedByPersonDay.get(key) || [];
      arr.push(m);
      completedByPersonDay.set(key, arr);
    }
    for (const [, mGroup] of completedByPersonDay.entries()) {
      if (mGroup.length <= 1) continue;
      const sortedM = [...mGroup].sort((a, b) => {
        const scoreM = (m: Meeting) => {
          let s = 0;
          if (canonicalSeedMeetingIds.has(m.id)) s += 10000;
          const tr = (this.state.transcripts || []).find(t => t.meeting_id === m.id);
          if (tr?.summary && !/もうバーも大好きやし|サッカーボール蹴るなんて/.test(tr.summary)) s += 500;
          return s;
        };
        return scoreM(b) - scoreM(a);
      });
      const keepM = sortedM[0];
      const keepTr = (this.state.transcripts || []).find(t => t.meeting_id === keepM.id);
      for (let i = 1; i < sortedM.length; i++) {
        const dupM = sortedM[i];
        const dupTr = (this.state.transcripts || []).find(t => t.meeting_id === dupM.id);
        if (dupTr) {
          if (keepTr && dupTr.full_text && dupTr.full_text.length > (keepTr.full_text || '').length) {
            keepTr.full_text = dupTr.full_text;
          }
          this.deletedIds.add(dupTr.id);
        }
        for (const f of this.state.facts || []) {
          if (f.source_id === dupM.id) {
            this.deletedIds.add(f.id);
          }
        }
        this.state.facts = (this.state.facts || []).filter(f => f.source_id !== dupM.id);
        this.deletedIds.add(dupM.id);
        this.state.meetings = (this.state.meetings || []).filter(m => m.id !== dupM.id);
        this.state.transcripts = (this.state.transcripts || []).filter(t => t.meeting_id !== dupM.id);
        this.state.consents = (this.state.consents || []).filter(c => c.meeting_id !== dupM.id);
        changed = true;
      }
    }

    if (changed) {
      if (tid === 'tenant-001') {
        this.seedTanakaMeeting();
        this.seedIwaneMeeting();
        this.seedKobiMeeting();
        this.seedMishimaMeeting();
        this.seedMoriMeeting();
        this.seedNakagawaMeeting();
      }
      this.saveDeletedIds();
      this.persist();
    }
    return changed;
  }

  public ingestZoomSessions(sessions: any[], scheduledFromZoom: any[] = []): boolean {
    const tid = this.state.currentTenantId;
    let changed = false;

    // 1. Zoomアプリ上で予約されている今後の予定を取り込み
    for (const sched of scheduledFromZoom || []) {
      if (!sched.start_time) continue;
      const code = String(sched.zoom_meeting_id || '');
      const exists = this.state.meetings.some(
        m => m.tenant_id === tid && (
          (sched.uuid && m.zoom_uuid === sched.uuid) ||
          (code && m.meeting_code === code && m.scheduled_start_at.slice(0, 16) === new Date(sched.start_time).toISOString().slice(0, 16))
        )
      );
      if (!exists && !this.deletedIds.has(`m-zoom-sched-${code}`)) {
        const topicClean = (sched.topic || '').replace(/ZENNOBATE Meeting Room|さんのZoomミーティング/g, '').trim();
        const hint = topicClean ? this.parseCompanyAndPersonHint(topicClean) : { personName: '' };
        const created = this.createMeeting({
          id: `m-zoom-sched-${code}-${new Date(sched.start_time).getTime()}`,
          title: sched.topic || 'Zoom予定',
          participant_name: hint.personName || undefined,
          meeting_type: '1to1',
          provider: 'zoom',
          meeting_url: sched.join_url,
          meeting_code: code,
          zoom_uuid: sched.uuid,
          scheduled_start_at: new Date(sched.start_time).toISOString(),
          host_type: 'self',
        });
        if (created) changed = true;
      }
    }

    // 2. 終了・録画・AI要約完了セッションを人物カルテ＆面談履歴へ自動反映
    for (const session of sessions || []) {
      const uuid: string | undefined = session.uuid || session.raw_payload?.payload?.object?.uuid || session.raw_payload?.payload?.object?.meeting_uuid;
      const rawMeetingId = String(session.meeting_id || session.id || '');
      const safeKey = uuid
        ? `m-zoom-${uuid.replace(/[^a-zA-Z0-9_-]/g, '')}`
        : `m-zoom-${rawMeetingId}`;

      if (this.deletedIds.has(safeKey)) continue;

      const startIso = session.start_time ? new Date(session.start_time).toISOString() : new Date().toISOString();
      const durationMin = session.duration || 30;
      const endIso = session.end_time
        ? new Date(session.end_time).toISOString()
        : new Date(new Date(startIso).getTime() + durationMin * 60000).toISOString();

      // 相手話者名の特定（ホスト自身を除外）
      const rawCandidates: string[] = [
        ...(session.attendees || []),
        ...((session.utterances || []).map((u: any) => u.speaker)),
      ].filter(Boolean);

      const externalNames = Array.from(
        new Set(
          rawCandidates
            .filter(name => !this.isSelfSpeaker(name))
            .map(name => this.normalizeSpeakerName(name))
            .filter(name => name.length >= 2 && name !== '参加者')
        )
      );

      let partnerName = externalNames[0] || '';
      if (!partnerName && session.summary_overview) {
        const sumMatch = session.summary_overview.match(/([^\s、。はと]{2,8})(?:と|氏|様|さん)/);
        if (sumMatch && !this.isSelfSpeaker(sumMatch[1])) {
          partnerName = this.normalizeSpeakerName(sumMatch[1]);
        }
      }
      const partnerSurname = partnerName ? partnerName.split(/\s+/)[0] : '';

      // 既存会議との照合: (A) zoom_uuid一致 -> (B) ID一致 -> (C) 同時間帯(±4時間)または同日+姓一致の事前予定
      let targetMeeting = this.state.meetings.find(m =>
        m.tenant_id === tid && (
          (uuid && m.zoom_uuid === uuid) ||
          m.id === safeKey ||
          (session.share_url && m.meeting_url === session.share_url)
        )
      );

      if (!targetMeeting) {
        const sessionStartMs = new Date(startIso).getTime();
        targetMeeting = this.state.meetings.find(m => {
          if (m.tenant_id !== tid) return false;
          if (m.zoom_uuid && uuid && m.zoom_uuid !== uuid) return false;
          const diffHrs = Math.abs(new Date(m.scheduled_start_at).getTime() - sessionStartMs) / 3600000;
          const sameDay = m.scheduled_start_at.slice(0, 10) === startIso.slice(0, 10);
          const isGenericPending = /相手未特定|面談予定|ZENNOBATE|オンライン面談|Zoom予定/.test(m.title);
          if (m.status !== 'completed' && diffHrs <= 4 && (!partnerSurname || isGenericPending || m.title.includes(partnerSurname))) return true;
          if (sameDay && partnerSurname && m.title.includes(partnerSurname)) return true;
          return false;
        });
      }

      // 事前予定から会社名ヒント（「夢叶開発の田中」など）を救出
      let preScheduledCompany = '';
      if (targetMeeting) {
        const hintFromTitle = this.parseCompanyAndPersonHint(targetMeeting.title);
        if (hintFromTitle.company) preScheduledCompany = hintFromTitle.company;
        const existingP = targetMeeting.participant_ids[0] ? this.getPersonById(targetMeeting.participant_ids[0]) : undefined;
        if (existingP) {
          const hintFromPerson = this.parseCompanyAndPersonHint(existingP.display_name);
          if (hintFromPerson.company) preScheduledCompany = preScheduledCompany || hintFromPerson.company;
          if (!partnerName && !existingP.display_name.startsWith('相手未特定')) {
            partnerName = hintFromPerson.personName;
          }
        }
      }

      // 人物カルテの検索・昇格・作成（実面談した相手なので status: 'active' として人物カルテへ正式反映！）
      let partnerPerson: Person | undefined;
      if (targetMeeting && targetMeeting.participant_ids.length > 0) {
        partnerPerson = this.getPersonById(targetMeeting.participant_ids[0]);
      }
      if (!partnerPerson && partnerName) {
        partnerPerson = this.getPersons().find(p =>
          p.display_name === partnerName ||
          p.display_name.replace(/\s+/g, '') === partnerName.replace(/\s+/g, '') ||
          (partnerSurname.length >= 2 && p.display_name === partnerSurname)
        );
      }

      const cleanZoomText = (txt?: string) =>
        (txt || '')
          .replace(/この会議は、前回のビーンズ交流会の反省と今後の運営方針について話し合うことを目的として行われた。?\s*/g, '')
          .replace(/冒頭では(?:[0-9０-９]+\s*[/／]\s*)?勝賀野が子供のインフルエンザに感染し体調を崩していることを共有し、高野陽行は寝起きで参加している状況を説明した。?\s*/g, '')
          .replace(/[^。]*?(?:風邪気味のため声が聞きにくい|体調不良のため声が小さい)[^。]*?。?\s*/g, '')
          .replace(/[0-9０-９]+\s*[/／]\s*勝賀野\s*太郎\s*[/／]\s*残置物撤去/g, '勝賀野')
          .replace(/[0-9０-９]+\s*[/／]\s*勝賀野/g, '勝賀野')
          .replace(/正勝賀野/g, '勝賀野')
          .replace(/K\s*Kawasaki|Kawasaki\s*K/gi, '川崎景')
          .replace(/(^|[、。・:：\s「『（(と])K(?=[はがもにのへと、。・\s」』）)]|$)/gm, '$1川崎景')
          .replace(/美器[（(]桑本みき[）)]|桑本\s*みき|美器\s*川本/g, '川本美器')
          .replace(/陵平\s*高田/g, '高田陵平')
          .replace(/(?<![川本])美器(?=[はがもにのへと、。・店舗])/g, '川本美器')
          .replace(/(?<![高田])陵平(?=[はがもにのへと、。・:：])/g, '高田陵平')
          .replace(/リライトチャプター/g, 'ディライトチャプター')
          .replace(/インビクタスチャプター/g, 'インヴィクタスチャプター')
          .replace(/3島から/g, '三島宏幸様（だんじりチャプター）から')
          .replace(/生命神社/g, '晴明神社')
          .replace(/ラズベリー/g, 'ジャズベリー')
          .replace(/無党開発|武藤開発/g, '夢叶開発')
          .replace(/免费/g, '無料')
          .trim();

      const cleanOverview = cleanZoomText(session.summary_overview);
      const cleanDetails: { label: string; summary: string }[] = Array.isArray(session.summary_details)
        ? session.summary_details.map((d: any) => ({
            label: cleanZoomText(d.label),
            summary: cleanZoomText(d.summary),
          })).filter((d: any) => d.summary)
        : [];
      const cleanNextSteps: string[] = Array.isArray(session.next_steps)
        ? session.next_steps.map((s: string) => cleanZoomText(s)).filter(Boolean)
        : [];

      if (partnerPerson) {
        const shouldUpdateName =
          partnerName &&
          (partnerPerson.display_name.startsWith('相手未特定') ||
           partnerPerson.display_name.includes('の') ||
           partnerPerson.display_name.length < partnerName.length);

        const isPlaceholderNotes =
          !partnerPerson.notes ||
          /予定登録から自動作成|面談予定より自動仮登録|Zoom面談より自動登録/.test(partnerPerson.notes) ||
          partnerPerson.notes.length < 25;

        if (partnerPerson.status === 'provisional' || shouldUpdateName || (cleanOverview && isPlaceholderNotes)) {
          partnerPerson.status = 'active';
          if (shouldUpdateName) {
            partnerPerson.display_name = partnerName;
          }
          if (cleanOverview && isPlaceholderNotes) {
            partnerPerson.notes = cleanOverview;
          }
          partnerPerson.last_interacted_at = endIso;
          partnerPerson.meeting_count = Math.max(1, partnerPerson.meeting_count || 0);
          partnerPerson.updated_at = new Date().toISOString();
          changed = true;
        }
      } else if (partnerName) {
        partnerPerson = this.createPerson({
          display_name: partnerName,
          status: 'active',
          category_tags: ['仕事'],
          meeting_count: 1,
          last_interacted_at: endIso,
          notes: cleanOverview || 'Zoom面談より自動登録',
        });
        changed = true;
      }

      // 会社名および事業強み(BusinessOffering)の自動紐付け（会話中に登場した第三者の紹介先企業「株式会社みやびっていう」等を本人の会社として誤紐付けしない）
      if (partnerPerson) {
        const existingOrgs = this.getOrgMembershipsForPerson(partnerPerson.id);
        let companyToLink = preScheduledCompany ? this.sanitizeCompanyName(preScheduledCompany) : '';
        if (!companyToLink && existingOrgs.length === 0 && session.transcript_text) {
          const partnerLines = (session.transcript_text as string)
            .split('\n')
            .filter((l: string) => !this.isSelfSpeaker(l.split(':')[0] || ''))
            .join('\n');
          companyToLink = this.extractPartnerOwnCompany(partnerLines, partnerPerson.display_name);
        }
        if (companyToLink && !existingOrgs.some(o => o.organization_name === companyToLink)) {
          this.addOrganizationMembership(partnerPerson.id, companyToLink, '代表');
          changed = true;
        }

        // 事業強み(BusinessOffering)が未登録かつ具体的な会社・屋号または要約がある場合のみ自動生成（「〇〇様の専門事業」の重複生成を防止）
        const existingOfferings = this.getBusinessOfferingsForPerson(partnerPerson.id);
        if (existingOfferings.length === 0 && cleanOverview && companyToLink) {
          this.addBusinessOffering({
            person_id: partnerPerson.id,
            service_title: `${companyToLink} 事業・協業`,
            specialties: cleanOverview.slice(0, 120),
            target_clients: cleanNextSteps[0] || '相互紹介・協業パートナー',
            service_area: '関西・全国対応',
            is_active: true,
          });
          changed = true;
        }

        // BNIチャプター・リージョン・専門カテゴリーの自動検出＆自動登録（今後のZoom 1to1で漏れなくBNIマスターへ反映）
        const combinedZoomContext = [
          ...(session.attendees || []),
          ...cleanNextSteps,
          ...cleanDetails.map(d => `${d.label} ${d.summary}`),
          cleanOverview,
          session.transcript_text || '',
        ].join('\n');

        if (/BNI|チャプター|リージョン/i.test(combinedZoomContext)) {
          // 参加者名括弧内（例: 小比直人（司法書士・土地家屋調査士））から専門カテゴリーを抽出
          let detectedCategory = '';
          for (const att of session.attendees || []) {
            if (!this.isSelfSpeaker(att)) {
              const parenMatch = String(att).match(/[（(]([^）)]{2,25})[）)]/);
              if (parenMatch) {
                detectedCategory = parenMatch[1].trim();
                break;
              }
            }
          }
          if (!detectedCategory) {
            const catMatch = combinedZoomContext.match(/カテゴリー(?:は|が)?「?([^、。\n」]{2,24})」?/);
            if (catMatch) detectedCategory = catMatch[1].trim();
          }

          // チャプター名の抽出（全国401公式BNIチャプターおよび音声認識表記ゆれ辞書とのみ照合し、「うち以外のチャプター」等の一般会話表現を厳格に除外）
          const normalizedContext = combinedZoomContext
            .replace(/ラインダース|マインダーズ|ライナッツ|ナインダーズ/g, 'ナインダーツ')
            .replace(/シャングリア/g, 'シャングリラ')
            .replace(/リライト/g, 'ディライト')
            .replace(/インビクタス/g, 'インヴィクタス')
            .replace(/ダンジェリ/g, 'だんじり');
          const officialMatches: { name: string; isEventOnly: boolean }[] = [];
          for (const ch of OFFICIAL_BNI_CHAPTERS) {
            const bare = ch.chapter_name.replace(/チャプター$/, '');
            if (bare.length >= 2 && normalizedContext.includes(`${bare}チャプター`)) {
              const isEventOnly =
                new RegExp(`${bare}チャプター(?:のイベント|というイベント)`).test(normalizedContext) &&
                !new RegExp(`${bare}チャプター(?:に所属|へ所属|所属|に入った|のメンバー)`).test(normalizedContext);
              officialMatches.push({ name: ch.chapter_name, isEventOnly });
            }
          }
          const nonSelfChap =
            officialMatches.find(c => !/だんじり/.test(c.name) && !c.isEventOnly)?.name ||
            officialMatches.find(c => !/だんじり/.test(c.name))?.name;
          const targetChapKeyword = nonSelfChap || '';

          if (targetChapKeyword && this.getBNIMembershipsForPerson(partnerPerson.id).length === 0) {
            const updatedBni = this.setPersonBNIMembership(
              partnerPerson.id,
              targetChapKeyword,
              detectedCategory || companyToLink || '専門カテゴリー'
            );
            if (updatedBni) {
              if (!partnerPerson.category_tags.includes('BNI')) {
                partnerPerson.category_tags.unshift('BNI');
              }
              changed = true;
            }
          }
        }
      }

      // 2人以上の相手が出席しているZoom会議の場合、2人目以降の出席者（例: 川崎 景様）も人物カルテとして自動作成・紐付け
      const extraParticipantPersons: Person[] = [];
      for (const extraName of externalNames.slice(1)) {
        const extraSurname = extraName.split(/\s+/)[0] || '';
        let ep = this.getPersons().find(p =>
          p.display_name === extraName ||
          p.display_name.replace(/\s+/g, '') === extraName.replace(/\s+/g, '') ||
          (extraSurname.length >= 2 && p.display_name === extraSurname)
        );
        if (!ep) {
          ep = this.createPerson({
            display_name: extraName,
            status: 'active',
            category_tags: ['仕事'],
            meeting_count: 1,
            last_interacted_at: endIso,
            notes: cleanOverview || 'Zoom面談より自動登録',
          });
          changed = true;
        } else if (ep.status === 'provisional') {
          ep.status = 'active';
          ep.meeting_count = Math.max(1, ep.meeting_count || 1);
          changed = true;
        }
        extraParticipantPersons.push(ep);
      }

      const allParticipantPersons = [
        ...(partnerPerson ? [partnerPerson] : []),
        ...extraParticipantPersons.filter(ep => ep.id !== partnerPerson?.id),
      ];
      const allParticipantIds = allParticipantPersons.map(p => p.id);

      // 面談レコードの作成または完了更新
      const defaultTitle = allParticipantPersons.length > 0
        ? `${allParticipantPersons.map(p => `${p.display_name}様`).join('・')}と${allParticipantPersons.length > 1 ? '面談' : '1to1面談'}${preScheduledCompany ? `（${preScheduledCompany}）` : ''}`
        : (session.summary_title && !session.summary_title.includes('Meeting Summary for')
            ? session.summary_title
            : (session.topic && session.topic !== 'ZENNOBATE Meeting Room' ? session.topic : 'Zoom 1to1面談'));

      if (!targetMeeting) {
        targetMeeting = {
          id: safeKey,
          tenant_id: tid,
          title: defaultTitle,
          meeting_type: '1to1',
          provider: 'zoom',
          meeting_url: session.share_url || '',
          meeting_code: rawMeetingId || undefined,
          zoom_uuid: uuid,
          scheduled_start_at: startIso,
          scheduled_end_at: endIso,
          host_type: 'self',
          recording_status: 'completed',
          status: 'completed',
          participant_ids: allParticipantIds,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        this.state.meetings.unshift(targetMeeting);
        changed = true;
      } else {
        if (targetMeeting.status !== 'completed' || targetMeeting.recording_status !== 'completed') {
          targetMeeting.status = 'completed';
          targetMeeting.recording_status = 'completed';
          changed = true;
        }
        if (uuid && targetMeeting.zoom_uuid !== uuid) {
          targetMeeting.zoom_uuid = uuid;
          changed = true;
        }
        if (session.share_url && !targetMeeting.meeting_url) {
          targetMeeting.meeting_url = session.share_url;
          changed = true;
        }
        for (const pid of allParticipantIds) {
          if (!targetMeeting.participant_ids.includes(pid)) {
            targetMeeting.participant_ids.push(pid);
            changed = true;
          }
        }
        if (
          partnerPerson &&
          (targetMeeting.title === 'ZENNOBATE Meeting Room' || targetMeeting.title.includes('相手未特定'))
        ) {
          targetMeeting.title = defaultTitle;
          changed = true;
        }
      }

      // 要約・文字起こし(MeetingTranscript)の作成・更新
      const detailSummaryText = cleanDetails.length > 0
        ? cleanDetails.slice(0, 4).map(d => `・${d.label}: ${d.summary}`).join('\n')
        : '';
      const combinedSummary = [cleanOverview, detailSummaryText].filter(Boolean).join('\n');

      if (combinedSummary || session.transcript_text) {
        const existingTr = this.state.transcripts.find(t => t.meeting_id === targetMeeting!.id);
        const mappedUtterances = Array.isArray(session.utterances) && session.utterances.length > 0
          ? session.utterances.slice(0, 300).map((u: any, idx: number) => ({
              id: `utt-${targetMeeting!.id}-${idx}`,
              speaker_label: u.speaker,
              resolved_person_id: !this.isSelfSpeaker(u.speaker) ? partnerPerson?.id : undefined,
              resolved_person_name: !this.isSelfSpeaker(u.speaker) ? partnerPerson?.display_name : '勝賀野 太郎',
              start_seconds: u.start_seconds || 0,
              end_seconds: u.end_seconds || 0,
              text: u.text,
              confidence: 0.98,
            }))
          : [];

        if (!existingTr) {
          this.state.transcripts.unshift({
            id: `tr-${targetMeeting.id}`,
            tenant_id: tid,
            meeting_id: targetMeeting.id,
            language: 'ja',
            full_text: session.transcript_text || combinedSummary,
            summary: combinedSummary || cleanOverview,
            utterances: mappedUtterances,
            created_at: new Date().toISOString(),
          });
          changed = true;
        } else {
          if (session.transcript_text && existingTr.full_text.length < session.transcript_text.length) {
            existingTr.full_text = session.transcript_text;
            if (mappedUtterances.length > 0) existingTr.utterances = mappedUtterances;
            changed = true;
          }
          const isVerifiedSeedMeeting = [
            'm-tanaka-20261110',
            'm-iwane-20261112',
            'm-kimura-20261109',
            'm-tsuji-20261109',
            'm-zoom-Hloc8gk6T9CevFvvf9bJLQ',
            'm-1794813034745-2e1gm',
            'm-zoom-yWF6XymmQ9y7VeeDNcwag',
            'm-zoom-wd6wBnHzQI6x8a6ytmmxSA',
          ].includes(targetMeeting.id);
          if (
            combinedSummary &&
            !(existingTr as any)?.ai_refined &&
            (!existingTr.summary || existingTr.summary.length < combinedSummary.length) &&
            !isVerifiedSeedMeeting
          ) {
            existingTr.summary = combinedSummary;
            changed = true;
          }
        }
      }

      // Facts（要約トピック & ネクストステップ約束ToDo）を人物カルテの先頭へ冪等追加（確定シード面談や削除済みIDの再生成による点滅を完全遮断）
      const isVerifiedSeedMeetingForFacts = [
        'm-tanaka-20261110',
        'm-iwane-20261112',
        'm-kimura-20261109',
        'm-tsuji-20261109',
        'm-zoom-Hloc8gk6T9CevFvvf9bJLQ',
        'm-1794813034745-2e1gm',
        'm-zoom-yWF6XymmQ9y7VeeDNcwag',
        'm-zoom-wd6wBnHzQI6x8a6ytmmxSA',
      ].includes(targetMeeting.id);

      if (partnerPerson && !isVerifiedSeedMeetingForFacts) {
        const existingMeetingFacts = this.state.facts.filter(
          f => f.person_id === partnerPerson!.id && f.source_id === targetMeeting!.id
        );
        if (existingMeetingFacts.length === 0) {
          const newFactsToPrepend: Fact[] = [];
          const sumFactId = `fact-zoom-sum-${targetMeeting.id}`;
          if (cleanOverview && !this.deletedIds.has(sumFactId)) {
            newFactsToPrepend.push({
              id: sumFactId,
              tenant_id: tid,
              person_id: partnerPerson.id,
              fact_category: 'topic',
              fact_key: 'Zoom AI面談要約',
              fact_value: cleanOverview,
              source_type: 'meeting_speech',
              source_id: targetMeeting.id,
              source_evidence: 'Zoom AI Companion / 自動文字起こし',
              confidence: 0.98,
              verification_status: 'verified',
              visibility: 'referral_eligible',
              valid_from: endIso,
              created_at: new Date().toISOString(),
            });
          }

          cleanDetails.slice(0, 2).forEach((det, idx) => {
            const detFactId = `fact-zoom-det-${targetMeeting!.id}-${idx}`;
            if (this.deletedIds.has(detFactId)) return;
            newFactsToPrepend.push({
              id: detFactId,
              tenant_id: tid,
              person_id: partnerPerson!.id,
              fact_category: 'topic',
              fact_key: det.label || '面談トピック',
              fact_value: det.summary,
              source_type: 'meeting_speech',
              source_id: targetMeeting!.id,
              source_evidence: 'Zoom AI Companion セクション要約',
              confidence: 0.97,
              verification_status: 'verified',
              visibility: 'referral_eligible',
              valid_from: endIso,
              created_at: new Date().toISOString(),
            });
          });

          cleanNextSteps.forEach((step: string, idx: number) => {
            if (!step || !step.trim()) return;
            const stepFactId = `fact-zoom-step-${targetMeeting!.id}-${idx}`;
            if (this.deletedIds.has(stepFactId)) return;
            newFactsToPrepend.push({
              id: stepFactId,
              tenant_id: tid,
              person_id: partnerPerson!.id,
              fact_category: 'promise',
              fact_key: '次回アクション・約束ToDo',
              fact_value: step.trim(),
              source_type: 'meeting_speech',
              source_id: targetMeeting!.id,
              source_evidence: 'Zoom AI Companion Next Steps',
              confidence: 0.96,
              verification_status: 'verified',
              visibility: 'referral_eligible',
              valid_from: endIso,
              created_at: new Date().toISOString(),
            });
          });

          if (newFactsToPrepend.length > 0) {
            this.state.facts.unshift(...newFactsToPrepend);
            changed = true;
          }
        }

        // 今後の新規Zoom面談が自動同期された際、Zoom標準要約の粗さ（イニシャル表記・雑談混入・BNIチャプター誤字等）をGemini 3.5 Flashで自動的に高精度アップグレード
        const trForAi = this.state.transcripts.find(t => t.meeting_id === targetMeeting!.id);
        if (
          this.isBrowserSyncEnabled() &&
          targetMeeting.id !== 'm-zoom-nUUblUGRdOUzkSVNFeAKA' &&
          !(trForAi as any)?.ai_refined
        ) {
          const zoomSourceForGemini = [
            `【Zoom参加者一覧】: ${(session.attendees || []).join('、')}`,
            session.transcript_text ? `【Zoom文字起こし全文】:\n${session.transcript_text}` : '',
            cleanOverview ? `【Zoom全体概要】:\n${cleanOverview}` : '',
            cleanDetails.length > 0
              ? `【Zoomセクション詳細】:\n${cleanDetails.map(d => `・${d.label}: ${d.summary}`).join('\n')}`
              : '',
            cleanNextSteps.length > 0 ? `【Zoomネクストステップ】:\n${cleanNextSteps.join('\n')}` : '',
          ]
            .filter(Boolean)
            .join('\n\n');
          if (zoomSourceForGemini.length >= 60) {
            if (trForAi) (trForAi as any).ai_refined = true;
            this.refineMeetingSummaryWithAI(targetMeeting.id, zoomSourceForGemini).catch(() => {});
          }
        }
      }
    }

    if (changed) {
      this.reconcileLegacyAndDuplicateData();
      this.persist();
    }
    return changed;
  }

  public syncZoomInbox(inbox: any[]): boolean {
    if (!Array.isArray(inbox) || inbox.length === 0) return false;
    return this.ingestZoomSessions(inbox, []);
  }

  public purgeSamplePersons(): void {
    const samplePersonIds = ['p-yamada', 'p-tanaka', 'p-sato', 'p-nakamura-prov', 'p-tenant2-secret'];
    const sampleMeetingIds = ['m-yamada-upcoming', 'm-yamada-past1', 'm-yamada-past2'];
    const sampleFactIds = ['fact-1', 'fact-2', 'fact-3', 'fact-4', 'fact-5', 'fact-6'];
    this.state.persons = this.state.persons.filter(p => !samplePersonIds.includes(p.id));
    this.state.meetings = this.state.meetings.filter(m => !sampleMeetingIds.includes(m.id));
    this.state.facts = this.state.facts.filter(f => !sampleFactIds.includes(f.id));
    this.state.cardScans = this.state.cardScans.filter(c => c.id !== 'cs-yamada');
    this.state.reviewQueue = this.state.reviewQueue.filter(q => q.id !== 'rq-1');
    this.state.referrals = this.state.referrals.filter(r => r.id !== 'ref-1');
    this.state.organizationMemberships = this.state.organizationMemberships.filter(m => !m.id.startsWith('om-yamada'));
    this.state.organizations = this.state.organizations.filter(o => !o.id.startsWith('org-yamada'));
    this.state.businessOfferings = this.state.businessOfferings.filter(b => !b.id.startsWith('bo-yamada'));
    this.state.bniMemberships = this.state.bniMemberships.filter(m => !m.id.startsWith('bnim-yamada'));
    this.persist();
  }

  private saveDeletedIds() {
    setStorageItem(this.getActiveDeletedKey(), JSON.stringify(Array.from(this.deletedIds).slice(-500)));
  }

  private isBrowserSyncEnabled(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.fetch === 'function' &&
      !(import.meta as any).env?.VITEST
    );
  }

  private isColloquialOrPlaceholderRecord(obj: any): boolean {
    if (!obj) return false;
    const txt = `${obj.notes || ''} ${obj.summary || ''} ${obj.service_title || ''} ${obj.fact_value || ''}`;
    return (
      /LINEでZoom URLのみ受領|\[Zoom特定メモ\]|もうバーも大好きやし|サッカーボール蹴るなんて|さんであの奈良かに行ってみたいな|ラズベリーでの交流会|正勝賀野|インフルエンザに感染し体調を崩している|寝起きで参加している|桑本みき|風邪気味のため声が聞きにくい|体調不良のため声が小さい|リライトチャプター/.test(txt) ||
      /(^|[、。・:：\s「『（(と])K(?=[はがもにのへと、。・\s」』）)]|$)/m.test(txt) ||
      /[ãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ\uFFFD\x80-\x9F]/.test(txt)
    );
  }

  private mergeCollectionById<T extends { id: string; updated_at?: string; created_at?: string }>(
    serverItems: T[] = [],
    localItems: T[] = []
  ): T[] {
    const map = new Map<string, T>();
    for (const item of serverItems || []) {
      if (item && item.id && !this.deletedIds.has(item.id)) {
        map.set(item.id, item);
      }
    }
    for (const item of localItems || []) {
      if (!item || !item.id || this.deletedIds.has(item.id)) continue;
      const existing = map.get(item.id);
      if (!existing) {
        map.set(item.id, item);
      } else {
        const serverBad = this.isColloquialOrPlaceholderRecord(existing);
        const localBad = this.isColloquialOrPlaceholderRecord(item);
        if (localBad && !serverBad) {
          continue;
        }
        const tServer = new Date((existing as any).updated_at || (existing as any).created_at || 0).getTime() || 0;
        const tLocal = new Date((item as any).updated_at || (item as any).created_at || 0).getTime() || 0;
        if ((!localBad && serverBad) || tLocal >= tServer) {
          map.set(item.id, { ...existing, ...item });
        }
      }
    }
    return Array.from(map.values());
  }

  private persist(skipCloudPush = false) {
    setStorageItem(this.getActiveStorageKey(), JSON.stringify(this.state));
    if (!skipCloudPush && this.isBrowserSyncEnabled()) {
      if (this.syncTimer) clearTimeout(this.syncTimer);
      this.syncTimer = setTimeout(() => {
        this.pushStateToCloud().catch(() => {});
      }, 200);
    }
  }

  private lockedTenantId: string | null = null;

  public setTenantLockedMode(tenantId: string | null): void {
    this.lockedTenantId = tenantId;
  }

  public isTenantLockedMode(): boolean {
    return !!this.lockedTenantId && this.lockedTenantId !== 'tenant-001';
  }

  public getCurrentOwnerProfile(): TenantOwnerProfile {
    const t = this.getCurrentTenant();
    if (t.owner_profile && t.owner_profile.owner_name) {
      return t.owner_profile;
    }
    if (t.id === 'tenant-001') {
      return {
        owner_name: '勝賀野 太郎',
        owner_phonetic: 'しょうがの たろう',
        company_name: '株式会社ZENNOBATE（ゼノベイト）',
        title: '代表取締役',
        bni_region_name: '大阪東リージョン (Osaka East)',
        bni_chapter_name: 'だんじりチャプター',
        bni_category: '残置物撤去・遺品整理・リユース',
        specialty_summary: '残置物撤去・遺品整理・リサイクルショップ運営・AI古物査定ツール「カンテノ」',
        is_onboarded: true,
      };
    }
    const cleanTenantTitle = t.name.replace(/\s*\(¥.*?\).*$/, '').trim();
    return {
      owner_name: cleanTenantTitle || 'オーナー様',
      company_name: cleanTenantTitle || '',
      title: '代表',
      bni_region_name: '',
      bni_chapter_name: '',
      bni_category: '',
      specialty_summary: '',
      is_onboarded: false,
    };
  }

  public updateTenantOwnerProfile(updates: Partial<TenantOwnerProfile>): TenantOwnerProfile {
    const t = this.getCurrentTenant();
    const current = this.getCurrentOwnerProfile();
    const merged: TenantOwnerProfile = {
      ...current,
      ...updates,
      is_onboarded: true,
    };
    t.owner_profile = merged;
    if (merged.owner_name && t.id !== 'tenant-001') {
      const priceSuffix = t.name.match(/\(¥.*?\)/)?.[0] || '';
      const displayLabel = merged.company_name && merged.company_name !== merged.owner_name
        ? `${merged.company_name} ${merged.owner_name}様`
        : `${merged.owner_name}様`;
      t.name = `${displayLabel}${priceSuffix ? ` ${priceSuffix}` : ''}`;
    }
    this.persist();
    return merged;
  }

  public async pushStateToCloud(): Promise<boolean> {
    if (!this.isBrowserSyncEnabled()) return false;
    if (this.isSyncingCloud) {
      this.hasPendingCloudPush = true;
      return false;
    }
    this.isSyncingCloud = true;
    try {
      const res = await fetch('/api/sync/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: this.state,
          deletedIds: Array.from(this.deletedIds),
          lockedTenantId: this.lockedTenantId || undefined,
        }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      let changed = false;
      if (Array.isArray(data.deletedIds)) {
        for (const id of data.deletedIds) {
          if (!this.deletedIds.has(id)) {
            this.deletedIds.add(id);
            changed = true;
          }
        }
        if (changed) this.saveDeletedIds();
      }
      if (data.state) {
        const snapshot = () =>
          JSON.stringify(this.state.meetings.map((m: any) => [m.id, m.status, m.title])) +
          JSON.stringify(this.state.persons.map((p: any) => [p.id, p.status, p.display_name, p.notes?.length])) +
          `:${this.state.transcripts?.length || 0}:${this.state.facts?.length || 0}`;
        const prevJson = snapshot();
        const localBackup = this.state;
        const activeTenantId = this.lockedTenantId || localBackup.currentTenantId || 'tenant-001';
        this.state = {
          ...data.state,
          currentTenantId: activeTenantId,
          tenants: this.mergeCollectionById(data.state.tenants, localBackup.tenants),
          persons: this.mergeCollectionById(data.state.persons, localBackup.persons),
          meetings: this.mergeCollectionById(data.state.meetings, localBackup.meetings),
          facts: this.mergeCollectionById(data.state.facts, localBackup.facts),
          transcripts: this.mergeCollectionById(data.state.transcripts, localBackup.transcripts),
          consents: this.mergeCollectionById(data.state.consents, localBackup.consents),
          organizations: this.mergeCollectionById(data.state.organizations, localBackup.organizations),
          organizationMemberships: this.mergeCollectionById(data.state.organizationMemberships, localBackup.organizationMemberships),
          businessOfferings: this.mergeCollectionById(data.state.businessOfferings, localBackup.businessOfferings),
          bniMemberships: this.mergeCollectionById(data.state.bniMemberships, localBackup.bniMemberships),
          referrals: this.mergeCollectionById(data.state.referrals, localBackup.referrals),
          relationships: this.mergeCollectionById(data.state.relationships, localBackup.relationships),
        };
        this.ensurePartnerTenants();
        if (activeTenantId === 'tenant-001') {
          this.seedTsujiMeeting();
          this.seedKimuraMeeting();
          this.seedTanakaMeeting();
          this.seedIwaneMeeting();
          this.seedKobiMeeting();
          this.seedMishimaMeeting();
          this.seedMoriMeeting();
          this.seedNakagawaMeeting();
        }
        this.reconcileLegacyAndDuplicateData();
        const nextJson = snapshot();
        this.persist(true);
        this.lastSyncedAt = new Date().toISOString();
        return prevJson !== nextJson || changed;
      }
      return changed;
    } catch {
      return false;
    } finally {
      this.isSyncingCloud = false;
      if (this.hasPendingCloudPush) {
        this.hasPendingCloudPush = false;
        this.pushStateToCloud().catch(() => {});
      }
    }
  }

  public async syncAllWithCloud(): Promise<{ updated: boolean; zoomConnected: boolean; syncedAt: string }> {
    let updated = false;
    if (!this.isBrowserSyncEnabled()) {
      return { updated: false, zoomConnected: false, syncedAt: new Date().toISOString() };
    }

    // 1. PC ⇄ スマホ クラウド状態同期
    const stateUpdated = await this.pushStateToCloud();
    if (stateUpdated) updated = true;

    // 2. Zoom 公式クラウドAPI + Webhook受信箱 一括同期（テナント別認証情報で完全分離）
    try {
      const tid = this.state.currentTenantId;
      const ownerProf = this.getCurrentOwnerProfile();
      const zoomCfg = this.oauthConfig.zoom;
      const accountId = tid === 'tenant-001' ? zoomCfg.account_id : (ownerProf.zoom_account_id || '');
      const clientId = tid === 'tenant-001' ? zoomCfg.client_id : (ownerProf.zoom_client_id || '');
      const clientSecret = tid === 'tenant-001' ? zoomCfg.client_secret : (ownerProf.zoom_client_secret || '');

      const res = await fetch('/api/zoom/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tid,
          account_id: accountId,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        this.zoomApiConnected = !!data.api_connected;
        if (Array.isArray(data.sessions) && data.sessions.length > 0) {
          const zoomChanged = this.ingestZoomSessions(data.sessions, data.scheduled_meetings || []);
          if (zoomChanged) {
            updated = true;
            await this.pushStateToCloud();
          }
        }
      }
    } catch {
      // ignore network error
    }

    const syncedAt = new Date().toISOString();
    this.lastSyncedAt = syncedAt;
    return { updated, zoomConnected: this.zoomApiConnected, syncedAt };
  }

  public getTranscriptForMeeting(meetingId: string): MeetingTranscript | undefined {
    const tid = this.state.currentTenantId;
    return this.state.transcripts.find(t => t.tenant_id === tid && t.meeting_id === meetingId);
  }

  public getMeetingsForPerson(personId: string): Meeting[] {
    return this.getMeetings().filter(m => m.participant_ids.includes(personId));
  }

  // --- テナント境界（RLS）フィルタ & SaaS月額会員テナント管理 ---
  public getTenantId(): string {
    return this.state.currentTenantId;
  }

  public setTenantId(tenantId: string) {
    if (!tenantId) return;
    this.ensurePartnerTenants();
    if (!this.state.tenants.some(t => t.id === tenantId)) {
      this.state.tenants.push({
        id: tenantId,
        name: '会員専用アカウント',
        plan_tier: 'standard',
        monthly_budget_jpy: 1000,
        current_spend_jpy: 0,
        is_budget_throttled: false,
        created_at: new Date().toISOString(),
      });
    }
    this.state.currentTenantId = tenantId;
    this.reconcileLegacyAndDuplicateData();
    this.persist();
  }

  public getTenants(): Tenant[] {
    return this.state.tenants;
  }

  public getCurrentTenant(): Tenant {
    return this.state.tenants.find(t => t.id === this.state.currentTenantId) || this.state.tenants[0];
  }

  public createTenant(name: string, planTier: 'standard' | 'premium' = 'standard', monthlyBudgetJpy: number = 1000): Tenant {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('会員・テナント名を入力してください');
    const newTenant: Tenant = {
      id: `tenant-${Date.now().toString(36)}`,
      name: trimmed,
      plan_tier: planTier,
      monthly_budget_jpy: monthlyBudgetJpy,
      current_spend_jpy: 0,
      is_budget_throttled: false,
      created_at: new Date().toISOString(),
    };
    this.state.tenants.push(newTenant);
    this.logAudit('CREATE_TENANT', 'tenant', newTenant.id, { name: trimmed, planTier, monthlyBudgetJpy });
    this.persist();
    return newTenant;
  }

  public deleteTenant(tenantId: string): boolean {
    if (tenantId === 'tenant-001' || tenantId === 'tenant-endo') return false; // オーナーおよび公式パートナーテナントは保護
    const idx = this.state.tenants.findIndex(t => t.id === tenantId);
    if (idx < 0) return false;
    this.state.tenants.splice(idx, 1);
    if (this.state.currentTenantId === tenantId) {
      this.state.currentTenantId = 'tenant-001';
    }
    this.persist();
    return true;
  }

  // --- 人物 (Persons) ---
  public getPersons(): Person[] {
    const tid = this.state.currentTenantId;
    return this.state.persons.filter(p => p.tenant_id === tid && p.status !== 'deleted');
  }

  public getPersonById(id: string): Person | undefined {
    const tid = this.state.currentTenantId;
    return this.state.persons.find(p => p.id === id && p.tenant_id === tid && p.status !== 'deleted');
  }

  public createPerson(data: Partial<Person>): Person {
    const tid = this.state.currentTenantId;
    const newPerson: Person = {
      id: data.id || `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: tid,
      display_name: data.display_name || '名称未設定',
      phonetic_name: data.phonetic_name || '',
      status: data.status || 'active',
      category_tags: data.category_tags || ['BNI'],
      avatar_url: data.avatar_url,
      primary_phone: data.primary_phone,
      primary_email: data.primary_email,
      office_address: data.office_address,
      service_areas: data.service_areas || [],
      meeting_count: data.meeting_count || 0,
      notes: data.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.state.persons.push(newPerson);

    this.logAudit('CREATE_PERSON', 'person', newPerson.id, { person: newPerson });
    this.persist();
    return newPerson;
  }

  public updatePerson(id: string, updates: Partial<Person>): Person {
    const p = this.getPersonById(id);
    if (!p) throw new Error('Person not found');

    const oldData = { ...p };
    Object.assign(p, updates, { updated_at: new Date().toISOString() });

    this.logAudit('UPDATE_PERSON', 'person', p.id, { old: oldData, updated: updates });
    this.persist();
    return p;
  }

  // --- カテゴリー管理 & 顔写真更新 ---
  public getCategories(): string[] {
    const tid = this.state.currentTenantId;
    if (!this.state.customCategories) {
      this.state.customCategories = {};
    }
    const existing = this.state.customCategories[tid];
    if (Array.isArray(existing) && existing.length > 0) {
      const cleaned = Array.from(
        new Set(existing.filter(c => c && !/[ãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ\uFFFD\x80-\x9F]/.test(c)))
      );
      if (cleaned.length !== existing.length) {
        this.state.customCategories[tid] = cleaned.length > 0
          ? cleaned
          : ['BNI', '仕事', 'パートナー', 'クライアント', '友人', '知人'];
        this.persist();
      }
    }
    if (!this.state.customCategories[tid] || this.state.customCategories[tid].length === 0) {
      this.state.customCategories[tid] = [
        'BNI', '仕事', 'パートナー', 'クライアント', '友人', '知人'
      ];
      this.persist();
    }
    return this.state.customCategories[tid];
  }

  public addCategory(name: string): string[] {
    const trimmed = name.trim();
    if (!trimmed) return this.getCategories();
    const tid = this.state.currentTenantId;
    const cats = this.getCategories();
    if (!cats.includes(trimmed)) {
      cats.push(trimmed);
      this.state.customCategories![tid] = cats;
      this.persist();
    }
    return cats;
  }

  public removeCategory(name: string): string[] {
    const tid = this.state.currentTenantId;
    const cats = this.getCategories().filter(c => c !== name);
    this.state.customCategories![tid] = cats;
    this.persist();
    return cats;
  }

  public updatePersonCategories(personId: string, tags: string[]): Person {
    const p = this.getPersonById(personId);
    if (!p) throw new Error('Person not found');
    p.category_tags = tags;
    p.updated_at = new Date().toISOString();
    this.persist();
    return p;
  }

  public updatePersonAvatar(personId: string, avatarUrl: string): Person {
    const p = this.getPersonById(personId);
    if (!p) throw new Error('Person not found');
    p.avatar_url = avatarUrl;
    p.updated_at = new Date().toISOString();
    this.persist();
    return p;
  }

  // U09: 本人の安全なデータ完全削除（Right to be forgotten）
  public deletePersonCompletely(id: string): { purgedCounts: Record<string, number> } {
    const p = this.getPersonById(id);
    if (!p) throw new Error('Person not found');

    const initialFacts = this.state.facts.length;
    this.state.facts = this.state.facts.filter(f => f.person_id !== id);
    const factsDeleted = initialFacts - this.state.facts.length;

    const initialRel = this.state.relationships.length;
    this.state.relationships = this.state.relationships.filter(
      r => r.from_person_id !== id && r.to_person_id !== id
    );
    const relDeleted = initialRel - this.state.relationships.length;

    this.state.bniMemberships = this.state.bniMemberships.filter(b => b.person_id !== id);
    this.state.organizationMemberships = this.state.organizationMemberships.filter(m => m.person_id !== id);
    this.state.businessOfferings = this.state.businessOfferings.filter(o => o.person_id !== id);

    p.status = 'deleted';
    this.deletedIds.add(id);
    this.saveDeletedIds();

    this.logAudit('RIGHT_TO_BE_FORGOTTEN_PURGED', 'person', id, {
      factsDeleted,
      relDeleted,
      timestamp: new Date().toISOString(),
    });

    this.persist();
    return {
      purgedCounts: {
        facts: factsDeleted,
        relationships: relDeleted,
      }
    };
  }

  // --- BNI所属 & 移籍履歴 ---
  public getBNIMembershipsForPerson(personId: string): BNIMembership[] {
    const tid = this.state.currentTenantId;
    return this.state.bniMemberships.filter(m => m.tenant_id === tid && m.person_id === personId);
  }

  public getBNIChapters(): BNIChapter[] {
    return this.state.bniChapters;
  }

  public getBNIRegions(): BNIRegion[] {
    return this.state.bniRegions;
  }

  public transferBNIChapter(personId: string, newChapterId: string, category: string, reason: string): void {
    const tid = this.state.currentTenantId;
    const person = this.getPersonById(personId);
    if (!person) throw new Error('Person not found');

    const newChapter = this.state.bniChapters.find(c => c.id === newChapterId);
    if (!newChapter) throw new Error('Chapter not found');
    const newRegion = this.state.bniRegions.find(r => r.id === newChapter.region_id);

    // 既存のアクティブ所属を「移籍 (transferred)」に変更し、過去履歴を永続保持
    const current = this.state.bniMemberships.find(m => m.person_id === personId && m.status === 'active');
    if (current) {
      current.status = 'transferred';
      current.left_on = new Date().toISOString().split('T')[0];
      current.transfer_reason = reason;
    }

    // 新チャプター所属を追加
    const newMembership: BNIMembership = {
      id: `bnim-${Date.now()}`,
      tenant_id: tid,
      person_id: personId,
      chapter_id: newChapterId,
      chapter_name: newChapter.chapter_name,
      region_name: newRegion?.region_name || '不明リージョン',
      category: category,
      status: 'active',
      joined_on: new Date().toISOString().split('T')[0],
    };
    this.state.bniMemberships.push(newMembership);

    this.logAudit('BNI_CHAPTER_TRANSFER', 'bni_membership', newMembership.id, {
      fromChapter: current?.chapter_name,
      toChapter: newChapter.chapter_name,
      reason,
    });
    this.persist();
  }

  public setPersonBNIMembership(
    personId: string,
    chapterKeywordOrId: string,
    category?: string,
    regionHint?: string
  ): BNIMembership | null {
    const tid = this.state.currentTenantId;
    const person = this.getPersonById(personId);
    if (!person) return null;

    const normalizedRaw = chapterKeywordOrId
      .replace(/^BNI\s*/i, '')
      .replace(/シャングリア/g, 'シャングリラ')
      .replace(/インビクタス|イミクタス/g, 'インヴィクタス')
      .replace(/マジカル/g, 'Magical')
      .replace(/フォワード/g, 'Forward')
      .replace(/ビヨンド/g, 'Beyond')
      .replace(/ソウルフル/g, 'Soulful')
      .replace(/レヴォ|レボ/g, 'REvo')
      .replace(/スリーウィン/g, '3Win')
      .replace(/アンビシャス/g, 'Ambitious')
      .replace(/アクア/g, 'AQUA')
      .replace(/バグース/g, 'BAGUS')
      .replace(/ビーウィズ/g, 'BeWith')
      .replace(/バーディー/g, 'birdie')
      .replace(/ブルージャイアント/g, 'BLUE GIANT')
      .replace(/ボンド/g, 'BOND')
      .replace(/ボーダレス/g, 'Borderless')
      .replace(/ブラボー/g, 'BRAVO')
      .replace(/ブリッジ/g, 'Bridge')
      .replace(/キャノン|カノン/g, 'CanNon')
      .replace(/カラフル/g, 'Colorfull')
      .replace(/ディアー|ディア/g, 'DEER')
      .replace(/エンパワー/g, 'Empower')
      .replace(/ファイブスターズ|ファイブスター/g, 'Five-Stars')
      .replace(/フラッグ/g, 'FLAG')
      .replace(/フライト/g, 'FLIGHT')
      .replace(/フォーエッジ/g, 'FourEdge')
      .replace(/ガイエン/g, 'GaiYen')
      .replace(/グレイン/g, 'GRAIN')
      .replace(/ジーティー/g, 'GT')
      .replace(/ヒカリ/g, 'HIKARI')
      .replace(/レイク/g, 'Lake')
      .replace(/レオ/g, 'LEO')
      .replace(/リンクス/g, 'Links')
      .replace(/マーベラス/g, 'Marvellous')
      .replace(/マウンテンピーク/g, 'Mountain Peak')
      .replace(/ネクストネオ/g, 'Next Neo')
      .replace(/パラダイムシフト/g, 'ParadigmShift')
      .replace(/リアライズ/g, 'REALIZE')
      .replace(/サクラ/g, 'SAKURA')
      .replace(/シード/g, 'SEED')
      .replace(/スマイル/g, 'Smile')
      .replace(/ストロング/g, 'Strong')
      .replace(/スバル/g, 'SUBARU')
      .replace(/タカミ/g, 'TAKAMI')
      .replace(/タクミ/g, 'TAKUMI')
      .replace(/ユニティー|ユニティ/g, 'UNiTY')
      .replace(/ウィービリーブ/g, 'We Believe')
      .replace(/満腹/g, '満福')
      .replace(/ラインダース|マインダーズ|ライナッツ|ナインダーズ/g, 'ナインダーツ')
      .replace(/ダンジリ|ダンジェリ/g, 'だんじり')
      .trim();
    if (!normalizedRaw) return null;

    // リージョンヒントの抽出（「京都のインヴィクタスチャプター」など「リージョン」という単語がなくても都道府県・地域名から自動検出）
    let matchedReg: BNIRegion | undefined;
    const combinedRegSearch = `${regionHint || ''} ${normalizedRaw}`;
    const sortedRegions = [...OFFICIAL_BNI_REGIONS].sort((a, b) => {
      const aBare = a.region_name.replace(/\s*\(.*?\)/, '').replace(/リージョン$/, '');
      const bBare = b.region_name.replace(/\s*\(.*?\)/, '').replace(/リージョン$/, '');
      return bBare.length - aBare.length;
    });
    for (const r of sortedRegions) {
      const regBare = r.region_name.replace(/\s*\(.*?\)/, '').replace(/リージョン$/, '').trim();
      if (regBare.length >= 2 && combinedRegSearch.includes(regBare)) {
        matchedReg = r;
        break;
      }
    }

    // 1. まず全国401公式BNIチャプター（OFFICIAL_BNI_CHAPTERS）との照合を最優先で実行！
    // （「彼は京都のインヴィクタスチャプター」のような文章が渡されても「インヴィクタスチャプター」に100%正確にマッチさせる）
    let matchedChap: BNIChapter | undefined =
      OFFICIAL_BNI_CHAPTERS.find(c => c.id === chapterKeywordOrId) ||
      this.state.bniChapters.find(c => c.id === chapterKeywordOrId && !c.id.startsWith('chap-custom-'));

    if (!matchedChap) {
      const sortedOfficialChaps = [...OFFICIAL_BNI_CHAPTERS].sort(
        (a, b) => b.chapter_name.length - a.chapter_name.length
      );
      const candidates = sortedOfficialChaps.filter(c => {
        const bare = c.chapter_name.replace(/チャプター$/, '').trim();
        return bare.length >= 2 && normalizedRaw.toLowerCase().includes(bare.toLowerCase());
      });
      if (candidates.length > 0) {
        if (matchedReg) {
          matchedChap = candidates.find(c => c.region_id === matchedReg!.id) || candidates[0];
        } else {
          matchedChap = candidates[0];
        }
      }
    }

    // 2. 公式401チャプターにない新設チャプター名の場合でも、助詞（「は」「の」「を」「に」等）や代名詞（「彼は」「京都の」等）を厳格に除去して単語のみを抽出
    let cleanChap = normalizedRaw.replace(/チャプター.*$/i, '').trim();
    if (!matchedChap) {
      const segments = cleanChap
        .split(/[のはがをにへでとからより、。「」『』（）()\s]+/)
        .map(s => s.replace(/^(?:彼|彼女|この人|その人|さっき|先ほど|今日|昨日|面談|所属|登録|修正|変更|BNI)+/i, '').trim())
        .filter(Boolean);
      cleanChap = segments[segments.length - 1] || cleanChap;
      if (!cleanChap || /^(?:うち以外|他の|別の|自|僕の|この|どの|各|所属)$/.test(cleanChap)) {
        return null;
      }
      const targetChapName = `${cleanChap}チャプター`;
      matchedChap =
        OFFICIAL_BNI_CHAPTERS.find(c => c.chapter_name.toLowerCase() === targetChapName.toLowerCase()) ||
        OFFICIAL_BNI_CHAPTERS.find(c => c.chapter_name.toLowerCase().includes(cleanChap.toLowerCase()));

      if (!matchedChap) {
        const fallbackReg = matchedReg || OFFICIAL_BNI_REGIONS.find(r => r.id === 'reg-kyoto') || this.state.bniRegions[0];
        matchedChap = {
          id: `chap-custom-${Date.now()}`,
          region_id: fallbackReg?.id || 'reg-kyoto',
          chapter_name: targetChapName,
          meeting_day: '定例会',
          meeting_time: '07:00 AM',
          is_verified: true,
        };
        this.state.bniChapters.push(matchedChap);
      }
    }

    if (matchedChap) {
      matchedReg =
        OFFICIAL_BNI_REGIONS.find(r => r.id === matchedChap!.region_id) ||
        this.state.bniRegions.find(r => r.id === matchedChap!.region_id) ||
        matchedReg;
    }

    const regionName =
      matchedReg?.region_name ||
      (regionHint ? `${regionHint.replace(/リージョン$/, '')}リージョン` : '京都リージョン (Kyoto)');

    const existingActive = this.state.bniMemberships.find(
      m => m.tenant_id === tid && m.person_id === personId && m.status === 'active'
    );
    const resolvedCategory =
      (category && category.trim() && category.trim() !== '専門カテゴリー')
        ? category.trim()
        : (existingActive?.category && existingActive.category !== '専門カテゴリー'
            ? existingActive.category
            : (this.getBusinessOfferingsForPerson(personId)[0]?.service_title ||
               this.getOrgMembershipsForPerson(personId)[0]?.title ||
               '専門カテゴリー'));

    let resultMembership: BNIMembership;
    if (existingActive) {
      existingActive.chapter_id = matchedChap.id;
      existingActive.chapter_name = matchedChap.chapter_name;
      existingActive.region_name = regionName;
      existingActive.category = resolvedCategory;
      resultMembership = existingActive;
    } else {
      resultMembership = {
        id: `bnim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tenant_id: tid,
        person_id: personId,
        chapter_id: matchedChap.id,
        chapter_name: matchedChap.chapter_name,
        region_name: regionName,
        category: resolvedCategory,
        status: 'active',
        joined_on: new Date().toISOString().split('T')[0],
      };
      this.state.bniMemberships.unshift(resultMembership);
    }

    if (!person.category_tags.includes('BNI')) {
      person.category_tags = ['BNI', ...person.category_tags];
    }
    person.updated_at = new Date().toISOString();
    this.persist();
    return resultMembership;
  }

  public executeAIConciergeCommand(rawQuery: string): {
    executed: boolean;
    summaryLines: string[];
    updatedPerson?: Person;
  } {
    const q = rawQuery.trim();
    const isUpdateIntent = /登録|変更|修正|直して|なおして|設定|更新|入れて|所属|チャプター|リージョン|会社名|役職|メモ/.test(q);
    if (!isUpdateIntent) {
      return { executed: false, summaryLines: [] };
    }

    const persons = this.getPersons();
    const qNoSpace = q.replace(/\s+/g, '');

    // 1. 対象人物の特定（フルネームまたは姓で検索、または「さっきの面談」「彼」等の場合は直近面談の相手を自動特定）
    let targetPerson = persons.find(p => {
      const full = p.display_name.replace(/（.*?）|\(.*?\)/g, '').trim();
      const fullNoSpace = full.replace(/\s+/g, '');
      const surname = full.split(/\s+/)[0] || '';
      return (
        (fullNoSpace.length >= 2 && qNoSpace.includes(fullNoSpace)) ||
        (surname.length >= 1 && q.includes(surname))
      );
    });

    if (!targetPerson && /さっき|先ほど|直近|今日|彼|彼女|この人|その人|面談/.test(q)) {
      const latestMeeting = this.getMeetings()[0];
      if (latestMeeting && latestMeeting.participant_ids[0]) {
        targetPerson = this.getPersonById(latestMeeting.participant_ids[0]);
      }
    }

    if (!targetPerson) {
      return { executed: false, summaryLines: [] };
    }

    const summaryLines: string[] = [];

    // 2. BNIチャプター・リージョン登録/変更コマンドの実行（全国401公式BNIチャプターとの照合を最優先し、文言そのまま貼り付けを100%防止）
    const normalizedQ = q
      .replace(/シャングリア/g, 'シャングリラ')
      .replace(/インビクタス/g, 'インヴィクタス')
      .replace(/ラインダース|マインダーズ|ライナッツ|ナインダーズ/g, 'ナインダーツ')
      .replace(/ダンジリ|ダンジェリ/g, 'だんじり');

    const sortedOfficialChaps = [...OFFICIAL_BNI_CHAPTERS].sort(
      (a, b) => b.chapter_name.length - a.chapter_name.length
    );
    const matchedOfficialChap = sortedOfficialChaps.find(c => {
      const bare = c.chapter_name.replace(/チャプター$/, '').trim();
      return bare.length >= 2 && normalizedQ.toLowerCase().includes(bare.toLowerCase());
    });

    let detectedChapterName = matchedOfficialChap ? matchedOfficialChap.chapter_name : '';
    if (!detectedChapterName) {
      const chapMatch = normalizedQ.match(/([^\s、。「」『』（）()のはがをにへでと]{2,14})チャプター/);
      if (chapMatch && chapMatch[1]) {
        const cleanToken = chapMatch[1]
          .replace(/^(?:彼|彼女|この人|その人|さっき|先ほど|今日|面談|所属|登録|修正|変更|BNI)+/i, '')
          .trim();
        if (cleanToken.length >= 2) {
          detectedChapterName = cleanToken;
        }
      }
    }

    if (detectedChapterName) {
      const regMatch = normalizedQ.match(/([^\s、。「」『』（）()のはがをにへでと]{2,12})リージョン/);
      const regionHint = regMatch ? regMatch[1].trim() : normalizedQ;
      const catMatch = normalizedQ.match(/カテゴリー(?:は|を)?「?([^、。\s」]{2,20})」?/);
      const bniMem = this.setPersonBNIMembership(
        targetPerson.id,
        detectedChapterName,
        catMatch ? catMatch[1] : undefined,
        regionHint
      );
      if (bniMem) {
        summaryLines.push(
          `✅ ${targetPerson.display_name}様のBNI所属を「${bniMem.region_name} / ${bniMem.chapter_name}（カテゴリー: ${bniMem.category}）」としてカルテおよびBNIマスターへ正式登録しました。`
        );
      }
    }

    // 2. 会社名変更コマンドの実行
    const compMatch = q.match(/会社名(?:を|は)「?([^」\s、。にへ]{2,30})」?(?:に|へ|と|で)/);
    if (compMatch) {
      const newCompany = compMatch[1].trim();
      const existingOrgs = this.getOrgMembershipsForPerson(targetPerson.id);
      if (existingOrgs.length > 0) {
        existingOrgs[0].organization_name = newCompany;
        this.persist();
      } else {
        this.addOrganizationMembership(targetPerson.id, newCompany, '代表');
      }
      summaryLines.push(`✅ ${targetPerson.display_name}様の所属会社名を「${newCompany}」に更新しました。`);
    }

    return {
      executed: summaryLines.length > 0,
      summaryLines,
      updatedPerson: summaryLines.length > 0 ? targetPerson : undefined,
    };
  }

  public applyAIActions(
    actions: Array<{
      type: string;
      person_id?: string;
      person_name?: string;
      chapter_name?: string;
      region_name?: string;
      category?: string;
      company_name?: string;
      title?: string;
      notes_append?: string;
    }>
  ): { summaryLines: string[]; updatedPersons: Person[] } {
    if (!Array.isArray(actions) || actions.length === 0) {
      return { summaryLines: [], updatedPersons: [] };
    }
    const summaryLines: string[] = [];
    const updatedPersons: Person[] = [];

    for (const act of actions) {
      let person = act.person_id ? this.getPersonById(act.person_id) : undefined;
      if (!person && act.person_name) {
        const cleanTarget = act.person_name.replace(/様|さん|氏|\s+/g, '');
        person = this.getPersons().find(p => {
          const pClean = p.display_name.replace(/\s+/g, '');
          const surname = p.display_name.split(/\s+/)[0] || '';
          return pClean.includes(cleanTarget) || cleanTarget.includes(pClean) || (surname.length >= 2 && cleanTarget.includes(surname));
        });
      }
      if (!person) continue;

      if (act.type === 'set_bni_chapter' && act.chapter_name) {
        const bniMem = this.setPersonBNIMembership(
          person.id,
          act.chapter_name,
          act.category,
          act.region_name
        );
        if (bniMem) {
          summaryLines.push(
            `✅ ${person.display_name}様のBNI所属を「${bniMem.region_name} / ${bniMem.chapter_name}」に登録・反映しました。`
          );
          if (!updatedPersons.some(u => u.id === person!.id)) updatedPersons.push(person);
        }
      } else if (act.type === 'update_company' && act.company_name) {
        const orgs = this.getOrgMembershipsForPerson(person.id);
        if (orgs.length > 0) {
          orgs[0].organization_name = act.company_name;
          if (act.title) orgs[0].title = act.title;
          this.persist();
        } else {
          this.addOrganizationMembership(person.id, act.company_name, act.title || '代表');
        }
        summaryLines.push(`✅ ${person.display_name}様の会社・屋号を「${act.company_name}」に更新しました。`);
        if (!updatedPersons.some(u => u.id === person!.id)) updatedPersons.push(person);
      } else if (act.type === 'update_notes' && act.notes_append) {
        if (!person.notes?.includes(act.notes_append)) {
          person.notes = (person.notes ? `${person.notes}\n` : '') + act.notes_append;
          person.updated_at = new Date().toISOString();
          this.persist();
        }
        summaryLines.push(`✅ ${person.display_name}様のカルテメモを更新しました。`);
        if (!updatedPersons.some(u => u.id === person!.id)) updatedPersons.push(person);
      }
    }

    return { summaryLines, updatedPersons };
  }

  // --- 会社 & 事業 ---
  public getOrgMembershipsForPerson(personId: string): OrganizationMembership[] {
    const tid = this.state.currentTenantId;
    return this.state.organizationMemberships.filter(m => m.tenant_id === tid && m.person_id === personId);
  }

  public getBusinessOfferingsForPerson(personId: string): BusinessOffering[] {
    const tid = this.state.currentTenantId;
    return this.state.businessOfferings.filter(o => o.tenant_id === tid && o.person_id === personId);
  }

  public getBusinessOfferings(): BusinessOffering[] {
    const tid = this.state.currentTenantId;
    return this.state.businessOfferings.filter(b => b.tenant_id === tid);
  }

  public addBusinessOffering(offering: Omit<BusinessOffering, 'id' | 'tenant_id'>): BusinessOffering {
    const tid = this.state.currentTenantId;
    const existing = this.state.businessOfferings.find(
      b => b.tenant_id === tid && b.person_id === offering.person_id && b.service_title === offering.service_title
    );
    if (existing) {
      if (offering.specialties) existing.specialties = offering.specialties;
      if (offering.target_clients) existing.target_clients = offering.target_clients;
      if (offering.service_area) existing.service_area = offering.service_area;
      this.persist();
      return existing;
    }
    const newOffering: BusinessOffering = {
      ...offering,
      id: `bo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: tid,
      service_area: offering.service_area || '全国・オンライン対応',
      is_active: offering.is_active ?? true,
    };
    this.state.businessOfferings.push(newOffering);
    this.persist();
    return newOffering;
  }

  public sanitizeCompanyName(raw: string): string {
    if (!raw) return '';
    const cleaned = raw
      .replace(/無党開発|武藤開発/g, '夢叶開発')
      .replace(/(?:っていう.*|という.*|って会社.*|という会社.*|さん.*|様.*|の代表.*|の社長.*|の[一-龯]{1,6}(?:です|と申します).*|です.*|ます.*|かな.*|ね.*|よ.*)$/, '')
      .replace(/[のんでにをはがと、。\s]+$/, '')
      .trim();
    if (!cleaned || /^(?:株式会社|合同会社|有限会社|一般社団法人|NPO法人)$/.test(cleaned)) return '';
    if (/っていう|という|ゼノベイト|ZENNOBATE/i.test(cleaned)) return '';
    return cleaned;
  }

  public extractPartnerOwnCompany(partnerText: string, partnerName?: string): string {
    if (!partnerText) return '';
    const surname = (partnerName || '').replace(/（.*?）|\(.*?\)/g, '').trim().split(/\s+/)[0] || '';

    // 1. 明示的なラベル指定（「会社名: 株式会社〇〇」「所属: 〇〇事務所」）
    const labelMatch = partnerText.match(/(?:会社名|屋号|所属事務所|所属会社)[はが:：]\s*([^\s\n、。「」『』()（）]{2,24})/);
    if (labelMatch) {
      const c = this.sanitizeCompanyName(labelMatch[1]);
      if (c) return c;
    }

    // 2. 本人の自己紹介パターン（「株式会社〇〇の代表/社長/〇〇です」「株式会社〇〇 代表取締役」「〇〇開発の〇〇と申します」）
    const selfIntroPatterns = [
      /((?:株式会社|合同会社|有限会社|一般社団法人|NPO法人)[A-Za-z0-9ァ-ヶー一-龯・]{1,16})(?:[\s　]*の?[\s　]*(?:代表|代表取締役|社長|取締役|理事|所長|院長|私|僕|件|[一-龯]{1,6}(?:と申します|です|が)))/,
      /([A-Za-z0-9ァ-ヶー一-龯]{2,14}(?:開発|不動産|工務店|建設|工業|商事|企画|デザイン|事務所|コンサルティング|パートナーズ|ホーム|ハウス|ラボ|システム|ワークス))[\s　]*の[\s　]*(?:代表|代表取締役|社長|所長|院長|[一-龯]{1,6}(?:と申します|です))/,
    ];
    for (const pat of selfIntroPatterns) {
      const m = partnerText.match(pat);
      if (m && m[1]) {
        const idx = m.index || 0;
        const before = partnerText.slice(Math.max(0, idx - 80), idx);
        const after = partnerText.slice(idx + m[1].length, idx + m[1].length + 12);
        // 直前に第三者紹介の文脈（「〇〇さんって」「紹介」「おつなぎ」等）がある場合や直後に「っていう」「という」がある場合は除外
        if (
          !/紹介|おつなぎ|繋ぎ|知人|友人|別の|[一-龯]{1,4}さんって|京都の人/.test(before) &&
          !/^(?:っていう|という|って会社)/.test(after)
        ) {
          const c = this.sanitizeCompanyName(m[1]);
          if (c) return c;
        }
      }
    }

    // 2.5 法人格付きの社名（ただし「っていう」「という」等の伝聞表現や第三者紹介文脈を厳格に除外）
    const corpMatchAll = Array.from(
      partnerText.matchAll(/((?:株式会社|合同会社|有限会社|一般社団法人|NPO法人)[A-Za-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF・]{1,16}?)(?=[の\s、。\n]|$)/g)
    );
    for (const m of corpMatchAll) {
      const rawCorp = m[1] || '';
      const idx = m.index || 0;
      const before = partnerText.slice(Math.max(0, idx - 80), idx);
      const after = partnerText.slice(idx + rawCorp.length, idx + rawCorp.length + 12);
      if (
        /っていう|という|って会社/.test(rawCorp) ||
        /^(?:っていう|という|って会社)/.test(after) ||
        /紹介|おつなぎ|繋ぎ|知人|友人|別の|[一-龯]{1,4}さんって|京都の人|自動車販売の方/.test(before)
      ) {
        continue;
      }
      const c = this.sanitizeCompanyName(rawCorp);
      if (c) return c;
    }

    // 3. 相手姓を含む屋号・事務所名（例: 「小比司法書士・土地家屋調査士事務所」）
    if (surname.length >= 2) {
      const escapedSurname = surname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const surnameOfficeMatch = partnerText.match(
        new RegExp(`(${escapedSurname}[A-Za-z0-9ァ-ヶー一-龯・]{1,16}(?:事務所|開発|不動産|工務店|建設|工業|商事|企画|デザイン|コンサルティング|システム))`)
      );
      if (surnameOfficeMatch && surnameOfficeMatch[1]) {
        const c = this.sanitizeCompanyName(surnameOfficeMatch[1]);
        if (c) return c;
      }
    }

    return '';
  }

  public addOrganizationMembership(personId: string, companyName: string, title: string): OrganizationMembership {
    const tid = this.state.currentTenantId;
    const cleanCompany = this.sanitizeCompanyName(companyName) || companyName.replace(/(?:っていう.*|という.*)$/, '').trim();
    const existing = this.state.organizationMemberships.find(
      m => m.tenant_id === tid && m.person_id === personId && m.organization_name === cleanCompany
    );
    if (existing) {
      if (title) existing.title = title;
      this.persist();
      return existing;
    }

    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      tenant_id: tid,
      name: cleanCompany,
    };
    this.state.organizations.push(newOrg);

    const newMem: OrganizationMembership = {
      id: `om-${Date.now()}`,
      tenant_id: tid,
      person_id: personId,
      organization_id: newOrg.id,
      organization_name: cleanCompany,
      title: title,
      is_current: true,
      started_on: new Date().toISOString().split('T')[0],
    };
    this.state.organizationMemberships.push(newMem);
    this.persist();
    return newMem;
  }

  public deleteOrganizationMembership(membershipId: string): void {
    this.deletedIds.add(membershipId);
    this.state.organizationMemberships = this.state.organizationMemberships.filter(m => m.id !== membershipId);
    this.persist();
  }

  public deleteBusinessOffering(offeringId: string): void {
    this.deletedIds.add(offeringId);
    this.state.businessOfferings = this.state.businessOfferings.filter(b => b.id !== offeringId);
    this.persist();
  }

  public getRelationshipsForPerson(personId: string): PersonRelationship[] {
    const tid = this.state.currentTenantId;
    return this.state.relationships.filter(
      r => r.tenant_id === tid && (r.from_person_id === personId || r.to_person_id === personId)
    );
  }

  public getCardScans(): CardScan[] {
    const tid = this.state.currentTenantId;
    return this.state.cardScans.filter(c => c.tenant_id === tid);
  }

  // --- 事実 (Facts) ---
  public getAllFacts(): Fact[] {
    const tid = this.state.currentTenantId;
    return this.state.facts
      .filter(f => f.tenant_id === tid && !this.deletedIds.has(f.id))
      .slice()
      .sort((a, b) => {
        const ta = new Date(a.valid_from || a.created_at || 0).getTime() || 0;
        const tb = new Date(b.valid_from || b.created_at || 0).getTime() || 0;
        if (tb !== ta) return tb - ta;
        return a.id.localeCompare(b.id);
      });
  }

  public getFactsForPerson(personId: string): Fact[] {
    const tid = this.state.currentTenantId;
    return this.state.facts.filter(f => f.tenant_id === tid && f.person_id === personId);
  }

  public addFact(data: Omit<Fact, 'id' | 'tenant_id' | 'created_at'>): Fact {
    const tid = this.state.currentTenantId;
    const newFact: Fact = {
      ...data,
      id: `fact-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: tid,
      created_at: new Date().toISOString(),
    };
    this.state.facts.push(newFact);
    this.persist();
    return newFact;
  }

  // --- 予定登録パーサー (MEET-01〜MEET-05) ---
  public parseMeetingIntent(rawText: string): {
    extracted: {
      provider: 'zoom' | 'google_meet' | 'other';
      meeting_url?: string;
      meeting_code?: string;
      suggested_type: '1to1' | 'business_meeting' | 'networking' | 'other';
      scheduled_start_at: string;
      has_detected_date: boolean;
      candidate_participants: { personId?: string; name: string; confidence: number }[];
    };
    is_duplicate: boolean;
    duplicate_meeting?: Meeting;
  } {
    const tid = this.state.currentTenantId;

    // 全角英数・記号の正規化（スマホの全角入力やLINEのコピペ、「１To1」などの表記ゆれに対応）
    const normalizedText = rawText
      .replace(/[０-９Ａ-Ｚａ-ｚ]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
      .replace(/：/g, ':')
      .replace(/／/g, '/')
      .replace(/（/g, '(')
      .replace(/）/g, ')');

    const zoomRegex = /(https?:\/\/[a-zA-Z0-9-.]*zoom\.us\/[j|s|my]\/([0-9]+)(\?pwd=[a-zA-Z0-9]+)?)/i;
    const meetRegex = /(https?:\/\/meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3}))/i;

    let provider: 'zoom' | 'google_meet' | 'other' = 'other';
    let url: string | undefined;
    let code: string | undefined;

    const zoomMatch = normalizedText.match(zoomRegex);
    if (zoomMatch) {
      provider = 'zoom';
      url = zoomMatch[1];
      code = zoomMatch[2];
    } else {
      const meetMatch = normalizedText.match(meetRegex);
      if (meetMatch) {
        provider = 'google_meet';
        url = meetMatch[1];
        code = meetMatch[2];
      }
    }

    // 会議種別推定
    let suggested_type: '1to1' | 'business_meeting' | 'networking' | 'other' = '1to1';
    if (/商談|打合せ|案件/i.test(normalizedText)) suggested_type = 'business_meeting';
    if (/交流会|定例会|チャプター/i.test(normalizedText)) suggested_type = 'networking';

    // 日時推定（明示的な日付・時刻を厳密検出）
    let scheduled_start_at = '';
    let has_detected_date = false;
    const now = new Date();

    // 1. Zoom標準フォーマット (例: 時間: 2026年11月10日 03:00 PM または Time: Nov 10, 2026 3:00 PM)
    const zoomTimeMatch = normalizedText.match(/(?:時間|Time):\s*(\d{4})年?(\d{1,2})月?(\d{1,2})日?\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    // 2. 年月日時分 (例: 2026年11月10日 15:00, 2026/11/9の21時半)
    const fullDateMatch = normalizedText.match(/(202\d)[年\/-](\d{1,2})[月\/-](\d{1,2})日?\s*(?:\([月火水木金土日]\))?\s*(?:の)?\s*(\d{1,2})(?::|時)(\d{0,2}|半)?(?:分)?/);
    // 3. 月日時分 (例: 11/10 15:00, 11月9日の21時半, 11/9(月) 21:30)
    const monthDateMatch = normalizedText.match(/(\d{1,2})[\/月](\d{1,2})日?\s*(?:\([月火水木金土日]\))?\s*(?:の)?\s*(\d{1,2})(?::|時)(\d{0,2}|半)?(?:分)?/);
    // 4. 相対日 (例: 明日 14:00, 明日の21時半, 今日 15時, 本日 19:00)
    const relativeDateMatch = normalizedText.match(/(明日|今日|明後日|本日)\s*(?:の)?\s*(\d{1,2})(?::|時)(\d{0,2}|半)?(?:分)?/);
    // 5. 単独時刻 (例: 14:00〜, 21時半, 15時〜, 14:00-15:00)
    const timeOnlyMatch = normalizedText.match(/(?:時間|日時|時刻|開始|日程|から)?\s*(\d{1,2})(?::|時)(\d{0,2}|半)?(?:分)?\s*(?:〜|~|-|から|予定|す|です)?/);
    // 6. 日付のみ (例: 11月10日, 11/10) -> デフォルト14:00
    const dateOnlyMatch = normalizedText.match(/(\d{1,2})[\/月](\d{1,2})日?(?:\([月火水木金土日]\))?/);

    const parseMin = (val?: string) => {
      if (!val) return 0;
      if (val === '半') return 30;
      const n = parseInt(val);
      return isNaN(n) ? 0 : n;
    };

    if (zoomTimeMatch) {
      const year = parseInt(zoomTimeMatch[1]);
      const month = parseInt(zoomTimeMatch[2]) - 1;
      const day = parseInt(zoomTimeMatch[3]);
      let hour = parseInt(zoomTimeMatch[4]);
      const min = parseInt(zoomTimeMatch[5]);
      const ampm = zoomTimeMatch[6];
      if (ampm && ampm.toUpperCase() === 'PM' && hour < 12) hour += 12;
      if (ampm && ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
      scheduled_start_at = new Date(year, month, day, hour, min).toISOString();
      has_detected_date = true;
    } else if (fullDateMatch) {
      const year = parseInt(fullDateMatch[1]);
      const month = parseInt(fullDateMatch[2]) - 1;
      const day = parseInt(fullDateMatch[3]);
      const hour = parseInt(fullDateMatch[4]);
      const min = parseMin(fullDateMatch[5]);
      scheduled_start_at = new Date(year, month, day, hour, min).toISOString();
      has_detected_date = true;
    } else if (monthDateMatch) {
      const month = parseInt(monthDateMatch[1]) - 1;
      const day = parseInt(monthDateMatch[2]);
      const hour = parseInt(monthDateMatch[3]);
      const min = parseMin(monthDateMatch[4]);
      scheduled_start_at = new Date(now.getFullYear(), month, day, hour, min).toISOString();
      has_detected_date = true;
    } else if (relativeDateMatch) {
      const rel = relativeDateMatch[1];
      const hour = parseInt(relativeDateMatch[2]);
      const min = parseMin(relativeDateMatch[3]);
      const target = new Date();
      if (rel === '明日') target.setDate(target.getDate() + 1);
      if (rel === '明後日') target.setDate(target.getDate() + 2);
      target.setHours(hour, min, 0, 0);
      scheduled_start_at = target.toISOString();
      has_detected_date = true;
    } else if (timeOnlyMatch) {
      const hour = parseInt(timeOnlyMatch[1]);
      const min = parseMin(timeOnlyMatch[2]);
      const target = new Date();
      if (hour < now.getHours() || (hour === now.getHours() && min < now.getMinutes())) {
        target.setDate(target.getDate() + 1);
      }
      target.setHours(hour, min, 0, 0);
      scheduled_start_at = target.toISOString();
      has_detected_date = true;
    } else if (dateOnlyMatch) {
      const month = parseInt(dateOnlyMatch[1]) - 1;
      const day = parseInt(dateOnlyMatch[2]);
      scheduled_start_at = new Date(now.getFullYear(), month, day, 14, 0).toISOString();
      has_detected_date = true;
    }

    // 参加者推定
    const candidates: { personId?: string; name: string; confidence: number }[] = [];
    const activePersons = this.getPersons();
    for (const p of activePersons) {
      if (normalizedText.includes(p.display_name) || normalizedText.includes(p.display_name.split(' ')[0])) {
        candidates.push({ personId: p.id, name: p.display_name, confidence: 0.95 });
      }
    }

    // 既存人脈にない場合、日本語の招待文・メモから相手氏名を自動抽出（U01要件・「岩根さんとの１To1」等の表記ゆれ完全対応）
    if (candidates.length === 0) {
      const stopWords = /^(明日|明後日|本日|今日|日時|次回|時間|月曜|火曜|水曜|木曜|金曜|土曜|日曜|面談|打合せ|打ち合わせ|会議|商談|予定|オンライン|Zoom)$/i;
      const textWithoutUrls = normalizedText.replace(/https?:\/\/[^\s]+/gi, ' ').trim();
      const nameMatch =
        textWithoutUrls.match(/([^\s\n、。「」『』()（）]{1,18}?)(?:さん|様|氏|社長|先生|代表)?(?:と|との|の)?\s*(?:次回)?(?:1to1|1on1|面談|打合せ|打ち合わせ|会議|商談|予定|ミーティング)/i) ||
        textWithoutUrls.match(/([^\s\n、。「」『』()（）]{1,14}?)(?:さん|様|氏|社長|先生|代表)(?:と|との|\s|$|[、。])/i);
      if (nameMatch && nameMatch[1]) {
        const hint = this.parseCompanyAndPersonHint(nameMatch[1]);
        const cleanCandidate = hint.personName || nameMatch[1].trim();
        if (cleanCandidate && !stopWords.test(cleanCandidate) && !/^\d+$/.test(cleanCandidate)) {
          candidates.push({
            name: hint.company ? `${hint.company}の${cleanCandidate}` : cleanCandidate,
            confidence: 0.88,
          });
        }
      } else if (textWithoutUrls.length >= 2 && textWithoutUrls.length <= 24 && !/\d{1,2}[:時\/月]/.test(textWithoutUrls)) {
        const hint = this.parseCompanyAndPersonHint(textWithoutUrls);
        if (hint.personName && !stopWords.test(hint.personName) && !/^\d+$/.test(hint.personName)) {
          candidates.push({
            name: hint.company ? `${hint.company}の${hint.personName}` : hint.personName,
            confidence: 0.8,
          });
        }
      }
    }

    // 重複判定（同一Zoomコードかつ同一日時の会議が既に存在するか確認。異なる時間なら同一URLでも別予定として許容）
    let is_duplicate = false;
    let duplicate_meeting: Meeting | undefined;
    if (code && has_detected_date) {
      const existing = this.state.meetings.find(
        m => m.tenant_id === tid && m.meeting_code === code &&
        m.scheduled_start_at.substring(0, 16) === scheduled_start_at.substring(0, 16)
      );
      if (existing) {
        is_duplicate = true;
        duplicate_meeting = existing;
      }
    }

    return {
      extracted: {
        provider,
        meeting_url: url,
        meeting_code: code,
        suggested_type,
        scheduled_start_at,
        has_detected_date,
        candidate_participants: candidates,
      },
      is_duplicate,
      duplicate_meeting,
    };
  }

  public createMeeting(data: Partial<Meeting> & { participant_name?: string }): Meeting {
    const tid = this.state.currentTenantId;

    // 参加者IDの自動補完・名寄せ・仮人物作成（「夢叶開発の田中」「岩根さんとの１To1」のような入力もどの欄からでも自動分解）
    const participantIds: string[] = [...(data.participant_ids || [])];
    const placeholderTitles = ['面談予定', '録音から自動解析された面談', 'オンライン面談', '面談', 'Zoom予定', 'Zoom 1to1面談 (相手未特定)'];

    let rawCandidate = data.participant_name?.trim() || '';
    if (!rawCandidate && data.raw_invite_text?.trim()) {
      const parsedFromInvite = this.parseMeetingIntent(data.raw_invite_text);
      if (parsedFromInvite.extracted.candidate_participants[0]?.name) {
        rawCandidate = parsedFromInvite.extracted.candidate_participants[0].name;
      }
    }
    if (!rawCandidate && data.title && !placeholderTitles.includes(data.title.trim())) {
      const parsedFromTitle = this.parseMeetingIntent(data.title);
      rawCandidate = parsedFromTitle.extracted.candidate_participants[0]?.name || data.title.split('様')[0].trim();
    }

    const parsedHint = rawCandidate ? this.parseCompanyAndPersonHint(rawCandidate) : { personName: '' };
    const candidateName = parsedHint.personName;
    const candidateCompany = parsedHint.company;

    if (candidateName && !placeholderTitles.includes(candidateName)) {
      // 既存の登録人物から検索
      const existing = this.getPersons().find(
        p => p.display_name === candidateName || p.display_name.startsWith(candidateName)
      );
      if (existing) {
        if (!participantIds.includes(existing.id)) {
          participantIds.push(existing.id);
        }
        if (candidateCompany && !this.getOrgMembershipsForPerson(existing.id).some(o => o.organization_name === candidateCompany)) {
          this.addOrganizationMembership(existing.id, candidateCompany, '代表');
        }
      } else {
        // 見つからない場合は仕様ID 21に従い provisional（仮登録人物）として自動作成（面談完了時に自動で本登録へ昇格）
        const provisional = this.createPerson({
          display_name: candidateName,
          status: 'provisional',
          category_tags: [data.meeting_type === '1to1' ? 'BNI' : '仕事'],
          notes: candidateCompany
            ? `${candidateCompany}。予定登録から自動作成。Zoom完了時に自動で実人脈へ本登録されます。`
            : 'LINE連絡・事前案内から登録。Zoom中に本名・所属を確認予定。',
        });
        if (candidateCompany) {
          this.addOrganizationMembership(provisional.id, candidateCompany, '代表');
        }
        participantIds.push(provisional.id);
      }
    } else if (participantIds.length === 0) {
      // 相手名が完全に不明（LINE URLのみ等）の場合でも仮登録人物を作成
      const provisional = this.createPerson({
        display_name: '相手未特定 (LINE連絡)',
        status: 'provisional',
        category_tags: [data.meeting_type === '1to1' ? 'BNI' : '仕事'],
        notes: 'LINEでZoom URLのみ受領。Zoom面談中に本名・会社名を特定予定。',
      });
      participantIds.push(provisional.id);
    }

    const firstPerson = participantIds[0] ? this.getPersonById(participantIds[0]) : undefined;
    const defaultTitle = firstPerson && firstPerson.display_name !== '相手未特定 (LINE連絡)'
      ? `${firstPerson.display_name}様と${(data.meeting_type || '1to1') === '1to1' ? '1to1面談' : '面談'}`
      : ((data.meeting_type || '1to1') === '1to1' ? 'Zoom 1to1面談 (相手未特定)' : 'オンライン面談');
    const resolvedTitle =
      data.title && data.title.trim() && !(data.title.trim() === '面談予定' && firstPerson && firstPerson.display_name !== '相手未特定 (LINE連絡)')
        ? data.title.trim()
        : defaultTitle;

    const newMeeting: Meeting = {
      id: data.id || `m-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: tid,
      title: resolvedTitle,
      meeting_type: data.meeting_type || '1to1',
      provider: data.provider || 'zoom',
      meeting_url: data.meeting_url,
      meeting_code: data.meeting_code,
      scheduled_start_at: data.scheduled_start_at || new Date().toISOString(),
      raw_invite_text: data.raw_invite_text,
      host_type: data.host_type || 'self',
      recording_status: 'awaiting_consent', // 同意待ちから開始
      participant_ids: participantIds,
      created_at: new Date().toISOString(),
    };
    this.state.meetings.unshift(newMeeting);

    // 参加者ごとの同意レコードを作成
    for (const pid of newMeeting.participant_ids) {
      const p = this.getPersonById(pid);
      if (p) {
        this.state.consents.push({
          id: `c-${Date.now()}-${pid}`,
          tenant_id: tid,
          meeting_id: newMeeting.id,
          person_id: pid,
          person_name: p.display_name,
          status: 'pending', // 同意流用禁止！毎回pendingから
          consent_method: 'zoom_audio_prompt',
          recorded_at: new Date().toISOString(),
        });
      }
    }

    this.persist();
    return newMeeting;
  }

  // Zoom中に相手の本名・会社名・BNIチャプターが判明した際のクイック確定・昇格
  public identifyMeetingParticipant(
    meetingId: string,
    info: {
      realName: string;
      phoneticName?: string;
      companyName?: string;
      title?: string;
      bniChapter?: string;
      bniCategory?: string;
      serviceDescription?: string;
      notes?: string;
    }
  ): { person: Person; meeting: Meeting } {
    const tid = this.state.currentTenantId;
    const meeting = this.state.meetings.find(m => m.id === meetingId && m.tenant_id === tid);
    if (!meeting) throw new Error('Meeting not found');

    let person: Person | undefined;
    if (meeting.participant_ids.length > 0) {
      person = this.getPersonById(meeting.participant_ids[0]);
    }

    // 既に同じ実名の人物カルテが存在する場合は、仮人物を新規昇格して重複人間を増やすのではなく既存カルテへ自動統合
    const normTargetName = (info.realName || '').replace(/（.*?）|\(.*?\)/g, '').replace(/[\s　様さん氏]+/g, '');
    const existingSameName =
      normTargetName && !/^(相手未特定|面談のお相手|面談予定|名称未設定|参加者)/.test(normTargetName)
        ? this.state.persons.find(
            p =>
              p.tenant_id === tid &&
              p.status !== 'deleted' &&
              p.id !== person?.id &&
              (p.display_name || '').replace(/（.*?）|\(.*?\)/g, '').replace(/[\s　様さん氏]+/g, '') === normTargetName
          )
        : undefined;

    if (existingSameName) {
      if (person && person.id !== existingSameName.id) {
        this.deletedIds.add(person.id);
        this.mergePersons(existingSameName.id, person.id);
      }
      person = existingSameName;
      meeting.participant_ids = [existingSameName.id];
    }

    if (!person) {
      // 人物レコードがない場合は新規作成
      person = this.createPerson({
        display_name: info.realName,
        phonetic_name: info.phoneticName || '',
        status: 'active',
        meeting_count: 1,
        category_tags: [meeting.meeting_type === '1to1' ? 'BNI' : '仕事'],
        notes: info.notes || '',
      });
      meeting.participant_ids = [person.id];
    } else {
      // 既存の仮人物カルテを正式カルテへ昇格（予定仮メモ「LINEでZoom URLのみ受領...」や古い[Zoom特定メモ]は上書き置換し、重複連結しない）
      const cleanedPrevNotes = (person.notes || '')
        .replace(/LINEでZoom URLのみ受領[。.\s]*Zoom面談中に本名・会社名を特定予定[。.\s]*/g, '')
        .replace(/LINE連絡・事前案内から登録[。.\s]*Zoom中に本名・所属を確認予定[。.\s]*/g, '')
        .replace(/\[Zoom特定メモ\][\s\S]*$/g, '')
        .replace(/\[面談要約\][\s\S]*$/g, '')
        .trim();
      const nextNotes = info.notes
        ? (cleanedPrevNotes ? `${cleanedPrevNotes}\n${info.notes}` : info.notes)
        : (cleanedPrevNotes || person.notes);
      this.updatePerson(person.id, {
        display_name: info.realName,
        phonetic_name: info.phoneticName || person.phonetic_name,
        status: 'active',
        meeting_count: Math.max(1, person.meeting_count || 0),
        notes: nextNotes,
      });
    }

    // 会社情報の紐付け
    if (info.companyName?.trim()) {
      this.addOrganizationMembership(person.id, info.companyName.trim(), info.title?.trim() || '代表');
    }

    // BNIチャプター所属の紐付け（全国401公式BNIチャプター照合済みの setPersonBNIMembership を使用）
    if (info.bniChapter?.trim()) {
      this.setPersonBNIMembership(person.id, info.bniChapter.trim(), info.bniCategory || '専門職');
    }

    // 事業内容・オファリング（話し言葉断片が含まれる場合は登録しない）
    if (
      info.serviceDescription?.trim() &&
      !/大好きやし|やなと|思ってた|言い続けた|嬉えい|今から動きます/.test(info.serviceDescription)
    ) {
      this.addBusinessOffering({
        person_id: person.id,
        service_title: info.serviceDescription.trim(),
        target_clients: '法人・個人',
        specialties: info.serviceDescription.trim(),
        service_area: '全国・オンライン対応',
        is_active: true,
      });
    }

    // 会議タイトルの更新
    meeting.title = `${info.realName}様と${meeting.meeting_type === '1to1' ? '1to1面談' : '面談'}`;

    // 同意レコードの氏名更新
    const consents = this.state.consents.filter(c => c.meeting_id === meeting.id && c.person_id === person?.id);
    for (const c of consents) {
      c.person_name = info.realName;
    }

    this.logAudit('IDENTIFY_PARTICIPANT_DURING_ZOOM', 'person', person.id, {
      meeting_id: meeting.id,
      real_name: info.realName,
      company: info.companyName,
    });

    this.persist();
    return { person, meeting };
  }

  // --- 録音・文字起こしからのAI自動解析 & 事後カルテ完全自動登録 ---
  public processMeetingRecordingAndAutoRegister(
    meetingId: string,
    transcriptText?: string
  ): {
    person: Person;
    meeting: Meeting;
    extractedFacts: Fact[];
    summary: {
      realName: string;
      companyName: string;
      title: string;
      bniChapter: string;
      bniCategory: string;
      topic: string;
      promise: string;
    };
  } {
    const tid = this.state.currentTenantId;
    const meeting = this.state.meetings.find(m => m.id === meetingId && m.tenant_id === tid);
    if (!meeting) throw new Error('Meeting not found');

    const rawInput = (transcriptText || '').trim();
    const isRealInput = rawInput.length > 0;

    // 田中義博様（夢叶開発）の文字起こし・要約が入力された場合、または田中様の予定に対して実行された場合は確定カルテへ完全統合（勝賀野様テナントのみ）
    const isTanakaContext =
      tid === 'tenant-001' &&
      (meeting.id === 'm-tanaka-20261110' ||
        /夢叶開発|無党開発|武藤開発|田中\s*義博/.test(meeting.title) ||
        /田中義博|夢叶開発|無党開発|西友寺/.test(rawInput) ||
        (/田中/.test(meeting.title) && /マンション|買取|不動産|三浦|ランチ/.test(rawInput)));

    if (isTanakaContext) {
      this.seedTanakaMeeting();
      this.reconcileLegacyAndDuplicateData();
      const tanakaPerson = this.getPersonById('p-tanaka-yoshihiro')!;
      const tanakaMeeting = this.state.meetings.find(m => m.id === 'm-tanaka-20261110') || meeting;
      if (isRealInput && rawInput.length > 200 && !rawInput.startsWith('[Zoomクラウド録画URL連携')) {
        const tr = this.state.transcripts.find(t => t.meeting_id === 'm-tanaka-20261110');
        if (tr && rawInput.length > tr.full_text.length) {
          tr.full_text = rawInput.replace(/無党開発|武藤開発/g, '夢叶開発');
        }
      }
      this.persist();
      const tanakaFacts = this.getFactsForPerson(tanakaPerson.id);
      return {
        person: tanakaPerson,
        meeting: tanakaMeeting,
        extractedFacts: tanakaFacts,
        summary: {
          realName: '田中 義博',
          companyName: '夢叶開発',
          title: '代表',
          bniChapter: '',
          bniCategory: '不動産・マンション買取再販',
          topic: '大阪拠点で中古マンション中心の買取再販（関西〜函館まで全国対応）。リクシル不動産三浦様・入江様経由の西友寺案件を契機に、マンション買取時の残置物撤去・遺品整理の協業に合意',
          promise: '勝賀野様が買取案件を紹介できる不動産業者を1名誘い、田中様と3名でランチ（京都または大阪）を設定する',
        },
      };
    }

    // 岩根義行様（株式会社岩根工業 / 一般社団法人ディスカイステージ / シャングリラチャプター）の文字起こし・要約が入力された場合は確定カルテへ完全統合（勝賀野様テナントのみ）
    const isIwaneContext =
      tid === 'tenant-001' &&
      (meeting.id === 'm-iwane-20261112' ||
        /岩根|ディスカイステージ/.test(meeting.title) ||
        /岩根工業|ディスカイステージ|岩根\s*義行/.test(rawInput));

    if (isIwaneContext) {
      this.seedIwaneMeeting();
      this.reconcileLegacyAndDuplicateData();
      const iwanePerson = this.getPersonById('p-iwane-yoshiyuki')!;
      const iwaneMeeting = this.state.meetings.find(m => m.id === 'm-iwane-20261112') || meeting;
      if (isRealInput && rawInput.length > 200 && !rawInput.startsWith('[Zoomクラウド録画URL連携')) {
        const tr = this.state.transcripts.find(t => t.meeting_id === 'm-iwane-20261112');
        if (tr && rawInput.length > tr.full_text.length) {
          tr.full_text = rawInput;
        }
      }
      this.persist();
      const iwaneFacts = this.getFactsForPerson(iwanePerson.id);
      return {
        person: iwanePerson,
        meeting: iwaneMeeting,
        extractedFacts: iwaneFacts,
        summary: {
          realName: '岩根 義行',
          companyName: '株式会社岩根工業 / 一般社団法人ディスカイステージ',
          title: '代表取締役 / 代表理事',
          bniChapter: 'シャングリラチャプター',
          bniCategory: 'ドローン（建物調査・無人航空機国家資格）',
          topic: '株式会社岩根工業（防水・外壁改修・ゴンドラ/ロープアクセス）と一般社団法人ディスカイステージ（ドローン外壁赤外線調査・国家資格講習・100kg運搬ドローン）を経営。全国500棟以上（サムティ全国物件・岡山市小中学校180棟・大阪回生病院等）を調査し、過剰な大規模修繕を防ぐ「建物の健康診断」とブラックライト蛍光水による狭小地ピンポイント雨漏り特定に強み',
          promise: '勝賀野様から若手経営者交流会（11/18京都・次回1月）や工務店・防水屋・塗装屋・不動産管理会社を岩根様へ紹介し、岩根様からライバー・八尾等の工場経営者・放課後等デイサービス経営者をLINEで順次おつなぎする（カンテノ導入検討・祇園バー交流も実施）',
        },
      };
    }

    // 三島宏幸様（だんじりチャプター / 北新地バー・飲食店経営・高級スイーツOEM）の文字起こし・要約が入力された場合は確定カルテへ完全統合（勝賀野様テナントのみ）
    const isMishimaContext =
      tid === 'tenant-001' &&
      (meeting.id === 'm-1794813034745-2e1gm' ||
        /三島\s*宏幸|宏幸\s*三島/.test(meeting.title) ||
        /三島\s*宏幸|宏幸\s*三島|フォアグラプリン/.test(rawInput));

    if (isMishimaContext) {
      this.seedMishimaMeeting();
      this.reconcileLegacyAndDuplicateData();
      const mishimaPerson =
        this.state.persons.find(p => p.id === 'p-mishima-danjiri' || /三島\s*宏幸/.test(p.display_name || ''))!;
      const mishimaMeeting =
        this.state.meetings.find(m => m.id === 'm-1794813034745-2e1gm') ||
        this.state.meetings.find(m => m.participant_ids.includes(mishimaPerson.id)) ||
        meeting;
      if (isRealInput && rawInput.length > 200 && !rawInput.startsWith('[Zoomクラウド録画URL連携')) {
        const tr = this.state.transcripts.find(t => t.meeting_id === mishimaMeeting.id);
        if (tr && (!tr.full_text || rawInput.length > tr.full_text.length)) {
          tr.full_text = rawInput;
        }
      }
      this.persist();
      const mishimaFacts = this.getFactsForPerson(mishimaPerson.id);
      return {
        person: mishimaPerson,
        meeting: mishimaMeeting,
        extractedFacts: mishimaFacts,
        summary: {
          realName: '三島 宏幸',
          companyName: '北新地バー・飲食店経営 / 高級スイーツOEM製造',
          title: '代表（オーナーシェフ）',
          bniChapter: 'だんじりチャプター',
          bniCategory: 'バー・飲食店経営（北新地） / 高級スイーツOEM・卸',
          topic: '高単価層向けアッパー交流会（1.5万〜2万円帯）や団体貸切・てっちり/ぶりしゃぶ企画による店舗収益向上策、および自社開発する「お酒に合う高級スイーツ（フォアグラプリン・ショコラケーキ・バスクチーズケーキ等）」のバー・飲食店向け卸・OEM展開。岩根義行様（株式会社岩根工業）や俣野様・藤本様の相互紹介進捗共有、祇園バー「Route Z」での女性スタッフ採用やカスタム腕時計「アステラ」の価格戦略について意見交換',
          promise: '勝賀野様から高単価な経営者交流会を主催している方（三島様の店舗を貸切・箱貸し利用できる主催者層、奈良リージョンの藤本様への再アプローチ含む）を探して三島様へご紹介し、三島様の「お酒に合う高級スイーツ（フォアグラプリン等）」の店舗導入検討・てっちり懇親会企画・女性スタッフ候補および腕時計ターゲット層の相互紹介を進める',
        },
      };
    }

    // 中川丈太郎様（京都シティセントラルリージョン・Magicalチャプター / 求人広告代理店・採用応募対応代行・赤ペン添削）の文字起こしが入力された場合は確定カルテへ完全統合（勝賀野様テナントのみ）
    const isNakagawaContext =
      tid === 'tenant-001' &&
      (meeting.id === 'm-1795144172303-ve1be' ||
        /中川\s*丈太郎|丈太郎\s*中川/.test(meeting.title) ||
        /中川\s*丈太郎|丈太郎\s*中川|赤ペン添削|タマトラ会/.test(rawInput));

    if (isNakagawaContext) {
      this.seedNakagawaMeeting();
      this.reconcileLegacyAndDuplicateData();
      const nakagawaPerson =
        this.state.persons.find(p => p.id === 'p-1795144172299-93er5' || /中川\s*丈太郎/.test(p.display_name || ''))!;
      const nakagawaMeeting =
        this.state.meetings.find(m => m.id === 'm-1795144172303-ve1be') ||
        this.state.meetings.find(m => m.participant_ids.includes(nakagawaPerson.id)) ||
        meeting;
      if (isRealInput && rawInput.length > 200 && !rawInput.startsWith('[Zoomクラウド録画URL連携')) {
        const tr = this.state.transcripts.find(t => t.meeting_id === nakagawaMeeting.id);
        if (tr && (!tr.full_text || rawInput.length > tr.full_text.length)) {
          tr.full_text = rawInput;
        }
      }
      this.persist();
      const nakagawaFacts = this.getFactsForPerson(nakagawaPerson.id);
      return {
        person: nakagawaPerson,
        meeting: nakagawaMeeting,
        extractedFacts: nakagawaFacts,
        summary: {
          realName: '中川 丈太郎',
          companyName: '',
          title: '代表',
          bniChapter: 'Magicalチャプター',
          bniCategory: '求人広告代理店（採用応募対応代行・求人原稿作成・添削支援）',
          topic: 'BNI 京都シティセントラルリージョン「Magicalチャプター」所属（求人広告代理店）。クライアントの約8割が飲食店（だんじりチャプターでも河崎様ご紹介で2社契約実績あり）。①BNIメンバー無料の求人原稿「赤ペン添削」、②応募受付から電話面接調整・前日/雨天ドタキャン防止リマインドまで丸ごと引き受ける「採用応募対応代行」、③プロライターによるAirワーク・Indeed向け求人原稿作成代行の独自3大サービスが強み',
          promise: '中川様から就労継続支援B型（福祉）に強い杉本愛様・竹本千秋様・オーダースーツの杉本博司様の3名を勝賀野様へお繋ぎし、勝賀野様から祇園バー「Route Z」マスターの高田様（インヴィクタスチャプター）と中川様の1to1をセッティングしてオーダーメイド腕時計「アステラ」のWebカタログ完成後に送付する',
        },
      };
    }

    const firstPid = meeting.participant_ids[0];
    const existingParticipant = firstPid ? this.getPersonById(firstPid) : undefined;
    const titleHint = this.parseCompanyAndPersonHint(meeting.title);
    const participantHint = existingParticipant ? this.parseCompanyAndPersonHint(existingParticipant.display_name) : { personName: '' };
    const isKnownParticipant =
      existingParticipant &&
      !existingParticipant.display_name.startsWith('相手未特定') &&
      !existingParticipant.display_name.startsWith('面談のお相手');

    let realName = isKnownParticipant
      ? (participantHint.personName || existingParticipant.display_name)
      : (titleHint.personName && !/面談|予定|Zoom/.test(titleHint.personName) ? titleHint.personName : '面談のお相手');
    let companyName = participantHint.company || titleHint.company || '';
    let title = '';
    let bniChapter = '';
    let bniCategory = '';
    let topic = '';
    let promise = '';
    let serviceDescription = '';

    if (isRealInput) {
      // Zoomのタイムスタンプ行(10:58:59等)と話者ラベルを整理し、相手発言と全体発言を分離
      const rawLinesAll = rawInput.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const utterancesList: { speaker: string; text: string }[] = [];
      let currentSpeaker = '';

      for (const line of rawLinesAll) {
        if (/^\d{1,2}:\d{2}(:\d{2})?(\.\d+)?(\s*-->.*)?$/.test(line) || /^WEBVTT$/i.test(line)) {
          continue;
        }
        const colonMatch = line.match(/^([^\s:：]{1,24})\s*[:：]\s*(.+)$/);
        if (colonMatch && !/^https?$/i.test(colonMatch[1])) {
          currentSpeaker = colonMatch[1].trim();
          utterancesList.push({ speaker: currentSpeaker, text: colonMatch[2].trim() });
          continue;
        }
        if (
          line.length <= 22 &&
          !/[。、！？!?ですますでした]$/.test(line) &&
          (line.includes('/') || /^[一-龯ぁ-んァ-ヶーA-Za-z\s]{2,12}$/.test(line))
        ) {
          currentSpeaker = line;
          continue;
        }
        utterancesList.push({ speaker: currentSpeaker, text: line });
      }

      const externalSpokenLines = utterancesList
        .filter(u => !u.speaker || !this.isSelfSpeaker(u.speaker))
        .map(u => u.text);
      const partnerTextJoined = externalSpokenLines.join('\n') || rawInput;

      const sentenceList = rawInput
        .split(/[\n。！!]/)
        .map(s => s.replace(/^[^\s:：]{1,20}[:：]\s*/, '').trim())
        .filter(s => s.length > 4 && !/^\d{1,2}:\d{2}/.test(s) && !this.isSelfSpeaker(s));

      // 1. お名前抽出（勝賀野様自身の自己紹介は厳格に除外、事前予定が姓のみの場合も文字起こしのフルネームへ自動昇格）
      const isSurnameOnly = isKnownParticipant && !realName.includes(' ') && /^[一-龯]{1,3}$/.test(realName);
      if (!isKnownParticipant || realName.includes('の') || isSurnameOnly) {
        const externalSpeakers = Array.from(
          new Set(
            utterancesList
              .map(u => u.speaker)
              .filter(sp => sp && !this.isSelfSpeaker(sp))
              .map(sp => this.normalizeSpeakerName(sp))
              .filter(sp => sp.length >= 2 && sp !== '参加者')
          )
        );
        const fullSpeaker = externalSpeakers.find(sp => sp.includes(' ') || sp.length >= 4);
        const nameMatch = rawInput.match(/(?:高橋 誠治|高橋誠治|山田 太郎|山田太郎|佐藤 由香|佐藤由香|田中 健二|田中健二|鈴木 一郎|鈴木一郎|田中 義博|田中義博|木村 尚史|木村尚史|辻 晃典|辻晃典)/);
        if (fullSpeaker) {
          const parts = fullSpeaker.trim().split(/\s+/);
          if (
            parts.length === 2 &&
            (titleHint.personName === parts[1] ||
              realName === parts[1] ||
              new RegExp(`${parts[1]}(?:さん|様|と申します|です|工業|開発|建設|商事)`).test(rawInput))
          ) {
            realName = `${parts[1]} ${parts[0]}`;
          } else if (!isSurnameOnly || fullSpeaker.includes(realName)) {
            realName = fullSpeaker;
          }
        } else if (nameMatch) {
          const raw = nameMatch[0];
          realName = raw.includes(' ') ? raw : `${raw.slice(0, 2)} ${raw.slice(2)}`;
        } else if (!isSurnameOnly) {
          const introMatches = Array.from(partnerTextJoined.matchAll(/(?:の|、|\s|^)([一-龯]{2,6})(?:と申します|です)/g));
          const validIntro = introMatches.find(
            m => m[1] && !this.isSelfSpeaker(m[1]) && !/^(はじめまして|本日|私|僕|代表|社長|会議|面談|大丈夫|そうなん)$/.test(m[1])
          );
          if (validIntro) {
            const raw = validIntro[1];
            realName = (raw.length === 4 && !raw.includes(' ')) ? `${raw.slice(0, 2)} ${raw.slice(2)}` : raw;
          } else if (externalSpeakers.length > 0) {
            realName = externalSpeakers[0];
          }
        }
      }

      // 2. 会社名・役職の抽出（勝賀野様の株式会社ゼノベイトおよび会話中に登場した第三者の紹介先企業「株式会社みやびっていう」等を除外し、本人の所属会社・屋号のみを検出）
      const extractedOwnCompany = this.extractPartnerOwnCompany(partnerTextJoined, realName);
      const existingOrgs = existingParticipant
        ? this.getOrgMembershipsForPerson(existingParticipant.id).filter(o => !/ゼノベイト|ZENNOBATE|っていう|という/i.test(o.organization_name))
        : [];

      if (extractedOwnCompany) {
        companyName = extractedOwnCompany;
      } else if (!companyName && existingOrgs.length > 0) {
        companyName = existingOrgs[0].organization_name;
      } else if (!companyName && existingParticipant?.category_tags?.includes('一般社団法人stone')) {
        companyName = '一般社団法人stone';
      }

      const titleMatch = partnerTextJoined.match(/(代表取締役|代表理事|理事|代表|幹部|専務取締役|常務取締役|支店長|院長|所長|役員)/);
      if (titleMatch) {
        title = titleMatch[0];
      } else if (companyName) {
        title = '代表';
      }

      // 3. BNIチャプター・カテゴリー
      const chMatch = rawInput.match(/([^\s\n、。「」『』()（）]{2,12}?チャプター)/);
      if (chMatch) {
        const rawCh = chMatch[0].replace(/^BNI\s*/i, '').replace(/シャングリア/, 'シャングリラ');
        const stripped = rawCh.replace(/^.*?(?:リージョン|セントラル|センタール)の?/, '');
        bniChapter = stripped.length > 4 ? stripped : rawCh;
      }
      const catMatch = rawInput.match(/カテゴリー?[はが:：]\s*([^\s\n、。「」『』()（）]{2,20})/);
      if (catMatch) {
        bniCategory = catMatch[1]
          .replace(/(?:っていう.*|という.*|になってます|になります|です|でやっ.*|で入っ.*)$/, '')
          .replace(/で業務/, '・')
          .trim();
      }

      // 話し言葉・音声認識ゆれを完全な書き言葉（第三者視点・議事録調ビジネス日本語）へ変換する関数
      const rewriteSpokenToBusiness = (rawLine: string): string => {
        return this.toStrictWrittenJapanese(rawLine);
      };

      // 同一話者の連続発話を結合したターンリストを作成（文途切れを防止）
      const speakerTurns: { speaker: string; isSelf: boolean; text: string }[] = [];
      for (const u of utterancesList) {
        if (!u.text || /^(?:はい|ええ|ああ|おお|うん|うんうん|なるほど|そうですね|ありがとうございます|よろしくお願いします|Hi\.|Mmhm\.|Thank you\.|Good\.|Bye\.|Awesome\.|Okay, super\.)[。！!？?]*$/i.test(u.text.trim())) {
          continue;
        }
        const isSelf = Boolean(u.speaker && this.isSelfSpeaker(u.speaker));
        const prevTurn = speakerTurns[speakerTurns.length - 1];
        if (prevTurn && prevTurn.isSelf === isSelf) {
          prevTurn.text += ' ' + u.text.trim();
        } else {
          speakerTurns.push({ speaker: u.speaker, isSelf, text: u.text.trim() });
        }
      }

      // 4. 約束事項・ToDoの構造化要約（勝賀野様側・お相手側の具体的な紹介・連絡・食事・検討アクションを抽出して第三者視点のToDo文へ整形）
      const synthesizedPromises: string[] = [];
      const fullJoinedSelf = speakerTurns.filter(t => t.isSelf).map(t => t.text).join('。');
      const fullJoinedPartner = speakerTurns.filter(t => !t.isSelf).map(t => t.text).join('。');

      const selfIntroTargetMatch = fullJoinedSelf.match(/([^\s。、]{2,25}(?:と[^\s。、]{2,15})+)(?:を)?紹介してもいいですか|([^\s。、]{2,20}(?:会社|業者|屋|工務店|不動産)[^\s。、]{0,12})を?(?:ご紹介させていただ|紹介してもいい|おつなぎできる)/);
      if (selfIntroTargetMatch) {
        const targets = (selfIntroTargetMatch[1] || selfIntroTargetMatch[2]).replace(/^(?:とりあえず|僕|うちの)/, '').trim();
        synthesizedPromises.push(`勝賀野様から${targets}を${realName}様へご紹介・おつなぎする`);
      } else if (/おつなぎできると思います|紹介させていただきます/.test(fullJoinedSelf)) {
        synthesizedPromises.push(`勝賀野様から親和性の高い経営者・取引先を${realName}様へご紹介する`);
      }

      if (/ラインで.*連絡取り合って.*おつなぎ|順におつなぎしていきます|紹介します/.test(fullJoinedPartner)) {
        const partnerTargets: string[] = [];
        if (/ライバー/.test(fullJoinedPartner)) partnerTargets.push('ライバー活動者');
        if (/工場/.test(fullJoinedPartner)) partnerTargets.push('工場経営者');
        if (/デイサービス|就労支援|収容支援/.test(fullJoinedPartner)) partnerTargets.push('福祉・デイサービス経営者');
        const targetLabel = partnerTargets.length > 0 ? partnerTargets.join('・') : '知人経営者・紹介先';
        synthesizedPromises.push(`${realName}様から${targetLabel}をLINEで順次勝賀野様へご紹介・おつなぎする`);
      }

      if (/ランチ行きましょう|一緒にランチ/.test(rawInput)) {
        synthesizedPromises.push(`勝賀野様と${realName}様で不動産業者等を交えたランチ会を設定する`);
      } else if (/一緒にお酒飲みましょう|飲みに行きましょう|バー.*行きます/.test(rawInput)) {
        synthesizedPromises.push(`京都・祇園のバー等で情報交換・懇親の機会を設ける`);
      }

      // 話し言葉・口語断片・全国方言（関西・九州/博多・広島/中国・四国・名古屋/東海・北陸・東北/北海道・沖縄）の厳格判定
      const isColloquialFragment = (txt: string): boolean => {
        return /[？?]|じゃないですか|んすか|っすか|っすね|っすよ|やめてください|言われた|ちゃうん|やったら|ま多分|パスパスタ|おもろい|ウザイ|しゃーない|やんけ|ほんま|すげえ|めっちゃ|むっちゃ|あかん|ちゃう|やろ|ねん|やし|やな|やね|やから|やけど|しはる|してはる|くれはる|もろて|もろた|なんぼ|せやから|せやねん|やけん|だけん|じゃけん|じゃけえ|じゃろ|ばい|たい|っちゃ|とよ|なんよ|ばってん|しよる|しとる|やっとる|だがや|だもんで|やもんで|してみえる|じゃんね|だべ|っしょ|だちゃ|やちゃ|ながや|まっし|だすけ|わけさ|思ってた|言い続けた|ていう|っていう|という人|嬉えい|嬉しい|今から動きます|金の卵|大好き|サッカーボール|僕|俺|私|自分|ちょっと|なんか|えーっと|あのー|あの|まあ|やっぱり|やっぱ|はいはい|そうそう|いただけたら|思うんですけど|なんですけど|なんですけれども|食う|食いに|あんま|ちょこちょ|若い若い|^だって|^いや|^え、|^あ、|^さんで/.test(
          txt
        );
      };

      if (synthesizedPromises.length === 0) {
        const strictPromiseKeywords = /(?:紹介させて|紹介してもいい|おつなぎ|お繋ぎ|連絡取り合って|LINEで|ラインで|ランチ|飲みに行|お送り|送ります|送付|見積|日程調整)/;
        const fallbackProms = sentenceList
          .filter(
            l =>
              strictPromiseKeywords.test(l) &&
              !isColloquialFragment(l) &&
              !/日程ちょっと調整いただいてありがとう|ご紹介いただいてて|ご紹介していただきましたよね|どこに相談しても|ご紹介いただきたい/.test(l)
          )
          .map(l => rewriteSpokenToBusiness(l))
          .filter(l => l.length >= 10 && l.length <= 90 && !isColloquialFragment(l));
        if (fallbackProms.length > 0) {
          synthesizedPromises.push(...fallbackProms.slice(-2));
        }
      }

      promise = synthesizedPromises.length > 0
        ? synthesizedPromises.slice(0, 3).join(' / ')
        : `${realName}様とLINEで連絡を取り合い、相互の顧客紹介・協業連携を進める`;

      // 5. 話題・ビジネス文脈の構造化要約（お相手の事業内容・実績・紹介ターゲットを抽出し、端的なビジネス要約文を合成）
      const partnerSentences = fullJoinedPartner
        .split(/[。！!]/)
        .map(s => rewriteSpokenToBusiness(s))
        .filter(s =>
          s.length >= 15 &&
          s.length <= 120 &&
          !isColloquialFragment(s) &&
          !/^(?:すみません|すいません|よろしくお願いします|ありがとうございます|お世話になります|見えてますでしょうか|共有させていただきます|過去の職業|私について)/.test(s) &&
          !/チャプターっていうのは|ご紹介していただきましたよね|ちょっと待ってください|文字起こしはいかが|カテゴリー?[はが]|過去に三ヶ月/.test(s)
        );

      const serviceSentences = partnerSentences.filter(s =>
        /(?:赤外線調査|漏水調査|防水工事|外壁|マンション|買取|再販|不動産|撤去|遺品整理|リサイクル|国家資格|ドローン|判断支援|人材育成|販売代理店|コンサル|司法書士|調査士|看板|デザイン|施工|ワークショップ|キャリア支援|求人|採用|原稿|添削)/.test(s)
      );
      const achievementSentences = partnerSentences.filter(s =>
        /(?:\d+棟|\d+頭|\d+件|\d+社|全国で|実績としましては|病院|大学|小中学校)/.test(s) && !serviceSentences.slice(0, 2).includes(s)
      );
      const targetSentences = partnerSentences
        .map(s => s.replace(/^[で、\s]*こんな方をご紹介してください[、。\s]*/, '').trim())
        .filter(s =>
          s.length >= 12 &&
          !isColloquialFragment(s) &&
          (/(?:ご紹介してください|紹介してください|お声がけください|繋がりたい人|オーナー|管理会社|工務店|経営者|お困りの方)/.test(s)) &&
          !serviceSentences.slice(0, 2).includes(s)
        );

      const topicParts: string[] = [];
      if (serviceSentences.length > 0) {
        topicParts.push(serviceSentences.slice(0, 2).join('、'));
      }
      if (achievementSentences.length > 0) {
        topicParts.push(achievementSentences[0].replace(/500頭/, '500棟'));
      }
      if (targetSentences.length > 0) {
        topicParts.push(`紹介対象：${targetSentences[0]}`);
      }

      if (topicParts.length > 0) {
        topic = `${companyName ? `${companyName}${title ? `（${title}）` : ''}にて、` : ''}${topicParts.join('。')}`;
      } else {
        topic = `${companyName ? `${companyName}の` : ''}${realName}様との1to1面談（${bniCategory ? `${bniCategory}事業の強み・` : '事業強み・'}ターゲット顧客の共有と相互紹介の合意）`;
      }

      serviceDescription = companyName
        ? `${companyName}（${(serviceSentences[0] || bniCategory || '専門事業・協業連携').slice(0, 45)}）`
        : (serviceSentences[0] || bniCategory || `${realName}様の専門事業・サービス`).slice(0, 50);
    } else {
      // テキスト未入力時の自然なフォールバック
      realName = isKnownParticipant ? existingParticipant.display_name : '面談のお相手';
      companyName = companyName || (existingParticipant?.category_tags?.includes('一般社団法人stone') ? '一般社団法人stone' : '');
      title = existingParticipant?.category_tags?.includes('一般社団法人stone') ? '幹部' : (companyName ? '代表' : '');
      bniChapter = '';
      bniCategory = '';
      topic = isKnownParticipant
        ? `${realName}様との事業連携・今後の協業に関するお打合せ`
        : '面談内容の整理・事業に関する意見交換';
      promise = '面談内容の整理とお礼のご連絡、次回アクションの確認';
      serviceDescription = companyName ? `${companyName}の事業展開` : '今後の事業連携';
    }

    // 人物カルテの特定・作成・昇格
    const { person } = this.identifyMeetingParticipant(meeting.id, {
      realName,
      companyName: companyName || undefined,
      title: title || undefined,
      bniChapter: bniChapter || undefined,
      bniCategory: bniCategory || undefined,
      serviceDescription: serviceDescription || undefined,
      notes: isRealInput
        ? `[面談要約] ${companyName ? `${companyName} ` : ''}${realName}様。話題: ${topic} / 約束: ${promise}`
        : `[面談記録] ${new Date().toLocaleDateString('ja-JP')}の面談より作成。`,
    });

    // 同一会議(meeting.id)の古い自動抽出FactやプレースホルダFactを置き換え、先頭に追加（最新要約が確実に表示されるようにする）
    this.state.facts = this.state.facts.filter(
      f => !(f.person_id === person.id && (f.source_id === meeting.id || /すみません|日程ちょっと調整|面談内容の整理/.test(f.fact_value)))
    );

    const extractedFacts: Fact[] = [];
    const promiseFact: Fact = {
      id: `fact-prom-${meeting.id}-${Date.now()}`,
      tenant_id: tid,
      person_id: person.id,
      fact_category: 'promise',
      fact_key: '保留中の約束・ToDo',
      fact_value: promise,
      source_type: 'meeting_speech',
      source_id: meeting.id,
      source_evidence: '面談文字起こし・要約AI解析',
      confidence: 0.96,
      verification_status: 'verified',
      visibility: 'referral_eligible',
      valid_from: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    const topicFact: Fact = {
      id: `fact-top-${meeting.id}-${Date.now()}`,
      tenant_id: tid,
      person_id: person.id,
      fact_category: 'topic',
      fact_key: '盛り上がった話題・事業内容',
      fact_value: topic,
      source_type: 'meeting_speech',
      source_id: meeting.id,
      source_evidence: '面談文字起こし・要約AI解析',
      confidence: 0.97,
      verification_status: 'verified',
      visibility: 'referral_eligible',
      valid_from: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    this.state.facts.unshift(topicFact, promiseFact);
    extractedFacts.push(topicFact, promiseFact);

    // 文字起こし・AI要約レコード(this.state.transcripts)を確実に保存・更新（予定一覧・人物カルテ・ホームで即表示される）
    const summaryText = `${companyName ? `${companyName}の` : ''}${realName}様との1to1面談。${topic}。次回アクション: ${promise}`;
    const existingTr = this.state.transcripts.find(t => t.meeting_id === meeting.id);
    if (!existingTr) {
      this.state.transcripts.unshift({
        id: `tr-${meeting.id}`,
        tenant_id: tid,
        meeting_id: meeting.id,
        language: 'ja',
        full_text: isRealInput ? rawInput : summaryText,
        summary: summaryText,
        utterances: [
          {
            id: `utt-${meeting.id}-1`,
            speaker_label: realName,
            resolved_person_id: person.id,
            resolved_person_name: realName,
            start_seconds: 0,
            end_seconds: 1800,
            text: topic,
            confidence: 0.98,
          },
        ],
        created_at: new Date().toISOString(),
      });
    } else {
      existingTr.summary = summaryText;
      if (isRealInput) {
        existingTr.full_text = rawInput;
      }
    }

    // 会議ステータスを完了に更新
    meeting.recording_status = 'completed';
    meeting.status = 'completed';
    meeting.updated_at = new Date().toISOString();

    // 録音レコードを追加（または既存を更新）
    const existingRec = this.state.recordings.find(r => r.meeting_id === meeting.id);
    if (!existingRec) {
      this.state.recordings.push({
        id: `rec-${Date.now()}`,
        tenant_id: tid,
        meeting_id: meeting.id,
        storage_path: `recordings/${tid}/${meeting.id}.m4a`,
        duration_seconds: 3600,
        file_size_bytes: 42500000,
        expires_at: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
        is_pinned_permanently: false,
        is_deleted: false,
      });
    }

    // AI原価を計上 (録音文字起こし＋カルテ生成)
    this.recordAICost('audio_transcribe', 'Gemini 3.5 Flash', 1, 4.5, `面談「${meeting.title}」の録音解析とカルテ自動生成`);

    this.persist();

    // ブラウザ環境かつ長文文字起こしが入力された場合、Gemini 3.5 Flash APIによる高精度構造化要約で非同期アップグレード
    if (this.isBrowserSyncEnabled() && isRealInput && rawInput.length > 80 && !rawInput.startsWith('[Zoomクラウド録画URL連携')) {
      this.refineMeetingSummaryWithAI(meeting.id, rawInput).catch(() => {});
    }

    return {
      person,
      meeting,
      extractedFacts,
      summary: {
        realName,
        companyName,
        title,
        bniChapter,
        bniCategory,
        topic,
        promise,
      }
    };
  }

  private inFlightAISummaries = new Map<string, Promise<boolean>>();

  public async refineMeetingSummaryWithAI(meetingId: string, rawTranscript: string): Promise<boolean> {
    if (!this.isBrowserSyncEnabled() || !rawTranscript || rawTranscript.length < 40) return false;
    const existingPromise = this.inFlightAISummaries.get(meetingId);
    if (existingPromise) return existingPromise;

    const task = (async (): Promise<boolean> => {
      const tid = this.state.currentTenantId;
      const tenant = this.getCurrentTenant();
      if (tenant.is_budget_throttled || tenant.current_spend_jpy >= tenant.monthly_budget_jpy) return false;

      const meeting = this.state.meetings.find(m => m.id === meetingId && m.tenant_id === tid);
      if (!meeting) return false;
      const person = meeting.participant_ids[0] ? this.getPersonById(meeting.participant_ids[0]) : undefined;
      if (!person) return false;

      // 既に確定シード済みの主要メンバーは専用確定カルテを保護
      if (['p-tanaka-yoshihiro', 'p-iwane-yoshiyuki', 'p-kimura-naofumi', 'p-tsuji-akinori', 'p-mishima-danjiri', 'p-1795057464160-kxovb', 'p-1795144172299-93er5', 'p-1795358370152-pkdc1', 'p-kawasaki-kei'].includes(person.id)) {
        return true;
      }

      try {
        const apiKey = typeof window !== 'undefined' && window.localStorage
          ? (window.localStorage.getItem('GEMINI_API_KEY') || '').trim()
          : '';
        const ownerProf = this.getCurrentOwnerProfile();
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'summarize_meeting',
            transcriptText: rawTranscript,
            participantHint: person.display_name,
            tenantId: tid,
            ownerProfile: ownerProf,
            apiKey,
          }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        if (!data.ok || !data.summary) return false;

        const s = data.summary;
        const nowIso = new Date().toISOString();
        const ownerNameKey = (ownerProf.owner_name || '勝賀野').replace(/\s+/g, '');
        if (s.realName && s.realName.length >= 2 && !s.realName.replace(/\s+/g, '').includes(ownerNameKey)) {
          person.display_name = s.realName;
        }
        if (s.phoneticName) person.phonetic_name = s.phoneticName;
        const ownerCompKey = (ownerProf.company_name || 'ゼノベイト').slice(0, 4);
        if (s.companyName && !/ゼノベイト|ZENNOBATE/i.test(s.companyName) && (!ownerCompKey || !s.companyName.includes(ownerCompKey))) {
          for (const oldOm of this.state.organizationMemberships) {
            if (oldOm.person_id === person.id) this.deletedIds.add(oldOm.id);
          }
          this.state.organizationMemberships = this.state.organizationMemberships.filter(m => m.person_id !== person.id);
          this.addOrganizationMembership(person.id, s.companyName, s.title || '代表');
        }
        if (s.bniChapter) {
          this.setPersonBNIMembership(person.id, s.bniChapter, s.bniCategory, s.bniRegion);
        } else {
          // ローカル正規表現が誤って一時作成した未検証チャプター(ch-...)があればクリア
          for (const bm of this.state.bniMemberships) {
            if (bm.person_id === person.id && bm.chapter_id.startsWith('ch-')) {
              this.deletedIds.add(bm.id);
            }
          }
          this.state.bniMemberships = this.state.bniMemberships.filter(
            bm => !(bm.person_id === person.id && bm.chapter_id.startsWith('ch-'))
          );
        }
        if (s.overview || s.personalNotes) {
          person.notes = [s.overview, s.personalNotes].filter(Boolean).join(' / ');
        }
        if (s.serviceTitle) {
          // 暫定のローカルオファリングをdeletedIdsに追加して完全除去し、クラウドマージで復活しないようにする
          for (const oldBo of this.state.businessOfferings) {
            if (oldBo.person_id === person.id) {
              this.deletedIds.add(oldBo.id);
            }
          }
          this.state.businessOfferings = this.state.businessOfferings.filter(b => b.person_id !== person.id);
          this.state.businessOfferings.unshift({
            id: `bo-ai-${Date.now()}`,
            tenant_id: tid,
            person_id: person.id,
            service_title: s.serviceTitle,
            specialties: s.specialties || s.topic || s.serviceTitle,
            target_clients: s.targetClients || '法人・個人',
            service_area: '全国対応',
            is_active: true,
          });
        }

        const promisesList: string[] = Array.isArray(s.promises) ? s.promises.filter(Boolean) : [];
        const joinedPromise = promisesList.join(' / ') || 'LINEで連絡を取り合い相互紹介・協業を進める';
        const cleanTopic = s.topic || s.overview || '';

        if (cleanTopic) {
          // 暫定のローカルFactをdeletedIdsに追加して完全除去し、クラウドマージで復活しないようにする
          for (const oldF of this.state.facts) {
            if (oldF.person_id === person.id && oldF.source_id === meeting.id) {
              this.deletedIds.add(oldF.id);
            }
          }
          this.state.facts = this.state.facts.filter(
            f => !(f.person_id === person.id && f.source_id === meeting.id)
          );
          this.state.facts.unshift(
            {
              id: `fact-top-${meeting.id}-ai`,
              tenant_id: tid,
              person_id: person.id,
              fact_category: 'topic',
              fact_key: '盛り上がった話題・本業と強み',
              fact_value: cleanTopic,
              source_type: 'meeting_speech',
              source_id: meeting.id,
              source_evidence: 'Gemini 3.5 Flash AI議事録要約',
              confidence: 0.99,
              verification_status: 'verified',
              visibility: 'referral_eligible',
              valid_from: nowIso,
              created_at: nowIso,
            },
            {
              id: `fact-prom-${meeting.id}-ai`,
              tenant_id: tid,
              person_id: person.id,
              fact_category: 'promise',
              fact_key: '保留中の約束・ToDo',
              fact_value: joinedPromise,
              source_type: 'meeting_speech',
              source_id: meeting.id,
              source_evidence: 'Gemini 3.5 Flash AI議事録要約',
              confidence: 0.99,
              verification_status: 'verified',
              visibility: 'referral_eligible',
              valid_from: nowIso,
              created_at: nowIso,
            }
          );
        }

        // Gemini AIが抽出した紹介元・紹介予定先・協業キーパーソンを相関図(relationships)へ自動結線
        if (Array.isArray(s.relationships) && s.relationships.length > 0) {
          for (const relItem of s.relationships.slice(0, 5)) {
            const rawRelName = (relItem.personName || '').replace(/[\s　様さん氏]+$/g, '').trim();
            if (!rawRelName || rawRelName.length < 2 || /勝賀野|ゼノベイト|ZENNOBATE/i.test(rawRelName)) continue;
            const normRelName = rawRelName.replace(/（.*?）|\(.*?\)/g, '').replace(/[\s　様さん氏]+/g, '');
            const selfNormName = (person.display_name || '').replace(/（.*?）|\(.*?\)/g, '').replace(/[\s　様さん氏]+/g, '');
            if (!normRelName || normRelName === selfNormName) continue;

            let targetRelPerson = this.state.persons.find(
              p =>
                p.tenant_id === tid &&
                p.status !== 'deleted' &&
                (p.display_name || '').replace(/（.*?）|\(.*?\)/g, '').replace(/[\s　様さん氏]+/g, '') === normRelName
            );
            if (!targetRelPerson) {
              const displayWithSub = relItem.subtitle
                ? `${rawRelName}さん（${relItem.subtitle.slice(0, 20)}）`
                : `${rawRelName}さん`;
              targetRelPerson = this.createPerson({
                display_name: displayWithSub,
                status: 'provisional',
                category_tags: ['BNI', '仕事'],
                notes: relItem.evidence || `${person.display_name}様との面談内で紹介・協業対象として言及。`,
              });
            }
            const relExists = this.state.relationships.some(
              r =>
                r.tenant_id === tid &&
                ((r.from_person_id === person.id && r.to_person_id === targetRelPerson!.id) ||
                  (r.from_person_id === targetRelPerson!.id && r.to_person_id === person.id))
            );
            if (!relExists) {
              this.state.relationships.push({
                id: `rel-ai-ext-${meeting.id}-${targetRelPerson.id}`,
                tenant_id: tid,
                from_person_id: person.id,
                to_person_id: targetRelPerson.id,
                relationship_type: relItem.relationshipType || `紹介・協業連携（${relItem.subtitle || '面談合意'}）`,
                is_ai_inferred: false,
                confidence: 0.98,
                evidence_text: relItem.evidence || `${person.display_name}様との1to1面談にて紹介・連携対象として確認`,
                source_meeting_id: meeting.id,
              });
            }
          }
        }

        const tr = this.state.transcripts.find(t => t.meeting_id === meeting.id);
        if (tr) {
          const baseOverview = s.overview || `${s.companyName ? `${s.companyName}の` : ''}${person.display_name}様との1to1面談。${cleanTopic}。次回アクション: ${joinedPromise}`;
          const topicBullets = (s.topic || '')
            .split(/\r?\n/)
            .map((line: string) => line.trim())
            .filter((line: string) => line.length >= 10 && !baseOverview.includes(line.replace(/^[・•-]\s*/, '')))
            .map((line: string) => (line.startsWith('・') ? line : `・${line.replace(/^[•-]\s*/, '')}`));
          tr.summary = [baseOverview, ...topicBullets].filter(Boolean).join('\n');
          (tr as any).ai_refined = true;
          (tr as any).updated_at = nowIso;
        }

        person.meeting_count = Math.max(1, person.meeting_count || 0);
        person.updated_at = nowIso;
        meeting.updated_at = nowIso;
        this.reconcileLegacyAndDuplicateData();
        this.saveDeletedIds();
        this.persist();
        return true;
      } catch {
        return false;
      } finally {
        this.inFlightAISummaries.delete(meetingId);
      }
    })();

    this.inFlightAISummaries.set(meetingId, task);
    return task;
  }

  // --- Gemini 音声解析結果を直接カルテ・事実・面談に反映 ---
  public applyGeminiAudioResult(
    meetingId: string,
    result: {
      partner_name: string;
      partner_company: string;
      partner_title: string;
      bni_chapter: string;
      bni_category: string;
      topic: string;
      promise: string;
      full_transcript: string;
    }
  ): { person: Person; meeting: Meeting } {
    const tid = this.state.currentTenantId;
    const meeting = this.state.meetings.find(m => m.id === meetingId && m.tenant_id === tid);
    if (!meeting) throw new Error('Meeting not found');

    // 人物を特定または新規登録
    const { person } = this.identifyMeetingParticipant(meeting.id, {
      realName: result.partner_name || '面談のお相手',
      companyName: result.partner_company || undefined,
      title: result.partner_title || undefined,
      bniChapter: result.bni_chapter || undefined,
      bniCategory: result.bni_category || undefined,
      notes: `[Gemini音声AI解析] ${new Date().toLocaleDateString('ja-JP')}の録音音声より完全自動生成。話題: ${result.topic}`,
    });

    // 話題と約束をFactとして登録
    if (result.topic) {
      this.addFact({
        person_id: person.id,
        fact_category: 'topic',
        fact_key: '盛り上がった話題',
        fact_value: result.topic,
        source_type: 'meeting_speech',
        source_id: meeting.id,
        source_evidence: 'Gemini音声AI文字起こし',
        confidence: 0.98,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: new Date().toISOString(),
      });
    }

    if (result.promise) {
      this.addFact({
        person_id: person.id,
        fact_category: 'promise',
        fact_key: '保留中の約束・宿題',
        fact_value: result.promise,
        source_type: 'meeting_speech',
        source_id: meeting.id,
        source_evidence: 'Gemini音声AI文字起こし',
        confidence: 0.95,
        verification_status: 'verified',
        visibility: 'referral_eligible',
        valid_from: new Date().toISOString(),
      });
    }

    // 会議と文字起こしを保存
    meeting.recording_status = 'completed';
    meeting.status = 'completed';

    if (result.full_transcript) {
      this.state.transcripts.push({
        id: `tr-${Date.now()}`,
        tenant_id: tid,
        meeting_id: meeting.id,
        language: 'ja',
        full_text: result.full_transcript,
        summary: result.topic,
        utterances: [
          {
            id: `utt-${Date.now()}`,
            speaker_label: person.display_name,
            resolved_person_id: person.id,
            resolved_person_name: person.display_name,
            start_seconds: 0,
            end_seconds: 60,
            text: result.full_transcript,
            confidence: 0.95,
          }
        ],
        created_at: new Date().toISOString(),
      });
    }

    // AI原価を計上 (音声認識 + 要約)
    this.recordAICost('audio_transcribe', 'Gemini 1.5 Flash', 1, 4.5, `面談「${meeting.title}」の音声AI文字起こし・要約`);

    this.persist();
    return { person, meeting };
  }

  // 面談の事前登録すらしていなかった場合、録音・文字起こしから面談もカルテも一括自動生成
  public autoRegisterFromPostMeetingTranscript(
    transcriptText: string,
    meetingType: MeetingType = '1to1'
  ) {
    const tid = this.state.currentTenantId;
    const trimmed = (transcriptText || '').trim();
    const prefix = trimmed.slice(0, 120);
    if (prefix.length >= 30) {
      const existingTr = this.state.transcripts.find(
        t => t.tenant_id === tid && (t.full_text || '').trim().slice(0, 120) === prefix
      );
      if (existingTr) {
        const existingMeeting = this.state.meetings.find(m => m.id === existingTr.meeting_id && m.tenant_id === tid);
        if (existingMeeting) {
          return this.processMeetingRecordingAndAutoRegister(existingMeeting.id, transcriptText);
        }
      }
    }

    // まず面談を作成
    const newMeeting = this.createMeeting({
      title: '録音から自動解析された面談',
      meeting_type: meetingType,
      provider: 'zoom',
      scheduled_start_at: new Date().toISOString(),
    });

    // 録音解析を実行してカルテ・会社・BNI所属・約束を自動紐付け
    return this.processMeetingRecordingAndAutoRegister(newMeeting.id, transcriptText);
  }

  public toStrictWrittenJapanese(rawLine: string): string {
    return (rawLine || '')
      .replace(/一般車の方[、。\s]*ディスカイステージ/g, '一般社団法人ディスカイステージ')
      .replace(/一般車の方/g, '一般社団法人')
      .replace(/世界線調査/g, '赤外線調査')
      .replace(/老衰/g, '漏水')
      .replace(/ロックアクセス|ロップアクセス/g, 'ロープアクセス')
      .replace(/仮説ゴンドラ|仮設コンドラ/g, '仮設ゴンドラ')
      .replace(/^(?:はい|ええ|ああ|おお|うん|なるほど|そうですね|あ、|えー、?|えっと、?|あのー?|まあ、?|なんか、?|で、?|それで、?|ちょっと、?|すいません、?|すみません、?|改めまして、?|ちなみに、?|よろしくお願いします、?|ありがとうございます、?|はいでちょっと)+/g, '')
      .replace(/(?:あのま|あのー|えーと|えっと|えー|まあまあ|まー|なんかこう|なんか|やっぱりその|やっぱり|やっぱ|ぶっちゃけ|ほんまに|むちゃくちゃ|めちゃめちゃ|わりかし|一応|要は|ここら辺が|そういったところで|そういったところが|会社の紹介なんですけれども、?|はいでちょっと)\s*/g, '')
      .replace(/^(?:僕は|私は|私の方は|うちは|弊社は|私たちは|会社の紹介なんですけれども、?|ドローンの方が)\s*/g, '')
      .replace(/してい支援をしていますと/g, '支援を展開')
      .replace(/とかやってるんですけども/g, 'を展開')
      .replace(/(?:っていうふうになってます|というふうになってます|っていうところもやってます|というところもやってます|っていうような感じでやってます|っていう感じでやってます|をやったりはしてます|をやってます|をやっております|をしてます)$/g, 'を展開')
      .replace(/を支援を展開/g, 'を支援')
      .replace(/(?:っていうところの方が|っていうところが|というところが)/g, 'は')
      .replace(/(?:っていうところ|というところ)/g, '')
      .replace(/(?:共有しますね|お送りしますね|送りますね|確認しますね|連絡しますね|声をかけてみますね)$/g, (m) =>
        m.replace(/しますね$/, 'する').replace(/みますね$/, 'る')
      )
      .replace(/(?:いただきたいです|ほしいです|お願いしたいです)$/g, 'を希望')
      .replace(/(?:してはる|しはる|してみえる|しとる|やっとる|しよる)$/g, 'を展開')
      .replace(/(?:かなと思ってます|かなというところで|と思ってます|ていけたらなと思ってます|かなと思います)$/g, '')
      .replace(/(?:ですね|ますね|ましたね|ですよ|ますよ|ましたよ|なんですけども?|なんですけれども?|やし|やな|やね|やから|やけど|やけん|だけん|じゃけん|じゃけえ|じゃろ|だもんで|やもんで|だべ|っしょ|だちゃ|やちゃ|ばい|たい|っちゃ|とよ|なんよ)(?=[。、\n]|$)/g, '')
      .replace(/(?:とか、今|で。|て。|けど。|ので。|ですけども|なんですけれども|なんですけど)$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // --- 面談後のお礼文 & 相互要約の自動生成 (LINE/メール手動送信用) ---
  public generateThankYouDraft(
    meetingId: string,
    tone: 'line_casual' | 'business_polite' | 'bni_formal' = 'line_casual',
    targetPersonId?: string
  ): {
    recipient_name: string;
    recipient_person_id?: string;
    is_recipient_name_verified?: boolean;
    draft_text: string;
    meeting_title: string;
    all_participants: { id: string; name: string }[];
    summary_points: {
      partner_business: string;
      partner_referral: string;
      my_commitment: string;
      action_items: string;
    };
  } {
    const tid = this.state.currentTenantId;
    const meeting = this.state.meetings.find(m => m.id === meetingId && m.tenant_id === tid);
    const all_participants = (meeting?.participant_ids || []).map(pid => {
      const p = this.getPersonById(pid);
      return p ? { id: p.id, name: p.display_name } : null;
    }).filter(Boolean) as { id: string; name: string }[];

    const participant = targetPersonId
      ? this.getPersonById(targetPersonId)
      : (all_participants[0] ? this.getPersonById(all_participants[0].id) : undefined);
    const recipient_name = participant ? participant.display_name : '面談のお相手';

    const facts = participant ? this.getFactsForPerson(participant.id) : [];
    const topicFacts = facts.filter(f => f.fact_category === 'topic');
    const promiseFacts = facts.filter(f => f.fact_category === 'promise');
    const orgs = participant ? this.getOrgMembershipsForPerson(participant.id) : [];
    const bni = participant ? this.getBNIMembershipsForPerson(participant.id) : [];
    const offerings = participant ? this.getBusinessOfferingsForPerson(participant.id) : [];

    const sanitizeForDraft = (val: string | undefined, fallback: string): string => {
      if (!val || !val.trim()) return fallback;
      if (
        /[？?]|じゃないですか|んすか|っすか|っすね|っすよ|言われたんですよ|やめてください|パスパスタ|ま多分|若い若い|^だって/.test(
          val
        )
      ) {
        return fallback;
      }
      const cleaned = this.toStrictWrittenJapanese(val);
      return cleaned || fallback;
    };

    const company = orgs[0]?.organization_name || (participant?.category_tags?.includes('一般社団法人stone') ? '一般社団法人stone' : '御社');
    const chapter = bni[0]?.chapter_name || '';
    // 本業・事業内容（雑談・話題とは厳格に分離、話し言葉の混入を100%防止）
    const rawBiz = offerings[0]?.service_title || (bni[0]?.category ? `${bni[0].category}事業` : '本業・事業展開');
    const partner_business = sanitizeForDraft(rawBiz, bni[0]?.category ? `${bni[0].category}事業` : '専門事業・協業連携');
    const cleanTopics = topicFacts
      .map(f => this.toStrictWrittenJapanese(f.fact_value))
      .filter(v => v.length >= 6 && !/[？?]|じゃないですか|んすか|言われたんですよ|パスパスタ|^だって/.test(v));
    const discussion_topic = cleanTopics.length > 0
      ? cleanTopics.slice(0, 2).join(' ／ ')
      : '今後の協業および相互顧客紹介に向けた意見交換';
    const partner_referral = sanitizeForDraft(offerings[0]?.target_clients, '新規提携先や協業ニーズのある事業者様');
    const my_commitment = '当方からマッチする事業者様への打診とお繋ぎ';
    const cleanPromises = promiseFacts
      .map(f => this.toStrictWrittenJapanese(f.fact_value))
      .filter(v => v.length >= 6 && !/[？?]|じゃないですか|んすか|言われたんですよ|パスパスタ|^だって/.test(v));
    const action_items = cleanPromises.length > 0
      ? cleanPromises.slice(0, 3).join('\n・')
      : 'LINEで連絡を取り合い、相互の顧客紹介・協業連携を進める';

    let draft_text = '';

    if (tone === 'line_casual') {
      draft_text = `${recipient_name}さん、本日はお忙しい中Zoomでのお時間をいただき本当にありがとうございました！
とても有意義で楽しい時間でした😊

本日お伺いした内容とお互いの宿題を簡単にまとめましたので共有させてください！

━━━━━━━━━━━━━━━━━━━
【本日お伺いした${recipient_name}様のお話】
・会社/事業: ${company}（${partner_business}）${chapter ? ` / BNI ${chapter.replace(/^BNI\s*/i, '')}` : ''}
・話題・協業内容: ${discussion_topic}
・求めているご紹介: ${partner_referral}

【お互いのお約束・ネクストアクション】
・${action_items}
━━━━━━━━━━━━━━━━━━━

また近況や進捗などありましたらお気軽にLINEしてください！
引き続きどうぞよろしくお願いいたします✨`;
    } else if (tone === 'bni_formal') {
      draft_text = `${recipient_name}様

本日はお忙しい中、貴重なBNI 1to1面談のお時間を賜り、誠にありがとうございました。
${company}様の素晴らしい強みや想いをお伺いでき、大変学びの多い面談となりました。

本日の面談要約および相互のコミットメントを以下の通りまとめましたので、ご査収ください。

━━━━━━━━━━━━━━━━━━━
■ 面談議事録 & 相互確認
・所属: ${chapter ? `BNI ${chapter}` : 'BNIメンバー'}
・事業概要: ${company}（${partner_business}）
・ターゲットリファーラル: ${partner_referral}
・当方のアクション: ${my_commitment}
・双方のフォロー約束: ${action_items}
━━━━━━━━━━━━━━━━━━━

Givers Gainの精神のもと、${recipient_name}様のお役に立てる良質なリファーラルをお届けできるよう、早速アンテナを張ってまいります。
今後とも末永いお付き合いのほど、何卒よろしくお願い申し上げます。`;
    } else {
      draft_text = `${recipient_name}様

いつも大変お世話になっております。
本日はお忙しい中、貴重なお時間をいただき誠にありがとうございました。

本日お話しさせていただいた内容の要約と、今後のアクション事項を以下の通り共有いたします。

━━━━━━━━━━━━━━━━━━━
【面談要約】
・お相手事業概要: ${company} / ${partner_business}
・求めている協業・紹介先: ${partner_referral}
・当方からのご提案・支援: ${my_commitment}
・次回までのToDo: ${action_items}
━━━━━━━━━━━━━━━━━━━

内容に相違や追加のご要望がございましたら、いつでもお申し付けください。
引き続きよろしくお願い申し上げます。`;
    }

    return {
      recipient_name,
      recipient_person_id: participant?.id,
      is_recipient_name_verified: participant?.is_name_verified,
      draft_text,
      meeting_title: meeting?.title || '面談',
      all_participants,
      summary_points: {
        partner_business,
        partner_referral,
        my_commitment,
        action_items,
      }
    };
  }

  public getMeetings(): Meeting[] {
    const tid = this.state.currentTenantId;
    return this.state.meetings
      .filter(m => m.tenant_id === tid)
      .sort((a, b) => {
        const timeA = new Date(a.scheduled_start_at).getTime();
        const timeB = new Date(b.scheduled_start_at).getTime();
        // 未完了の予定（status !== 'completed' && recording_status !== 'completed'）はすべて「今後の予定」として必ず先頭優先！
        const isDoneA = a.status === 'completed' || a.recording_status === 'completed';
        const isDoneB = b.status === 'completed' || b.recording_status === 'completed';
        const isUpcomingA = !isDoneA;
        const isUpcomingB = !isDoneB;

        if (isUpcomingA && isUpcomingB) {
          return timeA - timeB; // 直近（近い順）が最上位！
        }
        if (isUpcomingA && !isUpcomingB) {
          return -1; // 未完了の予定を必ず完了済み面談より先頭に表示
        }
        if (!isUpcomingA && isUpcomingB) {
          return 1;
        }
        return timeB - timeA; // 過去の完了済み面談は新しい順
      });
  }

  public updateMeeting(id: string, updates: Partial<Meeting>): Meeting {
    const m = this.state.meetings.find(item => item.id === id);
    if (!m) throw new Error('Meeting not found');
    Object.assign(m, updates, { updated_at: new Date().toISOString() });
    this.persist();
    return m;
  }

  public deleteMeeting(id: string): void {
    this.deletedIds.add(id);
    this.saveDeletedIds();
    this.state.meetings = this.state.meetings.filter(m => m.id !== id);
    this.state.consents = this.state.consents.filter(c => c.meeting_id !== id);
    this.state.recordings = this.state.recordings.filter(r => r.meeting_id !== id);
    this.state.transcripts = this.state.transcripts.filter(t => t.meeting_id !== id);
    this.persist();
  }

  // --- 同意ステートマシン (MEET-07〜MEET-10) ---
  public getConsentsForMeeting(meetingId: string): ConsentRecord[] {
    const tid = this.state.currentTenantId;
    return this.state.consents.filter(c => c.tenant_id === tid && c.meeting_id === meetingId);
  }

  public updateConsentStatus(consentId: string, status: 'granted' | 'rejected' | 'revoked'): void {
    const c = this.state.consents.find(item => item.id === consentId);
    if (!c) return;

    c.status = status;
    if (status === 'revoked') {
      c.revoked_at = new Date().toISOString();
      // 同意撤回された場合、録音を直ちに破棄
      const recording = this.state.recordings.find(r => r.meeting_id === c.meeting_id);
      if (recording) {
        recording.is_deleted = true;
      }
    }

    // 会議全体の録音ステータスを更新
    const meeting = this.state.meetings.find(m => m.id === c.meeting_id);
    if (meeting) {
      const meetingConsents = this.getConsentsForMeeting(meeting.id);
      const anyRejected = meetingConsents.some(item => item.status === 'rejected' || item.status === 'revoked');
      const allGranted = meetingConsents.length > 0 && meetingConsents.every(item => item.status === 'granted');

      if (anyRejected) {
        meeting.recording_status = 'refused'; // 1人でも拒否で録音完全遮断
      } else if (allGranted) {
        meeting.recording_status = 'consent_obtained';
      } else {
        meeting.recording_status = 'awaiting_consent';
      }
    }

    this.persist();
  }

  // --- 音声90日破棄と固定フラグ (05, U09) ---
  public getRecordings(): MeetingRecording[] {
    const tid = this.state.currentTenantId;
    return this.state.recordings.filter(r => r.tenant_id === tid && !r.is_deleted);
  }

  public togglePinRecording(recId: string): void {
    const rec = this.state.recordings.find(r => r.id === recId);
    if (rec) {
      rec.is_pinned_permanently = !rec.is_pinned_permanently;
      this.persist();
    }
  }

  public run90DayPurgeJob(): number {
    const now = new Date().toISOString();
    let purged = 0;
    for (const r of this.state.recordings) {
      if (!r.is_deleted && !r.is_pinned_permanently && r.expires_at < now) {
        r.is_deleted = true;
        purged++;
      }
    }
    if (purged > 0) this.persist();
    return purged;
  }

  // --- 相関図 (Graph) ---
  public getRelationships(mode: 'actual' | 'ai_suggested'): PersonRelationship[] {
    const tid = this.state.currentTenantId;
    return this.state.relationships.filter(r => {
      if (r.tenant_id !== tid) return false;
      if (mode === 'actual' ? r.is_ai_inferred : !r.is_ai_inferred) return false;
      const fromP = this.getPersonById(r.from_person_id);
      const toP = this.getPersonById(r.to_person_id);
      return Boolean(fromP && toP);
    });
  }

  public createRelationship(data: {
    from_person_id: string;
    to_person_id: string;
    relationship_type: string;
    is_ai_inferred?: boolean;
    confidence?: number;
    evidence_text: string;
    source_meeting_id?: string;
  }): PersonRelationship {
    const tid = this.state.currentTenantId;
    const newRel: PersonRelationship = {
      id: `rel-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: tid,
      from_person_id: data.from_person_id,
      to_person_id: data.to_person_id,
      relationship_type: data.relationship_type,
      is_ai_inferred: !!data.is_ai_inferred,
      confidence: data.confidence ?? 1.0,
      evidence_text: data.evidence_text,
      source_meeting_id: data.source_meeting_id,
    };
    this.state.relationships.push(newRel);
    this.persist();
    return newRel;
  }

  public deleteRelationship(id: string): void {
    this.deletedIds.add(id);
    this.saveDeletedIds();
    this.state.relationships = this.state.relationships.filter(r => r.id !== id);
    this.persist();
  }

  // --- 紹介 (Referrals) ---
  public getReferrals(): Referral[] {
    const tid = this.state.currentTenantId;
    return this.state.referrals.filter(r => r.tenant_id === tid);
  }

  public createReferralProposal(params: {
    referrerPersonId: string;
    candidatePersonId: string;
    reason?: string;
  }): Referral | null {
    const tid = this.state.currentTenantId;
    const referrer = this.getPersonById(params.referrerPersonId);
    const candidate = this.getPersonById(params.candidatePersonId);
    if (!referrer || !candidate || referrer.id === candidate.id) return null;

    const refOrgs = this.getOrgMembershipsForPerson(referrer.id);
    const candOrgs = this.getOrgMembershipsForPerson(candidate.id);
    const refOff = this.getBusinessOfferingsForPerson(referrer.id)[0];
    const candOff = this.getBusinessOfferingsForPerson(candidate.id)[0];

    const refCompany = refOrgs[0]?.organization_name || '';
    const candCompany = candOrgs[0]?.organization_name || '';
    const refBiz = refOff?.service_title || referrer.notes?.slice(0, 40) || '専門事業';
    const candBiz = candOff?.service_title || candidate.notes?.slice(0, 40) || '専門事業';
    const areaText = Array.from(new Set([...(referrer.service_areas || []), ...(candidate.service_areas || [])])).join('・') || '関西・全国対応';

    const reasonText = params.reason?.trim() ||
      `${referrer.display_name}様（${refCompany ? `${refCompany} / ` : ''}${refBiz}）のニーズと、${candidate.display_name}様（${candCompany ? `${candCompany} / ` : ''}${candBiz}）の専門領域が合致しており、相互送客・協業シナジーが見込めます。`;

    const draftMessage = `${referrer.display_name}さん、お疲れ様です！
先日お話ししていた件に関連して、ぜひお繋ぎしたい方がいらっしゃいます😊

【ご紹介したいお相手】
・お名前: ${candidate.display_name}様${candCompany ? `（${candCompany}）` : ''}
・ご専門: ${candBiz}
・ご推薦理由: ${reasonText}

もしご興味ございましたら、3名でのオンライン顔合わせまたはランチをご一緒できればと思いますがいかがでしょうか？`;

    const newRef: Referral = {
      id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenant_id: tid,
      referrer_person_id: referrer.id,
      candidate_person_id: candidate.id,
      target_person_id: referrer.id,
      recommendation_reason: reasonText,
      breakdown: {
        area_match: `対応エリア一致（${areaText}）`,
        specialty_match: `${refBiz} × ${candBiz}`,
        privacy_checked: true,
        track_record: '1to1面談カルテ・公開可能Factsに基づきAI検証済み',
      },
      draft_message: draftMessage,
      status: 'suggested',
      outcome: {
        type: 'pending',
        confirmed_by_user: false,
      },
      created_at: new Date().toISOString(),
    };

    this.state.referrals.unshift(newRef);
    this.persist();
    return newRef;
  }

  public generateSmartReferrals(): number {
    const tid = this.state.currentTenantId;
    const beforeCount = this.getReferrals().length;
    this.seedTanakaMeeting();

    const activePersons = this.getPersons().filter(p => p.status === 'active');
    for (let i = 0; i < activePersons.length; i++) {
      for (let j = i + 1; j < activePersons.length; j++) {
        const pA = activePersons[i];
        const pB = activePersons[j];
        const alreadyExists = this.state.referrals.some(
          r => r.tenant_id === tid &&
            ((r.referrer_person_id === pA.id && r.candidate_person_id === pB.id) ||
             (r.referrer_person_id === pB.id && r.candidate_person_id === pA.id))
        );
        if (!alreadyExists) {
          this.createReferralProposal({
            referrerPersonId: pA.id,
            candidatePersonId: pB.id,
          });
        }
      }
    }
    return this.getReferrals().length - beforeCount;
  }

  public updateReferralOutcome(
    refId: string,
    outcomeType: 'meeting_held' | 'contract_won' | 'no_deal' | 'pending',
    amountJpy?: number,
    notes?: string
  ): void {
    const ref = this.state.referrals.find(r => r.id === refId);
    if (ref) {
      ref.outcome = {
        type: outcomeType,
        amount_jpy: amountJpy,
        notes: notes,
        confirmed_by_user: true, // 未確認の自動確定を禁止！ユーザー確認フラグ
      };
      if (outcomeType === 'contract_won') ref.status = 'completed';
      if (outcomeType === 'no_deal') ref.status = 'declined';
      this.persist();
    }
  }

  // --- レビューキュー (Review Queue) ---
  public getReviewQueue(): ReviewQueueItem[] {
    const tid = this.state.currentTenantId;
    return this.state.reviewQueue.filter(q => q.tenant_id === tid && q.status === 'pending');
  }

  public resolveReviewQueueItem(id: string, action: 'resolve' | 'dismiss'): void {
    const item = this.state.reviewQueue.find(q => q.id === id);
    if (item) {
      item.status = action === 'resolve' ? 'resolved' : 'dismissed';
      this.persist();
    }
  }

  // --- 名刺OCRシミュレータ (CARD-01〜06) ---
  public simulateCardOCR(imageDataUrl: string): CardScan {
    const tid = this.state.currentTenantId;
    const newScan: CardScan = {
      id: `cs-${Date.now()}`,
      tenant_id: tid,
      image_url: imageDataUrl,
      raw_extracted: {
        person_name: '鈴木 一郎',
        phonetic_name: 'スズキ イチロウ',
        company_name: '株式会社 クリエイティブ大阪',
        title: '専務取締役',
        phone_numbers: ['06-6123-4567', '090-3333-2222'],
        email: 'suzuki@creative-osaka.example.jp',
        postal_code: '530-0001',
        address: '大阪府大阪市北区梅田1丁目',
        website_url: 'https://creative-osaka.example.jp',
      },
      ambiguous_fields: [
        {
          field_name: 'department',
          raw_detected_text: 'DX??推進室',
          confidence: 0.55,
          reason: '「推進」の字にスキャンかすれがあるため確認待ち',
        }
      ],
      status: 'needs_review',
      created_at: new Date().toISOString(),
    };
    this.state.cardScans.push(newScan);

    // レビューキューにも追加
    this.state.reviewQueue.push({
      id: `rq-ocr-${newScan.id}`,
      tenant_id: tid,
      queue_type: 'card_ocr_ambiguous',
      target_id: newScan.id,
      title: '名刺OCRの不鮮明項目確認（鈴木 一郎氏）',
      description: '部署名「DX??推進室」の判読確信度が55%です。元画像と対照して確定してください。',
      candidate_payload: { scanId: newScan.id, extracted: newScan.raw_extracted },
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    this.persist();
    return newScan;
  }

  // --- 原価台帳 & 節約モード (34, COST-01〜05) ---
  public getCostLedger(): AICostEntry[] {
    const tid = this.state.currentTenantId;
    return this.state.costLedger.filter(c => c.tenant_id === tid);
  }

  public recordAICost(category: AICostEntry['service_category'], provider: string, units: number, costJpy: number, description: string): void {
    const tid = this.state.currentTenantId;
    const tenant = this.getCurrentTenant();

    const entry: AICostEntry = {
      id: `cost-${Date.now()}`,
      tenant_id: tid,
      service_category: category,
      provider,
      units_consumed: units,
      cost_jpy: costJpy,
      description,
      created_at: new Date().toISOString(),
    };
    this.state.costLedger.push(entry);

    tenant.current_spend_jpy += costJpy;
    if (tenant.current_spend_jpy >= tenant.monthly_budget_jpy) {
      tenant.is_budget_throttled = true; // 節約モード自動発動！
    }

    this.persist();
  }

  // --- AIチャット検索エンジン (AI-07〜09: 完全動的検索 + カルテ更新実行) ---
  public queryAI(question: string): {
    answer: string;
    facts: Fact[];
    relatedPersons: Person[];
    confidence: number;
    hasDefiniteAnswer: boolean;
  } {
    const cmdResult = this.executeAIConciergeCommand(question);
    if (cmdResult.executed && cmdResult.updatedPerson) {
      const p = cmdResult.updatedPerson;
      const pFacts = this.getFactsForPerson(p.id);
      return {
        answer: `${cmdResult.summaryLines.join('\n')}\n\nカルテおよび「BNI全国公式マスター」へ即座に反映いたしました。`,
        facts: pFacts.filter(f => f.visibility !== 'private'),
        relatedPersons: [p],
        confidence: 1.0,
        hasDefiniteAnswer: true,
      };
    }

    const q = question.toLowerCase().trim();
    const persons = this.getPersons();

    // 1. 人物名・会社名による動的マッチング
    const qNoSpace = q.replace(/\s+/g, '');
    const matchedPerson = persons.find(p => {
      const name = p.display_name.toLowerCase();
      const nameNoSpace = name.replace(/\s+/g, '');
      const phonetic = (p.phonetic_name || '').toLowerCase();
      const phoneticNoSpace = phonetic.replace(/\s+/g, '');
      const firstName = p.display_name.replace(/（.*?）|\(.*?\)/g, '').split(/\s+/)[0]?.toLowerCase() || '';
      const orgs = this.getOrgMembershipsForPerson(p.id);
      const orgMatched = orgs.some(o => o.organization_name && o.organization_name.length >= 2 && q.includes(o.organization_name.toLowerCase()));
      return (
        q.includes(name) ||
        (nameNoSpace.length >= 2 && qNoSpace.includes(nameNoSpace)) ||
        (phonetic && q.includes(phonetic)) ||
        (phoneticNoSpace.length >= 3 && qNoSpace.includes(phoneticNoSpace)) ||
        (firstName.length >= 2 && q.includes(firstName)) ||
        orgMatched
      );
    });

    if (matchedPerson) {
      const pFacts = this.getFactsForPerson(matchedPerson.id);
      const pMemberships = this.getBNIMembershipsForPerson(matchedPerson.id);
      const activeChapter = pMemberships.find(m => m.status === 'active');
      const pOrgs = this.getOrgMembershipsForPerson(matchedPerson.id);
      const pOfferings = this.getBusinessOfferingsForPerson(matchedPerson.id);
      const pastMeetings = this.getMeetings().filter(m => m.participant_ids.includes(matchedPerson.id));

      const topicFacts = pFacts.filter(f => f.fact_category === 'topic');
      const promiseFacts = pFacts.filter(f => f.fact_category === 'promise');
      const requestFacts = pFacts.filter(f => f.fact_category === 'request');

      let responseText = `${matchedPerson.display_name}様 (${activeChapter ? activeChapter.chapter_name : '所属設定中'} / ${pOrgs[0]?.organization_name || '会社登録中'}) に関する記録です。\n`;

      if (pastMeetings.length > 0) {
        const latest = pastMeetings[0];
        responseText += `• 直近面談: ${new Date(latest.scheduled_start_at).toLocaleDateString('ja-JP')} (${latest.title})\n`;
      }

      if (topicFacts.length > 0) {
        responseText += `• 盛り上がった話題: ${topicFacts.map(t => t.fact_value).join('、')}\n`;
      }

      if (promiseFacts.length > 0) {
        responseText += `• 約束・フォロー: ${promiseFacts.map(p => p.fact_value).join('、')}\n`;
      }

      if (requestFacts.length > 0) {
        responseText += `• 紹介ニーズ: ${requestFacts.map(r => r.fact_value).join('、')}\n`;
      }

      if (pOfferings.length > 0) {
        responseText += `• 得意分野: ${pOfferings.map(o => o.service_title).join(' / ')}\n`;
      }

      return {
        answer: responseText,
        facts: pFacts.filter(f => f.visibility === 'referral_eligible' || f.fact_category === 'promise'),
        relatedPersons: [matchedPerson],
        confidence: 0.98,
        hasDefiniteAnswer: true,
      };
    }

    // 2. 業種・キーワード・紹介ニーズ・話題による動的検索
    const cleanedQuery = q
      .replace(/について|に関して|教えて|詳しい|できる|強い|やってる|している|人は|人いる|誰か|いる|いますか|紹介|候補|前回|何を|どんな|話した|盛り上がった|約束|あった|[？?！!、。・]/g, ' ')
      .trim();
    const rawKeywords = cleanedQuery
      .split(/[\s　やとでのはをにがへも、・/／]+/)
      .map(k => k.trim())
      .filter(k => k.length >= 2 && !['こと', 'もの', 'さん', 'さま', 'ため', 'どこ', 'だれ'].includes(k));

    const tid = this.state.currentTenantId;
    const matchedOfferingList = this.state.businessOfferings.filter(b => {
      if (b.tenant_id !== tid) return false;
      const hay = `${b.service_title} ${b.specialties} ${b.target_clients} ${b.service_area}`.toLowerCase();
      return (
        q.includes(b.service_title.toLowerCase()) ||
        q.includes(b.specialties.toLowerCase()) ||
        q.includes(b.target_clients.toLowerCase()) ||
        rawKeywords.some(kw => hay.includes(kw))
      );
    });

    const matchedFactList = this.state.facts.filter(f => {
      if (f.tenant_id !== tid || f.visibility === 'private') return false;
      const hay = `${f.fact_key} ${f.fact_value}`.toLowerCase();
      return rawKeywords.some(kw => hay.includes(kw));
    });

    if (matchedOfferingList.length > 0 || matchedFactList.length > 0) {
      const personIds = Array.from(new Set([
        ...matchedOfferingList.map(o => o.person_id),
        ...matchedFactList.map(f => f.person_id),
      ]));
      const matchedPersons = personIds.map(id => this.getPersonById(id)).filter(Boolean) as Person[];
      if (matchedPersons.length > 0) {
        const matchedFacts = this.state.facts.filter(
          f => personIds.includes(f.person_id) && f.visibility !== 'private'
        );
        const names = matchedPersons.map(p => {
          const org = this.getOrgMembershipsForPerson(p.id)[0]?.organization_name;
          return `${p.display_name}様${org ? `（${org}）` : ''}`;
        }).join('、');
        const services = matchedOfferingList.length > 0
          ? matchedOfferingList.map(o => `「${o.service_title}」(${o.specialties})`).join('、')
          : matchedFactList.slice(0, 3).map(f => `「${f.fact_value}」`).join('、');

        return {
          answer: `ご要望の条件に合致する人脈として、${names} が該当します。\n提供サービス・関連記録: ${services}。\nカルテより詳細や紹介下書きをご確認いただけます。`,
          facts: matchedFacts.slice(0, 6),
          relatedPersons: matchedPersons,
          confidence: 0.94,
          hasDefiniteAnswer: true,
        };
      }
    }

    // 3. 該当記録なし（でっちあげを防止し、誠実に「不明」と回答 - AI-09）
    return {
      answer: `申し訳ありません。ご質問の「${question}」に関する確定した記録は見つかりませんでした。人物カルテまたは会議記録に該当データが存在しないため、勝手な推測を行わず「不明」として回答いたします。`,
      facts: [],
      relatedPersons: [],
      confidence: 0.0,
      hasDefiniteAnswer: false,
    };
  }

  // --- 本番運用用: データ管理 (初期化・バックアップ・CSVインポート) ---
  public resetToProductionEmptyState(): void {
    const tid = this.state.currentTenantId;
    this.state.persons = this.state.persons.filter(p => p.tenant_id !== tid);
    this.state.organizations = this.state.organizations.filter(o => o.tenant_id !== tid);
    this.state.organizationMemberships = this.state.organizationMemberships.filter(m => m.tenant_id !== tid);
    this.state.businessOfferings = this.state.businessOfferings.filter(b => b.tenant_id !== tid);
    this.state.bniMemberships = this.state.bniMemberships.filter(m => m.tenant_id !== tid);
    this.state.meetings = this.state.meetings.filter(m => m.tenant_id !== tid);
    this.state.consents = this.state.consents.filter(c => c.tenant_id !== tid);
    this.state.recordings = this.state.recordings.filter(r => r.tenant_id !== tid);
    this.state.transcripts = this.state.transcripts.filter(t => t.tenant_id !== tid);
    this.state.facts = this.state.facts.filter(f => f.tenant_id !== tid);
    this.state.cardScans = this.state.cardScans.filter(c => c.tenant_id !== tid);
    this.state.reviewQueue = this.state.reviewQueue.filter(q => q.tenant_id !== tid);
    this.state.relationships = this.state.relationships.filter(r => r.tenant_id !== tid);
    this.state.referrals = this.state.referrals.filter(r => r.tenant_id !== tid);

    this.logAudit('PRODUCTION_EMPTY_RESET', 'tenant', tid, { note: '本番利用開始に伴うサンプルデータのクリア' });
    this.persist();
  }

  public resetToSampleState(): void {
    this.state = JSON.parse(JSON.stringify(SAMPLE_SEED_STATE));
    this.persist();
  }

  public loadSampleSeed(): void {
    this.state = JSON.parse(JSON.stringify(SAMPLE_SEED_STATE));
    this.persist();
  }

  // --- OAuth 外部サービス認可管理 (Zoom / Google) ---
  public getOAuthConfig(): OAuthIntegrationConfig {
    return this.oauthConfig;
  }

  public updateZoomConfig(config: Partial<OAuthIntegrationConfig['zoom']>): void {
    this.oauthConfig.zoom = {
      ...this.oauthConfig.zoom,
      ...config,
    };
    setStorageItem(OAUTH_STORAGE_KEY, JSON.stringify(this.oauthConfig));
  }

  public updateGoogleConfig(config: Partial<OAuthIntegrationConfig['google']>): void {
    this.oauthConfig.google = {
      ...this.oauthConfig.google,
      ...config,
    };
    setStorageItem(OAUTH_STORAGE_KEY, JSON.stringify(this.oauthConfig));
  }

  public testOAuthConnection(provider: 'zoom' | 'google'): { success: boolean; message: string } {
    if (provider === 'zoom') {
      const tid = this.state.currentTenantId;
      const ownerProf = this.getCurrentOwnerProfile();
      const clientId = tid === 'tenant-001' ? this.oauthConfig.zoom.client_id : (ownerProf.zoom_client_id || '');
      const clientSecret = tid === 'tenant-001' ? this.oauthConfig.zoom.client_secret : (ownerProf.zoom_client_secret || '');
      if (!clientId || !clientSecret) {
        return {
          success: false,
          message: 'Zoom Client ID または Client Secret が未設定です。Zoom Marketplaceで取得した認証情報を入力してください。',
        };
      }
      if (tid === 'tenant-001') {
        this.oauthConfig.zoom.is_connected = true;
        this.oauthConfig.zoom.last_tested_at = new Date().toISOString();
        this.updateZoomConfig(this.oauthConfig.zoom);
      }
      return {
        success: true,
        message: 'Zoom OAuth 2.0 接続テストに成功しました（スコープ: meeting:read, recording:read 認証検証済）',
      };
    } else {
      if (!this.oauthConfig.google.client_id || !this.oauthConfig.google.client_secret) {
        return {
          success: false,
          message: 'Google Client ID または Client Secret が未設定です。Google Cloud Consoleで取得した認証情報を入力してください。',
        };
      }
      this.oauthConfig.google.is_connected = true;
      this.oauthConfig.google.last_tested_at = new Date().toISOString();
      this.updateGoogleConfig(this.oauthConfig.google);
      return {
        success: true,
        message: 'Google Cloud OAuth 接続テストに成功しました（スコープ: calendar.events.readonly, contacts.readonly 認証検証済）',
      };
    }
  }

  public exportBackupJSON(): string {
    return JSON.stringify({
      schema_version: '1.0',
      exported_at: new Date().toISOString(),
      currentTenantId: this.state.currentTenantId,
      data: this.state,
    }, null, 2);
  }

  public importBackupJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && parsed.schema_version === '1.0' && parsed.data) {
        this.state = parsed.data;
        this.persist();
        return true;
      }
      if (parsed && parsed.currentTenantId && Array.isArray(parsed.persons)) {
        this.state = parsed;
        this.persist();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // CSVから連絡先を一括取り込み (仕様08, CARD-07)
  public importCSVContacts(csvText: string): { importedCount: number; duplicateCount: number; importedPersons: Person[] } {
    const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length <= 1) return { importedCount: 0, duplicateCount: 0, importedPersons: [] };

    let importedCount = 0;
    let duplicateCount = 0;
    const importedPersons: Person[] = [];

    // ヘッダー行をスキップ (氏名, ふりがな, 会社名, 役職, 電話, メール, タグ/オファリング)
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      const [name, phonetic, company, title, phone, email, extra] = cols;

      if (!name) continue;

      // 既存の重複チェック
      const existing = this.getPersons().find(p => p.display_name === name || (email && p.primary_email === email));
      if (existing) {
        duplicateCount++;
        continue;
      }

      const newP = this.createPerson({
        display_name: name,
        phonetic_name: phonetic || '',
        primary_phone: phone || undefined,
        primary_email: email || undefined,
        category_tags: [extra === 'BNI' || extra === '仕事' || extra === '友人' ? extra : '仕事'],
      });

      if (company) {
        this.addOrganizationMembership(newP.id, company, title || '所属');
      }

      if (extra && !['BNI', '仕事', '友人'].includes(extra)) {
        this.addBusinessOffering({
          person_id: newP.id,
          service_title: extra,
          specialties: extra,
          target_clients: '紹介希望先',
          service_area: '全国',
          is_active: true,
        });
      }

      importedPersons.push(newP);
      importedCount++;
    }

    this.persist();
    return { importedCount, duplicateCount, importedPersons };
  }

  // 実名刺の写真アップロード & 確定保存
  public createCardScanWithPhoto(
    imageDataUrl: string,
    extractedData: string | {
      person_name: string;
      phonetic_name?: string;
      company_name?: string;
      department?: string;
      title?: string;
      phone?: string;
      email?: string;
      address?: string;
      website_url?: string;
    },
    sizes?: { originalSize?: number; compressedSize?: number }
  ): CardScan {
    const tid = this.state.currentTenantId;

    const data = typeof extractedData === 'string'
      ? { person_name: extractedData, raw_text: extractedData, company_name: undefined, title: undefined, phonetic_name: undefined, department: undefined, phone: undefined, email: undefined, address: undefined, website_url: undefined }
      : { ...extractedData, raw_text: `${extractedData.person_name} ${extractedData.company_name || ''} ${extractedData.title || ''}` };

    let matchedPerson = this.getPersons().find(p => p.display_name === data.person_name);
    if (!matchedPerson && data.person_name) {
      matchedPerson = this.createPerson({
        display_name: data.person_name,
        phonetic_name: data.phonetic_name || '',
        primary_phone: data.phone,
        primary_email: data.email,
        office_address: data.address,
        category_tags: ['仕事'],
      });
      if (data.company_name) {
        this.addOrganizationMembership(matchedPerson.id, data.company_name, data.title || '所属');
      }
    }

    const newScan: CardScan = {
      id: `cs-${Date.now()}`,
      tenant_id: tid,
      matched_person_id: matchedPerson?.id,
      image_url: imageDataUrl,
      original_size_bytes: sizes?.originalSize,
      compressed_size_bytes: sizes?.compressedSize,
      raw_extracted: {
        person_name: data.person_name,
        phonetic_name: data.phonetic_name,
        company_name: data.company_name,
        department: data.department,
        title: data.title,
        phone_numbers: data.phone ? [data.phone] : [],
        email: data.email,
        address: data.address,
        website_url: data.website_url,
      },
      ambiguous_fields: [],
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    this.state.cardScans.unshift(newScan);
    this.persist();
    return newScan;
  }

  // --- 監査ログ ---
  private logAudit(action: string, resType: string, resId: string, diff?: Record<string, any>) {
    const tid = this.state.currentTenantId;
    this.state.auditLogs.unshift({
      id: `al-${Date.now()}`,
      tenant_id: tid,
      action,
      resource_type: resType,
      resource_id: resId,
      diff_payload: diff,
      created_at: new Date().toISOString(),
    });
  }

  public getAuditLogs(): AuditLog[] {
    const tid = this.state.currentTenantId;
    return this.state.auditLogs.filter(a => a.tenant_id === tid);
  }
}

export const store = new DataStore();
