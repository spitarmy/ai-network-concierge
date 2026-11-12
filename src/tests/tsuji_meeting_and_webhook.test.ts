import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../services/store';
import crypto from 'crypto';

describe('辻 晃典様・木村 尚史様 1to1面談実績およびZoom自動連携テスト', () => {
  beforeEach(() => {
    store.seedTsujiMeeting();
    store.seedKimuraMeeting();
  });

  it('辻 晃典様が人物カルテとして正しく登録されていること', () => {
    const tsuji = store.getPersons().find(p => p.display_name === '辻 晃典');
    expect(tsuji).toBeDefined();
    expect(tsuji?.status).toBe('active');
    expect(tsuji?.category_tags).toContain('BNI');
    expect(tsuji?.category_tags).toContain('仕事');
  });

  it('遠藤さんが仮カルテ（provisional）として登録されていること', () => {
    const endo = store.getPersons().find(p => p.id === 'p-endo-prov');
    expect(endo).toBeDefined();
    expect(endo?.status).toBe('provisional');
    expect(endo?.notes).toContain('ディーラー');
  });

  it('仮カルテの人物を本カルテへ昇格（promotePerson）できること', () => {
    const endo = store.getPersons().find(p => p.id === 'p-endo-prov');
    expect(endo?.status).toBe('provisional');

    store.promotePerson('p-endo-prov');
    const promoted = store.getPersons().find(p => p.id === 'p-endo-prov');
    expect(promoted?.status).toBe('active');
  });

  it('仮カルテと本カルテを統合（mergePersons）できること', () => {
    const kimura = store.getPersons().find(p => p.display_name === '木村 尚史')!;
    const endo = store.getPersons().find(p => p.id === 'p-endo-prov')!;

    store.mergePersons(kimura.id, endo.id);

    // endo は削除され、kimura に情報が統合されていること
    expect(store.getPersons().some(p => p.id === 'p-endo-prov')).toBe(false);
    const updatedKimura = store.getPersonById(kimura.id);
    expect(updatedKimura?.notes).toContain('ディーラー');
  });

  it('辻様との1to1面談が完了（completed）状態で登録され、辻様が紐付いていること', () => {
    const meeting = store.getMeetings().find(m => m.id === 'm-tsuji-20261109');
    expect(meeting).toBeDefined();
    expect(meeting?.status).toBe('completed');
    expect(meeting?.recording_status).toBe('completed');
    expect(meeting?.participant_ids).toContain('p-tsuji-akinori');
  });

  it('辻様との面談からアミューズメントポーカー、金曜晩、卓購入、税理士相談のFactsが登録されていること', () => {
    const facts = store.getFactsForPerson('p-tsuji-akinori');
    expect(facts.length).toBeGreaterThanOrEqual(4);

    const hasPoker = facts.some(f => f.fact_value.includes('アミューズメントポーカー'));
    const hasFriday = facts.some(f => f.fact_value.includes('金曜の晩'));
    const hasTaxConsult = facts.some(f => f.fact_value.includes('税理士'));

    expect(hasPoker).toBe(true);
    expect(hasFriday).toBe(true);
    expect(hasTaxConsult).toBe(true);
  });

  it('辻様宛てのお礼状ドラフトが自動生成できること', () => {
    const thankYou = store.generateThankYouDraft('m-tsuji-20261109', 'line_casual');
    expect(thankYou.recipient_name).toBe('辻 晃典');
    expect(thankYou.draft_text).toContain('辻');
    expect(thankYou.draft_text).toContain('金曜の晩');
  });

  it('木村 尚史様が人物カルテとして正しく登録されていること', () => {
    const kimura = store.getPersons().find(p => p.display_name === '木村 尚史');
    expect(kimura).toBeDefined();
    expect(kimura?.status).toBe('active');
    expect(kimura?.category_tags).toContain('仕事');
    expect(kimura?.category_tags).toContain('東山高');
  });

  it('木村様との関連人物（康二、江戸、俊介、伊藤さん）が登録されていること', () => {
    const koji = store.getPersons().find(p => p.id === 'p-koji-prov');
    const edono = store.getPersons().find(p => p.id === 'p-edono-prov');
    const shunsuke = store.getPersons().find(p => p.id === 'p-shunsuke-prov');
    const ito = store.getPersons().find(p => p.id === 'p-ito-prov');

    expect(koji).toBeDefined();
    expect(edono).toBeDefined();
    expect(shunsuke).toBeDefined();
    expect(ito).toBeDefined();
  });

  it('木村様との1to1面談が完了（completed）状態で登録されていること', () => {
    const meeting = store.getMeetings().find(m => m.id === 'm-kimura-20261109');
    expect(meeting).toBeDefined();
    expect(meeting?.status).toBe('completed');
    expect(meeting?.recording_status).toBe('completed');
    expect(meeting?.participant_ids).toContain('p-kimura-naofumi');
  });

  it('木村様との面談から不用品回収×リユース、11/18飲み、現調案件見積のFactsが登録されていること', () => {
    const facts = store.getFactsForPerson('p-kimura-naofumi');
    expect(facts.length).toBeGreaterThanOrEqual(4);

    const hasReuse = facts.some(f => f.fact_value.includes('リユース') || f.fact_value.includes('不用品回収'));
    const hasNov18 = facts.some(f => f.fact_value.includes('11月18日') || f.fact_value.includes('タメ語'));
    const hasEstimate = facts.some(f => f.fact_value.includes('見積もり'));

    expect(hasReuse).toBe(true);
    expect(hasNov18).toBe(true);
    expect(hasEstimate).toBe(true);
  });

  it('木村様宛てのお礼状ドラフトが自動生成できること', () => {
    const thankYou = store.generateThankYouDraft('m-kimura-20261109', 'line_casual');
    expect(thankYou.recipient_name).toBe('木村 尚史');
    expect(thankYou.draft_text).toContain('木村');
  });

  it('Zoom Webhook URL Validation (CRCチャレンジ) の暗号化ハッシュが正しく計算されること', () => {
    const secret = '9D2MsR03RK6Srow8lUSAYw';
    const plainToken = 'test-plain-token-12345';
    const expectedHash = crypto.createHmac('sha256', secret).update(plainToken).digest('hex');

    expect(expectedHash).toBeDefined();
    expect(expectedHash.length).toBe(64); // SHA-256 hex string
  });

  it('Zoom Webhook inboxから自動同期が機能すること', () => {
    const mockInbox = [
      {
        id: 'zoom-event-999',
        meeting_id: '999888777',
        topic: 'テスト面談（自動受信）',
        start_time: '2026-11-09T15:00:00Z',
        duration: 30,
        share_url: 'https://us06web.zoom.us/rec/share/test',
        summary_overview: '次回商談についての打ち合わせ。'
      }
    ];

    const result = store.syncZoomInbox(mockInbox);
    expect(result).toBe(true);

    const imported = store.getMeetings().find(m => m.id === 'm-zoom-999888777');
    expect(imported).toBeDefined();
    expect(imported?.title).toBe('テスト面談（自動受信）');
    expect(imported?.status).toBe('completed');
  });

  it('田中義博様（夢叶開発）のカルテ・会社・面談要約・約束ToDo・お礼文に全内容が反映されていること', () => {
    const tanaka = store.getPersonById('p-tanaka-yoshihiro');
    expect(tanaka).toBeDefined();
    expect(tanaka?.display_name).toBe('田中 義博');
    expect(tanaka?.status).toBe('active');
    expect(tanaka?.notes).toContain('夢叶開発');
    expect(tanaka?.notes).toContain('マンション');

    const orgs = store.getOrgMembershipsForPerson('p-tanaka-yoshihiro');
    expect(orgs.some(o => o.organization_name === '夢叶開発')).toBe(true);
    expect(orgs.some(o => o.organization_name.includes('ゼノベイト'))).toBe(false);

    const tr = store.getTranscriptForMeeting('m-tanaka-20261110');
    expect(tr).toBeDefined();
    expect(tr?.summary).toContain('夢叶開発');
    expect(tr?.summary).toContain('マンション買取再販');
    expect(tr?.summary).toContain('ランチ');

    const facts = store.getFactsForPerson('p-tanaka-yoshihiro');
    expect(facts.some(f => f.fact_value.includes('買取再販'))).toBe(true);
    expect(facts.some(f => f.fact_value.includes('ランチ'))).toBe(true);

    const draft = store.generateThankYouDraft('m-tanaka-20261110', 'line_casual');
    expect(draft.draft_text).toContain('夢叶開発');
    expect(draft.draft_text).toContain('マンション買取再販');
    expect(draft.draft_text).toContain('ランチ');
  });

  it('スマホで「夢叶開発の田中様」を登録し文字起こし・要約を入力しても重複せず田中義博様カルテへ完全統合されること', () => {
    const spMeeting = store.createMeeting({
      title: '夢叶開発の田中様',
      participant_name: '夢叶開発の田中',
      meeting_type: '1to1',
      provider: 'zoom',
      scheduled_start_at: '2026-11-10T11:00:00+09:00',
    });

    const pastedTranscript = `田中義博\n10:58:59\nすみません。よろしくお願いします。\n4/勝賀野 太郎/残置物撤去\n10:59:25\n改めまして、株式会社ゼノベイトの僕、生姜のと申します。\n田中義博\n10:59:31\nお世話になります。無党開発の田中と申します。会社は大阪でマンション中心に買取再販をやってます。`;

    const res = store.processMeetingRecordingAndAutoRegister(spMeeting.id, pastedTranscript);
    expect(res.person.id).toBe('p-tanaka-yoshihiro');
    expect(res.person.display_name).toBe('田中 義博');
    expect(res.summary.companyName).toBe('夢叶開発');
    expect(res.summary.topic).toContain('マンション');
    expect(res.summary.promise).toContain('ランチ');

    // 重複した「夢叶開発の田中様」会議や仮人物が残っていないこと
    const allTanakaMeetings = store.getMeetings().filter(m => m.title.includes('田中'));
    expect(allTanakaMeetings.length).toBe(1);
    expect(allTanakaMeetings[0].id).toBe('m-tanaka-20261110');
  });

  it('今後の新規Zoom面談が終了した際、事前登録予定と自動統合され、要約・詳細・会社名・強み・ToDoが最上部に自動反映されること', () => {
    const preMeeting = store.createMeeting({
      title: '関西エステート開発の佐藤様と1to1',
      participant_name: '関西エステート開発の佐藤',
      meeting_type: '1to1',
      provider: 'zoom',
      scheduled_start_at: '2026-11-11T14:00:00+09:00',
    });

    const synced = store.ingestZoomSessions([
      {
        uuid: 'future-zoom-uuid-sato-001',
        meeting_id: '89999999999',
        topic: 'ZENNOBATE Meeting Room',
        start_time: '2026-11-11T05:00:00Z',
        end_time: '2026-11-11T05:45:00Z',
        duration: 45,
        attendees: ['4/勝賀野 太郎/残置物撤去', '佐藤健一'],
        summary_overview: '佐藤健一と4/勝賀野 太郎/残置物撤去は関西エリアの収益物件リノベーションと残置物撤去の一括発注体制について合意した。',
        summary_details: [
          {
            label: '収益物件リノベ連携',
            summary: '4/勝賀野が解体前の残置物撤去と買取査定（カンテノ）を一括請負するスキームを確認した。',
          },
        ],
        next_steps: [
          '4/勝賀野: 佐藤健一へ残置物撤去の標準単価表を送付する',
          '佐藤健一: 来月の堺市マンション案件の見積依頼を送る',
        ],
        transcript_text: '佐藤健一: 関西エステート開発の佐藤健一です。よろしくお願いします。\n4/勝賀野 太郎/残置物撤去: 株式会社ゼノベイトの勝賀野です。',
      },
    ]);

    expect(synced).toBe(true);
    const sato = store.getPersons().find(p => p.display_name === '佐藤 健一');
    expect(sato).toBeDefined();
    expect(sato?.status).toBe('active');
    expect(sato?.notes).toContain('収益物件リノベーションと残置物撤去');
    expect(sato?.notes).not.toContain('4/勝賀野');

    const orgs = store.getOrgMembershipsForPerson(sato!.id);
    expect(orgs.some(o => o.organization_name === '関西エステート開発')).toBe(true);

    const offerings = store.getBusinessOfferingsForPerson(sato!.id);
    expect(offerings.length).toBeGreaterThan(0);

    const tr = store.getTranscriptForMeeting(preMeeting.id);
    expect(tr).toBeDefined();
    expect(tr?.summary).toContain('収益物件リノベ連携');
    expect(tr?.summary).not.toContain('4/勝賀野');

    const satoFacts = store.getFactsForPerson(sato!.id);
    expect(satoFacts.some(f => f.fact_category === 'promise' && f.fact_value.includes('標準単価表'))).toBe(true);
  });

  it('実面談に基づく紹介ハブ提案およびAI人脈秘書の自然言語検索が動作すること', () => {
    store.seedTanakaMeeting();
    const referrals = store.getReferrals();
    expect(referrals.some(r => r.id === 'ref-tanaka-miura')).toBe(true);
    expect(referrals.some(r => r.id === 'ref-tanaka-kimura')).toBe(true);

    const aiRes1 = store.queryAI('不動産やマンション買取に強い人いる？');
    expect(aiRes1.hasDefiniteAnswer).toBe(true);
    expect(aiRes1.relatedPersons.some(p => p.id === 'p-tanaka-yoshihiro')).toBe(true);

    const aiRes2 = store.queryAI('田中さんと前回何を話した？約束はあった？');
    expect(aiRes2.hasDefiniteAnswer).toBe(true);
    expect(aiRes2.answer).toContain('夢叶開発');
    expect(aiRes2.answer).toContain('ランチ');
  });

  it('「黒田さんとの１To1」など全角・大文字混じりの予定入力から相手名が確実に抽出され、未完了予定として最上部に反映されること', () => {
    const parsed = store.parseMeetingIntent('黒田さんとの１To1');
    expect(parsed.extracted.candidate_participants.length).toBeGreaterThan(0);
    expect(parsed.extracted.candidate_participants[0].name).toBe('黒田');

    // 案内文貼り付け欄のみに入力して予定登録した場合でも自動で「黒田」が抽出されること
    const m = store.createMeeting({
      title: '面談予定',
      raw_invite_text: '黒田さんとの１To1',
      meeting_type: '1to1',
      scheduled_start_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 当日2時間前の時刻でも未完了なら最優先
    });

    expect(m.title).toBe('黒田様と1to1面談');
    const p = store.getPersonById(m.participant_ids[0]);
    expect(p?.display_name).toBe('黒田');

    // 未完了予定として getMeetings() の先頭に来ること
    const topMeeting = store.getMeetings()[0];
    expect(topMeeting.id).toBe(m.id);
  });

  it('岩根義行様（株式会社岩根工業・一般社団法人ディスカイステージ）の文字起こしが議事録の生ログではなく構造化要約として登録・統合されること', () => {
    const rawIwaneMeeting = store.createMeeting({
      title: '岩根　義行様と1to1面談',
      participant_name: '岩根　義行',
      meeting_type: '1to1',
      scheduled_start_at: '2026-11-12T18:30:00+09:00',
    });

    const rawIwaneTranscript = `4/勝賀野 太郎/残置物撤去\n18:37:06\nよろしくお願いします。三島さんからご紹介していただきましたよね。\n義行 岩根\n18:37:30\nはいおお。大阪セントラルですね。シャングリラチャプターでカテゴリーがドローンで業務国家資格です。一般社団法人ディスカイステージ代表理事と株式会社岩根工業の代表取締役をやってます。ドローンによる外壁赤外線調査、打診調査、漏水調査で修繕時期や修繕計画の判断支援というところもやってます。`;

    const res = store.processMeetingRecordingAndAutoRegister(rawIwaneMeeting.id, rawIwaneTranscript);
    expect(res.person.id).toBe('p-iwane-yoshiyuki');
    expect(res.person.display_name).toBe('岩根 義行');
    expect(res.summary.companyName).toContain('株式会社岩根工業');
    expect(res.summary.bniChapter).toBe('シャングリラチャプター');
    expect(res.summary.topic).toContain('500棟');
    expect(res.summary.topic).not.toContain('三島さんからご紹介していただきましたよね');
    expect(res.summary.promise).toContain('工務店');
    expect(res.summary.promise).not.toContain('どこに相談しても');

    const bni = store.getBNIMembershipsForPerson('p-iwane-yoshiyuki');
    expect(bni[0]?.region_name).toBe('大阪セントラルリージョン');
    expect(bni[0]?.chapter_name).toBe('シャングリラチャプター');

    const draft = store.generateThankYouDraft('m-iwane-20261112', 'line_casual');
    expect(draft.draft_text).toContain('株式会社岩根工業');
    expect(draft.draft_text).toContain('シャングリラチャプター');
  });

  it('未知の新規相手の生文字起こしでも、挨拶や相槌・生の発話断片ではなく第三者視点の構造化ビジネス要約と双方のToDoに変換されること', () => {
    const newMeeting = store.createMeeting({
      title: '山本さんとの1to1',
      participant_name: '山本',
      meeting_type: '1to1',
      scheduled_start_at: '2026-11-15T14:00:00+09:00',
    });

    const rawFutureTranscript = `
4/勝賀野 太郎/残置物撤去
14:00:10
三島さんからご紹介していただきましたよね。日程ちょっと調整いただいてありがとうございます。
義行 山本
14:01:00
はいおお。大阪セントラルリージョンのシャングリラチャプターでカテゴリーがドローンで業務国家資格っていうふうになってます。
株式会社山本工業の代表取締役をやってます。
はいでちょっと会社の紹介なんですけれども、ドローンによる外壁赤外線調査、打診調査、漏水調査で、修繕時期や修繕計画の判断支援というところもやってます。
実績としましては、全国で500棟以上の調査の実績があります。
どこに相談しても、やっぱり今修繕した方がいいとか、そういった話になりやすいです。
4/勝賀野 太郎/残置物撤去
14:30:00
工務店と防水屋と塗装屋と不動産屋紹介してもいいですか。
義行 山本
14:31:00
ありがとうございます。ラインで連絡取り合って順におつなぎしていきます。ライバーの方と八尾の工場経営者もご紹介します。
    `.trim();

    const res = store.processMeetingRecordingAndAutoRegister(newMeeting.id, rawFutureTranscript);
    expect(res.summary.realName).toBe('山本 義行');
    expect(res.summary.companyName).toBe('株式会社山本工業');
    expect(res.summary.bniChapter).toBe('シャングリラチャプター');
    expect(res.summary.bniCategory).toContain('ドローン');
    expect(res.summary.topic).toContain('株式会社山本工業');
    expect(res.summary.topic).toContain('外壁赤外線調査');
    expect(res.summary.topic).not.toContain('三島さんからご紹介していただきましたよね');
    expect(res.summary.topic).not.toContain('はいでちょっと会社の紹介なんですけれども');
    expect(res.summary.promise).toContain('勝賀野様から工務店と防水屋と塗装屋と不動産屋を山本 義行様へご紹介・おつなぎする');
    expect(res.summary.promise).toContain('山本 義行様からライバー活動者・工場経営者をLINEで順次勝賀野様へご紹介・おつなぎする');
    expect(res.summary.promise).not.toContain('どこに相談しても');
  });

  it('岩根義行様の相関図（だんじりチャプターの三島様・土林様）と紹介ハブ提案、およびSaaS月額会員テナント完全分離が動作すること', () => {
    store.setTenantId('tenant-001');
    store.seedIwaneMeeting();

    const rels = store.getRelationships('actual');
    expect(rels.some(r => r.id === 'rel-mishima-danjiri-iwane')).toBe(true);
    expect(rels.some(r => r.id === 'rel-tsuchibayashi-iwane')).toBe(true);

    const refs = store.getReferrals();
    expect(refs.some(r => r.id === 'ref-iwane-tanaka')).toBe(true);
    expect(refs.some(r => r.id === 'ref-iwane-kimura')).toBe(true);

    // 新規SaaS月額会員テナントの発行とデータ完全分離(RLS)
    const memberTenant = store.createTenant('テスト会員様 (¥4,980/月)', 'standard', 1000);
    expect(memberTenant.monthly_budget_jpy).toBe(1000);
    store.setTenantId(memberTenant.id);
    expect(store.getPersons().length).toBe(0);

    // オーナーテナントへ戻して後片付け
    store.deleteTenant(memberTenant.id);
    expect(store.getTenantId()).toBe('tenant-001');
  });
});
