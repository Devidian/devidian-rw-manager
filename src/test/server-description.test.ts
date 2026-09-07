import { describe, expect, it } from 'vitest';
import { formatServerDescription } from '@/lib/server-description';

describe('server description formatting', () => {
  it('converts game line-break notation, including blank lines and CRLF', () => {
    expect(formatServerDescription(String.raw`<b>Title</b>\n\nBody\r\nEnd`))
      .toBe('<b>Title</b>\n\nBody\nEnd');
  });

  it('preserves actual newlines, ordinary text and unrelated escapes', () => {
    for (const text of ['', 'Plain description', 'First\nSecond\r\nThird', String.raw`C:\games\world`, String.raw`literal\ttext`]) {
      expect(formatServerDescription(text)).toBe(text);
    }
  });

  it('allows escaped backslashes without decoding the result a second time', () => {
    expect(formatServerDescription(String.raw`Literal \\n and \\r\\n`))
      .toBe(String.raw`Literal \n and \r\n`);
  });
});
