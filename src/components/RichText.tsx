import React from 'react';

type RichTextNode =
  | string
  | { type: 'color'; value: string; children: RichTextNode[] }
  | { type: 'bold'; children: RichTextNode[] }
  | { type: 'u'; children: RichTextNode[] }
  | { type: 'size'; value: string; children: RichTextNode[] }
  | { type: 'a'; value: string; children: RichTextNode[] }
  | { type: 'break' }
  | { type: 'align'; value: string; children: RichTextNode[] };

type RichTextFrame = { type: 'root'; children: RichTextNode[] }
  | Exclude<RichTextNode, string | { type: 'break' }>;

const TAG_REGEX = /<[^>]*>/g;

interface RichTextProps {
  text: string;
  className?: string;
  code?: boolean;
  allowLinks?: boolean;
}

export function RichText({ text, className, code, allowLinks = false }: RichTextProps) {
  const parts = renderNodes(parseRichText(text, allowLinks));

  return code ? <pre>{parts}</pre> : <span className={className}>{parts}</span>;
}

export function hasRichTextTags(text: string, allowLinks = false): boolean {
  return /<\/?(?:b|u)>|<\/?color(?:=[^>]+)?>|<br\s*\/?>|<\/?align(?:=(?:left|center|right|justify|justified))?>|<size=\d+(?:\.\d+)?%>/i.test(text)
    || (allowLinks && /<a\s+href\s*=/i.test(text));
}

function parseRichText(text: string, allowLinks: boolean): RichTextNode[] {
  const root: RichTextFrame = { type: 'root', children: [] };
  const stack: RichTextFrame[] = [root];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const appendText = (value: string) => {
    if (value) currentFrame(stack).children.push(value);
  };

  const regex = new RegExp(TAG_REGEX.source, 'g');
  while ((match = regex.exec(text)) !== null) {
    appendText(text.slice(lastIndex, match.index));
    const tag = match[0];
    if (!applyTag(tag, stack, allowLinks)) appendText(tag);
    lastIndex = regex.lastIndex;
  }

  appendText(text.slice(lastIndex));
  closeOpenFrames(stack);
  return root.children;
}

function applyTag(tag: string, stack: RichTextFrame[], allowLinks: boolean): boolean {
  const lowerTag = tag.toLowerCase();
  if (/^<br\s*\/?>$/i.test(tag)) {
    currentFrame(stack).children.push({ type: 'break' });
    return true;
  }
  if (lowerTag === '</align>') return closeFrame(stack, 'align');
  const alignment = tag.match(/^<align=(left|center|right|justify|justified)>$/i);
  if (alignment) {
    stack.push({ type: 'align', value: alignment[1].toLowerCase().replace('justified', 'justify'), children: [] });
    return true;
  }
  if (lowerTag === '<b>') {
    stack.push({ type: 'bold', children: [] });
    return true;
  }
  if (lowerTag === '</b>') return closeFrame(stack, 'bold');
  if (lowerTag === '<u>') {
    stack.push({ type: 'u', children: [] });
    return true;
  }
  if (lowerTag === '</u>') return closeFrame(stack, 'u');
  if (lowerTag === '</size>') return closeFrame(stack, 'size');
  const percentage = tag.match(/^<size=(\d+(?:\.\d+)?)%>$/i);
  if (percentage) {
    const size = Number(percentage[1]);
    if (size <= 0 || size > 300) return false;
    stack.push({ type: 'size', value: `${size}%`, children: [] });
    return true;
  }
  if (allowLinks) {
    if (lowerTag === '</a>') return closeFrame(stack, 'a');
    const href = tag.match(/^<a\s+href\s*=\s*(?:"([^"]+)"|'([^']+)')\s*>$/i);
    if (href && !stack.some(frame => frame.type === 'a')) {
      const url = safeWebUrl(href[1] ?? href[2]);
      if (!url) return false;
      stack.push({ type: 'a', value: url, children: [] });
      return true;
    }
  }

  if (lowerTag === '<color>' || lowerTag === '</color>') {
    return closeFrame(stack, 'color');
  }

  const colorMatch = tag.match(/^<color=([^>]+)>$/i);
  if (!colorMatch) return false;

  const color = colorMatch[1].trim();
  if (!color) return closeFrame(stack, 'color');

  stack.push({ type: 'color', value: color, children: [] });
  return true;
}

function safeWebUrl(value: string): string | undefined {
  if (!/^https?:\/\//i.test(value)) return;
  try {
    return new URL(value).href;
  } catch {
    return undefined;
  }
}

function closeFrame(stack: RichTextFrame[], type: Exclude<RichTextFrame['type'], 'root'>): boolean {
  const frame = currentFrame(stack);
  if (frame.type !== type) return false;

  stack.pop();
  currentFrame(stack).children.push(frame);
  return true;
}

function closeOpenFrames(stack: RichTextFrame[]): void {
  while (stack.length > 1) {
    const frame = stack.pop();
    if (!frame || frame.type === 'root') return;
    currentFrame(stack).children.push(frame);
  }
}

function currentFrame(stack: RichTextFrame[]): RichTextFrame {
  return stack[stack.length - 1];
}

function renderNodes(nodes: RichTextNode[], keyPrefix = 'rt'): React.ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    if (typeof node === 'string') return node;
    if (node.type === 'break') return <br key={key} />;
    const children = renderNodes(node.children, key);
    if (node.type === 'align') {
      return <span key={key} style={{ display: 'block', textAlign: node.value as React.CSSProperties['textAlign'] }}>{children}</span>;
    }
    if (node.type === 'bold') {
      return <strong key={key}>{children}</strong>;
    }
    if (node.type === 'u') return <u key={key}>{children}</u>;
    if (node.type === 'size') return <span key={key} style={{ fontSize: node.value }}>{children}</span>;
    if (node.type === 'a') return <a key={key} href={node.value} className="underline" target="_blank" rel="noopener noreferrer">{children}</a>;
    return (
      <span key={key} style={{ color: node.value }}>
        {children}
      </span>
    );
  });
}
