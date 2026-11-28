import React from 'react';

interface StructuredTextBlockProps {
  text?: string | null;
  className?: string;
  bulletColorClass?: string;
  compact?: boolean;
}

/**
 * 改行なしの長い要約文・メモ・話題・約束テキストを、
 * 読みやすい箇条書き・セクション見出し・番号付きリストへ自動整形して表示するコンポーネント
 */
export function splitIntoStructuredLines(raw?: string | null): string[] {
  if (!raw) return [];
  const normalized = raw
    .replace(/\r\n/g, '\n')
    // 【次回アクション】等の見出しの前に必ず改行を入れる
    .replace(/(?!^)(【[^】]+】)/g, '\n$1\n')
    // ① ② ③ 等の丸数字の前に改行を入れる
    .replace(/(?!^)\s*([①②③④⑤⑥⑦⑧⑨⑩])/g, '\n$1 ')
    // 「・」「■」「◆」が文中に連続している場合も改行
    .replace(/(?!^)\s*([■◆▲▼])/g, '\n$1 ')
    // 句点「。」の後に改行を入れる（括弧内の句点は除く）
    .replace(/。+(?![）)”」』\n])/g, '。\n');

  const rawLines = normalized
    .split('\n')
    .map(l => l.replace(/^[、,\s]+/, '').trim())
    .filter(l => l && !/^[・•▪▫■◆▲▼\-*]+$/.test(l));

  const result: string[] = [];
  for (const line of rawLines) {
    // 1行が110文字を超えていて「、」が複数ある場合は、中間の読点でさらに読みやすく分割
    if (line.length > 115 && !line.startsWith('【')) {
      const parts = line.split(/(?<=、)(?=.{35,})/);
      if (parts.length >= 2) {
        let buf = '';
        for (const p of parts) {
          if ((buf + p).length > 85 && buf.length >= 25) {
            result.push(buf.trim());
            buf = p;
          } else {
            buf += p;
          }
        }
        if (buf.trim()) result.push(buf.trim());
        continue;
      }
    }
    result.push(line);
  }

  return result;
}

export const StructuredTextBlock: React.FC<StructuredTextBlockProps> = ({
  text,
  className = '',
  bulletColorClass = 'text-apple-blue dark:text-apple-darkBlue',
  compact = false,
}) => {
  const lines = splitIntoStructuredLines(text);
  if (lines.length === 0) return null;

  // 1行のみで短い場合（45文字以下）はシンプルに表示
  if (lines.length === 1 && lines[0].length <= 45) {
    return <p className={`leading-relaxed ${className}`}>{lines[0]}</p>;
  }

  return (
    <div className={`${compact ? 'space-y-1' : 'space-y-1.5'} ${className}`}>
      {lines.map((line, idx) => {
        // 【次回アクション】などのセクション見出し行
        if (/^【[^】]+】$/.test(line)) {
          return (
            <div
              key={idx}
              className="pt-1.5 first:pt-0 font-bold text-[11px] text-apple-blue dark:text-sky-400 tracking-wide"
            >
              {line}
            </div>
          );
        }

        // ① ② ③ などの番号付きアクション行
        const numMatch = line.match(/^([①②③④⑤⑥⑦⑧⑨⑩])\s*(.+)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 leading-relaxed pl-0.5">
              <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0 mt-0.2">
                {numMatch[1]}
              </span>
              <span className="flex-1">{numMatch[2]}</span>
            </div>
          );
        }

        // 既に「・」「■」等で始まっている行
        const cleanedLine = line.replace(/^[・•\-*]\s*/, '');

        return (
          <div key={idx} className="flex items-start gap-2 leading-relaxed">
            <span className={`font-bold shrink-0 select-none ${bulletColorClass}`}>•</span>
            <span className="flex-1">{cleanedLine}</span>
          </div>
        );
      })}
    </div>
  );
};
