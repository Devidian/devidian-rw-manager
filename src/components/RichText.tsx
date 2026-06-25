import React from 'react';

type RichTextNode =
  | string
  | { type: 'color'; value: string; children: RichTextNode[] }
  | { type: 'bold'; children: RichTextNode[] };

type RichTextFrame = {
  type: 'root' | 'color' | 'bold';
  value?: string;
  children: RichTextNode[];
};

const TAG_REGEX = /<[^>]*>/g;

interface RichTextProps {
  text: string;
  className?: string;
  code?: boolean;
}

export function RichText({ text, className, code }: RichTextProps) {
  const parts = renderNodes(parseRichText(text));

  return code ? <pre>{parts}</pre> : <span className={className}>{parts}</span>;
}

export function hasRichTextTags(text: string): boolean {
  return /<\/?b>|<\/?color(?:=[^>]+)?>/i.test(text);
}

function parseRichText(text: string): RichTextNode[] {
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
    if (!applyTag(tag, stack)) appendText(tag);
    lastIndex = regex.lastIndex;
  }

  appendText(text.slice(lastIndex));
  closeOpenFrames(stack);
  return root.children;
}

function applyTag(tag: string, stack: RichTextFrame[]): boolean {
  const lowerTag = tag.toLowerCase();
  if (lowerTag === '<b>') {
    stack.push({ type: 'bold', children: [] });
    return true;
  }
  if (lowerTag === '</b>') return closeFrame(stack, 'bold');

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

function closeFrame(stack: RichTextFrame[], type: 'color' | 'bold'): boolean {
  const frame = currentFrame(stack);
  if (frame.type !== type) return false;

  stack.pop();
  currentFrame(stack).children.push(frameToNode(frame));
  return true;
}

function closeOpenFrames(stack: RichTextFrame[]): void {
  while (stack.length > 1) {
    const frame = stack.pop();
    if (!frame) return;
    currentFrame(stack).children.push(frameToNode(frame));
  }
}

function currentFrame(stack: RichTextFrame[]): RichTextFrame {
  return stack[stack.length - 1];
}

function frameToNode(frame: RichTextFrame): RichTextNode {
  return frame.type === 'color'
    ? { type: 'color', value: frame.value ?? 'inherit', children: frame.children }
    : { type: 'bold', children: frame.children };
}

function renderNodes(nodes: RichTextNode[], keyPrefix = 'rt'): React.ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    if (typeof node === 'string') return node;
    if (node.type === 'bold') {
      return <strong key={key}>{renderNodes(node.children, key)}</strong>;
    }
    return (
      <span key={key} style={{ color: node.value }}>
        {renderNodes(node.children, key)}
      </span>
    );
  });
}
