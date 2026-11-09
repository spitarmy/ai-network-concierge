// AI人脈コンシェルジュ — 日時フォーマット・面談ステータス判定ユーティリティ

export function formatMeetingSchedule(
  isoDate: string,
  meetingStatus?: string,
  recordingStatus?: string
) {
  const d = new Date(isoDate);
  const now = new Date();

  const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const dayName = daysOfWeek[d.getDay()];
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  const dateText = `${month}月${date}日(${dayName})`;
  const fullDateText = `${year}年${month}月${date}日(${dayName})`;
  const timeText = `${hours}:${minutes}〜`;

  const diffMs = d.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (3600 * 1000));
  const startOfDay = (dateObj: Date) => new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
  const diffDays = Math.round((startOfDay(d) - startOfDay(now)) / (24 * 3600 * 1000));

  // 1. 明示的に完了しているか、録音解析完了なら無条件で「終了」
  if (meetingStatus === 'completed' || recordingStatus === 'completed') {
    return {
      year,
      month,
      date,
      dayName,
      hours,
      minutes,
      dateText,
      fullDateText,
      timeText,
      relativeBadge: '終了',
      badgeColor: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
      isToday: diffDays === 0,
      isTomorrow: false,
      isUpcoming: false,
      isPast: true,
    };
  }

  // 2. 開始時刻から45分以上経過している場合は「終了」とみなす（いつまでも開催中にならない）
  if (diffMs < -45 * 60 * 1000) {
    return {
      year,
      month,
      date,
      dayName,
      hours,
      minutes,
      dateText,
      fullDateText,
      timeText,
      relativeBadge: '終了',
      badgeColor: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400',
      isToday: diffDays === 0,
      isTomorrow: false,
      isUpcoming: false,
      isPast: true,
    };
  }

  // 3. 開始15分前から開始後45分までは「開催中 / まもなく開催」
  let relativeBadge = '';
  let badgeColor = 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300';

  if (diffMs >= -45 * 60 * 1000 && diffMs <= 15 * 60 * 1000) {
    relativeBadge = diffMs <= 0 ? '開催中' : 'まもなく開催';
    badgeColor = diffMs <= 0
      ? 'bg-rose-500 text-white font-bold animate-pulse'
      : 'bg-amber-500 text-white font-bold animate-pulse';
  } else if (diffDays === 0) {
    relativeBadge = diffHours > 0 ? `今日 (あと${diffHours}時間)` : '今日';
    badgeColor = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30';
  } else if (diffDays === 1) {
    relativeBadge = '明日';
    badgeColor = 'bg-apple-blue/15 text-apple-blue dark:text-apple-darkBlue font-bold border border-apple-blue/30';
  } else if (diffDays === 2) {
    relativeBadge = '明後日';
    badgeColor = 'bg-purple-500/15 text-purple-600 dark:text-purple-400 font-semibold border border-purple-500/30';
  } else if (diffDays > 2 && diffDays <= 7) {
    relativeBadge = `${diffDays}日後`;
    badgeColor = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium';
  }

  return {
    year,
    month,
    date,
    dayName,
    hours,
    minutes,
    dateText,
    fullDateText,
    timeText,
    relativeBadge,
    badgeColor,
    isToday: diffDays === 0,
    isTomorrow: diffDays === 1,
    isUpcoming: diffMs >= -45 * 60 * 1000,
    isPast: diffMs < -45 * 60 * 1000,
  };
}
