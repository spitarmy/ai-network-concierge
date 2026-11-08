export function formatMeetingSchedule(isoDate: string) {
  const d = new Date(isoDate);
  const now = new Date();

  const daysOfWeek = ['日', '月', '火', '水', '木', '金', '土'];
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const date = d.getDate();
  const dayName = daysOfWeek[d.getDay()];
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  // 日付の差分計算
  const startOfDay = (dateObj: Date) => new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
  const diffDays = Math.round((startOfDay(d) - startOfDay(now)) / (24 * 3600 * 1000));

  const diffMs = d.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (3600 * 1000));

  let relativeBadge = '';
  let badgeColor = 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300';

  if (diffMs < -3600 * 1000 * 2) {
    relativeBadge = '終了';
    badgeColor = 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400';
  } else if (diffMs >= -3600 * 1000 * 2 && diffMs <= 3600 * 1000) {
    relativeBadge = 'まもなく開催 / 開催中';
    badgeColor = 'bg-rose-500 text-white font-bold animate-pulse';
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

  const dateText = `${month}月${date}日(${dayName})`;
  const fullDateText = `${year}年${month}月${date}日(${dayName})`;
  const timeText = `${hours}:${minutes}〜`;

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
    isUpcoming: diffMs >= -3600 * 1000 * 2,
    isPast: diffMs < -3600 * 1000 * 2,
  };
}
