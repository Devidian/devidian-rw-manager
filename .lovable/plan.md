
## Anpassungen: Neue Query-Routen, aktualisierte Typen & Backend-Prefix

### Zusammenfassung

Die vom Spiel gelieferten Daten werden um drei neue Query-Routen erweitert (`/info`, `/playerlist`, `/image/header`), das `DbPlayer`-Schema wird an die echten Datenbankfelder angepasst, und der Backend-Daten-Prefix wechselt von `/api/player` auf `/api/data/player`. Ausserdem wird das `BackendInfo`-Schema um `version` erweitert.

---

### 1. Typen aktualisieren (`src/types/server.ts`)

Neue Interfaces hinzufuegen:

- **`ServerInfoResponse`** -- Schema fuer `GET {queryUrl}/info` (name, shortname, description, contact, headerimage)
- **`ServerPlayerListPlayer`** -- Online-Spieler aus `/playerlist` (id, name, uid, platform, ping)
- **`ServerPlayerListResponse`** -- Wrapper mit playercount + players-Array
- **`BackendInfo`** -- ok, services (mit `"data"` statt dem alten Konzept), version

**`DbPlayer` komplett ersetzen** mit dem echten Schema:
- `id: number`, `uid: string`, `name: string`, Position (posx/y/z, rotx/y/z/w), `platform`, `permissiongroup`, Vitalwerte (health, hunger, thirst, brokenbones, temperature), `dead`, `flying`, `clothes`, Spawns, `playtime`, `firstseen`, `lastseen` etc.

**`DataPlayerListResponse`** -- `{ items: DbPlayer[] }`

Das alte `OnlinePlayer`-Interface kann entfernt werden, da es durch `ServerPlayerListPlayer` ersetzt wird.

---

### 2. ServerWithStatus erweitern

`ServerWithStatus` bekommt zwei neue optionale Felder:
- `infoData?: ServerInfoResponse` -- aus `/info`
- `onlinePlayers?: ServerPlayerListPlayer[]` -- aus `/playerlist`

---

### 3. Status-Hook erweitern (`src/hooks/useServerStatus.ts`)

Beim Statusabruf pro Server zusaetzlich zu `GET /` auch abfragen:
- `GET {queryUrl}/info` -- Serverinfo laden (Name, Beschreibung, Headerbild-Flag)
- `GET {queryUrl}/playerlist` -- Aktuelle Online-Spieler laden

Alle drei Requests parallel ausfuehren. Die neuen Daten werden im `ServerWithStatus` gespeichert. Fehler bei `/info` oder `/playerlist` sind nicht kritisch -- der Server gilt trotzdem als online wenn `/` erfolgreich war.

---

### 4. Backend-Daten-Endpoint anpassen (`src/hooks/useDatabasePlayers.ts`)

- URL-Pfad aendern: `/api/player` wird zu `/api/data/player`
- Response-Parsing anpassen: Erwartet jetzt `{ items: DbPlayer[] }` statt ein nacktes Array
- Felder im Hook an das neue DbPlayer-Schema anpassen (z.B. `uid` statt `steamId`, `permissiongroup` statt `group`, `playtime` statt `playTime`, `lastseen` statt `lastLogin`)

---

### 5. Backend-Health-Check anpassen (`src/lib/storage.ts`)

- `checkBackend()` aktualisieren: Der Service-Name bleibt `"storage"` fuer Site-Backends
- Fuer Game-Backends wird der Service `"data"` geprueft (statt dem bisherigen Konzept)
- Optional `version` aus der Response lesen und zurueckgeben

---

### 6. ServerDetail aktualisieren (`src/components/ServerDetail.tsx`)

**Uebersicht-Tab:**
- Server-Beschreibung und Kurzname aus `/info` anzeigen (falls vorhanden)
- Header-Bild: Wenn `infoData.headerimage === true`, ein `<img>` mit `src={queryUrl}/image/header` als Banner ueber der Detailansicht rendern

**Spieler-Tab -- Zwei Bereiche:**
1. **Online-Spieler** (aus Query `/playerlist`): Immer verfuegbar wenn Server online. Zeigt Name, UID, Platform, Ping
2. **Datenbank-Spieler** (aus Game-Backend `/api/data/player`): Nur wenn `backendUrl` gesetzt. Tabellenspalten anpassen an neues Schema: Name, UID, Platform, Gruppe (permissiongroup), Spielzeit (playtime), Zuletzt gesehen (lastseen), Health/Hunger/Thirst

**Feldnamen-Mapping in der Spieler-Tabelle:**
- `steamId` -> `uid`
- `group` -> `permissiongroup`
- `playTime` -> `playtime`
- `lastLogin` -> `lastseen` (Unix-Timestamp, muss formatiert werden)

---

### 7. ServerCard anpassen (`src/components/ServerCard.tsx`)

- Falls `infoData` vorhanden: Kurzname (`shortname`) oder Beschreibung als Untertitel anzeigen
- Online-Spieler-Anzahl kann jetzt auch aus der `/playerlist`-Response kommen

---

### Dateien-Uebersicht

| Datei | Aktion |
|---|---|
| `src/types/server.ts` | Neue Interfaces, DbPlayer ersetzen |
| `src/hooks/useServerStatus.ts` | `/info` + `/playerlist` parallel abfragen |
| `src/hooks/useDatabasePlayers.ts` | Pfad `/api/data/player`, neues Response-Format |
| `src/lib/storage.ts` | `checkBackend` um `version` erweitern, `"data"` Service |
| `src/components/ServerDetail.tsx` | Header-Bild, Info-Daten, Online-Spieler, DB-Spieler Spalten |
| `src/components/ServerCard.tsx` | Kurzname/Beschreibung anzeigen |

---

### Technische Details

**Timestamps:** `firstseen` und `lastseen` sind Unix-Timestamps (Sekunden). Formatierung mit `date-fns`: `formatDistanceToNow(new Date(lastseen * 1000), { addSuffix: true, locale: de })`.

**Header-Bild URL:** `${queryUrl}/image/header` -- wird als normales `<img>` Tag eingebunden mit Fallback bei Ladefehler.

**Parallel-Fetching in useServerStatus:** Alle drei Query-Endpunkte (`/`, `/info`, `/playerlist`) werden gleichzeitig mit `Promise.allSettled` abgefragt, um Timeouts bei einzelnen Routen nicht den gesamten Status zu blockieren.
