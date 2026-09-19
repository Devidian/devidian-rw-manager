const STEAM_PLAYER_SUMMARIES_URL = 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/';

function steamIdFromOpenId(params: Record<string, string>): string | undefined {
  const openId = params['openid.claimed_id'] ?? params['openid.identity'];
  const match = openId?.match(/\/openid\/id\/(\d+)(?:\/)?$/);
  return match?.[1];
}

/**
 * Steam OpenID only supplies the stable Steam ID. Resolve the optional persona
 * name separately; sign-in must still work if Steam's profile API is unavailable.
 */
export async function resolveSteamPersonaName(
  params: Record<string, string>,
  apiKey: string | undefined,
): Promise<string | undefined> {
  const steamId = steamIdFromOpenId(params);
  if (!apiKey || !steamId) return undefined;

  try {
    const url = new URL(STEAM_PLAYER_SUMMARIES_URL);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('steamids', steamId);
    const response = await fetch(url);
    if (!response.ok) return undefined;
    const payload: unknown = await response.json();
    const personaName = (payload as {
      response?: { players?: Array<{ personaname?: unknown }> };
    }).response?.players?.[0]?.personaname;
    return typeof personaName === 'string' && personaName.trim()
      ? personaName.trim()
      : undefined;
  } catch {
    return undefined;
  }
}
