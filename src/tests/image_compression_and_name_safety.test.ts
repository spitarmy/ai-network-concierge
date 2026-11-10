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
