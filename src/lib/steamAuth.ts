const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';

export interface AuthProvider {
  name: string;
  startLogin(returnUrl: string, realm: string): void;
}

export const steamProvider: AuthProvider = {
  name: 'steam',
  startLogin(returnUrl: string, realm: string) {
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': returnUrl,
      'openid.realm': realm,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    });
    window.location.href = `${STEAM_OPENID_URL}?${params.toString()}`;
  },
};

/** Extract OpenID params from the callback URL search string */
export function extractOpenIdParams(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    if (key.startsWith('openid.')) {
      result[key] = value;
    }
  });
  return result;
}
