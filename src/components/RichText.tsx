import React from 'react';

const COLOR_TAG_REGEX = /<color=([^>]+)>(.*?)<\/color>/g;

interface RichTextProps {
  text: string;
  className?: string;
}

export function RichText({ text, className }: RichTextProps) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(COLOR_TAG_REGEX.source, 'g');

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span key={match.index} style={{ color: match[1] }}>
        {match[2]}
      </span>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <span className={className}>{parts}</span>;
}
