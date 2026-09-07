/** Decode description line-break notation once, only at the display boundary. */
export function formatServerDescription(description: string): string {
  return description.replace(/\\\\|\\r\\n|\\n/g, escape => escape === '\\\\' ? '\\' : '\n');
}
