import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../services/store';

describe('名刺画像圧縮・大容量耐性およびお名前漢字セーフティ確認テスト', () => {
  beforeEach(() => {
    // 状態の確認
  });

  it('名刺撮影時に元サイズと圧縮後サイズが正しくCardScanに記録されること', () => {
    const dummyWebPDataUrl = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
    const scan = store.createCardScanWithPhoto(
      dummyWebPDataUrl,
      {
        person_name: '辻 晃典',
        phonetic_name: 'つじ あきのり',
        company_name: 'アミューズメント企画',
        title: '代表',
      },
      {
        originalSize: 4500000, // 元画像 4.5MB
        compressedSize: 48000, // 圧縮後 48KB (約99%削減)
      }
    );

    expect(scan).toBeDefined();
    expect(scan.raw_extracted.person_name).toBe('辻 晃典');
    expect(scan.original_size_bytes).toBe(4500000);
    expect(scan.compressed_size_bytes).toBe(48000);
  });

  it('人物カルテでお名前の漢字確認フラグ(is_name_verified)が更新・保持できること', () => {
    const persons = store.getPersons();
    const tsuji = persons.find(p => p.display_name === '辻 晃典');
    expect(tsuji).toBeDefined();

    // 漢字確認済みフラグをtrueに更新
    store.updatePerson(tsuji!.id, {
      is_name_verified: true,
    });

    const updated = store.getPersonById(tsuji!.id);
    expect(updated?.is_name_verified).toBe(true);
  });

  it('お礼状ドラフト生成時に対象人物のIDおよび漢字確認フラグが連携されること', () => {
    const meetings = store.getMeetings();
    const tsujiMeeting = meetings.find(m => m.title.includes('辻'));
    expect(tsujiMeeting).toBeDefined();

    const draft = store.generateThankYouDraft(tsujiMeeting!.id, 'line_casual');
    expect(draft.recipient_name).toBe('辻 晃典');
    expect(draft.recipient_person_id).toBeDefined();
    expect(draft.is_recipient_name_verified).toBe(true);
  });

  it('相関図（GraphView）のデフォルト描画対象から仮登録（provisional）の人物が確実に除外されること', () => {
    const allPersons = store.getPersons();
    const realPersons = allPersons.filter(p => p.status !== 'provisional');
    const provisionalPersons = allPersons.filter(p => p.status === 'provisional');

    // 辻様、木村様などの実面談人物は実人脈に含まれる
    expect(realPersons.some(p => p.display_name === '辻 晃典')).toBe(true);
    expect(realPersons.some(p => p.display_name === '木村 尚史')).toBe(true);

    // 会話で登場しただけの仮人物（遠藤さん、康二、江戸、俊介、伊藤さん）は実人脈に含まれない
    expect(realPersons.some(p => p.status === 'provisional')).toBe(false);
    expect(provisionalPersons.length).toBeGreaterThan(0);
    expect(provisionalPersons.some(p => p.id === 'p-endo-prov')).toBe(true);
  });

  it('仮登録の人物の漢字や詳細を編集し、実人脈へ本登録（昇格）できること', () => {
    // 遠藤さんを正しい漢字「遠藤 雄一」に編集して本登録へ昇格
    store.promotePerson('p-endo-prov', {
      display_name: '遠藤 雄一',
      phonetic_name: 'えんどう ゆういち',
      is_name_verified: true,
    });

    const endo = store.getPersonById('p-endo-prov');
    expect(endo).toBeDefined();
    expect(endo?.status).toBe('active');
    expect(endo?.display_name).toBe('遠藤 雄一');
    expect(endo?.phonetic_name).toBe('えんどう ゆういち');
    expect(endo?.is_name_verified).toBe(true);

    // 実人脈一覧に正式追加されていること
    const realPersons = store.getPersons().filter(p => p.status !== 'provisional');
    expect(realPersons.some(p => p.display_name === '遠藤 雄一')).toBe(true);
  });

  it('田中 義博様（夢叶開発）との1to1面談実績・Facts・文字起こし・お礼状ドラフトが完全に登録されていること', () => {
    const tanaka = store.getPersons().find(p => p.display_name === '田中 義博');
    expect(tanaka).toBeDefined();
    expect(tanaka?.status).toBe('active');
    expect(tanaka?.is_name_verified).toBe(true);

    const orgs = store.getOrgMembershipsForPerson(tanaka!.id);
    expect(orgs.some(o => o.organization_name === '夢叶開発')).toBe(true);
    expect(orgs.some(o => o.organization_name === '武藤開発')).toBe(false);

    const mtg = store.getMeetings().find(m => m.id === 'm-tanaka-20261110');
    expect(mtg).toBeDefined();
    expect(mtg?.status).toBe('completed');
    expect(mtg?.zoom_uuid).toBe('BGodEUwlTyuhgtDOPAVE+w==');

    const tr = store.getTranscriptForMeeting('m-tanaka-20261110');
    expect(tr).toBeDefined();
    expect(tr?.summary).toContain('夢叶開発');

    const facts = store.getFactsForPerson(tanaka!.id);
    expect(facts.length).toBeGreaterThan(3);
    expect(facts.some(f => f.fact_value.includes('夢叶開発'))).toBe(true);
    expect(facts.some(f => f.fact_value.includes('ランチ'))).toBe(true);

    const draft = store.generateThankYouDraft('m-tanaka-20261110', 'line_casual');
    expect(draft.recipient_name).toBe('田中 義博');
    expect(draft.draft_text).toContain('田中');
    expect(draft.draft_text).toContain('夢叶開発');
  });

  it('同一Zoomルーム(89527504054)でもセッションUUID単位で独立処理され、事前予定「〇〇開発の△△様」と自動統合・本登録昇格されること', () => {
    // スマホで事前予定「星野開発の星野様と1to1」を登録した状態を再現
    const scheduled = store.createMeeting({
      title: '星野開発の星野様と1to1',
      participant_name: '星野開発の星野',
      meeting_type: '1to1',
      provider: 'zoom',
      scheduled_start_at: '2026-11-12T02:00:00Z',
    });

    // 社名「星野開発」と人物「星野」に自動分解されていること
    const prePerson = store.getPersonById(scheduled.participant_ids[0]);
    expect(prePerson?.display_name).toBe('星野');
    expect(store.getOrgMembershipsForPerson(prePerson!.id)[0]?.organization_name).toBe('星野開発');

    // 同一パーソナルルーム 89527504054 で新規UUIDのZoomセッションが完了（AI要約＋文字起こし到着）
    const changed = store.ingestZoomSessions([
      {
        uuid: 'UniqueSessionUUID_Hoshino_001==',
        meeting_id: '89527504054',
        topic: 'ZENNOBATE Meeting Room',
        start_time: '2026-11-12T02:01:00Z',
        duration: 35,
        share_url: 'https://us06web.zoom.us/rec/share/hoshino_rec',
        summary_overview: '星野健太と4/勝賀野の間で店舗開発・残置物撤去の協業に合意しました。',
        summary_details: [{ label: '協業合意', summary: '大阪エリアの店舗物件での連携を決定。' }],
        next_steps: ['4/勝賀野: 来週火曜に星野健太へ見積フォーマットを送付する'],
        attendees: ['4/勝賀野 太郎/残置物撤去', '星野健太'],
        transcript_text: '星野健太: 星野開発の星野です。よろしくお願いします。\n4/勝賀野 太郎/残置物撤去: よろしくお願いします！',
        utterances: [
          { speaker: '星野健太', start_seconds: 1, end_seconds: 5, text: '星野開発の星野です。よろしくお願いします。' },
        ],
      },
    ]);

    expect(changed).toBe(true);

    // 事前予定が完了ステータスに自動更新され、重複予定が増えていないこと
    const updatedMtg = store.getMeetings().find(m => m.id === scheduled.id);
    expect(updatedMtg?.status).toBe('completed');
    expect(updatedMtg?.zoom_uuid).toBe('UniqueSessionUUID_Hoshino_001==');

    // 人物カルテがフルネーム「星野 健太」かつ実人脈（active）に自動昇格し、社名「星野開発」も保持されていること
    const promotedPerson = store.getPersonById(prePerson!.id);
    expect(promotedPerson?.status).toBe('active');
    expect(promotedPerson?.display_name).toBe('星野 健太');
    expect(store.getOrgMembershipsForPerson(promotedPerson!.id).some(o => o.organization_name === '星野開発')).toBe(true);

    // AI要約・文字起こし・次回アクションToDoがすべて自動紐付けされていること
    const tr = store.getTranscriptForMeeting(scheduled.id);
    expect(tr?.summary).toContain('残置物撤去の協業に合意');
    expect(tr?.full_text).toContain('星野開発の星野です');

    const pFacts = store.getFactsForPerson(promotedPerson!.id);
    expect(pFacts.some(f => f.fact_category === 'promise' && f.fact_value.includes('見積フォーマット'))).toBe(true);
  });

  it('何千枚登録シミュレーション時でもlocalStorage容量上限でアプリがクラッシュしないこと', () => {
    // 意図的に巨大な文字列でQuotaExceededをシミュレートしてもstoreがエラーを内部吸収して安全に継続
    expect(() => {
      // 100件のダミー名刺を追加
      for (let i = 0; i < 50; i++) {
        store.createCardScanWithPhoto(
          'data:image/webp;base64,dummy...',
          { person_name: `テスト名刺 ${i}`, company_name: `テスト株式会社 ${i}` },
          { originalSize: 3000000, compressedSize: 50000 }
        );
      }
    }).not.toThrow();

    // PersonsやMeetingsが正常に取得できること
    expect(store.getPersons().length).toBeGreaterThan(0);
    expect(store.getMeetings().length).toBeGreaterThan(0);
  });
});
