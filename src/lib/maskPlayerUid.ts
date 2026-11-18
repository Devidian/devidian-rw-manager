export function maskPlayerUid(uid: string): string {
  if (uid === '**PRIVATE**') return uid;
  if (/^\d{17}$/.test(uid)) return `${uid[0]}${'*'.repeat(15)}${uid[uid.length - 1]}`;
  if (uid.length <= 8) return uid;
  return `${uid.slice(0, 4)}${'*'.repeat(uid.length - 8)}${uid.slice(-4)}`;
}
