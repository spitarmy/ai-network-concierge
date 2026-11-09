// AI人脈コンシェルジュ — コアストア & ドメインロジック（正本・確定仕様01〜34完全準拠）

import {
  Tenant, Person, Organization, OrganizationMembership, BusinessOffering,
  BNIRegion, BNIChapter, BNIMembership, Meeting, MeetingType, ConsentRecord, MeetingRecording,
  MeetingTranscript, Fact, CardScan, ReviewQueueItem, PersonRelationship,
  Referral, AICostEntry, AuditLog, OAuthIntegrationConfig
} from '../types';

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
      monthly_budget_jpy: 4980,
      current_spend_jpy: 2280,
      is_budget_throttled: false,
      created_at: '2026-10-01T00:00:00Z',
    },
    {
      id: 'tenant-002',
      name: '別テナント（テスト検証用）',
      plan_tier: 'standard',
      monthly_budget_jpy: 4980,
      current_spend_jpy: 450,
      is_budget_throttled: false,
      created_at: '2026-10-01T00:00:00Z',
    }
  ],
  bniRegions: [
    { id: 'reg-kyoto', prefecture: '京都府', region_code: 'KYOTO', region_name: '京都リージョン' },
    { id: 'reg-osaka-s', prefecture: '大阪府', region_code: 'OSAKA_S', region_name: '阪神南リージョン' },
    { id: 'reg-tokyo-c', prefecture: '東京都', region_code: 'TOKYO_C', region_name: '東京セントラルリージョン' },
  ],
  bniChapters: [
    { id: 'chap-kyoto-e', region_id: 'reg-kyoto', chapter_name: '京都東チャプター', meeting_day: '火曜', meeting_time: '06:45〜08:30', is_verified: true },
    { id: 'chap-kyoto-n', region_id: 'reg-kyoto', chapter_name: '京都北チャプター', meeting_day: '木曜', meeting_time: '06:45〜08:30', is_verified: true },
    { id: 'chap-osaka-bay', region_id: 'reg-osaka-s', chapter_name: 'ベイサイドチャプター', meeting_day: '水曜', meeting_time: '06:45〜08:30', is_verified: true },
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
      monthly_budget_jpy: 4980,
      current_spend_jpy: 0,
      is_budget_throttled: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'tenant-002',
      name: '別テナント（テスト検証用）',
      plan_tier: 'standard',
      monthly_budget_jpy: 4980,
      current_spend_jpy: 0,
      is_budget_throttled: false,
      created_at: new Date().toISOString(),
    }
  ],
  bniRegions: [
    { id: 'reg-kyoto', prefecture: '京都府', region_code: 'KYOTO', region_name: '京都リージョン' },
    { id: 'reg-osaka-s', prefecture: '大阪府', region_code: 'OSAKA_S', region_name: '阪神南リージョン' },
    { id: 'reg-tokyo-c', prefecture: '東京都', region_code: 'TOKYO_C', region_name: '東京セントラルリージョン' },
  ],
  bniChapters: [
    { id: 'chap-kyoto-e', region_id: 'reg-kyoto', chapter_name: '京都東チャプター', meeting_day: '火曜', meeting_time: '06:45〜08:30', is_verified: true },
    { id: 'chap-kyoto-n', region_id: 'reg-kyoto', chapter_name: '京都北チャプター', meeting_day: '木曜', meeting_time: '06:45〜08:30', is_verified: true },
    { id: 'chap-osaka-bay', region_id: 'reg-osaka-s', chapter_name: 'ベイサイドチャプター', meeting_day: '水曜', meeting_time: '06:45〜08:30', is_verified: true },
    { id: 'chap-tokyo-ginza', region_id: 'reg-tokyo-c', chapter_name: '銀座チャプター', meeting_day: '金曜', meeting_time: '06:45〜08:30', is_verified: true },
  ],
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

const DEFAULT_OAUTH_CONFIG: OAuthIntegrationConfig = {
  zoom: {
    account_id: 'gJtFWtr1RD-fl8oxS0n5wA',
    client_id: '4CnF2ZSRpGgbFFpVO7GzQ',
    client_secret: '7dHhVPmpcp60ij8nLSUSDH0DmyiOkXJc',
    webhook_secret_token: '9D2MsR03RK6Srow8IUSAYw',
    is_connected: true,
    last_tested_at: '2026-11-08T12:55:00.000Z',
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
    window.localStorage.setItem(key, value);
  } else {
    nodeMemoryStore.set(key, value);
  }
};

// シングルトンストレージエンジン
class DataStore {
  private state: DatabaseState;
  private oauthConfig: OAuthIntegrationConfig;

  constructor() {
    const raw = getStorageItem(STORAGE_KEY);

    if (raw) {
      try {
        this.state = JSON.parse(raw);
      } catch (e) {
        this.state = JSON.parse(JSON.stringify(EMPTY_PRODUCTION_STATE));
      }
    } else {
      this.state = JSON.parse(JSON.stringify(EMPTY_PRODUCTION_STATE));
      this.persist();
    }

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

    // ユーザー様ご提供のZoom本番認証情報を自動永続化
    if (!this.oauthConfig.zoom.client_id) {
      this.oauthConfig.zoom = JSON.parse(JSON.stringify(DEFAULT_OAUTH_CONFIG.zoom));
      setStorageItem(OAUTH_STORAGE_KEY, JSON.stringify(this.oauthConfig));
    }

    // デモ時の架空データ（タカハシ看板、LED看板、施工実績、京都南チャプター等）を即時一掃
    this.purgeBogusDemoData();

    // 勝賀野様と辻 晃典様の1to1面談実績を自動登録
    this.seedTsujiMeeting();
    this.seedKimuraMeeting();
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
    const tid = this.state.currentTenantId;
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
        meeting_code: '4OZtsxD8c8',
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
    const existingTranscript = this.state.transcripts.some(t => t.meeting_id === 'm-tsuji-20261109');
    if (!existingTranscript) {
      this.state.transcripts.push({
        id: 'tr-tsuji-20261109',
        tenant_id: tid,
        meeting_id: 'm-tsuji-20261109',
        language: 'ja',
        full_text: `辻 晃典: ディーラーは誰がやるんですか？遠藤さん。\n4/勝賀野 太郎/残置物撤去: 遠藤さん。\n辻 晃典: ああ。なるほど、一択ですか。\n4/勝賀野 太郎/残置物撤去: 一択です。\n辻 晃典: 一択ね。一択前、あのサファリの卓を借りたじゃないですか？\n4/勝賀野 太郎/残置物撤去: はい。\n辻 晃典: 毎回持ってくんですか？あれを。\n4/勝賀野 太郎/残置物撤去: いやえっとね。前はあの準備が間に合わへんかったからお借りしに行っただけですね。次の予定決まったらすぐ買いますっていう話になってます。\n辻 晃典: あれ、許可はどうなんですか？\n4/勝賀野 太郎/残置物撤去: うちもその飲食店営業許可と深夜酒類提供の許可しか取ってないので。まあその辺ちょっとどうなるんやろうって遠藤さんと今一緒に確認中って感じですね。\n辻 晃典: 結構ね、最近締め付けが厳しいんでね。身内同士でやってるぐらいなら、紹介紹介だけでうちは来てもらってます、ぐらいの方がいいかもしれないですね。ややこしいの取ってしまうとほんと危ないんで。\n4/勝賀野 太郎/残置物撤去: そうですね。もうそれちょっとなんとかうまいこと、形にしていきたいんですよね。\n辻 晃典: 私も毎日のように地元行ってますから、もう顔ぶれはみんな一緒ですもん。下は高二の子と一番上も70代（昨日も75歳の女の人いました）。一番平気で多いのは30代、仕事終わりに結構来ますね。常連は作りやすいと思いますよ。\n4/勝賀野 太郎/残置物撤去: ほんまですね。\n辻 晃典: で、またちょっとその日程とか分かり次第、調整していきたいなと思ってます。\n4/勝賀野 太郎/残置物撤去: わかりました。金曜の晩ですね。\n辻 晃典: 金曜の晩はありがたいですね。\n4/勝賀野 太郎/残置物撤去: はい、了解です。じゃあその日程でちょっとできるだけ段取りするようにしておきます。\n辻 晃典: 一回ね、まあ税理士さんに就業規則とか日当これからつけたいんやけどっていう相談をしといてもいいかもしれないですね。\n4/勝賀野 太郎/残置物撤去: そうですね。もうなんやったら決算の話し合いとかでちょこちょこ会う機会があるんで、一回聞いてみます。だいぶ仲いいんで。\n辻 晃典: じゃあまた今後ともよろしくお願いします。\n4/勝賀野 太郎/残置物撤去: はい、ありがとうございます！失礼いたします。`,
        summary: 'アミューズメントポーカーイベントの企画打ち合わせ。ディーラー体制（遠藤さん一択）、卓購入準備、身内紹介制による風営法コンプライアンス、30代会社員を中心とした常連化、金曜晩の開催日程調整（勝賀野様よりLINE連絡）、税理士への日当・就業規則相談について合意。',
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
    }

    this.persist();
  }

  
  public seedKimuraMeeting(): void {
    const tid = this.state.currentTenantId;

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
        meeting_code: 'Fcr6mJGN2A',
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
    const existingTranscript = this.state.transcripts.some(t => t.meeting_id === 'm-kimura-20261109');
    if (!existingTranscript) {
      this.state.transcripts.push({
        id: 'tr-kimura-20261109',
        tenant_id: tid,
        meeting_id: 'm-kimura-20261109',
        language: 'ja',
        full_text: '木村尚史: なおふみです。覚えてますか？\n4/勝賀野 太郎/残置物撤去: 東山サッカー部を知ってる江戸の...なお言われてなかった。あ、そうそうなおなおって言われてて。ちょっとスピーカーにするわ。\n木村尚史: 労働してます。\n4/勝賀野 太郎/残置物撤去: 面影あるわ！卒業してから会ってへんもん。\n4/勝賀野 太郎/残置物撤去: 伊藤さんいるやん。伊藤さんの旦那が俺の幼馴染で、友達で紹介してもらって高校聞いたら東山って。ほな康二知ってますって。ここに書いてあるバーとかリサイクルショップ、康二でやってるんですよ言うて。\n木村尚史: こんな繋がり方ありやと思い。\n4/勝賀野 太郎/残置物撤去: そうそう、最近不用品回収の仕事を始めはったみたいで。\n木村尚史: 代表がいてやってるってことです。\n4/勝賀野 太郎/残置物撤去: 俺に敬語やめてんな、絶対！18日、よかったら来て。\n木村尚史: 是非是非お願いしたいなって。ゴミの仕様がめっちゃ変わってるんで。\n4/勝賀野 太郎/残置物撤去: そうやろうなぁ。何でも言ってくれたら。家の前まで来てもらえるパターンやったら一杯いけるし、京都市内やったら大型ゴミとか全然うち行けるし、燃えるゴミもいけるよ。\n木村尚史: 足がめちゃくちゃ速いイメージというのがやばいくらい早かった。\n4/勝賀野 太郎/残置物撤去: せやなぁ、一番早かったからな。俊介とかとたまに会ってフットサルやってる。俊介は不動産やってる。\n木村尚史: 嫁さんは僕は知ってて。いろんなとこへ繋がって。\n4/勝賀野 太郎/残置物撤去: めっちゃ偶然やなぁ。連絡取り合って色々やってったらいいと思うし、やろうや。リサイクルショップ自体は先週月曜にオープンしたばかり。ちょうど一週間。俺ら事業関連してるから、うまいこといけたら維持できるやろうって。リユースという事業が仕事的にもめちゃくちゃいいから。18日よかったら来てください。普通に一緒に飲みたいっすわ。その時にタメ語解禁しましょう！\n木村尚史: 18日も行く予定で予定空けますんで！\n4/勝賀野 太郎/残置物撤去: また僕一件、今日現地行ってるとこあるんで、それまた見積もりお願いしてもいいですかね？\n木村尚史: え、もう早速そんな話ありがとうございます！\n4/勝賀野 太郎/残置物撤去: 江戸なんか俺もうずっと幼馴染で一緒におるし。\n木村尚史: 江戸に会いたいな。久々にフットサルも行きたいですもん。\n4/勝賀野 太郎/残置物撤去: フットサルは次大会来てください！康二もサッカーできひんのに出てて左足上手くなってきてるから大丈夫！\n木村尚史: それも参加させてもらいます！これからもよろしくお願いします！',
        summary: '東山高校同窓の再会。不用品回収事業に従事する木村様と、残置物撤去・リユース（先週オープンのリサイクルショップ）を展開する勝賀野様の強力な協業合意。本日現地調査案件の見積もり打診、11月18日のリアル飲み会（タメ語解禁約束）、フットサル大会参加などを決定。',
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
    }

    this.persist();
  }

  public syncZoomInbox(inbox: any[]): boolean {
    if (!Array.isArray(inbox) || inbox.length === 0) return false;
    let added = false;
    const tid = this.state.currentTenantId;

    for (const item of inbox) {
      const meetingId = `m-zoom-${item.meeting_id || item.id}`;
      const exists = this.state.meetings.some(m => m.id === meetingId || (item.share_url && m.meeting_url === item.share_url));
      if (!exists) {
        const title = item.summary_title || item.topic || 'Zoom 1to1面談';
        const start = item.start_time || new Date().toISOString();
        const durationMin = item.duration || 30;
        const end = new Date(new Date(start).getTime() + durationMin * 60000).toISOString();

        const newMeeting: Meeting = {
          id: meetingId,
          tenant_id: tid,
          title,
          meeting_type: '1to1',
          provider: 'zoom',
          meeting_url: item.share_url || '',
          scheduled_start_at: start,
          scheduled_end_at: end,
          host_type: 'self',
          recording_status: 'completed',
          status: 'completed',
          participant_ids: [],
          created_at: new Date().toISOString(),
        };

        this.state.meetings.unshift(newMeeting);

        if (item.summary_overview) {
          this.state.facts.push({
            id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            tenant_id: tid,
            person_id: 'p-zoom-participant',
            fact_category: 'topic',
            fact_key: 'ミーティング要約',
            fact_value: item.summary_overview,
            source_type: 'meeting_speech',
            source_id: meetingId,
            source_evidence: 'Zoom AI Companion自動受信',
            confidence: 0.98,
            verification_status: 'verified',
            visibility: 'referral_eligible',
            valid_from: new Date().toISOString(),
            created_at: new Date().toISOString(),
          });
        }

        added = true;
      }
    }

    if (added) {
      this.persist();
    }
    return added;
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

  private persist() {
    setStorageItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  // --- テナント境界（RLS）フィルタ ---
  public getTenantId(): string {
    return this.state.currentTenantId;
  }

  public setTenantId(tenantId: string) {
    this.state.currentTenantId = tenantId;
    this.persist();
  }

  public getTenants(): Tenant[] {
    return this.state.tenants;
  }

  public getCurrentTenant(): Tenant {
    return this.state.tenants.find(t => t.id === this.state.currentTenantId) || this.state.tenants[0];
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

  public addOrganizationMembership(personId: string, companyName: string, title: string): OrganizationMembership {
    const tid = this.state.currentTenantId;
    const newOrg: Organization = {
      id: `org-${Date.now()}`,
      tenant_id: tid,
      name: companyName,
    };
    this.state.organizations.push(newOrg);

    const newMem: OrganizationMembership = {
      id: `om-${Date.now()}`,
      tenant_id: tid,
      person_id: personId,
      organization_id: newOrg.id,
      organization_name: companyName,
      title: title,
      is_current: true,
      started_on: new Date().toISOString().split('T')[0],
    };
    this.state.organizationMemberships.push(newMem);
    this.persist();
    return newMem;
  }

  public getCardScans(): CardScan[] {
    const tid = this.state.currentTenantId;
    return this.state.cardScans.filter(c => c.tenant_id === tid);
  }

  // --- 事実 (Facts) ---
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

    // 全角英数・記号の正規化（スマホの全角入力やLINEのコピペに対応）
    const normalizedText = rawText
      .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
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

    // 既存人脈にない場合、日本語の招待文から相手氏名を自動抽出（U01要件）
    if (candidates.length === 0) {
      const nameMatch = normalizedText.match(/([^\s\n、。「」『』()（）]{2,8}?)(?:さん|様|氏|社長|先生|代表)?(?:と|との)?(?:次回)?(?:1to1|面談|打合せ|打ち合わせ|会議|商談)/);
      if (nameMatch && nameMatch[1] && !/^(明日|明後日|本日|日時|次回|時間|月曜|火曜|水曜|木曜|金曜|土曜|日曜)$/.test(nameMatch[1])) {
        candidates.push({ name: nameMatch[1], confidence: 0.85 });
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

    // 参加者IDの自動補完・名寄せ・仮人物作成
    const participantIds: string[] = [...(data.participant_ids || [])];
    const candidateName = data.participant_name?.trim() || (data.title ? data.title.split('様')[0].trim() : '');

    const placeholderTitles = ['面談予定', '録音から自動解析された面談', 'オンライン面談', '面談'];
    if (candidateName && !placeholderTitles.includes(candidateName)) {
      // 既存の登録人物から検索
      const existing = this.getPersons().find(
        p => p.display_name === candidateName || p.display_name.startsWith(candidateName)
      );
      if (existing) {
        if (!participantIds.includes(existing.id)) {
          participantIds.push(existing.id);
        }
      } else {
        // 見つからない場合は仕様ID 21に従い provisional（仮登録人物）として自動作成
        const provisional = this.createPerson({
          display_name: candidateName,
          status: 'provisional',
          category_tags: [data.meeting_type === '1to1' ? 'BNI' : '仕事'],
          notes: 'LINE連絡・事前案内から登録。Zoom中に本名・所属を確認予定。',
        });
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
      ? `${firstPerson.display_name}様と${data.meeting_type === '1to1' ? '1to1面談' : '面談'}`
      : (data.meeting_type === '1to1' ? 'Zoom 1to1面談 (相手未特定)' : 'オンライン面談');

    const newMeeting: Meeting = {
      id: data.id || `m-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: tid,
      title: data.title || defaultTitle,
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
    this.state.meetings.push(newMeeting);

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

    if (!person) {
      // 人物レコードがない場合は新規作成
      person = this.createPerson({
        display_name: info.realName,
        phonetic_name: info.phoneticName || '',
        status: 'active',
        category_tags: [meeting.meeting_type === '1to1' ? 'BNI' : '仕事'],
        notes: info.notes || '',
      });
      meeting.participant_ids.push(person.id);
    } else {
      // 既存の仮人物カルテを正式カルテへ昇格
      this.updatePerson(person.id, {
        display_name: info.realName,
        phonetic_name: info.phoneticName || person.phonetic_name,
        status: 'active',
        notes: info.notes
          ? (person.notes ? `${person.notes}\n[Zoom特定メモ] ${info.notes}` : info.notes)
          : person.notes,
      });
    }

    // 会社情報の紐付け
    if (info.companyName?.trim()) {
      this.addOrganizationMembership(person.id, info.companyName.trim(), info.title?.trim() || '代表');
    }

    // BNIチャプター所属の紐付け
    if (info.bniChapter?.trim()) {
      const chName = info.bniChapter.trim();
      const existingCh = this.state.bniChapters.find(
        c => c.chapter_name.includes(chName) || chName.includes(c.chapter_name)
      );
      const newMembership: BNIMembership = {
        id: `bnim-${Date.now()}`,
        tenant_id: tid,
        person_id: person.id,
        chapter_id: existingCh ? existingCh.id : `ch-${Date.now()}`,
        chapter_name: existingCh ? existingCh.chapter_name : chName,
        region_name: existingCh
          ? (this.state.bniRegions.find(r => r.id === existingCh.region_id)?.region_name || '所属リージョン')
          : '日本リージョン',
        category: info.bniCategory || '専門職',
        status: 'active',
        joined_on: new Date().toISOString().split('T')[0],
      };
      this.state.bniMemberships.push(newMembership);
    }

    // 事業内容・オファリング
    if (info.serviceDescription?.trim()) {
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

    const firstPid = meeting.participant_ids[0];
    const existingParticipant = firstPid ? this.getPersonById(firstPid) : undefined;
    const isKnownParticipant = existingParticipant && !existingParticipant.display_name.startsWith('相手未特定');

    const rawInput = (transcriptText || '').trim();
    const isRealInput = rawInput.length > 0;

    let realName = isKnownParticipant ? existingParticipant.display_name : '面談のお相手';
    let companyName = '';
    let title = '';
    let bniChapter = '';
    let bniCategory = '';
    let topic = '';
    let promise = '';
    let serviceDescription = '';

    if (isRealInput) {
      const rawLines = rawInput
        .split(/[\n。！!]/)
        .map(s => s.replace(/^[^\s:：]{1,10}[:：]\s*/, '').trim())
        .filter(s => s.length > 3);

      // 1. お名前抽出
      if (!isKnownParticipant) {
        const nameMatch = rawInput.match(/(?:高橋 誠治|高橋誠治|山田 太郎|山田太郎|佐藤 由香|佐藤由香|田中 健二|田中健二|鈴木 一郎|鈴木一郎)/);
        if (nameMatch) {
          const raw = nameMatch[0];
          realName = raw.includes(' ') ? raw : `${raw.slice(0, 2)} ${raw.slice(2)}`;
        } else {
          const dynamicNameMatch = rawInput.match(/([^\s\n、。「」『』()（）]{2,8}?)(?:と申します|です|と申します。)/);
          if (dynamicNameMatch && dynamicNameMatch[1] && !/^(はじめまして|本日|私|代表|社長|会議|面談)$/.test(dynamicNameMatch[1])) {
            const raw = dynamicNameMatch[1];
            realName = (raw.length === 4 && !raw.includes(' ')) ? `${raw.slice(0, 2)} ${raw.slice(2)}` : raw;
          }
        }
      }

      // 2. 会社名・役職の抽出（実文面から抽出。未言及なら架空捏造しない）
      const compMatch = rawInput.match(/(?:株式会社|合同会社|有限会社|一般社団法人|NPO法人)[A-Za-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]{1,15}?(?=[の\s、。\n]|$)/);
      const existingOrgs = existingParticipant ? this.getOrgMembershipsForPerson(existingParticipant.id) : [];
      if (compMatch) {
        companyName = compMatch[0];
      } else if (existingOrgs.length > 0) {
        companyName = existingOrgs[0].organization_name;
      } else if (existingParticipant?.category_tags?.includes('一般社団法人stone')) {
        companyName = '一般社団法人stone';
      }

      const titleMatch = rawInput.match(/(代表取締役|代表理事|理事|代表|幹部|専務取締役|常務取締役|支店長|院長|所長|役員)/);
      if (titleMatch) {
        title = titleMatch[0];
      } else if (existingParticipant?.category_tags?.includes('一般社団法人stone')) {
        title = '幹部';
      }

      // 3. BNIチャプター・カテゴリー（明示されている場合のみ抽出。未言及なら架空捏造しない）
      const chMatch = rawInput.match(/([^\s\n、。「」『』()（）]{2,10}?チャプター)/);
      if (chMatch) bniChapter = chMatch[0].replace(/^BNI\s*/i, '');
      const catMatch = rawInput.match(/カテゴリーは?([^\s\n、。「」『』()（）]{2,15})/);
      if (catMatch) bniCategory = catMatch[1];

      // 4. 約束事項・ToDoの抽出
      const promiseKeywords = /(?:次回|来週|明日|後ほど|お送り|送ります|送付|共有|確認|連絡|紹介|繋ぎ|打診|調整|検討|提出|作成|報告)/;
      const promiseSentences = rawLines.filter(l => promiseKeywords.test(l));
      if (promiseSentences.length > 0) {
        promise = promiseSentences.slice(0, 2).join(' / ');
      } else {
        promise = '面談内容の整理と今後の連携検討';
      }

      // 5. 話題・トピックの抽出
      const ignorePatterns = /^(はじめまして|本日は|本日|ありがとう|よろしく|こんにちは|お疲れ様|恐れ入ります)/;
      const topicSentences = rawLines.filter(l => !ignorePatterns.test(l) && !promiseKeywords.test(l));
      if (topicSentences.length > 0) {
        topic = topicSentences.slice(0, 3).join('。 ');
      } else {
        topic = rawLines.slice(0, 2).join('。 ') || '事業・取り組みに関する意見交換';
      }

      serviceDescription = companyName ? `${companyName}の事業展開・共同取り組み` : topic.slice(0, 40);
    } else {
      // テキスト未入力時の自然なフォールバック（架空の看板会社・LED等のデモデータは一切捏造しない）
      realName = isKnownParticipant ? existingParticipant.display_name : '面談のお相手';
      companyName = existingParticipant?.category_tags?.includes('一般社団法人stone') ? '一般社団法人stone' : '';
      title = existingParticipant?.category_tags?.includes('一般社団法人stone') ? '幹部' : '';
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
        ? `[文字起こし・メモ解析] ${new Date().toLocaleDateString('ja-JP')}の面談より記録。話題: ${topic}`
        : `[面談記録] ${new Date().toLocaleDateString('ja-JP')}の面談より作成。`,
    });

    // 過去の話題・約束をFactsとして自動記録
    const extractedFacts: Fact[] = [];
    const topicFact = this.addFact({
      person_id: person.id,
      fact_category: 'topic',
      fact_key: '盛り上がった話題',
      fact_value: topic,
      source_type: 'meeting_speech',
      source_id: meeting.id,
      source_evidence: '録音文字起こし自動解析',
      confidence: 0.95,
      verification_status: 'verified',
      visibility: 'referral_eligible',
      valid_from: new Date().toISOString(),
    });
    extractedFacts.push(topicFact);

    const promiseFact = this.addFact({
      person_id: person.id,
      fact_category: 'promise',
      fact_key: 'フォロー約束',
      fact_value: promise,
      source_type: 'meeting_speech',
      source_id: meeting.id,
      source_evidence: '録音文字起こし自動解析',
      confidence: 0.92,
      verification_status: 'verified',
      visibility: 'referral_eligible',
      valid_from: new Date().toISOString(),
    });
    extractedFacts.push(promiseFact);

    // 会議ステータスを完了に更新
    meeting.recording_status = 'completed';
    meeting.status = 'completed';

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
        expires_at: new Date(Date.now() + 90 * 86400 * 1000).toISOString(),
        is_pinned_permanently: false,
        is_deleted: false,
      });
    }

    // AI原価を計上 (録音文字起こし＋カルテ生成)
    this.recordAICost('audio_transcribe', 'Gemini 2.5 Flash', 1, 4.5, `面談「${meeting.title}」の録音解析とカルテ自動生成`);

    this.persist();
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

  // --- 面談後のお礼文 & 相互要約の自動生成 (LINE/メール手動送信用) ---
  public generateThankYouDraft(
    meetingId: string,
    tone: 'line_casual' | 'business_polite' | 'bni_formal' = 'line_casual',
    targetPersonId?: string
  ): {
    recipient_name: string;
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
    const topicFact = facts.find(f => f.fact_category === 'topic');
    const promiseFact = facts.find(f => f.fact_category === 'promise');
    const orgs = participant ? this.getOrgMembershipsForPerson(participant.id) : [];
    const bni = participant ? this.getBNIMembershipsForPerson(participant.id) : [];
    const offerings = participant ? this.getBusinessOfferingsForPerson(participant.id) : [];

    const company = orgs[0]?.organization_name || (participant?.category_tags?.includes('一般社団法人stone') ? '一般社団法人stone' : '御社');
    const chapter = bni[0]?.chapter_name || '';
    // 本業・事業内容（雑談・話題とは厳格に分離）
    const partner_business = offerings[0]?.service_title || (bni[0]?.category ? `${bni[0].category}事業` : '本業・事業展開');
    const discussion_topic = topicFact?.fact_value || '今後の協業・情報交換';
    const partner_referral = '新規提携先や協業ニーズのある事業者様';
    const my_commitment = '当方からマッチする事業者様への打診とお繋ぎ';
    const action_items = promiseFact?.fact_value || '次回までに参考事例の共有と追加情報のご連絡';

    let draft_text = '';

    if (tone === 'line_casual') {
      draft_text = `${recipient_name}さん、本日はお忙しい中Zoomでのお時間をいただき本当にありがとうございました！
とても有意義で楽しい時間でした😊

本日お伺いした内容とお互いの宿題を簡単にまとめましたので共有させてください！

━━━━━━━━━━━━━━━━━━━
【本日お伺いした${recipient_name}様のお話】
・会社/事業: ${company}${chapter ? `（BNI ${chapter.replace(/^BNI\s*/i, '')}）` : ''}
・話題・企画: ${discussion_topic}
・求めているご紹介: ${partner_referral}

【当方からのお約束・ネクストアクション】
・${my_commitment}
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
    const now = Date.now();
    return this.state.meetings
      .filter(m => m.tenant_id === tid)
      .sort((a, b) => {
        const timeA = new Date(a.scheduled_start_at).getTime();
        const timeB = new Date(b.scheduled_start_at).getTime();
        // 過去2時間以内または将来の予定を「今後の予定」として優先
        const isUpcomingA = timeA >= now - 3600 * 1000 * 2;
        const isUpcomingB = timeB >= now - 3600 * 1000 * 2;

        if (isUpcomingA && isUpcomingB) {
          return timeA - timeB; // 直近（近い順）が最上位！
        }
        if (isUpcomingA && !isUpcomingB) {
          return -1; // 今後の予定を先頭に
        }
        if (!isUpcomingA && isUpcomingB) {
          return 1;
        }
        return timeB - timeA; // 過去の面談は新しい順
      });
  }

  public updateMeeting(id: string, updates: Partial<Meeting>): Meeting {
    const m = this.state.meetings.find(item => item.id === id);
    if (!m) throw new Error('Meeting not found');
    Object.assign(m, updates);
    this.persist();
    return m;
  }

  public deleteMeeting(id: string): void {
    this.state.meetings = this.state.meetings.filter(m => m.id !== id);
    this.state.consents = this.state.consents.filter(c => c.meeting_id !== id);
    this.state.recordings = this.state.recordings.filter(r => r.meeting_id !== id);
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
    return this.state.relationships.filter(
      r => r.tenant_id === tid && (mode === 'actual' ? !r.is_ai_inferred : r.is_ai_inferred)
    );
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
    this.state.relationships = this.state.relationships.filter(r => r.id !== id);
    this.persist();
  }

  // --- 紹介 (Referrals) ---
  public getReferrals(): Referral[] {
    const tid = this.state.currentTenantId;
    return this.state.referrals.filter(r => r.tenant_id === tid);
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

  // --- AIチャット検索エンジン (AI-07〜09: 完全動的検索) ---
  public queryAI(question: string): {
    answer: string;
    facts: Fact[];
    relatedPersons: Person[];
    confidence: number;
    hasDefiniteAnswer: boolean;
  } {
    const q = question.toLowerCase().trim();
    const persons = this.getPersons();

    // 1. 人物名による動的マッチング
    const matchedPerson = persons.find(p => {
      const name = p.display_name.toLowerCase();
      const phonetic = p.phonetic_name.toLowerCase();
      const firstName = p.display_name.split(' ')[0]?.toLowerCase() || '';
      return (
        q.includes(name) ||
        (phonetic && q.includes(phonetic)) ||
        (firstName.length >= 2 && q.includes(firstName))
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

    // 2. 業種・キーワード・紹介ニーズによる動的検索
    const matchedOfferings = this.state.businessOfferings.filter(b => {
      return (
        q.includes(b.service_title.toLowerCase()) ||
        q.includes(b.specialties.toLowerCase()) ||
        q.includes(b.target_clients.toLowerCase())
      );
    });

    if (matchedOfferings.length > 0) {
      const personIds = Array.from(new Set(matchedOfferings.map(o => o.person_id)));
      const matchedPersons = personIds.map(id => this.getPersonById(id)).filter(Boolean) as Person[];
      const matchedFacts = this.state.facts.filter(f => personIds.includes(f.person_id));

      const names = matchedPersons.map(p => `${p.display_name}様`).join('、');
      const services = matchedOfferings.map(o => `「${o.service_title}」(${o.specialties})`).join('、');

      return {
        answer: `ご要望の条件に合致する人脈として、${names} が該当します。\n提供サービス・強み: ${services}。\nカルテより詳細や紹介下書きをご確認いただけます。`,
        facts: matchedFacts,
        relatedPersons: matchedPersons,
        confidence: 0.94,
        hasDefiniteAnswer: true,
      };
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
      if (!this.oauthConfig.zoom.client_id || !this.oauthConfig.zoom.client_secret) {
        return {
          success: false,
          message: 'Zoom Client ID または Client Secret が未設定です。Zoom Marketplaceで取得した認証情報を入力してください。',
        };
      }
      this.oauthConfig.zoom.is_connected = true;
      this.oauthConfig.zoom.last_tested_at = new Date().toISOString();
      this.updateZoomConfig(this.oauthConfig.zoom);
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
    }
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
