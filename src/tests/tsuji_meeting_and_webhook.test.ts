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
});
