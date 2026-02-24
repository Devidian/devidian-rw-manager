

## Naechste Schritte: i18n, Rich-Text, Server bearbeiten, Steam-Links, API-Anpassungen

### 1. Internationalisierung (i18n)

**Library:** `react-i18next` mit `i18next` und `i18next-browser-languagedetector`

- Neue Dateien: `src/i18n/index.ts`, `src/i18n/de.json`, `src/i18n/en.json`
- `i18next-browser-languagedetector` erkennt automatisch die Browser-Sprache
- Sprachauswahl wird im localStorage gespeichert (`rwm_language`)
- Ein Sprachumschalter (DE/EN Toggle) wird in der Sidebar-Footer oder im Header platziert
- Alle hartkodierten deutschen Strings in Komponenten werden durch `t('key')` ersetzt
- Betrifft: `ServerCard`, `ServerDetail`, `AddServerDialog`, `AppSidebar`, `Index`, `LandingPage`, `NotFound`, Status-Labels, Fehlermeldungen, Formulare
- `date-fns` Locale wird dynamisch basierend auf der aktiven Sprache gewaehlt (`de` oder `enUS`)

---

### 2. Rich-Text / Color-Tags

Server-Namen und Beschreibungen koennen `<color=orange>Text</color>`-Tags enthalten.

- Neue Utility-Komponente: `src/components/RichText.tsx`
- Parst den String mit einem einfachen Regex: `/<color=([^>]+)>(.*?)<\/color>/g`
- Gibt React-Elemente mit `<span style={{ color }}>` zurueck
- Nicht-farbige Textabschnitte werden als normaler Text gerendert
- Wird ueberall eingesetzt wo Servernamen oder Beschreibungen angezeigt werden: `ServerCard`, `ServerDetail`, `AppSidebar`

---

### 3. Server bearbeiten

- Neue Komponente: `src/components/EditServerDialog.tsx`
  - Aehnlich wie `AddServerDialog`, aber mit vorausgefuellten Feldern
  - Erlaubt Aendern von: `label`, `backendUrl`
  - `queryUrl` bleibt unveraenderlich (identifiziert den Server)
- `StorageAdapter` Interface erhaelt neue Methode: `updateServer(id: string, data: Partial<Pick<ServerConfig, 'label' | 'backendUrl'>>): Promise<ServerConfig>`
  - `LocalStorageAdapter`: Update im localStorage
  - `BackendStorageAdapter`: `PATCH /api/storage/server/:id`
- Edit-Button in der `ServerDetail`-Ansicht (neben dem Refresh-Button)
- `ServerContext` und `useServers` Hook erhalten `updateServer` Funktion

---

### 4. Steam-Profil-Links

- In den Spielerlisten (Online-Spieler und Datenbank-Spieler) wird die `uid` klickbar wenn `platform` den Wert `"Steam"` hat (case-insensitive)
- Link-Format: `https://steamcommunity.com/profiles/{uid}`
- Oeffnet sich in einem neuen Tab (`target="_blank"`)
- Visuell: Die UID wird als Link mit Unterstrich und externem Link-Icon dargestellt
- Betrifft: `OnlinePlayersSection` und die DB-Spieler-Tabelle in `ServerDetail.tsx`

---

### 5. API-Route-Prefix Aenderung

Der Storage-Prefix wechselt von `/api/server` zu `/api/storage/server`:

- `BackendStorageAdapter` in `src/lib/storage.ts` anpassen:
  - `GET /api/storage/server`
  - `POST /api/storage/server`
  - `DELETE /api/storage/server/:id`
  - `PATCH /api/storage/server/:id` (neu)

---

### 6. Neuer Tab: Serverkonfiguration

- Neue Route am Game-Backend: `GET /api/data/server/config` liefert `{ config: Record<string, string | number | boolean> }`
- Neuer Hook: `src/hooks/useServerConfig.ts` -- laedt die Config wenn `backendUrl` gesetzt ist
- Neuer Tab "Konfiguration" in `ServerDetail.tsx`, nur sichtbar wenn Backend verbunden
- Anzeige als gruppierte Key-Value-Tabelle:
  - Gruppierung nach Prefix: `Server_*`, `World_*`, `Settings_*`, `Database_*`, `RCON_*`, `Plugins_*`, `Permissions_*`
  - Werte mit `***` werden als "geschwärzt" dargestellt (z.B. mit Schloss-Icon)
  - Boolean-Werte ("True"/"False") werden visuell als gruene/rote Badges dargestellt
  - Mehrzeiliger Text (z.B. `Server_Description`) wird mit Zeilenumbruechen gerendert

---

### 7. DbPlayer Spawn-Properties

Die `*spawn` Properties (`primaryspawn`, `secondaryspawn`, `tertiaryspawn`) aendern sich von `unknown`/Buffer zu `{ x: number; y: number; z: number } | null`.

- Typ-Update in `src/types/server.ts`:
  ```
  interface SpawnPoint { x: number; y: number; z: number }
  primaryspawn: SpawnPoint | null;
  secondaryspawn: SpawnPoint | null;
  tertiaryspawn: SpawnPoint | null;
  ```

---

### Dateiuebersicht

| Datei | Aktion |
|---|---|
| `src/i18n/index.ts` | Neu: i18next Setup |
| `src/i18n/de.json` | Neu: Deutsche Uebersetzungen |
| `src/i18n/en.json` | Neu: Englische Uebersetzungen |
| `src/components/RichText.tsx` | Neu: Color-Tag Parser |
| `src/components/EditServerDialog.tsx` | Neu: Server bearbeiten |
| `src/hooks/useServerConfig.ts` | Neu: Server-Config laden |
| `src/types/server.ts` | SpawnPoint-Typ, ServerConfigResponse |
| `src/lib/storage.ts` | API-Prefix + updateServer + PATCH |
| `src/hooks/useServers.ts` | updateServer hinzufuegen |
| `src/context/ServerContext.tsx` | updateServer exponieren |
| `src/components/ServerDetail.tsx` | Steam-Links, RichText, Config-Tab, Edit-Button, i18n |
| `src/components/ServerCard.tsx` | RichText, i18n |
| `src/components/AddServerDialog.tsx` | i18n |
| `src/components/AppSidebar.tsx` | RichText, Sprachumschalter, i18n |
| `src/pages/Index.tsx` | i18n |
| `src/pages/LandingPage.tsx` | i18n |
| `src/pages/NotFound.tsx` | i18n |
| `src/main.tsx` | i18n Import |

