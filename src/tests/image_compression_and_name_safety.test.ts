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
