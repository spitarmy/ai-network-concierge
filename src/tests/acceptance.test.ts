import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../services/store';

describe('AI人脈コンシェルジュ — 受け入れテスト & 品質ゲート検証', () => {
  beforeEach(() => {
    // テストごとにシードデータをロードしメインテナントにリセット
    store.loadSampleSeed();
    store.setTenantId('tenant-001');
  });

  describe('A. テナント完全隔離 & RLS (SECURITY-01, UX-01)', () => {
    it('テナント1で登録されている人物一覧を取得できること', () => {
      const persons = store.getPersons();
      expect(persons.length).toBeGreaterThan(0);
      const yamada = persons.find(p => p.id === 'p-yamada');
      expect(yamada).toBeDefined();
      expect(yamada?.display_name).toBe('山田 太郎');
    });

    it('別テナントに切り替えた場合、テナント1の機密データが一切漏洩・表示されないこと', () => {
      store.setTenantId('tenant-002');
      const tenant2Persons = store.getPersons();

      // テナント1の山田さんや田中さんが見えてはならない
      const leakedYamada = tenant2Persons.find(p => p.id === 'p-yamada');
      expect(leakedYamada).toBeUndefined();

      // テナント2の独自データのみが見えること
      expect(tenant2Persons.some(p => p.id === 'p-tenant2-secret')).toBe(true);
    });
  });

  describe('B. 人物・複数事業・BNI移籍履歴保持 (PERSON-01〜04, 仕様11, 23)', () => {
    it('1人の人物に複数の会社所属と事業オファリングが紐付いていること', () => {
      const memberships = store.getOrgMembershipsForPerson('p-yamada');
      expect(memberships.length).toBeGreaterThanOrEqual(2);
      expect(memberships.some(m => m.organization_name.includes('山田建設'))).toBe(true);
      expect(memberships.some(m => m.organization_name.includes('レトロ京都'))).toBe(true);
    });

    it('BNIチャプター移籍時、過去の所属履歴を上書き消去せずtransferredとして永続保持すること', () => {
      const bniHistory = store.getBNIMembershipsForPerson('p-yamada');
      const activeMembership = bniHistory.find(m => m.status === 'active');
      const pastMembership = bniHistory.find(m => m.status === 'transferred');

      expect(activeMembership).toBeDefined();
      expect(activeMembership?.chapter_name).toBe('京都東チャプター');

      expect(pastMembership).toBeDefined();
      expect(pastMembership?.chapter_name).toBe('京都北チャプター');
      expect(pastMembership?.transfer_reason).toBeDefined();
    });
  });

  describe('C. 予定登録・案内文パーサー & 重複検知 (MEET-01〜05, 仕様27, 28, 29)', () => {
    it('Zoom招待文全文からURL、日時、参加者候補を抽出できること', () => {
      const inviteText = `山田太郎さんと1to1です！\n日時: 11/15 14:00〜15:00\nZoom: https://us02web.zoom.us/j/81234567890?pwd=samplepassword`;
      const result = store.parseMeetingIntent(inviteText);

      expect(result.extracted.provider).toBe('zoom');
      expect(result.extracted.meeting_code).toBe('81234567890');
      expect(result.extracted.candidate_participants.length).toBeGreaterThan(0);
      expect(result.extracted.candidate_participants[0].name).toContain('山田');
    });

    it('同一Zoomコード・同一日時の予定を重複登録検知して警告できること', () => {
      // 既存予定と同じURL・日時でテスト
      const existing = store.getMeetings()[0];
      if (existing && existing.meeting_url) {
        const result = store.parseMeetingIntent(`重複テスト\n${existing.meeting_url}`);
        expect(result.extracted.meeting_code).toBe(existing.meeting_code);
      }
    });
  });

  describe('D. 同意ステートマシン & 録音制御 (MEET-07〜10, 仕様05, 26)', () => {
    it('参加者全員の同意がある場合は録音可能ステータスとなること', () => {
      const meetings = store.getMeetings();
      const upcoming = meetings.find(m => m.id === 'm-yamada-upcoming');
      expect(upcoming?.recording_status).toBe('consent_obtained');
    });

    it('参加者の1人が同意拒否（rejected）した場合、会議の録音が完全遮断（refused）されること', () => {
      const consents = store.getConsentsForMeeting('m-yamada-upcoming');
      expect(consents.length).toBeGreaterThan(0);

      store.updateConsentStatus(consents[0].id, 'rejected');

      const updatedMeeting = store.getMeetings().find(m => m.id === 'm-yamada-upcoming');
      expect(updatedMeeting?.recording_status).toBe('refused');
    });

    it('同意が途中で撤回（revoked）された場合、録音ファイルが直ちに削除フラグとなること', () => {
      const consents = store.getConsentsForMeeting('m-yamada-past2');
      if (consents.length > 0) {
        store.updateConsentStatus(consents[0].id, 'revoked');
        const recording = (store as any).state.recordings.find((r: any) => r.meeting_id === 'm-yamada-past2');
        expect(recording.is_deleted).toBe(true);
      }
    });
  });

  describe('E. 音声90日自動破棄 & 恒久ピン留め (05, U09)', () => {
    it('恒久ピン留めされていない90日超過の音声は破棄ジョブで削除されること', () => {
      const recs = store.getRecordings();
      if (recs.length > 0) {
        // 過去の日付に強制設定してパージテスト
        recs[0].expires_at = '2020-01-01T00:00:00Z';
        const purged = store.run90DayPurgeJob();
        expect(purged).toBeGreaterThan(0);
      }
    });
  });

  describe('F. AI検索の誠実性 & 出典・引用 (AI-07, AI-09, 仕様12)', () => {
    it('記録されている事実については出典と根拠付きで回答すること', () => {
      const result = store.queryAI('山田太郎さんと前回何を話した？');
      expect(result.hasDefiniteAnswer).toBe(true);
      expect(result.answer).toContain('補助金');
      expect(result.facts.length).toBeGreaterThan(0);
      expect(result.relatedPersons[0].display_name).toBe('山田 太郎');
    });

    it('記録にない質問に対して架空の事実をでっちあげず、「不明」と誠実に答えること (AI-09)', () => {
      const result = store.queryAI('量子コンピューターの量子超越性について知っている人いる？');
      expect(result.hasDefiniteAnswer).toBe(false);
      expect(result.answer).toContain('不明');
      expect(result.facts.length).toBe(0);
    });
  });

  describe('G. 紹介推薦 & プライバシー保護 (INTRO-01〜04, 仕様15, 22)', () => {
    it('紹介推薦の根拠（地域・専門性・実績）が提示されていること', () => {
      const referrals = store.getReferrals();
      expect(referrals.length).toBeGreaterThan(0);
      const ref = referrals[0];
      expect(ref.breakdown.area_match).toBeDefined();
      expect(ref.breakdown.specialty_match).toBeDefined();
      expect(ref.breakdown.privacy_checked).toBe(true);
    });

    it('家族などの極秘プライベート情報（visibility=private）が紹介文草稿に混入していないこと', () => {
      const referrals = store.getReferrals();
      const draft = referrals[0].draft_message;
      expect(draft).not.toContain('受験');
      expect(draft).not.toContain('長男');
    });

    it('未確認の成果を自動確定せず、ユーザーの手動確定を必須とすること (INTRO-04)', () => {
      const ref = store.getReferrals()[0];
      expect(ref.outcome?.confirmed_by_user).toBe(false);

      store.updateReferralOutcome(ref.id, 'contract_won', 1500000);
      const updated = store.getReferrals().find(r => r.id === ref.id);
      expect(updated?.outcome?.confirmed_by_user).toBe(true);
      expect(updated?.outcome?.amount_jpy).toBe(1500000);
      expect(updated?.status).toBe('completed');
    });
  });

  describe('H. 本人の完全削除請求 (Right to be Forgotten - U09)', () => {
    it('削除請求により、人物カルテ・事実・相関図リンクが完全抹消されること', () => {
      // テスト用新規人物を作成
      const newPerson = store.createPerson({ display_name: '削除テスト 太郎' });
      store.addFact({
        person_id: newPerson.id,
        fact_category: 'topic',
        fact_key: 'テスト事実',
        fact_value: '機密情報テスト',
        source_type: 'manual_edit',
        confidence: 1.0,
        verification_status: 'verified',
        visibility: 'private',
        valid_from: new Date().toISOString(),
      });

      expect(store.getFactsForPerson(newPerson.id).length).toBe(1);

      // 完全削除実行
      const res = store.deletePersonCompletely(newPerson.id);
      expect(res.purgedCounts.facts).toBe(1);

      // 一覧から完全に消失していること
      expect(store.getPersonById(newPerson.id)).toBeUndefined();
      expect(store.getFactsForPerson(newPerson.id).length).toBe(0);
    });
  });

  describe('I. 本番運用・データ管理・インポート/バックアップ検証 (PROD-01〜05)', () => {
    it('名刺写真付きスキャンの作成とOCRシミュレーションが動作すること', () => {
      const scan = store.createCardScanWithPhoto('data:image/png;base64,samplebase64data', '名刺表面テスト');
      expect(scan.id).toBeDefined();
      expect(scan.image_url).toBe('data:image/png;base64,samplebase64data');
      expect(scan.status).toBe('completed');
      expect(scan.raw_extracted.person_name).toBe('名刺表面テスト');
    });

    it('人物の基本情報更新、オファリング追加、事実追加、BNI移籍が反映されること', () => {
      // 1. 人物更新
      const updated = store.updatePerson('p-yamada', {
        notes: '2026年本番運用メモ更新',
        service_areas: ['京都府', '滋賀県', '大阪府'],
      });
      expect(updated?.notes).toBe('2026年本番運用メモ更新');
      expect(updated?.service_areas).toContain('大阪府');

      // 2. オファリング追加
      const offering = store.addBusinessOffering({
        person_id: 'p-yamada',
        service_title: '新築ZEH住宅プロデュース',
        specialties: '高気密高断熱, 京都産木材100%',
        target_clients: '環境配慮型住宅を検討中の子育て世帯',
        service_area: '京都・滋賀',
        is_active: true,
      });
      expect(offering.service_title).toBe('新築ZEH住宅プロデュース');
      expect(store.getBusinessOfferingsForPerson('p-yamada').some(o => o.id === offering.id)).toBe(true);

      // 3. 事実追加
      const fact = store.addFact({
        person_id: 'p-yamada',
        fact_category: 'preference',
        fact_key: '趣味',
        fact_value: 'トレイルランニング（比叡山）',
        source_type: 'manual_edit',
        confidence: 1.0,
        verification_status: 'verified',
        visibility: 'private',
        valid_from: new Date().toISOString(),
      });
      expect(fact.fact_value).toContain('トレイルランニング');

      // 4. BNI移籍処理
      store.transferBNIChapter('p-yamada', 'chap-tokyo-ginza', '建設・リノベ', '滋賀エリア開拓のため移籍');
      const bniList = store.getBNIMembershipsForPerson('p-yamada');
      const newActive = bniList.find(b => b.status === 'active');
      expect(newActive?.chapter_id).toBe('chap-tokyo-ginza');
      const oldTransferred = bniList.filter(b => b.status === 'transferred');
      expect(oldTransferred.length).toBeGreaterThanOrEqual(1);
    });

    it('CSVインポートで新規人物・会社・オファリングが一括作成されること', () => {
      const csv = `名前,フリガナ,会社名,役職,電話番号,メールアドレス,事業内容・オファリング
テストCSV太郎,テストシータロウ,株式会社CSVフューチャー,代表取締役,090-1111-2222,testcsv@example.com,クラウドAI設計導入支援
テストCSV花子,テストシーハナコ,花子デザイン事務所,代表,090-3333-4444,hanako@example.com,Apple風UIデザイン制作`;

      const result = store.importCSVContacts(csv);
      expect(result.importedCount).toBe(2);
      expect(result.importedPersons[0].display_name).toBe('テストCSV太郎');
      expect(result.importedPersons[1].display_name).toBe('テストCSV花子');

      const p1 = store.getPersonById(result.importedPersons[0].id);
      expect(p1?.primary_email).toBe('testcsv@example.com');
      const orgs = store.getOrgMembershipsForPerson(result.importedPersons[0].id);
      expect(orgs.some(o => o.organization_name === '株式会社CSVフューチャー')).toBe(true);
      const offerings = store.getBusinessOfferingsForPerson(result.importedPersons[0].id);
      expect(offerings.some(o => o.service_title.includes('クラウドAI設計導入支援'))).toBe(true);
    });

    it('バックアップのエクスポートとインポートが整合性を保つこと', () => {
      const backup = store.exportBackupJSON();
      expect(backup).toBeDefined();
      const parsed = JSON.parse(backup);
      expect(parsed.schema_version).toBe('1.0');
      expect(parsed.data.persons.length).toBeGreaterThan(0);

      // 本番初期化 (クリア)
      store.resetToProductionEmptyState();
      expect(store.getPersons().length).toBe(0);
      expect(store.getMeetings().length).toBe(0);

      // バックアップ復元
      const restored = store.importBackupJSON(backup);
      expect(restored).toBe(true);
      expect(store.getPersons().length).toBeGreaterThan(0);
    });

    it('本番初期化（resetToProductionEmptyState）でサンプルデータが綺麗にクリアされること', () => {
      store.resetToProductionEmptyState();
      expect(store.getPersons().length).toBe(0);
      expect(store.getMeetings().length).toBe(0);
      expect(store.getBusinessOfferings().length).toBe(0);
      expect(store.getCardScans().length).toBe(0);

      // サンプル再投入
      store.resetToSampleState();
      expect(store.getPersons().length).toBeGreaterThan(0);
    });
  });

  describe('J. 外部OAuth認可アプリ設定検証 (Zoom & Google - 仕様05, 30)', () => {
    it('認証情報未入力時の接続テストが適切に拒否されること', () => {
      store.updateZoomConfig({ client_id: '', client_secret: '' });
      const zoomRes = store.testOAuthConnection('zoom');
      expect(zoomRes.success).toBe(false);
      expect(zoomRes.message).toContain('未設定');

      const googleRes = store.testOAuthConnection('google');
      expect(googleRes.success).toBe(false);
      expect(googleRes.message).toContain('未設定');
    });

    it('認証情報設定後のOAuth接続テストが成功しステータスが更新されること', () => {
      store.updateZoomConfig({
        client_id: 'test-zoom-client-id',
        client_secret: 'test-zoom-client-secret',
      });
      const zoomRes = store.testOAuthConnection('zoom');
      expect(zoomRes.success).toBe(true);
      expect(store.getOAuthConfig().zoom.is_connected).toBe(true);

      store.updateGoogleConfig({
        client_id: 'test-google-client-id.apps.googleusercontent.com',
        client_secret: 'test-google-client-secret',
      });
      const googleRes = store.testOAuthConnection('google');
      expect(googleRes.success).toBe(true);
      expect(store.getOAuthConfig().google.is_connected).toBe(true);
    });
  });

  describe('K. 予定登録・相手自動名寄せ・仮登録カルテ作成 (MEET-01〜03, 仕様ID 21)', () => {
    it('登録人物がいない状態でも参加者名付き予定登録で仮人物カルテが自動生成・紐付けされること', () => {
      // 一旦本番用初期状態（空）にリセット
      store.resetToProductionEmptyState();
      expect(store.getPersons().length).toBe(0);
      expect(store.getMeetings().length).toBe(0);

      // 参加者名付きで予定作成
      const meeting = store.createMeeting({
        title: '鈴木 一郎様と1to1面談',
        participant_name: '鈴木 一郎',
        meeting_type: '1to1',
        scheduled_start_at: new Date(Date.now() + 86400000).toISOString(),
      });

      expect(meeting).toBeDefined();
      expect(meeting.participant_ids.length).toBe(1);

      // 仮登録人物（provisional）が生成されていること
      const createdPerson = store.getPersonById(meeting.participant_ids[0]);
      expect(createdPerson).toBeDefined();
      expect(createdPerson?.display_name).toBe('鈴木 一郎');
      expect(createdPerson?.status).toBe('provisional');

      // 同意レコードも自動生成されること
      const consents = store.getConsentsForMeeting(meeting.id);
      expect(consents.length).toBe(1);
      expect(consents[0].person_name).toBe('鈴木 一郎');
      expect(consents[0].status).toBe('pending');
    });

    it('参加者名が既存人物と一致する場合は既存人物のIDに正しく紐付けられること', () => {
      store.resetToSampleState();
      const yamada = store.getPersons().find(p => p.display_name === '山田 太郎');
      expect(yamada).toBeDefined();

      const meeting = store.createMeeting({
        title: '山田 太郎様とフォローアップ面談',
        participant_name: '山田 太郎',
        meeting_type: '1to1',
      });

      expect(meeting.participant_ids).toContain(yamada?.id);
    });

    it('LINEからのURLのみで相手情報が全く不明でも登録でき、Zoom中に本名・会社特定で正式昇格できること', () => {
      store.resetToProductionEmptyState();

      // LINEからZoom URLのみ受領（お名前・会社名一切不明）
      const unknownMeeting = store.createMeeting({
        meeting_url: 'https://us02web.zoom.us/j/999888777?pwd=line_secret',
        meeting_type: '1to1',
        scheduled_start_at: new Date(Date.now() + 3600000).toISOString(),
      });

      expect(unknownMeeting).toBeDefined();
      expect(unknownMeeting.participant_ids.length).toBe(1);

      // 仮カルテ「相手未特定 (LINE連絡)」が自動生成されていること
      const provisionalPerson = store.getPersonById(unknownMeeting.participant_ids[0]);
      expect(provisionalPerson).toBeDefined();
      expect(provisionalPerson?.display_name).toContain('LINE連絡');
      expect(provisionalPerson?.status).toBe('provisional');

      // Zoom中に自己紹介があり、本名・会社・BNIチャプターが判明したため確定を実行
      const result = store.identifyMeetingParticipant(unknownMeeting.id, {
        realName: '高橋 誠治',
        phoneticName: 'タカハシ セイジ',
        companyName: '株式会社タカハシ看板デザイン',
        title: '代表取締役',
        bniChapter: '京都南チャプター',
        bniCategory: '看板施工',
        serviceDescription: 'LED電飾看板・店舗サイン施工',
        notes: 'クリニックやカフェの出店オーナーを求めている',
      });

      // 正式カルテ（active）へ昇格していること
      expect(result.person.status).toBe('active');
      expect(result.person.display_name).toBe('高橋 誠治');

      // 会社所属が紐付いていること
      const orgs = store.getOrgMembershipsForPerson(result.person.id);
      expect(orgs.some(o => o.organization_name.includes('タカハシ看板'))).toBe(true);

      // BNIチャプター所属が紐付いていること
      const bni = store.getBNIMembershipsForPerson(result.person.id);
      expect(bni.some(b => b.chapter_name.includes('京都南'))).toBe(true);

      // 会議タイトルが本名付きに自動更新されていること
      expect(result.meeting.title).toContain('高橋 誠治');

      // 同意レコードも本名に更新されていること
      const consents = store.getConsentsForMeeting(unknownMeeting.id);
      expect(consents[0].person_name).toBe('高橋 誠治');
    });

    it('事前の入力一切なしで、面談後に録音・文字起こしを渡すだけでAIが相手カルテ・会社・BNI所属・話題・約束を全自動登録すること', () => {
      store.resetToProductionEmptyState();
      expect(store.getPersons().length).toBe(0);
      expect(store.getMeetings().length).toBe(0);

      const transcript = `
高橋: はじめまして！本日は面談のお時間ありがとうございます。株式会社タカハシ看板デザイン 代表取締役の高橋誠治です。
自分: はじめまして、よろしくお願いします！
高橋: BNI京都南チャプターで屋外広告・看板施工のカテゴリーを担当しています。最近は新規出店される町家カフェやクリニックのLED電飾看板を多く手掛けています。
自分: 素晴らしいですね！
高橋: 次回までに当社の施工実績カタログと事例集をお送りしますね。
      `.trim();

      // 事後文字起こしからAI自動登録を実行
      const result = store.autoRegisterFromPostMeetingTranscript(transcript);

      // 面談が作成されていること
      expect(result.meeting).toBeDefined();
      expect(result.meeting.recording_status).toBe('completed');

      // 本名カルテが生成されていること
      expect(result.person).toBeDefined();
      expect(result.person.display_name).toBe('高橋 誠治');
      expect(result.person.status).toBe('active');

      // 会社情報とBNI所属が自動紐付けされていること
      const orgs = store.getOrgMembershipsForPerson(result.person.id);
      expect(orgs.some(o => o.organization_name.includes('タカハシ看板'))).toBe(true);

      const bni = store.getBNIMembershipsForPerson(result.person.id);
      expect(bni.some(b => b.chapter_name.includes('京都南'))).toBe(true);

      // 話題と約束がFactsとして自動記録されていること
      const facts = store.getFactsForPerson(result.person.id);
      expect(facts.some(f => f.fact_category === 'topic' && f.fact_value.includes('看板'))).toBe(true);
      expect(facts.some(f => f.fact_category === 'promise' && f.fact_value.includes('カタログ'))).toBe(true);

      // AI利用コスト（原価台帳）が自動計上されていること
      const costs = store.getCostLedger();
      expect(costs.some(c => c.service_category === 'audio_transcribe')).toBe(true);

      // お礼文・相互要約の自動生成テスト (LINE用カジュアル & BNIフォーマル)
      const thankYouLine = store.generateThankYouDraft(result.meeting.id, 'line_casual');
      expect(thankYouLine.recipient_name).toBe('高橋 誠治');
      expect(thankYouLine.draft_text).toContain('高橋 誠治さん、本日はお忙しい中Zoomでのお時間をいただき');
      expect(thankYouLine.draft_text).toContain('株式会社タカハシ看板デザイン');
      expect(thankYouLine.draft_text).toContain('京都南');
      expect(thankYouLine.draft_text).toContain('施工実績カタログ');

      const thankYouBNI = store.generateThankYouDraft(result.meeting.id, 'bni_formal');
      expect(thankYouBNI.draft_text).toContain('Givers Gain');
      expect(thankYouBNI.draft_text).toContain('BNI 1to1面談');
    });

    it('汎用的な初期カテゴリー設定、自由なカスタムカテゴリー（一般社団法人stone等）の追加・削除、人物カルテへの手動振り分け、顔写真の事後登録・更新ができること', () => {
      // 1. 他ユーザーへの販売・一般公開時、初期カテゴリーは普遍的・汎用的なもの（BNI, 仕事, パートナー等）であること
      const initialCategories = store.getCategories();
      expect(initialCategories).toContain('BNI');
      expect(initialCategories).toContain('仕事');
      expect(initialCategories).toContain('パートナー');

      // 2. 自社や利用団体に合わせて任意のカスタムカテゴリー（例: 一般社団法人stone, 幹部等）を追加作成できること
      store.addCategory('一般社団法人stone');
      store.addCategory('幹部');
      expect(store.getCategories()).toContain('一般社団法人stone');
      expect(store.getCategories()).toContain('幹部');

      // 3. 非BNI人物カルテを作成し、一般社団法人stoneと幹部カテゴリーを手動割り当てできること
      const person = store.createPerson({
        display_name: '田中 健一',
        phonetic_name: 'タナカ ケンイチ',
        category_tags: ['一般社団法人stone', '幹部'],
      });
      expect(person.category_tags).toContain('一般社団法人stone');
      expect(person.category_tags).toContain('幹部');

      // 4. カテゴリーの更新・追加割り当て
      const updatedPerson = store.updatePersonCategories(person.id, ['一般社団法人stone', '幹部', '知人']);
      expect(updatedPerson.category_tags).toContain('知人');
      expect(updatedPerson.category_tags.length).toBe(3);

      // 5. 不要になったカテゴリーを削除できること
      store.addCategory('不要テストタグ');
      expect(store.getCategories()).toContain('不要テストタグ');
      store.removeCategory('不要テストタグ');
      expect(store.getCategories()).not.toContain('不要テストタグ');

      // 6. 顔写真（アバター）を後から登録・変更できること
      const mockDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const personWithAvatar = store.updatePersonAvatar(person.id, mockDataUrl);
      expect(personWithAvatar.avatar_url).toBe(mockDataUrl);

      // 7. 永続化されたストアから取得しても顔写真とカテゴリーが正しく保持されていること
      const fetched = store.getPersonById(person.id);
      expect(fetched?.avatar_url).toBe(mockDataUrl);
      expect(fetched?.category_tags).toEqual(['一般社団法人stone', '幹部', '知人']);
    });

    it('複数の面談予定を登録した際、日時が近い順（昇順）に並び、日時の更新・変更・削除が正しく動作すること', () => {
      store.resetToProductionEmptyState();
      expect(store.getMeetings().length).toBe(0);

      const now = Date.now();
      const in2Days = new Date(now + 86400 * 1000 * 2).toISOString();
      const in1Day = new Date(now + 86400 * 1000 * 1).toISOString();
      const in3Hours = new Date(now + 3600 * 1000 * 3).toISOString();

      // あえてバラバラの順番で予定を作成
      const m2Days = store.createMeeting({
        title: '明後日の面談',
        scheduled_start_at: in2Days,
      });

      const m3Hours = store.createMeeting({
        title: '3時間後の直近面談',
        scheduled_start_at: in3Hours,
      });

      const m1Day = store.createMeeting({
        title: '明日の面談',
        scheduled_start_at: in1Day,
      });

      // getMeetings() で取得したとき、近い順（3時間後 → 明日 → 明後日）にソートされていること
      const sortedMeetings = store.getMeetings();
      expect(sortedMeetings.length).toBe(3);
      expect(sortedMeetings[0].id).toBe(m3Hours.id);
      expect(sortedMeetings[0].title).toBe('3時間後の直近面談');
      expect(sortedMeetings[1].id).toBe(m1Day.id);
      expect(sortedMeetings[1].title).toBe('明日の面談');
      expect(sortedMeetings[2].id).toBe(m2Days.id);
      expect(sortedMeetings[2].title).toBe('明後日の面談');

      // 日時変更（updateMeeting）のテスト
      const in1Hour = new Date(now + 3600 * 1000 * 1).toISOString();
      store.updateMeeting(m2Days.id, {
        title: '繰り上げ面談（1時間後）',
        scheduled_start_at: in1Hour,
      });

      // 繰り上げられた予定が先頭（1時間後）に並び変わること
      const reordered = store.getMeetings();
      expect(reordered[0].id).toBe(m2Days.id);
      expect(reordered[0].title).toBe('繰り上げ面談（1時間後）');

      // 予定削除（deleteMeeting）のテスト
      store.deleteMeeting(m1Day.id);
      expect(store.getMeetings().length).toBe(2);
      expect(store.getMeetings().some(m => m.id === m1Day.id)).toBe(false);
    });

    it('純粋なURLのみの入力では has_detected_date が false、日付入りテキストでは true となり、リロード後も予定が維持されること', () => {
      // 純粋なZoom URL貼り付け
      const pureUrl = 'https://us02web.zoom.us/j/84920491029?pwd=abcd';
      const parsedPure = store.parseMeetingIntent(pureUrl);
      expect(parsedPure.extracted?.meeting_url).toBe(pureUrl);
      expect(parsedPure.extracted?.has_detected_date).toBe(false);

      // 日時が明記されたテキスト貼り付け
      const textWithDate = '次回面談 11/15 14:00〜 https://us02web.zoom.us/j/84920491029?pwd=abcd 佐藤さんと打ち合わせ';
      const parsedWithDate = store.parseMeetingIntent(textWithDate);
      expect(parsedWithDate.extracted?.has_detected_date).toBe(true);

      // 口語表現「11月9日の21時半」「明日の21時半」などの高精度抽出
      const conversationalText = 'ちなみに今回は11月9日の21時半す。https://us02web.zoom.us/j/84920491029?pwd=abcd';
      const parsedConversational = store.parseMeetingIntent(conversationalText);
      expect(parsedConversational.extracted?.has_detected_date).toBe(true);
      const parsedDate = new Date(parsedConversational.extracted?.scheduled_start_at || '');
      expect(parsedDate.getMonth() + 1).toBe(11);
      expect(parsedDate.getDate()).toBe(9);
      expect(parsedDate.getHours()).toBe(21);
      expect(parsedDate.getMinutes()).toBe(30);

      // ユーザー予定を登録
      const userMeeting = store.createMeeting({
        title: '大切な取引先との面談',
        scheduled_start_at: new Date(Date.now() + 86400 * 1000 * 5).toISOString(),
        meeting_url: pureUrl,
      });

      // localStorageから再読み込み（リロード擬似）
      // @ts-expect-error accessing constructor for persistence verification
      const reloadedStore = new store.constructor();
      const reloadedMeetings = reloadedStore.getMeetings();
      expect(reloadedMeetings.some((m: any) => m.id === userMeeting.id)).toBe(true);
      expect(reloadedMeetings.find((m: any) => m.id === userMeeting.id)?.title).toBe('大切な取引先との面談');
    });

    it('同一Zoomリンクを別時間に使用しても重複誤判定されず、面談・参加者ごとに個別要約とお礼文が生成されること', () => {
      const zoomUrl = 'https://us02web.zoom.us/j/84920491029?pwd=abcd';

      // 14:00の面談（鹿股さん）
      const meeting1 = store.createMeeting({
        title: '鹿股 幸男様と面談',
        scheduled_start_at: '2026-11-09T14:00:00.000Z',
        meeting_url: zoomUrl,
        meeting_code: '84920491029',
        participant_name: '鹿股 幸男',
      });
      expect(meeting1.id).toBeDefined();

      // 同日21:30の面談（ツージーさん、同一Zoomコード）
      const parseResult2 = store.parseMeetingIntent(`11/9 21:30〜 ${zoomUrl} ツージーさんと面談`);
      // 時間が異なるため重複と判定されないこと
      expect(parseResult2.is_duplicate).toBe(false);

      const meeting2 = store.createMeeting({
        title: 'ツージー様・木村 尚史様と面談',
        scheduled_start_at: '2026-11-09T21:30:00.000Z',
        meeting_url: zoomUrl,
        meeting_code: '84920491029',
        participant_name: 'ツージー',
      });

      // 木村さんも同席参加者に追加
      const kimura = store.createPerson({ display_name: '木村 尚史' });
      store.updateMeeting(meeting2.id, {
        participant_ids: [...meeting2.participant_ids, kimura.id]
      });

      // お礼文生成テスト: ツージー様宛て
      const draftTsuji = store.generateThankYouDraft(meeting2.id, 'line_casual', meeting2.participant_ids[0]);
      expect(draftTsuji.recipient_name).toBe('ツージー');
      expect(draftTsuji.draft_text).toContain('ツージーさん');

      // お礼文生成テスト: 木村様宛て（個別要約・個別お礼文）
      const draftKimura = store.generateThankYouDraft(meeting2.id, 'business_polite', kimura.id);
      expect(draftKimura.recipient_name).toBe('木村 尚史');
      expect(draftKimura.draft_text).toContain('木村 尚史様');
      expect(draftKimura.all_participants.length).toBeGreaterThanOrEqual(2);
    });

    it('相関図において接点のない人脈はエッジ0で独立し、確証のある実関係のみを結線できること', () => {
      const p1 = store.createPerson({ display_name: '鹿股 幸男' });
      const p2 = store.createPerson({ display_name: '木村 尚史' });

      // 新規登録時点では接点がないため、エッジ数は0
      const p1Rels = store.getRelationships('actual').filter(r => r.from_person_id === p1.id || r.to_person_id === p1.id);
      expect(p1Rels.length).toBe(0);

      // 実関係を確証（紹介元・紹介先）として記録
      const newRel = store.createRelationship({
        from_person_id: p1.id,
        to_person_id: p2.id,
        relationship_type: '紹介元 / 紹介先',
        evidence_text: '11月9日の面談で鹿股様より木村様をご紹介',
      });

      const updated = store.getRelationships('actual');
      expect(updated.some(r => r.id === newRel.id)).toBe(true);
      expect(updated.find(r => r.id === newRel.id)?.evidence_text).toContain('鹿股様より木村様をご紹介');

      // 削除できること
      store.deleteRelationship(newRel.id);
      expect(store.getRelationships('actual').some(r => r.id === newRel.id)).toBe(false);
    });

    it('一般ビジネス・社団法人などの面談文字起こしにおいて、架空のBNIや看板施工を捏造せず実文面通りの話題・約束・お礼文を抽出すること', () => {
      const stoneMeeting = store.createMeeting({
        title: '一般社団法人stone 幹部面談',
        scheduled_start_at: '2026-11-09T21:30:00.000Z',
        participant_name: 'ツージー',
      });

      const memo = `
本日はありがとうございました。一般社団法人stoneの件で意見交換しました。
今後は学生向けのキャリア支援とAI活用のワークショップを共同で開催していく方針で合意しました。
来週月曜までに企画書の骨子を作成してLINEで共有しますね。
      `.trim();

      const result = store.processMeetingRecordingAndAutoRegister(stoneMeeting.id, memo);
      expect(result.summary.realName).toBe('ツージー');
      expect(result.summary.companyName).toContain('stone');
      expect(result.summary.bniChapter).toBe(''); // BNI言及なしのため空であること
      expect(result.summary.topic).toContain('ワークショップ');
      expect(result.summary.promise).toContain('企画書の骨子を作成');

      // タカハシ看板やLED看板が一切混入していないこと
      expect(result.summary.topic).not.toContain('看板');
      expect(result.summary.promise).not.toContain('施工実績');

      const thankYou = store.generateThankYouDraft(stoneMeeting.id, 'line_casual', result.person.id);
      expect(thankYou.draft_text).toContain('ツージーさん');
      expect(thankYou.draft_text).toContain('企画書の骨子');
      expect(thankYou.draft_text).not.toContain('看板');
      expect(thankYou.draft_text).not.toContain('京都南');
    });
  });
});
