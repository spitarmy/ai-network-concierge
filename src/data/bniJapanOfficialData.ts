// BNI Japan 公式ウェブサイト (https://bni.jp/ja/chapterlist) より取得した全国公式リージョン・チャプターマスターデータ
import { BNIRegion, BNIChapter } from '../types';

export const OFFICIAL_BNI_REGIONS: BNIRegion[] = [
  {
    "id": "reg-osaka-n",
    "prefecture": "大阪府",
    "region_code": "OSAKA_N",
    "region_name": "大阪シティNorthリージョン (Osaka City North)"
  },
  {
    "id": "reg-osaka-c",
    "prefecture": "大阪府",
    "region_code": "OSAKA_C",
    "region_name": "大阪シティセントラルリージョン (Osaka City Central)"
  },
  {
    "id": "reg-osaka-e",
    "prefecture": "大阪府",
    "region_code": "OSAKA_E",
    "region_name": "大阪東リージョン (Osaka East)"
  },
  {
    "id": "reg-osaka-ne",
    "prefecture": "大阪府",
    "region_code": "OSAKA_NE",
    "region_name": "大阪北東リージョン (Osaka North East)"
  },
  {
    "id": "reg-kyoto",
    "prefecture": "京都府",
    "region_code": "KYOTO",
    "region_name": "京都シティセントラルリージョン (Kyoto City Central)"
  },
  {
    "id": "reg-kobe-central",
    "prefecture": "兵庫県",
    "region_code": "KOBE_CENTRAL",
    "region_name": "神戸セントラルリージョン (Kobe Central)"
  },
  {
    "id": "reg-kobe-east",
    "prefecture": "兵庫県",
    "region_code": "KOBE_EAST",
    "region_name": "神戸東リージョン (Kobe East)"
  },
  {
    "id": "reg-himeji",
    "prefecture": "兵庫県",
    "region_code": "HIMEJI",
    "region_name": "姫路リージョン (Himeji)"
  },
  {
    "id": "reg-shiga-west",
    "prefecture": "滋賀県",
    "region_code": "SHIGA_WEST",
    "region_name": "滋賀西・京都北リージョン (Shiga West)"
  },
  {
    "id": "reg-nara-city-kyoto-south",
    "prefecture": "奈良県",
    "region_code": "NARA_CITY_KYOTO_SOUTH",
    "region_name": "奈良市京都南リージョン (Nara City Kyoto South)"
  },
  {
    "id": "reg-tama-west",
    "prefecture": "東京都",
    "region_code": "TAMA_WEST",
    "region_name": "多摩西リージョン (Tama West)"
  },
  {
    "id": "reg-tama-east",
    "prefecture": "東京都",
    "region_code": "TAMA_EAST",
    "region_name": "多摩東リージョン (Tama East)"
  },
  {
    "id": "reg-tokyo-bc-bc",
    "prefecture": "東京都",
    "region_code": "TOKYO_BC_BC",
    "region_name": "東京BCリージョン (Tokyo BC)"
  },
  {
    "id": "reg-tokyo-ms-ms",
    "prefecture": "東京都",
    "region_code": "TOKYO_MS_MS",
    "region_name": "東京MSリージョン (Tokyo MS)"
  },
  {
    "id": "reg-tokyo-ne-n-e",
    "prefecture": "東京都",
    "region_code": "TOKYO_NE_N_E",
    "region_name": "東京N.E.リージョン (Tokyo NE)"
  },
  {
    "id": "reg-tokyo-minato-chuo",
    "prefecture": "東京都",
    "region_code": "TOKYO_MINATO_CHUO",
    "region_name": "東京港中央リージョン (Tokyo Minato Chuo)"
  },
  {
    "id": "reg-tokyo-shibuya",
    "prefecture": "東京都",
    "region_code": "TOKYO_SHIBUYA",
    "region_name": "東京渋谷リージョン (Tokyo Shibuya)"
  },
  {
    "id": "reg-tokyo-shibuya-east",
    "prefecture": "東京都",
    "region_code": "TOKYO_SHIBUYA_EAST",
    "region_name": "東京渋谷東リージョン (Tokyo Shibuya East)"
  },
  {
    "id": "reg-tokyo-shinjuku",
    "prefecture": "東京都",
    "region_code": "TOKYO_SHINJUKU",
    "region_name": "東京新宿リージョン (Tokyo Shinjuku)"
  },
  {
    "id": "reg-tokyo-chiyoda",
    "prefecture": "東京都",
    "region_code": "TOKYO_CHIYODA",
    "region_name": "東京千代田リージョン (Tokyo Chiyoda)"
  },
  {
    "id": "reg-tokyo-chuo-east",
    "prefecture": "東京都",
    "region_code": "TOKYO_CHUO_EAST",
    "region_name": "東京中央東リージョン (Tokyo Chuo East)"
  },
  {
    "id": "reg-tokyo-sumida",
    "prefecture": "東京都",
    "region_code": "TOKYO_SUMIDA",
    "region_name": "東京墨田リージョン (Tokyo Sumida)"
  },
  {
    "id": "reg-yokohama-central",
    "prefecture": "神奈川県",
    "region_code": "YOKOHAMA_CENTRAL",
    "region_name": "横浜セントラルリージョン (Yokohama Central)"
  },
  {
    "id": "reg-chiba-central",
    "prefecture": "千葉県",
    "region_code": "CHIBA_CENTRAL",
    "region_name": "千葉セントラルリージョン (Chiba Central)"
  },
  {
    "id": "reg-chiba-keiyo",
    "prefecture": "千葉県",
    "region_code": "CHIBA_KEIYO",
    "region_name": "千葉京葉リージョン (Chiba Keiyo)"
  },
  {
    "id": "reg-saitama-central",
    "prefecture": "埼玉県",
    "region_code": "SAITAMA_CENTRAL",
    "region_name": "さいたま中央リージョン (Saitama Central)"
  },
  {
    "id": "reg-mikawa-west",
    "prefecture": "愛知県",
    "region_code": "MIKAWA_WEST",
    "region_name": "三河西リージョン (Mikawa West)"
  },
  {
    "id": "reg-mikawa-east",
    "prefecture": "愛知県",
    "region_code": "MIKAWA_EAST",
    "region_name": "三河東リージョン (Mikawa East)"
  },
  {
    "id": "reg-chita-nagoya-east-east",
    "prefecture": "愛知県",
    "region_code": "CHITA_NAGOYA_EAST_EAST",
    "region_name": "知多・名古屋 EASTリージョン (Chita Nagoya EAST)"
  },
  {
    "id": "reg-nagoya-se-se",
    "prefecture": "愛知県",
    "region_code": "NAGOYA_SE_SE",
    "region_name": "名古屋SEリージョン (Nagoya SE)"
  },
  {
    "id": "reg-nagoya-central",
    "prefecture": "愛知県",
    "region_code": "NAGOYA_CENTRAL",
    "region_name": "名古屋セントラルリージョン (Nagoya Central)"
  },
  {
    "id": "reg-chikugo",
    "prefecture": "福岡県",
    "region_code": "CHIKUGO",
    "region_name": "筑後リージョン (Chikugo)"
  },
  {
    "id": "reg-fukuoka-hakata",
    "prefecture": "福岡県",
    "region_code": "FUKUOKA_HAKATA",
    "region_name": "福岡博多リージョン (Fukuoka Hakata)"
  },
  {
    "id": "reg-kitakyushu-east",
    "prefecture": "福岡県",
    "region_code": "KITAKYUSHU_EAST",
    "region_name": "北九州東リージョン (Kitakyushu East)"
  },
  {
    "id": "reg-ibaraki-south",
    "prefecture": "茨城県",
    "region_code": "IBARAKI_SOUTH",
    "region_name": "茨城南リージョン (Ibaraki South)"
  },
  {
    "id": "reg-okinawa",
    "prefecture": "沖縄県",
    "region_code": "OKINAWA",
    "region_name": "沖縄リージョン (Okinawa)"
  },
  {
    "id": "reg-gifu-city",
    "prefecture": "岐阜県",
    "region_code": "GIFU_CITY",
    "region_name": "岐阜シティリージョン (Gifu City)"
  },
  {
    "id": "reg-gifu-owari-east",
    "prefecture": "岐阜県",
    "region_code": "GIFU_OWARI_EAST",
    "region_name": "岐阜尾張東リージョン (Gifu Owari East)"
  },
  {
    "id": "reg-miyazaki",
    "prefecture": "宮崎県",
    "region_code": "MIYAZAKI",
    "region_name": "宮崎リージョン (Miyazaki)"
  },
  {
    "id": "reg-sendai-central",
    "prefecture": "宮城県",
    "region_code": "SENDAI_CENTRAL",
    "region_name": "仙台セントラルリージョン (Sendai Central)"
  },
  {
    "id": "reg-kumamoto-city",
    "prefecture": "熊本県",
    "region_code": "KUMAMOTO_CITY",
    "region_name": "熊本シティリージョン (Kumamoto City)"
  },
  {
    "id": "reg-gunma-east",
    "prefecture": "群馬県",
    "region_code": "GUNMA_EAST",
    "region_name": "群馬東リージョン (Gunma East)"
  },
  {
    "id": "reg-hiroshima-city-central",
    "prefecture": "広島県",
    "region_code": "HIROSHIMA_CITY_CENTRAL",
    "region_name": "広島シティセントラルリージョン (Hiroshima City Central)"
  },
  {
    "id": "reg-mie",
    "prefecture": "三重県",
    "region_code": "MIE",
    "region_name": "三重リージョン (Mie)"
  },
  {
    "id": "reg-yamaguchi",
    "prefecture": "山口県",
    "region_code": "YAMAGUCHI",
    "region_name": "山口リージョン (Yamaguchi)"
  },
  {
    "id": "reg-shizuoka-central",
    "prefecture": "静岡県",
    "region_code": "SHIZUOKA_CENTRAL",
    "region_name": "静岡セントラルリージョン (Shizuoka Central)"
  },
  {
    "id": "reg-hamamatsu",
    "prefecture": "静岡県",
    "region_code": "HAMAMATSU",
    "region_name": "浜松リージョン (Hamamatsu)"
  },
  {
    "id": "reg-kanazawa-north-noto",
    "prefecture": "石川県",
    "region_code": "KANAZAWA_NORTH_NOTO",
    "region_name": "金沢北・能登リージョン (Kanazawa North Noto)"
  },
  {
    "id": "reg-oita",
    "prefecture": "大分県",
    "region_code": "OITA",
    "region_name": "大分リージョン (Oita)"
  },
  {
    "id": "reg-nagano",
    "prefecture": "長野県",
    "region_code": "NAGANO",
    "region_name": "長野リージョン (Nagano)"
  },
  {
    "id": "reg-toyama",
    "prefecture": "富山県",
    "region_code": "TOYAMA",
    "region_name": "富山リージョン (Toyama)"
  },
  {
    "id": "reg-fukui",
    "prefecture": "福井県",
    "region_code": "FUKUI",
    "region_name": "福井リージョン (Fukui)"
  },
  {
    "id": "reg-sapporo-central",
    "prefecture": "北海道",
    "region_code": "SAPPORO_CENTRAL",
    "region_name": "札幌セントラルリージョン (Sapporo Central)"
  }
];

export const OFFICIAL_BNI_CHAPTERS: BNIChapter[] = [
  {
    "id": "chap-osaka-shangrila",
    "region_id": "reg-osaka-c",
    "chapter_name": "シャングリラチャプター",
    "meeting_day": "火曜",
    "meeting_time": "6:45 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-osaka-danjiri",
    "region_id": "reg-osaka-e",
    "chapter_name": "だんじりチャプター",
    "meeting_day": "水曜",
    "meeting_time": "10:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-1",
    "region_id": "reg-kyoto",
    "chapter_name": "3Winチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-2",
    "region_id": "reg-tokyo-ms-ms",
    "chapter_name": "AAAチャプター",
    "meeting_day": "木曜",
    "meeting_time": "9:40 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-3",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "Abundanceチャプター",
    "meeting_day": "金曜",
    "meeting_time": "9:15 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-4",
    "region_id": "reg-tokyo-chiyoda",
    "chapter_name": "Activeチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-5",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "AIMチャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-6",
    "region_id": "reg-chiba-keiyo",
    "chapter_name": "ALL STARSチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-7",
    "region_id": "reg-okinawa",
    "chapter_name": "AMAMIKUチャプター",
    "meeting_day": "木曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-8",
    "region_id": "reg-osaka-n",
    "chapter_name": "Ambitiousチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-9",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "Anchorチャプター",
    "meeting_day": "水曜",
    "meeting_time": "9:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-10",
    "region_id": "reg-mikawa-west",
    "chapter_name": "AOIチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-11",
    "region_id": "reg-yokohama-central",
    "chapter_name": "APOLLOチャプター",
    "meeting_day": "水曜",
    "meeting_time": "9:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-12",
    "region_id": "reg-osaka-c",
    "chapter_name": "AQUAチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-13",
    "region_id": "reg-fukui",
    "chapter_name": "Arkチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-14",
    "region_id": "reg-yokohama-central",
    "chapter_name": "ARTEMISチャプター",
    "meeting_day": "火曜",
    "meeting_time": "9:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-15",
    "region_id": "reg-nagoya-central",
    "chapter_name": "ASSEMBLEチャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-16",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "ASTERIAチャプター",
    "meeting_day": "金曜",
    "meeting_time": "9:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-17",
    "region_id": "reg-chikugo",
    "chapter_name": "AZVEILチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-18",
    "region_id": "reg-osaka-ne",
    "chapter_name": "BAGUSチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-19",
    "region_id": "reg-chiba-central",
    "chapter_name": "Balloonチャプター",
    "meeting_day": "火曜",
    "meeting_time": "10:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-20",
    "region_id": "reg-tokyo-shibuya",
    "chapter_name": "Bambooチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-21",
    "region_id": "reg-yokohama-central",
    "chapter_name": "Bayチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-22",
    "region_id": "reg-tokyo-ms-ms",
    "chapter_name": "BeBeeチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-23",
    "region_id": "reg-tokyo-shibuya-east",
    "chapter_name": "BESIDEチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-24",
    "region_id": "reg-nara-city-kyoto-south",
    "chapter_name": "BeWithチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-25",
    "region_id": "reg-kyoto",
    "chapter_name": "Beyondチャプター",
    "meeting_day": "金曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-26",
    "region_id": "reg-osaka-e",
    "chapter_name": "birdieチャプター",
    "meeting_day": "金曜",
    "meeting_time": "9:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-27",
    "region_id": "reg-nagoya-central",
    "chapter_name": "BLAZEチャプター",
    "meeting_day": "水曜",
    "meeting_time": "10:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-28",
    "region_id": "reg-yokohama-central",
    "chapter_name": "BLOSSOMチャプター",
    "meeting_day": "木曜",
    "meeting_time": "11:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-29",
    "region_id": "reg-shiga-west",
    "chapter_name": "BLUE GIANTチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-30",
    "region_id": "reg-okinawa",
    "chapter_name": "Blue Oceanチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-31",
    "region_id": "reg-osaka-e",
    "chapter_name": "BONDチャプター",
    "meeting_day": "金曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-32",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "bonheurチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:15 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-33",
    "region_id": "reg-osaka-n",
    "chapter_name": "Borderlessチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-34",
    "region_id": "reg-nara-city-kyoto-south",
    "chapter_name": "BRAVOチャプター",
    "meeting_day": "水曜",
    "meeting_time": "6:15 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-36",
    "region_id": "reg-kitakyushu-east",
    "chapter_name": "Bridge ∞ Linkチャプター",
    "meeting_day": "月曜",
    "meeting_time": "3:00 PM (対面)",
    "is_verified": true
  },
  {
    "id": "chap-bni-37",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "BRIDGETチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-35",
    "region_id": "reg-osaka-n",
    "chapter_name": "Bridgeチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-38",
    "region_id": "reg-yokohama-central",
    "chapter_name": "BtoB-Acrossチャプター",
    "meeting_day": "火曜",
    "meeting_time": "9:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-39",
    "region_id": "reg-tokyo-sumida",
    "chapter_name": "BULL UPチャプター",
    "meeting_day": "火曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-40",
    "region_id": "reg-osaka-ne",
    "chapter_name": "CanNonチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-41",
    "region_id": "reg-hiroshima-city-central",
    "chapter_name": "CANVASチャプター",
    "meeting_day": "金曜",
    "meeting_time": "6:20 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-42",
    "region_id": "reg-osaka-ne",
    "chapter_name": "Colorfullチャプター",
    "meeting_day": "水曜",
    "meeting_time": "9:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-43",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "Confioirチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:15 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-44",
    "region_id": "reg-kanazawa-north-noto",
    "chapter_name": "Connexionチャプター",
    "meeting_day": "水曜",
    "meeting_time": "10:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-45",
    "region_id": "reg-kumamoto-city",
    "chapter_name": "Contributionチャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-46",
    "region_id": "reg-gunma-east",
    "chapter_name": "Craneチャプター",
    "meeting_day": "火曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-47",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "Createチャプター",
    "meeting_day": "木曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-48",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "Cross Pointチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-49",
    "region_id": "reg-nagoya-se-se",
    "chapter_name": "CSチャプター",
    "meeting_day": "水曜",
    "meeting_time": "9:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-50",
    "region_id": "reg-nara-city-kyoto-south",
    "chapter_name": "DEERチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-51",
    "region_id": "reg-tokyo-chiyoda",
    "chapter_name": "Diamondチャプター",
    "meeting_day": "水曜",
    "meeting_time": "8:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-52",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "DIANAチャプター",
    "meeting_day": "水曜",
    "meeting_time": "9:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-54",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "DragonFlyチャプター",
    "meeting_day": "火曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-53",
    "region_id": "reg-okinawa",
    "chapter_name": "Dragonチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-55",
    "region_id": "reg-chiba-keiyo",
    "chapter_name": "DREAM BIGチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-56",
    "region_id": "reg-chita-nagoya-east-east",
    "chapter_name": "Dreamsチャプター",
    "meeting_day": "火曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-57",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "EAGLEチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:15 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-58",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "EduTechチャプター",
    "meeting_day": "水曜",
    "meeting_time": "1:00 PM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-59",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "ELEVAREチャプター",
    "meeting_day": "水曜",
    "meeting_time": "10:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-60",
    "region_id": "reg-osaka-c",
    "chapter_name": "Empowerチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-61",
    "region_id": "reg-hamamatsu",
    "chapter_name": "ENISHIチャプター",
    "meeting_day": "火曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-62",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "ETOILEチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-73",
    "region_id": "reg-tokyo-ms-ms",
    "chapter_name": "F×Rチャプター",
    "meeting_day": "火曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-63",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "Feliceチャプター",
    "meeting_day": "火曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-64",
    "region_id": "reg-toyama",
    "chapter_name": "FireFlyチャプター",
    "meeting_day": "火曜",
    "meeting_time": "8:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-65",
    "region_id": "reg-osaka-e",
    "chapter_name": "Five-Starsチャプター",
    "meeting_day": "水曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-66",
    "region_id": "reg-osaka-c",
    "chapter_name": "FLAGチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-67",
    "region_id": "reg-nara-city-kyoto-south",
    "chapter_name": "FLIGHTチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-68",
    "region_id": "reg-hiroshima-city-central",
    "chapter_name": "FOCUSチャプター",
    "meeting_day": "水曜",
    "meeting_time": "9:45 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-69",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "FortySevenチャプター",
    "meeting_day": "水曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-70",
    "region_id": "reg-kyoto",
    "chapter_name": "Forwardチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-71",
    "region_id": "reg-osaka-ne",
    "chapter_name": "FourEdgeチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-72",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "FUN and FUNチャプター",
    "meeting_day": "火曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-74",
    "region_id": "reg-nagoya-central",
    "chapter_name": "G.O.チャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-75",
    "region_id": "reg-osaka-ne",
    "chapter_name": "GaiYenチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-76",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "GGチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-77",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "GIFTチャプター",
    "meeting_day": "金曜",
    "meeting_time": "10:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-78",
    "region_id": "reg-gifu-city",
    "chapter_name": "GIFUTOチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-79",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "GOATチャプター",
    "meeting_day": "火曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-80",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "GoENチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-82",
    "region_id": "reg-kanazawa-north-noto",
    "chapter_name": "Gold Valleyチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-81",
    "region_id": "reg-nagoya-se-se",
    "chapter_name": "Goldチャプター",
    "meeting_day": "火曜",
    "meeting_time": "5:00 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-83",
    "region_id": "reg-chita-nagoya-east-east",
    "chapter_name": "Gorgeousチャプター",
    "meeting_day": "金曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-84",
    "region_id": "reg-okinawa",
    "chapter_name": "Graceチャプター",
    "meeting_day": "水曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-85",
    "region_id": "reg-osaka-c",
    "chapter_name": "GRAINチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-86",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "GRANDIRチャプター",
    "meeting_day": "金曜",
    "meeting_time": "9:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-87",
    "region_id": "reg-chita-nagoya-east-east",
    "chapter_name": "Greenチャプター",
    "meeting_day": "水曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-88",
    "region_id": "reg-hiroshima-city-central",
    "chapter_name": "GRITチャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-89",
    "region_id": "reg-tokyo-chiyoda",
    "chapter_name": "Growthチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-90",
    "region_id": "reg-nara-city-kyoto-south",
    "chapter_name": "GTチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-91",
    "region_id": "reg-okinawa",
    "chapter_name": "Haisaiチャプター",
    "meeting_day": "水曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-92",
    "region_id": "reg-miyazaki",
    "chapter_name": "HI-NA-TAチャプター",
    "meeting_day": "火曜",
    "meeting_time": "10:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-93",
    "region_id": "reg-osaka-n",
    "chapter_name": "HIKARIチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-94",
    "region_id": "reg-tokyo-shinjuku",
    "chapter_name": "HIVEチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-95",
    "region_id": "reg-tokyo-chiyoda",
    "chapter_name": "I-YASAKAチャプター",
    "meeting_day": "金曜",
    "meeting_time": "1:00 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-96",
    "region_id": "reg-sapporo-central",
    "chapter_name": "ICE CRESTチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:30 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-97",
    "region_id": "reg-hiroshima-city-central",
    "chapter_name": "IKIGAIチャプター",
    "meeting_day": "火曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-98",
    "region_id": "reg-tokyo-shibuya-east",
    "chapter_name": "Illuminateチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-99",
    "region_id": "reg-tokyo-ms-ms",
    "chapter_name": "IMPACTチャプター",
    "meeting_day": "金曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-100",
    "region_id": "reg-tokyo-chiyoda",
    "chapter_name": "Innovationチャプター",
    "meeting_day": "水曜",
    "meeting_time": "5:00 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-101",
    "region_id": "reg-fukui",
    "chapter_name": "INTERACTチャプター",
    "meeting_day": "水曜",
    "meeting_time": "4:30 PM (対面)",
    "is_verified": true
  },
  {
    "id": "chap-bni-102",
    "region_id": "reg-tama-east",
    "chapter_name": "J-ONEチャプター",
    "meeting_day": "金曜",
    "meeting_time": "6:35 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-103",
    "region_id": "reg-tokyo-chiyoda",
    "chapter_name": "Justiceチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-104",
    "region_id": "reg-tokyo-chuo-east",
    "chapter_name": "KABUTOチャプター",
    "meeting_day": "木曜",
    "meeting_time": "5:00 PM (対面)",
    "is_verified": true
  },
  {
    "id": "chap-bni-105",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "KAIGANチャプター",
    "meeting_day": "水曜",
    "meeting_time": "5:45 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-106",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "KerNelチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:15 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-107",
    "region_id": "reg-yokohama-central",
    "chapter_name": "KOAチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-108",
    "region_id": "reg-shiga-west",
    "chapter_name": "Lakeチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-109",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "LAPISチャプター",
    "meeting_day": "水曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-110",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "Legacyチャプター",
    "meeting_day": "木曜",
    "meeting_time": "8:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-111",
    "region_id": "reg-gifu-owari-east",
    "chapter_name": "LEGENDチャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:45 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-112",
    "region_id": "reg-osaka-ne",
    "chapter_name": "LEOチャプター",
    "meeting_day": "木曜",
    "meeting_time": "10:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-113",
    "region_id": "reg-okinawa",
    "chapter_name": "Lequiosチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-114",
    "region_id": "reg-tokyo-ms-ms",
    "chapter_name": "Libertaチャプター",
    "meeting_day": "水曜",
    "meeting_time": "9:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-115",
    "region_id": "reg-kobe-east",
    "chapter_name": "Linksチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-116",
    "region_id": "reg-kitakyushu-east",
    "chapter_name": "Loopチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-117",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "loveconeチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-118",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "Loveknotチャプター",
    "meeting_day": "金曜",
    "meeting_time": "11:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-119",
    "region_id": "reg-kanazawa-north-noto",
    "chapter_name": "LUMINAチャプター",
    "meeting_day": "火曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-120",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "LUMINOUSチャプター",
    "meeting_day": "土曜",
    "meeting_time": "9:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-121",
    "region_id": "reg-kyoto",
    "chapter_name": "Magicalチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-122",
    "region_id": "reg-yokohama-central",
    "chapter_name": "Majesticチャプター",
    "meeting_day": "金曜",
    "meeting_time": "8:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-123",
    "region_id": "reg-kumamoto-city",
    "chapter_name": "Make itチャプター",
    "meeting_day": "火曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-124",
    "region_id": "reg-chiba-keiyo",
    "chapter_name": "Mana Olanaチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-125",
    "region_id": "reg-osaka-n",
    "chapter_name": "Marvellousチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-126",
    "region_id": "reg-tokyo-ms-ms",
    "chapter_name": "MaSterMindチャプター",
    "meeting_day": "金曜",
    "meeting_time": "10:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-127",
    "region_id": "reg-nagoya-central",
    "chapter_name": "MAXチャプター",
    "meeting_day": "金曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-128",
    "region_id": "reg-yokohama-central",
    "chapter_name": "MEDICALチャプター",
    "meeting_day": "木曜",
    "meeting_time": "8:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-129",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "Mercuryチャプター",
    "meeting_day": "水曜",
    "meeting_time": "9:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-130",
    "region_id": "reg-kanazawa-north-noto",
    "chapter_name": "Milioneチャプター",
    "meeting_day": "金曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-131",
    "region_id": "reg-gunma-east",
    "chapter_name": "MIRAISMチャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:45 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-132",
    "region_id": "reg-osaka-e",
    "chapter_name": "Mountain Peakチャプター",
    "meeting_day": "火曜",
    "meeting_time": "10:00 AM (対面)",
    "is_verified": true
  },
  {
    "id": "chap-bni-133",
    "region_id": "reg-nagoya-se-se",
    "chapter_name": "MSGsチャプター",
    "meeting_day": "金曜",
    "meeting_time": "9:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-134",
    "region_id": "reg-tokyo-ms-ms",
    "chapter_name": "Mt.チャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-135",
    "region_id": "reg-tama-west",
    "chapter_name": "MUGENNチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-136",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "MUSCLEチャプター",
    "meeting_day": "金曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-137",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "NATION DRIVEチャプター",
    "meeting_day": "金曜",
    "meeting_time": "3:00 PM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-138",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "NEOチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-139",
    "region_id": "reg-nagoya-se-se",
    "chapter_name": "New Styleチャプター",
    "meeting_day": "金曜",
    "meeting_time": "9:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-140",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "NEXIAチャプター",
    "meeting_day": "月曜",
    "meeting_time": "5:30 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-141",
    "region_id": "reg-nagoya-central",
    "chapter_name": "Next Linkチャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:30 PM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-142",
    "region_id": "reg-osaka-n",
    "chapter_name": "Next Neoチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-143",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "NOBELIAチャプター",
    "meeting_day": "金曜",
    "meeting_time": "9:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-144",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "O.K.チャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-145",
    "region_id": "reg-chiba-central",
    "chapter_name": "OMOIYARIチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-146",
    "region_id": "reg-kitakyushu-east",
    "chapter_name": "ONE Teamチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-147",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "OuVrirチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-148",
    "region_id": "reg-osaka-ne",
    "chapter_name": "ParadigmShiftチャプター",
    "meeting_day": "金曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-149",
    "region_id": "reg-chita-nagoya-east-east",
    "chapter_name": "Paradiseチャプター",
    "meeting_day": "金曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-150",
    "region_id": "reg-chita-nagoya-east-east",
    "chapter_name": "PASSIONチャプター",
    "meeting_day": "金曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-151",
    "region_id": "reg-tokyo-shinjuku",
    "chapter_name": "Preciousチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-152",
    "region_id": "reg-gifu-owari-east",
    "chapter_name": "PRELUDEチャプター",
    "meeting_day": "水曜",
    "meeting_time": "10:30 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-153",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "Premierチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-154",
    "region_id": "reg-tokyo-chiyoda",
    "chapter_name": "Rabbit burrowチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-155",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "Rainbowチャプター",
    "meeting_day": "火曜",
    "meeting_time": "8:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-156",
    "region_id": "reg-tokyo-chiyoda",
    "chapter_name": "RANUNCULUSチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:15 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-157",
    "region_id": "reg-osaka-c",
    "chapter_name": "REALIZEチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-158",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "Reverieチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 PM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-159",
    "region_id": "reg-yokohama-central",
    "chapter_name": "Revivalチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-160",
    "region_id": "reg-kyoto",
    "chapter_name": "REvoチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-161",
    "region_id": "reg-fukui",
    "chapter_name": "RiaSチャプター",
    "meeting_day": "水曜",
    "meeting_time": "10:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-162",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "Rise Upチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-163",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "Rising-Jチャプター",
    "meeting_day": "金曜",
    "meeting_time": "9:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-164",
    "region_id": "reg-hiroshima-city-central",
    "chapter_name": "ROUTEチャプター",
    "meeting_day": "火曜",
    "meeting_time": "6:45 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-165",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "S1チャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-166",
    "region_id": "reg-osaka-e",
    "chapter_name": "SAKURAチャプター",
    "meeting_day": "火曜",
    "meeting_time": "11:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-167",
    "region_id": "reg-hamamatsu",
    "chapter_name": "SanSunチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-168",
    "region_id": "reg-shiga-west",
    "chapter_name": "SEEDチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-169",
    "region_id": "reg-tokyo-chiyoda",
    "chapter_name": "SHINSEIチャプター",
    "meeting_day": "木曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-170",
    "region_id": "reg-saitama-central",
    "chapter_name": "SHRINEチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-171",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "SILVISチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-172",
    "region_id": "reg-osaka-c",
    "chapter_name": "Smileチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-173",
    "region_id": "reg-tokyo-ms-ms",
    "chapter_name": "SOLIDチャプター",
    "meeting_day": "木曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-174",
    "region_id": "reg-kyoto",
    "chapter_name": "Soulfulチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-175",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "SPREADチャプター",
    "meeting_day": "水曜",
    "meeting_time": "4:00 PM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-176",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "SQUADチャプター",
    "meeting_day": "水曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-177",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "SRチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-178",
    "region_id": "reg-fukui",
    "chapter_name": "STARチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-179",
    "region_id": "reg-osaka-n",
    "chapter_name": "Strongチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-180",
    "region_id": "reg-osaka-ne",
    "chapter_name": "SUBARUチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-181",
    "region_id": "reg-tokyo-chuo-east",
    "chapter_name": "SUNチャプター",
    "meeting_day": "火曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-182",
    "region_id": "reg-tokyo-bc-bc",
    "chapter_name": "SUNファンチャプター",
    "meeting_day": "水曜",
    "meeting_time": "9:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-183",
    "region_id": "reg-tokyo-ms-ms",
    "chapter_name": "Supremeチャプター",
    "meeting_day": "木曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-184",
    "region_id": "reg-tokyo-ms-ms",
    "chapter_name": "Symphonyチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-185",
    "region_id": "reg-yokohama-central",
    "chapter_name": "SYNERGYチャプター",
    "meeting_day": "水曜",
    "meeting_time": "6:40 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-186",
    "region_id": "reg-kobe-east",
    "chapter_name": "TAKAMIチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-187",
    "region_id": "reg-osaka-n",
    "chapter_name": "TAKUMIチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-188",
    "region_id": "reg-osaka-ne",
    "chapter_name": "Task e 愛チャプター",
    "meeting_day": "金曜",
    "meeting_time": "9:30 AM (対面)",
    "is_verified": true
  },
  {
    "id": "chap-bni-189",
    "region_id": "reg-mikawa-west",
    "chapter_name": "TATSUKIチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-190",
    "region_id": "reg-tokyo-chuo-east",
    "chapter_name": "TENxチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-191",
    "region_id": "reg-okinawa",
    "chapter_name": "Thanksチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-192",
    "region_id": "reg-osaka-c",
    "chapter_name": "THREEチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-193",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "ThunderVoltチャプター",
    "meeting_day": "木曜",
    "meeting_time": "9:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-194",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "Tifonetチャプター",
    "meeting_day": "火曜",
    "meeting_time": "8:30 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-195",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "to Uチャプター",
    "meeting_day": "水曜",
    "meeting_time": "9:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-196",
    "region_id": "reg-nagoya-central",
    "chapter_name": "TOMORROWLANDチャプター",
    "meeting_day": "水曜",
    "meeting_time": "10:30 AM (対面)",
    "is_verified": true
  },
  {
    "id": "chap-bni-197",
    "region_id": "reg-okinawa",
    "chapter_name": "TOPチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-198",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "TRES STELLASチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-199",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "TRINITYチャプター",
    "meeting_day": "水曜",
    "meeting_time": "9:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-200",
    "region_id": "reg-tokyo-shibuya",
    "chapter_name": "TRIUMPHチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-201",
    "region_id": "reg-yokohama-central",
    "chapter_name": "Trustチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-202",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "UKAチャプター",
    "meeting_day": "木曜",
    "meeting_time": "11:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-203",
    "region_id": "reg-osaka-c",
    "chapter_name": "UNiTYチャプター",
    "meeting_day": "水曜",
    "meeting_time": "3:00 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-204",
    "region_id": "reg-mikawa-west",
    "chapter_name": "UNSTOPPABLEチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-205",
    "region_id": "reg-sapporo-central",
    "chapter_name": "Via Novaチャプター",
    "meeting_day": "水曜",
    "meeting_time": "10:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-206",
    "region_id": "reg-tokyo-ne-n-e",
    "chapter_name": "VORTEXチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:15 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-207",
    "region_id": "reg-yokohama-central",
    "chapter_name": "VOYAGEチャプター",
    "meeting_day": "火曜",
    "meeting_time": "11:10 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-208",
    "region_id": "reg-tokyo-chiyoda",
    "chapter_name": "Wallaroo pocketチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-209",
    "region_id": "reg-tokyo-chuo-east",
    "chapter_name": "WBCチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-210",
    "region_id": "reg-osaka-n",
    "chapter_name": "We Believeチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-211",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "Xチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-212",
    "region_id": "reg-tokyo-chiyoda",
    "chapter_name": "YAOYOROZチャプター",
    "meeting_day": "金曜",
    "meeting_time": "9:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-214",
    "region_id": "reg-hamamatsu",
    "chapter_name": "ZENTSUチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-213",
    "region_id": "reg-yokohama-central",
    "chapter_name": "ZENチャプター",
    "meeting_day": "金曜",
    "meeting_time": "9:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-215",
    "region_id": "reg-shiga-west",
    "chapter_name": "ZEROチャプター",
    "meeting_day": "水曜",
    "meeting_time": "10:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-217",
    "region_id": "reg-kumamoto-city",
    "chapter_name": "ZOOMLinkチャプター",
    "meeting_day": "水曜",
    "meeting_time": "9:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-216",
    "region_id": "reg-tokyo-shinjuku",
    "chapter_name": "ZOOチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-242",
    "region_id": "reg-shizuoka-central",
    "chapter_name": "アクセルチャプター",
    "meeting_day": "木曜",
    "meeting_time": "9:45 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-243",
    "region_id": "reg-shizuoka-central",
    "chapter_name": "アトラスチャプター",
    "meeting_day": "金曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-244",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "アプリマチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-218",
    "region_id": "reg-chiba-central",
    "chapter_name": "あまてらすチャプター",
    "meeting_day": "火曜",
    "meeting_time": "8:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-247",
    "region_id": "reg-nagoya-se-se",
    "chapter_name": "アル・ルーポチャプター",
    "meeting_day": "金曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-245",
    "region_id": "reg-shizuoka-central",
    "chapter_name": "アルゴーチャプター",
    "meeting_day": "水曜",
    "meeting_time": "9:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-246",
    "region_id": "reg-kobe-east",
    "chapter_name": "アルバトロスチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-248",
    "region_id": "reg-chiba-central",
    "chapter_name": "アレキサンドライトチャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:45 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-249",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "アレグロチャプター",
    "meeting_day": "火曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-219",
    "region_id": "reg-nagoya-central",
    "chapter_name": "あんだんてチャプター",
    "meeting_day": "金曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-259",
    "region_id": "reg-himeji",
    "chapter_name": "イーグレットチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-250",
    "region_id": "reg-mie",
    "chapter_name": "イザナギチャプター",
    "meeting_day": "火曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-251",
    "region_id": "reg-shiga-west",
    "chapter_name": "イナズマチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-258",
    "region_id": "reg-kyoto",
    "chapter_name": "インヴィクタスチャプター",
    "meeting_day": "火曜",
    "meeting_time": "12:30 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-252",
    "region_id": "reg-gifu-owari-east",
    "chapter_name": "インスパイアチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-253",
    "region_id": "reg-chiba-central",
    "chapter_name": "インスパイアリングチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-256",
    "region_id": "reg-mikawa-west",
    "chapter_name": "インディゴチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-254",
    "region_id": "reg-shizuoka-central",
    "chapter_name": "インテグラルチャプター",
    "meeting_day": "水曜",
    "meeting_time": "6:45 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-255",
    "region_id": "reg-osaka-c",
    "chapter_name": "インテグレーションチャプター",
    "meeting_day": "水曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-257",
    "region_id": "reg-shizuoka-central",
    "chapter_name": "インフィニティチャプター",
    "meeting_day": "火曜",
    "meeting_time": "6:35 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-260",
    "region_id": "reg-tokyo-ms-ms",
    "chapter_name": "ウィリアムチャプター",
    "meeting_day": "金曜",
    "meeting_time": "8:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-220",
    "region_id": "reg-mikawa-east",
    "chapter_name": "ええじゃないかチャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:20 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-263",
    "region_id": "reg-kyoto",
    "chapter_name": "エールチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-261",
    "region_id": "reg-tokyo-shibuya",
    "chapter_name": "エクセルチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-262",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "エターナルチャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-221",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "おいさチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-264",
    "region_id": "reg-himeji",
    "chapter_name": "オーシャンチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-265",
    "region_id": "reg-nagoya-se-se",
    "chapter_name": "オーセンティックチャプター",
    "meeting_day": "水曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-222",
    "region_id": "reg-mie",
    "chapter_name": "おかげさんチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-268",
    "region_id": "reg-shizuoka-central",
    "chapter_name": "ガイアチャプター",
    "meeting_day": "火曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-269",
    "region_id": "reg-kumamoto-city",
    "chapter_name": "ガマダスチャプター",
    "meeting_day": "金曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-266",
    "region_id": "reg-kobe-east",
    "chapter_name": "カムイチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-267",
    "region_id": "reg-himeji",
    "chapter_name": "カムラッドチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-270",
    "region_id": "reg-osaka-c",
    "chapter_name": "キラキラチャプター",
    "meeting_day": "水曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-271",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "クオリティチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-278",
    "region_id": "reg-yokohama-central",
    "chapter_name": "グラーノチャプター",
    "meeting_day": "水曜",
    "meeting_time": "9:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-272",
    "region_id": "reg-kitakyushu-east",
    "chapter_name": "クラーベチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-223",
    "region_id": "reg-osaka-ne",
    "chapter_name": "くらわんかっ！チャプター",
    "meeting_day": "水曜",
    "meeting_time": "6:15 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-273",
    "region_id": "reg-chiba-central",
    "chapter_name": "クリエーションズチャプター",
    "meeting_day": "水曜",
    "meeting_time": "10:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-274",
    "region_id": "reg-chiba-central",
    "chapter_name": "クリスタルチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-275",
    "region_id": "reg-kumamoto-city",
    "chapter_name": "クレイジーチャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-276",
    "region_id": "reg-kitakyushu-east",
    "chapter_name": "クレストチャプター",
    "meeting_day": "火曜",
    "meeting_time": "6:40 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-277",
    "region_id": "reg-shizuoka-central",
    "chapter_name": "クロノスチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-279",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "コンセンサスチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-280",
    "region_id": "reg-nagoya-se-se",
    "chapter_name": "コンダクトチャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:15 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-281",
    "region_id": "reg-kumamoto-city",
    "chapter_name": "サクシードチャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-282",
    "region_id": "reg-yokohama-central",
    "chapter_name": "サファイアチャプター",
    "meeting_day": "水曜",
    "meeting_time": "11:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-283",
    "region_id": "reg-kobe-east",
    "chapter_name": "サンクス！チャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-284",
    "region_id": "reg-tokyo-shinjuku",
    "chapter_name": "サンシャインチャプター",
    "meeting_day": "火曜",
    "meeting_time": "8:30 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-288",
    "region_id": "reg-oita",
    "chapter_name": "ジェスタチャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:30 AM (対面)",
    "is_verified": true
  },
  {
    "id": "chap-bni-285",
    "region_id": "reg-kyoto",
    "chapter_name": "シナジーチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-289",
    "region_id": "reg-tokyo-bc-bc",
    "chapter_name": "ジャイアンツチャプター",
    "meeting_day": "火曜",
    "meeting_time": "9:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-290",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "ジャンヌチャプター",
    "meeting_day": "水曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-291",
    "region_id": "reg-chiba-central",
    "chapter_name": "ジュライズチャプター",
    "meeting_day": "火曜",
    "meeting_time": "9:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-287",
    "region_id": "reg-yokohama-central",
    "chapter_name": "シリウスチャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-292",
    "region_id": "reg-chiba-keiyo",
    "chapter_name": "スプレンダーチャプター",
    "meeting_day": "金曜",
    "meeting_time": "9:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-293",
    "region_id": "reg-kyoto",
    "chapter_name": "スペクタクルチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-295",
    "region_id": "reg-shizuoka-central",
    "chapter_name": "ゼータチャプター",
    "meeting_day": "金曜",
    "meeting_time": "6:25 AM (対面)",
    "is_verified": true
  },
  {
    "id": "chap-bni-294",
    "region_id": "reg-chiba-keiyo",
    "chapter_name": "ゼロイチチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-224",
    "region_id": "reg-tokyo-chiyoda",
    "chapter_name": "そらまめチャプター",
    "meeting_day": "金曜",
    "meeting_time": "6:40 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-296",
    "region_id": "reg-chiba-keiyo",
    "chapter_name": "ダイヤモンドチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-226",
    "region_id": "reg-chiba-central",
    "chapter_name": "つくよみチャプター",
    "meeting_day": "月曜",
    "meeting_time": "7:00 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-297",
    "region_id": "reg-kyoto",
    "chapter_name": "ディライトチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-227",
    "region_id": "reg-nagoya-se-se",
    "chapter_name": "てんびんチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-228",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "とびうめチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-298",
    "region_id": "reg-kitakyushu-east",
    "chapter_name": "トラベルチャプター",
    "meeting_day": "水曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-299",
    "region_id": "reg-kitakyushu-east",
    "chapter_name": "ドリサポチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-300",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "ドルフィンチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-229",
    "region_id": "reg-mie",
    "chapter_name": "とんてきチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-302",
    "region_id": "reg-kobe-central",
    "chapter_name": "ナーウィスチャプター",
    "meeting_day": "火曜",
    "meeting_time": "1:30 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-301",
    "region_id": "reg-osaka-ne",
    "chapter_name": "ナインダーツチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-303",
    "region_id": "reg-osaka-c",
    "chapter_name": "ニコニコチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-304",
    "region_id": "reg-tokyo-chiyoda",
    "chapter_name": "ネオシニアチャンネルチャプター",
    "meeting_day": "火曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-305",
    "region_id": "reg-gifu-city",
    "chapter_name": "ネクサスチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-306",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "ノーブレスチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-307",
    "region_id": "reg-tokyo-shinjuku",
    "chapter_name": "ノーリーズンチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-310",
    "region_id": "reg-chiba-central",
    "chapter_name": "ハーバーチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-311",
    "region_id": "reg-tokyo-chiyoda",
    "chapter_name": "ハーベストチャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:45 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-313",
    "region_id": "reg-yamaguchi",
    "chapter_name": "パイオニアチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-308",
    "region_id": "reg-kyoto",
    "chapter_name": "ハッピーチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-230",
    "region_id": "reg-osaka-c",
    "chapter_name": "はやぶさチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-312",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "バリューチャプター",
    "meeting_day": "金曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-309",
    "region_id": "reg-nara-city-kyoto-south",
    "chapter_name": "ハンドレッドチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-316",
    "region_id": "reg-chiba-keiyo",
    "chapter_name": "ピースチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-231",
    "region_id": "reg-sapporo-central",
    "chapter_name": "ひぐまチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-232",
    "region_id": "reg-osaka-n",
    "chapter_name": "ひだまりチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-314",
    "region_id": "reg-shizuoka-central",
    "chapter_name": "ビッグバンチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (対面)",
    "is_verified": true
  },
  {
    "id": "chap-bni-315",
    "region_id": "reg-miyazaki",
    "chapter_name": "ビッグフォレスツチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-233",
    "region_id": "reg-kitakyushu-east",
    "chapter_name": "ひなたチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-234",
    "region_id": "reg-ibaraki-south",
    "chapter_name": "ひばりチャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:30 PM (対面)",
    "is_verified": true
  },
  {
    "id": "chap-bni-235",
    "region_id": "reg-tama-east",
    "chapter_name": "ひまわりチャプター",
    "meeting_day": "水曜",
    "meeting_time": "6:45 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-317",
    "region_id": "reg-himeji",
    "chapter_name": "フィールドチャプター",
    "meeting_day": "水曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-318",
    "region_id": "reg-tokyo-shinjuku",
    "chapter_name": "フェニックスチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-319",
    "region_id": "reg-kitakyushu-east",
    "chapter_name": "フォースターチャプター",
    "meeting_day": "水曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-320",
    "region_id": "reg-kumamoto-city",
    "chapter_name": "フォーマルチャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:00 PM (対面)",
    "is_verified": true
  },
  {
    "id": "chap-bni-321",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "フュージョンチャプター",
    "meeting_day": "火曜",
    "meeting_time": "11:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-322",
    "region_id": "reg-nagoya-central",
    "chapter_name": "フューチャーコンパスチャプター",
    "meeting_day": "水曜",
    "meeting_time": "9:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-325",
    "region_id": "reg-chikugo",
    "chapter_name": "プラネットチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-326",
    "region_id": "reg-nagoya-se-se",
    "chapter_name": "プリンシプルチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-323",
    "region_id": "reg-chiba-central",
    "chapter_name": "ブルースカイチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-324",
    "region_id": "reg-kyoto",
    "chapter_name": "ブレイクスルーチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-327",
    "region_id": "reg-gifu-city",
    "chapter_name": "プログレスチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-328",
    "region_id": "reg-chiba-keiyo",
    "chapter_name": "ホエルズチャプター",
    "meeting_day": "金曜",
    "meeting_time": "10:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-331",
    "region_id": "reg-tokyo-chiyoda",
    "chapter_name": "ポラリスチャプター",
    "meeting_day": "水曜",
    "meeting_time": "9:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-329",
    "region_id": "reg-shizuoka-central",
    "chapter_name": "ホルスチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (対面)",
    "is_verified": true
  },
  {
    "id": "chap-bni-330",
    "region_id": "reg-nagoya-central",
    "chapter_name": "ホワイトチャプター",
    "meeting_day": "水曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-236",
    "region_id": "reg-osaka-c",
    "chapter_name": "まいどおおきにチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-332",
    "region_id": "reg-chiba-central",
    "chapter_name": "マリーンチャプター",
    "meeting_day": "金曜",
    "meeting_time": "6:45 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-333",
    "region_id": "reg-tama-west",
    "chapter_name": "マルベリーチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-334",
    "region_id": "reg-nagoya-central",
    "chapter_name": "ミッドランドチャプター",
    "meeting_day": "金曜",
    "meeting_time": "6:20 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-237",
    "region_id": "reg-nagoya-central",
    "chapter_name": "みらくるチャプター",
    "meeting_day": "火曜",
    "meeting_time": "9:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-335",
    "region_id": "reg-kobe-east",
    "chapter_name": "ミリオネアチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-336",
    "region_id": "reg-tokyo-chuo-east",
    "chapter_name": "ミリオンダラーチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-238",
    "region_id": "reg-hamamatsu",
    "chapter_name": "やらまいかチャプター",
    "meeting_day": "水曜",
    "meeting_time": "6:40 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-337",
    "region_id": "reg-kyoto",
    "chapter_name": "ユニコーンチャプター",
    "meeting_day": "月曜",
    "meeting_time": "6:50 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-338",
    "region_id": "reg-shizuoka-central",
    "chapter_name": "ユニバースチャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-239",
    "region_id": "reg-mie",
    "chapter_name": "よさげチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-240",
    "region_id": "reg-mie",
    "chapter_name": "よつばチャプター",
    "meeting_day": "土曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-340",
    "region_id": "reg-osaka-e",
    "chapter_name": "ラ・トゥールチャプター",
    "meeting_day": "火曜",
    "meeting_time": "11:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-339",
    "region_id": "reg-nagoya-se-se",
    "chapter_name": "ライトニングチャプター",
    "meeting_day": "火曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-344",
    "region_id": "reg-kumamoto-city",
    "chapter_name": "リーディングチャプター",
    "meeting_day": "火曜",
    "meeting_time": "6:30 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-343",
    "region_id": "reg-kobe-central",
    "chapter_name": "リヴァイチャプター",
    "meeting_day": "金曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-341",
    "region_id": "reg-chiba-central",
    "chapter_name": "リブライズチャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:45 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-342",
    "region_id": "reg-kyoto",
    "chapter_name": "リベルタスチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-345",
    "region_id": "reg-shizuoka-central",
    "chapter_name": "レガーレチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-346",
    "region_id": "reg-kitakyushu-east",
    "chapter_name": "レッドクイーンチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-347",
    "region_id": "reg-mie",
    "chapter_name": "レバレッジチャプター",
    "meeting_day": "金曜",
    "meeting_time": "1:00 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-241",
    "region_id": "reg-osaka-ne",
    "chapter_name": "わいわいチャプター",
    "meeting_day": "金曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-348",
    "region_id": "reg-gifu-owari-east",
    "chapter_name": "ワンダーチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-349",
    "region_id": "reg-chiba-keiyo",
    "chapter_name": "ワンニャンチャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-350",
    "region_id": "reg-tokyo-chuo-east",
    "chapter_name": "一億円チャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-351",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "一番星チャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-389",
    "region_id": "reg-nagoya-se-se",
    "chapter_name": "茨チャプター",
    "meeting_day": "金曜",
    "meeting_time": "9:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-384",
    "region_id": "reg-kobe-east",
    "chapter_name": "縁陣チャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-355",
    "region_id": "reg-mie",
    "chapter_name": "可能性チャプター",
    "meeting_day": "火曜",
    "meeting_time": "9:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-375",
    "region_id": "reg-kumamoto-city",
    "chapter_name": "火の国チャプター",
    "meeting_day": "水曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-366",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "快動チャプター",
    "meeting_day": "水曜",
    "meeting_time": "10:00 AM (対面)",
    "is_verified": true
  },
  {
    "id": "chap-bni-395",
    "region_id": "reg-nagano",
    "chapter_name": "開港チャプター",
    "meeting_day": "水曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-394",
    "region_id": "reg-nagano",
    "chapter_name": "開智チャプター",
    "meeting_day": "金曜",
    "meeting_time": "6:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-401",
    "region_id": "reg-nagoya-central",
    "chapter_name": "金シャチ BNIチャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:30 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-352",
    "region_id": "reg-nagoya-se-se",
    "chapter_name": "交チャプター",
    "meeting_day": "木曜",
    "meeting_time": "9:30 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-363",
    "region_id": "reg-saitama-central",
    "chapter_name": "彩チャプター",
    "meeting_day": "木曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-364",
    "region_id": "reg-osaka-e",
    "chapter_name": "志チャプター",
    "meeting_day": "水曜",
    "meeting_time": "12:00 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-365",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "志高チャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-387",
    "region_id": "reg-nagoya-se-se",
    "chapter_name": "至誠チャプター",
    "meeting_day": "木曜",
    "meeting_time": "9:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-388",
    "region_id": "reg-fukuoka-hakata",
    "chapter_name": "若鷹チャプター",
    "meeting_day": "火曜",
    "meeting_time": "6:30 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-368",
    "region_id": "reg-mikawa-east",
    "chapter_name": "手筒チャプター",
    "meeting_day": "水曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-361",
    "region_id": "reg-oita",
    "chapter_name": "宗麟チャプター",
    "meeting_day": "金曜",
    "meeting_time": "6:30 AM (対面)",
    "is_verified": true
  },
  {
    "id": "chap-bni-354",
    "region_id": "reg-nagoya-se-se",
    "chapter_name": "匠チャプター",
    "meeting_day": "火曜",
    "meeting_time": "6:40 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-383",
    "region_id": "reg-chita-nagoya-east-east",
    "chapter_name": "笑門チャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-367",
    "region_id": "reg-osaka-c",
    "chapter_name": "情熱チャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-369",
    "region_id": "reg-kyoto",
    "chapter_name": "新撰組チャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-380",
    "region_id": "reg-gifu-city",
    "chapter_name": "真チャプター",
    "meeting_day": "水曜",
    "meeting_time": "9:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-381",
    "region_id": "reg-osaka-c",
    "chapter_name": "神風チャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-391",
    "region_id": "reg-kitakyushu-east",
    "chapter_name": "迅風チャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-353",
    "region_id": "reg-sendai-central",
    "chapter_name": "仙臺四郎チャプター",
    "meeting_day": "火曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-360",
    "region_id": "reg-osaka-n",
    "chapter_name": "奏チャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-356",
    "region_id": "reg-osaka-c",
    "chapter_name": "大一大万大吉チャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-359",
    "region_id": "reg-osaka-e",
    "chapter_name": "大志チャプター",
    "meeting_day": "木曜",
    "meeting_time": "12:00 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-357",
    "region_id": "reg-tokyo-ms-ms",
    "chapter_name": "大人なじみチャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-358",
    "region_id": "reg-tokyo-shibuya",
    "chapter_name": "大八チャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-374",
    "region_id": "reg-yokohama-central",
    "chapter_name": "潮騒チャプター",
    "meeting_day": "火曜",
    "meeting_time": "6:45 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-371",
    "region_id": "reg-sendai-central",
    "chapter_name": "杜の都チャプター",
    "meeting_day": "水曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-376",
    "region_id": "reg-nagoya-se-se",
    "chapter_name": "灯火チャプター",
    "meeting_day": "火曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-392",
    "region_id": "reg-sapporo-central",
    "chapter_name": "道産子ismチャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-385",
    "region_id": "reg-osaka-n",
    "chapter_name": "縄文チャプター",
    "meeting_day": "木曜",
    "meeting_time": "12:00 PM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-378",
    "region_id": "reg-yokohama-central",
    "chapter_name": "白樺チャプター",
    "meeting_day": "火曜",
    "meeting_time": "6:40 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-379",
    "region_id": "reg-himeji",
    "chapter_name": "白鷺チャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-386",
    "region_id": "reg-mie",
    "chapter_name": "美し国チャプター",
    "meeting_day": "火曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-372",
    "region_id": "reg-saitama-central",
    "chapter_name": "武蔵チャプター",
    "meeting_day": "金曜",
    "meeting_time": "6:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-398",
    "region_id": "reg-kobe-east",
    "chapter_name": "風見鶏チャプター",
    "meeting_day": "金曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-397",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "風神チャプター",
    "meeting_day": "火曜",
    "meeting_time": "9:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-362",
    "region_id": "reg-kyoto",
    "chapter_name": "平安セブンチャプター",
    "meeting_day": "木曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-373",
    "region_id": "reg-kyoto",
    "chapter_name": "満福チャプター",
    "meeting_day": "水曜",
    "meeting_time": "7:00 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-370",
    "region_id": "reg-tokyo-chiyoda",
    "chapter_name": "明朗チャプター",
    "meeting_day": "火曜",
    "meeting_time": "10:00 AM (対面)",
    "is_verified": true
  },
  {
    "id": "chap-bni-390",
    "region_id": "reg-nagoya-se-se",
    "chapter_name": "誉チャプター",
    "meeting_day": "木曜",
    "meeting_time": "9:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-396",
    "region_id": "reg-nagano",
    "chapter_name": "雷鳥チャプター",
    "meeting_day": "火曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-382",
    "region_id": "reg-nagano",
    "chapter_name": "竜胆チャプター",
    "meeting_day": "土曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-400",
    "region_id": "reg-okinawa",
    "chapter_name": "龍宮チャプター",
    "meeting_day": "金曜",
    "meeting_time": "6:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-393",
    "region_id": "reg-nagano",
    "chapter_name": "鈴蘭チャプター",
    "meeting_day": "木曜",
    "meeting_time": "9:30 AM (オンライン（永続）)",
    "is_verified": true
  },
  {
    "id": "chap-bni-377",
    "region_id": "reg-tokyo-minato-chuo",
    "chapter_name": "燿チャプター",
    "meeting_day": "火曜",
    "meeting_time": "10:00 AM (ハイブリッド)",
    "is_verified": true
  },
  {
    "id": "chap-bni-399",
    "region_id": "reg-tokyo-chuo-east",
    "chapter_name": "麒麟チャプター",
    "meeting_day": "木曜",
    "meeting_time": "8:00 AM (オンライン（永続）)",
    "is_verified": true
  }
];
