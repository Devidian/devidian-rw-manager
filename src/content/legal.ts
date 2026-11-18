export type LegalLocale = 'en' | 'de';
export type LegalPageKey = 'imprint' | 'privacy' | 'terms' | 'community-rules' | 'report';

export const LEGAL_OPERATOR = {
  name: 'Maik Laschober',
  address: ['Hebeckenkamp 49', '45731 Waltrop', 'Germany'],
  phone: '+49 2309 5409842',
  imprintEmail: 'imprint@omega-zirkel.de',
  privacyEmail: 'privacy@omega-zirkel.de',
  abuseEmail: 'abuse@omega-zirkel.de',
} as const;

export const LEGAL_UPDATED = {
  en: 'Last updated: July 1, 2026',
  de: 'Stand: 1. Juli 2026',
} as const;

const PRIVACY_UPDATED = {
  en: 'Last updated: November 16, 2026',
  de: 'Stand: 16. November 2026',
} as const;

const legalAddressDe = ['Hebeckenkamp 49', '45731 Waltrop', 'Deutschland'];

export const LEGAL_LINKS: Record<LegalLocale, { label: string; path: string }[]> = {
  en: [
    { label: 'Imprint', path: '/imprint' },
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Terms of Use', path: '/terms' },
    { label: 'Community Rules', path: '/community-rules' },
    { label: 'Report / Abuse', path: '/report' },
  ],
  de: [
    { label: 'Impressum', path: '/imprint' },
    { label: 'Datenschutzerklärung', path: '/privacy' },
    { label: 'Nutzungsbedingungen', path: '/terms' },
    { label: 'Community-Regeln', path: '/community-rules' },
    { label: 'Melden / Missbrauch', path: '/report' },
  ],
};

export const LEGAL_UI: Record<LegalLocale, {
  back: string;
  reportContext: string;
  legalNavigation: string;
}> = {
  en: {
    back: 'Back',
    reportContext: 'Report context: server ID',
    legalNavigation: 'Legal links',
  },
  de: {
    back: 'Zurück',
    reportContext: 'Meldekontext: Server-ID',
    legalNavigation: 'Rechtliche Links',
  },
};

export function legalLocale(language?: string): LegalLocale {
  return language?.toLowerCase().startsWith('de') ? 'de' : 'en';
}

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

export const LEGAL_PAGES: Record<LegalLocale, Record<LegalPageKey, LegalPageContent>> = {
  en: {
    imprint: {
      title: 'Imprint',
      updated: LEGAL_UPDATED.en,
      sections: [
        {
          heading: 'Service Provider',
          body: [
            LEGAL_OPERATOR.name,
            ...LEGAL_OPERATOR.address,
            `Email: ${LEGAL_OPERATOR.imprintEmail}`,
            `Phone: ${LEGAL_OPERATOR.phone}`,
          ],
        },
        {
          heading: 'Responsible for Content',
          body: [
            `${LEGAL_OPERATOR.name}, ${LEGAL_OPERATOR.address.join(', ')}`,
            'Server names, descriptions, logos and public server data are provided by the respective server operators. The listed service provider is responsible for this website, not for third-party server content supplied by individual server operators.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      updated: PRIVACY_UPDATED.en,
      intro: [
        'This policy explains how Rising World Manager processes data for the public server list, Steam sign-in, admin-only views and global chat.',
      ],
      sections: [
        {
          heading: 'Controller and Contact',
          body: [
            `${LEGAL_OPERATOR.name}, ${LEGAL_OPERATOR.address.join(', ')}`,
            `Privacy requests can be sent to ${LEGAL_OPERATOR.privacyEmail}.`,
          ],
        },
        {
          heading: 'Server Logs and IP Addresses',
          body: [
            'When you access the website, backend API or WebSocket endpoints, technical logs may contain your IP address, request time, requested URL, user agent, referrer, response status and error details. These logs are used to operate, secure, diagnose and protect the service.',
            'Log retention depends on the hosting and operational setup. Logs are kept only as long as needed for security, troubleshooting and legal obligations, and are then deleted or rotated.',
          ],
        },
        {
          heading: 'Rising World Master List Data',
          body: [
            'The service displays public Rising World server list data from the Rising World master list. This can include server identifiers, address and port data, server status, player counts, version information and other public metadata. Master-list-only entries are held temporarily in memory and have no detail page.',
          ],
        },
        {
          heading: 'Stored Servers and Operator Control',
          body: [
            'A server is stored with statistics if it connects through the OZ Tools WebSocket, uses [rw-servers] in its description, or is approved by a Steam-signed-in operator whose identity matches the server contact field. Any one of these conditions is sufficient.',
            'A verified contact operator can remove their stored server from the manager. The manager then removes its statistics and prevents automatic re-import of that endpoint until a new verified approval.',
          ],
        },
        {
          heading: 'Data Fetched from Listed Game Servers',
          body: [
            'For stored servers, the service fetches additional server metadata such as name, description, contact field, map name, game mode, version, public configuration flags, uptime and plugin/status information. Player records are accepted only from a consent-filtered OZ Admin Utils plugin export; the game server player-list endpoint is not used to populate them.',
            'Server operators are responsible for server names, descriptions, logos, public player names and other public content supplied by their servers.',
          ],
        },
        {
          heading: 'Player Consent and Visibility',
          body: [
            'The game server asks players separately before OZ plugins send player activity to this manager, map positions, Discord, Stargate or Global Intercom. Declining a purpose stops the corresponding export from that server.',
            'Player lists on a stored server are available only to signed-in players recorded on that server. Public server statistics do not include a player list. Other visitors do not receive Steam IDs; a verified server administrator may see Steam IDs for players also known on their own server.',
            'A player can change their choice in the OZ Tools player settings. After a Manager revocation, the connected server reports the removal to the manager; disconnected servers are reconciled when a valid plugin export is available again. Privacy requests can also be sent to the contact address above.',
          ],
        },
        {
          heading: 'Steam Login',
          body: [
            'Steam sign-in is used for authentication and admin access verification. If you sign in, Rising World Manager may store your SteamID64, Steam display name, avatar URL, login timestamp, session token metadata and account timestamps.',
            'Steam is an external service. Steam authentication redirects you to Steam and is also subject to Steam privacy information and terms.',
          ],
        },
        {
          heading: 'Server Admin Verification and Admin-Only Views',
          body: [
            'Signed-in users may receive access to admin-only server data when their Steam identity can be verified as authorized for a server. Verification can compare your SteamID64 with server ownership or admin data reported by the manager backend or connected server plugins.',
            'Admin-only views can include additional server configuration, map/admin mapping data, database player information, plugin data or other server-side data exposed only to verified admins.',
          ],
        },
        {
          heading: 'Global Chat Messages',
          body: [
            'If you use global chat, messages may include display name, message text, timestamps, source endpoint, direction, channel information and optional attachment data. Messages can be visible on the website, Discord and connected Rising World servers.',
            'Do not post private or sensitive information in global chat.',
          ],
        },
        {
          heading: 'Discord Bridge',
          body: [
            'Global chat can be bridged to and from a Discord channel. Discord-origin messages can include Discord display names, message content, timestamps and source metadata needed to relay messages. Discord is an external service not controlled by this website.',
          ],
        },
        {
          heading: 'WebSocket/API Access',
          body: [
            'The frontend uses HTTP APIs and WebSocket connections to load server data, authentication state, admin-only data and live chat updates. These connections can process session tokens, request metadata and technical connection data required to provide the service.',
          ],
        },
        {
          heading: 'Cookies and Session Storage',
          body: [
            'The frontend uses technically necessary browser storage for login/session state, the selected language and user interface preferences. This includes local storage keys such as the authentication token and language preference.',
            'No cookie banner is shown because this implementation does not add non-essential tracking, analytics or marketing cookies. If analytics, ads or marketing tools are added later, this policy and consent handling must be updated first.',
          ],
        },
        {
          heading: 'Retention Periods',
          body: [
            'Master-list-only entries are kept in a temporary memory cache. Stored server data is refreshed as part of normal operation. Player records and statistics are removed from this manager after the server reports a revocation or a valid consent-filtered export no longer includes the player. Session/login data is kept while needed to maintain authentication and protect the service. Steam account data and admin verification data are kept while the account or admin access is active, unless deletion is required earlier.',
            'Global chat messages are retained as long as needed to provide chat history, bridge messages across endpoints, investigate abuse and protect the service. Abuse reports and related moderation records may be retained for as long as needed to process the report and defend against repeated abuse.',
          ],
        },
        {
          heading: 'Data Subject Rights',
          body: [
            'Depending on applicable law, you may have rights to access, correction, deletion, restriction of processing, data portability and objection to processing of your personal data.',
            `Send privacy requests to ${LEGAL_OPERATOR.privacyEmail}. Verification may be required before a request can be processed.`,
          ],
          items: ['Access', 'Correction', 'Deletion', 'Restriction', 'Portability', 'Objection'],
        },
        {
          heading: 'External Services',
          body: [
            'The service interacts with external services and third-party systems such as Steam, Discord, the Rising World master list and listed Rising World servers. These services are operated by their respective providers and may process data under their own terms and privacy policies.',
          ],
        },
      ],
    },
    terms: {
      title: 'Terms of Use',
      updated: LEGAL_UPDATED.en,
      sections: [
        {
          heading: 'Scope',
          body: [
            'These terms apply to the public Rising World Manager frontend, including the server list, server detail pages, Steam sign-in, admin-only views and global chat.',
          ],
        },
        {
          heading: 'No Entitlement to Listing',
          body: [
            'There is no entitlement to inclusion in the server list, continued listing, specific ranking, uptime, availability, accuracy or completeness of the service.',
          ],
        },
        {
          heading: 'Server Operator Responsibility',
          body: [
            'Server admins and operators are responsible for server names, descriptions, logos, public server data, public player names and other content supplied by their own servers or configuration.',
          ],
        },
        {
          heading: 'Moderation and Removal',
          body: [
            'The operator may hide, remove, block, limit or delist server entries, messages or user access where needed to comply with law, respond to reports, prevent abuse, protect users or maintain the service.',
          ],
        },
        {
          heading: 'Authentication and Admin Access',
          body: [
            'Abuse of Steam login, admin access verification, account access or admin-only views is prohibited. Do not attempt to access data or controls for servers you are not authorized to administer.',
          ],
        },
        {
          heading: 'No Warranty',
          body: [
            'The service is provided without warranty for uptime, accuracy, availability, completeness or fitness for any particular purpose.',
          ],
        },
        {
          heading: 'External Services',
          body: [
            'External services such as Steam, Discord, the Rising World master list and third-party Rising World game servers are not controlled by this site. Their availability, content, rules and data processing are governed by their respective operators.',
          ],
        },
      ],
    },
    'community-rules': {
      title: 'Community Rules',
      updated: LEGAL_UPDATED.en,
      sections: [
        {
          heading: 'Prohibited Content and Conduct',
          body: [
            'Do not post, submit, relay or configure content that is illegal, harmful, abusive or disruptive.',
          ],
          items: [
            'Illegal content',
            'Hate speech, harassment, threats or doxxing',
            'Scams, malware, cheat distribution or malicious links',
            'Impersonation or misleading ownership/admin claims',
            'Spam or repeated disruptive messages',
            'Unauthorized copyrighted material',
          ],
        },
        {
          heading: 'Global Chat Visibility',
          body: [
            'Global chat messages may be visible on the website, Discord and connected Rising World servers. Do not post private, confidential or sensitive information.',
          ],
        },
        {
          heading: 'Moderation Actions',
          body: [
            'Moderation actions may include message removal, server delisting, account restrictions, admin access restrictions or bans. Severe or illegal abuse may be escalated to appropriate service providers or authorities where required.',
          ],
        },
      ],
    },
    report: {
      title: 'Report / Abuse',
      updated: LEGAL_UPDATED.en,
      intro: [
        `Send reports to ${LEGAL_OPERATOR.abuseEmail}. Include enough detail to identify the server, message or user activity involved.`,
      ],
      sections: [
        {
          heading: 'What You Can Report',
          body: ['Please report issues that may require review or moderation.'],
          items: [
            'Problematic server name, description or logo',
            'Illegal or harmful content',
            'Global chat abuse',
            'Wrong ownership or admin claims',
            'Privacy complaints',
            'Copyright complaints',
          ],
        },
        {
          heading: 'Useful Report Details',
          body: ['The following details help review reports faster:'],
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
  },
  de: {
    imprint: {
      title: 'Impressum',
      updated: LEGAL_UPDATED.de,
      sections: [
        {
          heading: 'Diensteanbieter',
          body: [
            LEGAL_OPERATOR.name,
            ...legalAddressDe,
            `E-Mail: ${LEGAL_OPERATOR.imprintEmail}`,
            `Telefon: ${LEGAL_OPERATOR.phone}`,
          ],
        },
        {
          heading: 'Verantwortlich für Inhalte',
          body: [
            `${LEGAL_OPERATOR.name}, ${legalAddressDe.join(', ')}`,
            'Servernamen, Beschreibungen, Logos und öffentliche Serverdaten werden von den jeweiligen Serverbetreibern bereitgestellt. Der oben genannte Diensteanbieter ist für diese Website verantwortlich, nicht für Drittinhalte einzelner Serverbetreiber.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Datenschutzerklärung',
      updated: PRIVACY_UPDATED.de,
      intro: [
        'Diese Datenschutzerklärung beschreibt, wie Rising World Manager Daten für die öffentliche Serverliste, Steam-Anmeldung, Admin-Ansichten und den globalen Chat verarbeitet.',
      ],
      sections: [
        {
          heading: 'Verantwortlicher und Kontakt',
          body: [
            `${LEGAL_OPERATOR.name}, ${legalAddressDe.join(', ')}`,
            `Anfragen zum Datenschutz können an ${LEGAL_OPERATOR.privacyEmail} gesendet werden.`,
          ],
        },
        {
          heading: 'Server-Logs und IP-Adressen',
          body: [
            'Beim Zugriff auf Website, Backend-API oder WebSocket-Endpunkte können technische Logs IP-Adresse, Zeitpunkt, angefragte URL, User-Agent, Referrer, Antwortstatus und Fehlerdetails enthalten. Diese Daten werden für Betrieb, Sicherheit, Fehleranalyse und Schutz des Dienstes verwendet.',
            'Die Speicherdauer richtet sich nach Hosting- und Betriebsumgebung. Logs werden nur so lange aufbewahrt, wie sie für Sicherheit, Fehlerbehebung und rechtliche Pflichten benötigt werden, und anschließend gelöscht oder rotiert.',
          ],
        },
        {
          heading: 'Daten aus der Rising World Masterliste',
          body: [
            'Der Dienst zeigt öffentliche Serverlistendaten aus der Rising World Masterliste an. Dazu können Serverkennungen, Adresse und Port, Serverstatus, Spielerzahlen, Versionsinformationen und weitere öffentliche Metadaten gehören. Einträge, die nur aus der Masterliste stammen, werden vorübergehend im Arbeitsspeicher gehalten und haben keine Detailseite.',
          ],
        },
        {
          heading: 'Gespeicherte Server und Betreiberrechte',
          body: [
            'Ein Server wird mit Statistiken gespeichert, wenn er über den OZ-Tools-WebSocket verbunden ist, [rw-servers] in seiner Beschreibung verwendet oder von einem über Steam angemeldeten Betreiber freigegeben wurde, dessen Identität zum Kontaktfeld des Servers passt. Eine dieser Bedingungen genügt.',
            'Ein verifizierter Kontaktbetreiber kann seinen gespeicherten Server aus dem Manager entfernen. Dabei werden dessen Statistiken gelöscht und der automatische Neuimport dieses Endpunkts bis zu einer erneuten verifizierten Freigabe unterdrückt.',
          ],
        },
        {
          heading: 'Daten von gelisteten Spielservern',
          body: [
            'Für gespeicherte Server ruft der Dienst zusätzliche Servermetadaten ab, etwa Name, Beschreibung, Kontaktfeld, Kartenname, Spielmodus, Version, öffentliche Konfigurationsflags, Laufzeit und Plugin-/Statusinformationen. Spielerdatensätze stammen ausschließlich aus einem nach Einwilligung gefilterten Export von OZ Admin Utils; der Spielserver-Endpunkt für die Spielerliste füllt diese Datensätze nicht.',
            'Serverbetreiber sind für Servernamen, Beschreibungen, Logos, öffentliche Spielernamen und sonstige öffentliche Inhalte verantwortlich, die ihre Server bereitstellen.',
          ],
        },
        {
          heading: 'Spielerfreigabe und Sichtbarkeit',
          body: [
            'Der Spielserver fragt Spieler für die Übertragung von Spielaktivität an diesen Manager, Kartenpositionen, Discord, Stargate und Global Intercom getrennt um Freigabe. Bei Ablehnung unterbleibt der entsprechende Export dieses Servers.',
            'Spielerlisten gespeicherter Server sehen nur angemeldete Spieler, die auf dem jeweiligen Server erfasst sind. Öffentliche globale Serverstatistiken enthalten keine Spielerliste. Andere Besucher erhalten keine Steam-IDs; ein verifizierter Serveradministrator kann Steam-IDs von Spielern sehen, die auch auf seinem eigenen Server bekannt sind.',
            'Spieler können ihre Entscheidung in den OZ-Tools-Spielereinstellungen ändern. Bei einem Manager-Widerruf meldet ein verbundener Server die Entfernung an den Manager; bei getrennter Verbindung erfolgt der Abgleich nach dem nächsten gültigen Plugin-Export. Anfragen zum Datenschutz können zusätzlich an die oben genannte Kontaktadresse gesendet werden.',
          ],
        },
        {
          heading: 'Steam-Anmeldung',
          body: [
            'Die Steam-Anmeldung wird zur Authentifizierung und zur Prüfung von Admin-Zugriffen verwendet. Bei Anmeldung kann Rising World Manager SteamID64, Steam-Anzeigename, Avatar-URL, Anmeldezeitpunkt, Session-Token-Metadaten und Kontozeitstempel speichern.',
            'Steam ist ein externer Dienst. Die Steam-Authentifizierung leitet zu Steam weiter und unterliegt zusätzlich den Datenschutzinformationen und Bedingungen von Steam.',
          ],
        },
        {
          heading: 'Server-Admin-Verifikation und Admin-Ansichten',
          body: [
            'Angemeldete Nutzer können Zugriff auf zusätzliche Admin-Daten erhalten, wenn ihre Steam-Identität als berechtigt für einen Server verifiziert wird. Dazu kann die SteamID64 mit Eigentümer- oder Admin-Daten verglichen werden, die vom Manager-Backend oder verbundenen Server-Plugins gemeldet werden.',
            'Admin-Ansichten können zusätzliche Serverkonfiguration, Karten-/Admin-Mapping-Daten, Datenbank-Spielerinformationen, Plugin-Daten oder andere serverseitige Daten enthalten, die nur verifizierten Admins angezeigt werden.',
          ],
        },
        {
          heading: 'Globale Chat-Nachrichten',
          body: [
            'Bei Nutzung des globalen Chats können Anzeigename, Nachrichtentext, Zeitstempel, Quell-Endpunkt, Richtung, Kanalinformationen und optionale Anhänge verarbeitet werden. Nachrichten können auf der Website, in Discord und auf verbundenen Rising-World-Servern sichtbar sein.',
            'Bitte keine privaten oder sensiblen Informationen im globalen Chat veröffentlichen.',
          ],
        },
        {
          heading: 'Discord-Brücke',
          body: [
            'Der globale Chat kann mit einem Discord-Kanal verbunden sein. Von Discord stammende Nachrichten können Discord-Anzeigenamen, Nachrichtentext, Zeitstempel und Quell-Metadaten enthalten, die zur Weiterleitung benötigt werden. Discord ist ein externer Dienst und wird nicht von dieser Website kontrolliert.',
          ],
        },
        {
          heading: 'WebSocket-/API-Zugriff',
          body: [
            'Das Frontend verwendet HTTP-APIs und WebSocket-Verbindungen, um Serverdaten, Authentifizierungsstatus, Admin-Daten und Live-Chat-Updates zu laden. Dabei können Session-Tokens, Request-Metadaten und technische Verbindungsdaten verarbeitet werden, die für den Dienst erforderlich sind.',
          ],
        },
        {
          heading: 'Cookies und Browser-Speicher',
          body: [
            'Das Frontend nutzt technisch notwendigen Browser-Speicher für Login-/Session-Status, Spracheinstellung und Bedienoberflächen-Präferenzen. Dazu gehören Local-Storage-Einträge wie Authentifizierungs-Token und Sprachpräferenz.',
            'Es wird kein Cookie-Banner angezeigt, weil diese Implementierung keine nicht notwendigen Tracking-, Analyse- oder Marketing-Cookies hinzufügt. Wenn später Analyse-, Werbe- oder Marketingtools ergänzt werden, müssen diese Erklärung und die Einwilligungsbehandlung vorher angepasst werden.',
          ],
        },
        {
          heading: 'Speicherdauer',
          body: [
            'Einträge ausschließlich aus der Masterliste bleiben in einem vorübergehenden Arbeitsspeicher-Cache. Daten gespeicherter Server werden im normalen Betrieb aktualisiert. Spielerdatensätze und Statistiken werden aus diesem Manager entfernt, nachdem der Server einen Widerruf gemeldet hat oder ein gültiger, nach Einwilligung gefilterter Export den Spieler nicht mehr enthält. Session-/Login-Daten werden gespeichert, solange sie für Authentifizierung und Schutz des Dienstes benötigt werden. Steam-Kontodaten und Admin-Verifikationsdaten werden gespeichert, solange Konto oder Admin-Zugriff aktiv sind, sofern keine frühere Löschung erforderlich ist.',
            'Globale Chat-Nachrichten werden gespeichert, solange dies für Chat-Verlauf, Weiterleitung zwischen Endpunkten, Missbrauchsprüfung und Schutz des Dienstes erforderlich ist. Missbrauchsmeldungen und zugehörige Moderationsdaten können so lange gespeichert werden, wie dies zur Bearbeitung der Meldung und zur Abwehr wiederholten Missbrauchs erforderlich ist.',
          ],
        },
        {
          heading: 'Betroffenenrechte',
          body: [
            'Je nach anwendbarem Recht können Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch gegen die Verarbeitung personenbezogener Daten bestehen.',
            `Anfragen können an ${LEGAL_OPERATOR.privacyEmail} gesendet werden. Vor Bearbeitung kann eine Verifikation erforderlich sein.`,
          ],
          items: ['Auskunft', 'Berichtigung', 'Löschung', 'Einschränkung', 'Datenübertragbarkeit', 'Widerspruch'],
        },
        {
          heading: 'Externe Dienste',
          body: [
            'Der Dienst interagiert mit externen Diensten und Drittsystemen wie Steam, Discord, der Rising World Masterliste und gelisteten Rising-World-Servern. Diese Dienste werden von ihren jeweiligen Anbietern betrieben und können Daten nach eigenen Bedingungen und Datenschutzhinweisen verarbeiten.',
          ],
        },
      ],
    },
    terms: {
      title: 'Nutzungsbedingungen',
      updated: LEGAL_UPDATED.de,
      sections: [
        {
          heading: 'Geltungsbereich',
          body: [
            'Diese Bedingungen gelten für das öffentliche Rising-World-Manager-Frontend, einschließlich Serverliste, Serverdetailseiten, Steam-Anmeldung, Admin-Ansichten und globalem Chat.',
          ],
        },
        {
          heading: 'Kein Anspruch auf Listung',
          body: [
            'Es besteht kein Anspruch auf Aufnahme in die Serverliste, dauerhafte Listung, bestimmte Platzierung, Betriebszeit, Verfügbarkeit, Richtigkeit oder Vollständigkeit des Dienstes.',
          ],
        },
        {
          heading: 'Verantwortung der Serverbetreiber',
          body: [
            'Serveradmins und Serverbetreiber sind verantwortlich für Servernamen, Beschreibungen, Logos, öffentliche Serverdaten, öffentliche Spielernamen und sonstige Inhalte, die durch ihre Server oder Konfiguration bereitgestellt werden.',
          ],
        },
        {
          heading: 'Moderation und Entfernung',
          body: [
            'Der Betreiber kann Servereinträge, Nachrichten oder Nutzerzugriffe ausblenden, entfernen, sperren, beschränken oder delisten, wenn dies zur Einhaltung von Recht, Bearbeitung von Meldungen, Verhinderung von Missbrauch, zum Schutz von Nutzern oder zum Betrieb des Dienstes erforderlich ist.',
          ],
        },
        {
          heading: 'Authentifizierung und Admin-Zugriff',
          body: [
            'Missbrauch der Steam-Anmeldung, Admin-Verifikation, Kontozugriffe oder Admin-Ansichten ist untersagt. Es dürfen keine Daten oder Funktionen für Server genutzt werden, für die keine Admin-Berechtigung besteht.',
          ],
        },
        {
          heading: 'Keine Gewährleistung',
          body: [
            'Der Dienst wird ohne Gewähr für Betriebszeit, Richtigkeit, Verfügbarkeit, Vollständigkeit oder Eignung für einen bestimmten Zweck bereitgestellt.',
          ],
        },
        {
          heading: 'Externe Dienste',
          body: [
            'Externe Dienste wie Steam, Discord, die Rising World Masterliste und Rising-World-Server Dritter werden nicht von dieser Website kontrolliert. Verfügbarkeit, Inhalte, Regeln und Datenverarbeitung richten sich nach den jeweiligen Betreibern.',
          ],
        },
      ],
    },
    'community-rules': {
      title: 'Community-Regeln',
      updated: LEGAL_UPDATED.de,
      sections: [
        {
          heading: 'Unzulässige Inhalte und Verhaltensweisen',
          body: [
            'Es dürfen keine rechtswidrigen, schädlichen, missbräuchlichen oder störenden Inhalte veröffentlicht, übermittelt, weitergeleitet oder konfiguriert werden.',
          ],
          items: [
            'Rechtswidrige Inhalte',
            'Hassrede, Belästigung, Drohungen oder Doxxing',
            'Betrug, Malware, Cheat-Verbreitung oder schädliche Links',
            'Identitätsmissbrauch oder irreführende Eigentümer-/Admin-Behauptungen',
            'Spam oder wiederholt störende Nachrichten',
            'Nicht autorisiertes urheberrechtlich geschütztes Material',
          ],
        },
        {
          heading: 'Sichtbarkeit des globalen Chats',
          body: [
            'Globale Chat-Nachrichten können auf der Website, in Discord und auf verbundenen Rising-World-Servern sichtbar sein. Bitte keine privaten, vertraulichen oder sensiblen Informationen veröffentlichen.',
          ],
        },
        {
          heading: 'Moderationsmaßnahmen',
          body: [
            'Moderationsmaßnahmen können das Entfernen von Nachrichten, das Delisting von Servern, Kontobeschränkungen, Einschränkungen von Admin-Zugriffen oder Sperren umfassen. Schwerer oder rechtswidriger Missbrauch kann an zuständige Diensteanbieter oder Behörden weitergegeben werden, soweit dies erforderlich ist.',
          ],
        },
      ],
    },
    report: {
      title: 'Melden / Missbrauch',
      updated: LEGAL_UPDATED.de,
      intro: [
        `Meldungen bitte an ${LEGAL_OPERATOR.abuseEmail} senden. Bitte genügend Details angeben, damit Server, Nachricht oder Nutzeraktivität identifiziert werden können.`,
      ],
      sections: [
        {
          heading: 'Was gemeldet werden kann',
          body: ['Bitte melde Probleme, die eine Prüfung oder Moderation erfordern können.'],
          items: [
            'Problematischer Servername, problematische Beschreibung oder problematisches Logo',
            'Rechtswidrige oder schädliche Inhalte',
            'Missbrauch im globalen Chat',
            'Falsche Eigentümer- oder Admin-Behauptungen',
            'Datenschutzbeschwerden',
            'Urheberrechtsbeschwerden',
          ],
        },
        {
          heading: 'Hilfreiche Angaben',
          body: ['Die folgenden Angaben helfen bei einer schnelleren Prüfung:'],
          items: [
            'Servername',
            'Serveradresse oder ID',
            'Screenshot oder Zitat',
            'Grund der Meldung',
            'Kontakt-E-Mail für Rückfragen',
          ],
        },
      ],
    },
  },
};
