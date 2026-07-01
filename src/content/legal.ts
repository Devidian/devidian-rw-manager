export const LEGAL_LINKS = [
  { label: 'Imprint', path: '/imprint' },
  { label: 'Privacy Policy', path: '/privacy' },
  { label: 'Terms of Use', path: '/terms' },
  { label: 'Community Rules', path: '/community-rules' },
  { label: 'Report / Abuse', path: '/report' },
] as const;

export type LegalPageKey = 'imprint' | 'privacy' | 'terms' | 'community-rules' | 'report';

interface LegalSection {
  heading: string;
  body: string[];
  items?: string[];
}

interface LegalPageContent {
  title: string;
  updated: string;
  intro?: string[];
  sections: LegalSection[];
}

export const LEGAL_PAGES: Record<LegalPageKey, LegalPageContent> = {
  imprint: {
    title: 'Imprint',
    updated: 'Placeholder draft',
    intro: [
      'This page contains placeholder provider information for a German DDG §5-style imprint. Replace all placeholder values before publishing.',
    ],
    sections: [
      {
        heading: 'Service Provider',
        body: [
          'TODO: Full name / company: [FULL LEGAL NAME OR COMPANY NAME]',
          'TODO: Address: [STREET, POSTAL CODE, CITY, COUNTRY]',
          'TODO: Email: [CONTACT EMAIL ADDRESS]',
          'TODO: Optional phone: [PHONE NUMBER OR REMOVE THIS LINE]',
        ],
      },
      {
        heading: 'Responsible Person',
        body: [
          'TODO: Responsible person for editorial content, if editorial content is later added: [NAME AND ADDRESS].',
          'This placeholder does not create or replace legal advice. Confirm the required imprint details before launch.',
        ],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'Placeholder draft',
    intro: [
      'This privacy policy is structured as editable template text for the public Rising World Manager frontend. Replace placeholder contact details and validate the final text before production use.',
    ],
    sections: [
      {
        heading: 'Server Logs and IP Addresses',
        body: [
          'When you access the website or API, technical server logs may contain your IP address, request time, requested URL, user agent, response status, and similar security or diagnostics data. These logs are used to operate, secure, debug, and protect the service.',
        ],
      },
      {
        heading: 'Rising World Master List Data',
        body: [
          'The service displays and processes public server data obtained from the Rising World master list, including server identifiers, addresses, public status data, and metadata made available through that list.',
        ],
      },
      {
        heading: 'Data Fetched from Listed Game Servers',
        body: [
          'The service may fetch additional public data directly from listed Rising World servers, including server name, description, map, version, player counts, public server configuration flags, public player list data, and related status information. Server operators are responsible for the server names, descriptions, logos, and public data they provide.',
        ],
      },
      {
        heading: 'Steam Login',
        body: [
          'Steam sign-in is used for authentication and admin access verification. If you sign in, the service may store your SteamID64, Steam display name, avatar URL, login timestamp, and session-related authentication data.',
          'Steam is an external service. Your use of Steam authentication is also subject to Steam terms and privacy information.',
        ],
      },
      {
        heading: 'Server Admin Verification and Admin-Only Views',
        body: [
          'Signed-in users may receive access to additional admin-only server data when their Steam identity can be verified as authorized for a server. This may involve comparing your SteamID64 with server ownership or admin data and storing access state required to provide the admin view.',
        ],
      },
      {
        heading: 'Global Chat Messages',
        body: [
          'If you use global chat, messages you submit may include your display name, message text, timestamps, source endpoint, and optional attachment data. Messages may be visible on the website, Discord, and connected Rising World servers.',
        ],
      },
      {
        heading: 'Discord Bridge',
        body: [
          'Global chat may be bridged to and from a Discord channel. Discord user names, message content, timestamps, and Discord-origin metadata may be processed to relay messages between endpoints. Discord is an external service not controlled by this site.',
        ],
      },
      {
        heading: 'WebSocket/API Access',
        body: [
          'The frontend uses HTTP APIs and WebSocket connections to load server data, authentication state, and live chat updates. These connections may process session tokens, request metadata, and technical connection data needed to operate the service.',
        ],
      },
      {
        heading: 'Cookies and Session Storage',
        body: [
          'The frontend uses technically necessary browser storage for login/session state and user interface preferences. No cookie banner is shown because this template does not add non-essential tracking, analytics, or marketing cookies. If analytics or marketing tools are added later, update this policy and implement the required consent handling.',
        ],
      },
      {
        heading: 'Retention Periods',
        body: [
          'Technical logs are retained only as long as needed for security, diagnostics, and legal obligations. Account/session records, Steam authentication data, admin verification records, server data cache entries, and chat messages are retained as long as needed to provide the service, handle abuse reports, protect the platform, or comply with legal obligations. Replace this paragraph with concrete retention periods before launch.',
        ],
      },
      {
        heading: 'Data Subject Rights',
        body: [
          'Depending on applicable law, you may have rights to access, correction, deletion, restriction of processing, data portability, and objection to processing of your personal data.',
          'You can submit privacy requests using the contact listed below. Verification may be required before a request can be processed.',
        ],
        items: [
          'Access',
          'Correction',
          'Deletion',
          'Restriction',
          'Portability',
          'Objection',
        ],
      },
      {
        heading: 'Contact for Privacy Requests',
        body: [
          'TODO: Replace this placeholder contact before launch: privacy@example.com',
        ],
      },
    ],
  },
  terms: {
    title: 'Terms of Use',
    updated: 'Placeholder draft',
    sections: [
      {
        heading: 'Service Availability',
        body: [
          'There is no entitlement to inclusion in the server list, continued listing, specific ranking, uptime, availability, accuracy, or completeness of the service.',
        ],
      },
      {
        heading: 'Server Operator Responsibility',
        body: [
          'Server admins and operators are responsible for server names, descriptions, logos, public server data, and other content supplied by their own servers or configuration.',
        ],
      },
      {
        heading: 'Moderation and Removal',
        body: [
          'The site operator may hide, remove, block, limit, or delist server entries or user access where needed to protect users, comply with law, respond to reports, prevent abuse, or maintain the service.',
        ],
      },
      {
        heading: 'Authentication and Admin Access',
        body: [
          'Abuse of Steam login, admin access verification, account access, or admin-only views is prohibited. Do not attempt to access data or controls for servers you are not authorized to administer.',
        ],
      },
      {
        heading: 'No Warranty',
        body: [
          'The service is provided without warranty for uptime, accuracy, availability, completeness, or fitness for any particular purpose.',
        ],
      },
      {
        heading: 'External Services',
        body: [
          'External services such as Steam, Discord, and third-party Rising World game servers are not controlled by this site. Their availability, content, rules, and data processing are governed by their respective operators.',
        ],
      },
    ],
  },
  'community-rules': {
    title: 'Community Rules',
    updated: 'Placeholder draft',
    sections: [
      {
        heading: 'Prohibited Content and Conduct',
        body: [
          'Do not post, submit, relay, or configure content that is illegal, harmful, abusive, or disruptive.',
        ],
        items: [
          'Illegal content',
          'Hate speech, harassment, threats, or doxxing',
          'Scams, malware, cheat distribution, or malicious links',
          'Impersonation or misleading ownership/admin claims',
          'Spam or repeated disruptive messages',
          'Unauthorized copyrighted material',
        ],
      },
      {
        heading: 'Global Chat Visibility',
        body: [
          'Global chat messages may be visible on the website, Discord, and connected Rising World servers. Do not post private, confidential, or sensitive information.',
        ],
      },
      {
        heading: 'Moderation Actions',
        body: [
          'Moderation actions may include message removal, server delisting, account restrictions, admin access restrictions, or bans. Severe or illegal abuse may be escalated to appropriate service providers or authorities where required.',
        ],
      },
    ],
  },
  report: {
    title: 'Report / Abuse',
    updated: 'Placeholder draft',
    intro: [
      'Use this page to report problematic server listings, chat abuse, ownership issues, privacy complaints, or copyright complaints. Placeholder contact email: abuse@example.com',
    ],
    sections: [
      {
        heading: 'What You Can Report',
        body: [
          'Please report issues that may require review or moderation.',
        ],
        items: [
          'Problematic server name, description, or logo',
          'Illegal or harmful content',
          'Global chat abuse',
          'Wrong ownership or admin claims',
          'Privacy complaints',
          'Copyright complaints',
        ],
      },
      {
        heading: 'How to Report',
        body: [
          'Send your report to abuse@example.com. Include enough detail to identify the server, message, or user activity involved.',
        ],
      },
      {
        heading: 'Useful Report Details',
        body: [
          'The following details help review reports faster:',
        ],
        items: [
          'Server name',
          'Server address or ID',
          'Screenshot or quote',
          'Reason for report',
          'Contact email for follow-up',
        ],
      },
    ],
  },
};
