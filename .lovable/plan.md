
## Refactoring: Dual-Backend-Architektur

### Übersicht der Änderungen

Das Projekt wird um eine Landing Page erweitert, die den Nutzer zwischen zwei Modi wählen lässt. Die Typen werden aktualisiert und die gesamte Datenzugriffs-Schicht wird sauber getrennt.

---

### 1. Typen aktualisieren (`src/types/server.ts`)

- `ServerConfig` erhält `userId?: string`
- `RisingWorldQueryData` wird auf das exakte Schema aus der echten API angepasst (alle Felder mit korrekten Typen: `version`, `legacy`, `ip`, `port`, `steamid`, `contact`, `name`, `map`, `os`, `uptime`, `visible`, `locked`, `whitelist`, `pvp`, `pve`, `gamemode`, `peaceful`, `maxplayers`, `playercount`, `mods`)
- `DbPlayer` wird angepasst: `id`, `steamId`, `name`, `playTime`, `lastLogin`, `group` (passend zu `GET /api/player`)

---

### 2. Storage-Abstraktionsschicht (`src/lib/storage.ts`)

Neues Modul, das die Lese/Schreib-Operationen für Server-Konfigurationen kapselt. Es entscheidet je nach aktivem Modus, ob es localStorage oder das Site-Backend nutzt:

```text
StorageAdapter
├── LocalStorageAdapter  → CRUD in localStorage
└── BackendStorageAdapter → CRUD via fetch() gegen Site-Backend-API
```

Beide Adapter implementieren dasselbe Interface:
- `getServers(): Promise<ServerConfig[]>`
- `addServer(data): Promise<ServerConfig>`
- `deleteServer(id): Promise<void>`

---

### 3. Neuer Context: `StorageModeContext` (`src/context/StorageModeContext.tsx`)

Hält global fest, welcher Modus aktiv ist:
- `mode: 'local' | 'backend'`
- `backendUrl: string | null`
- `setMode(...)`: persistiert die Wahl in localStorage

---

### 4. Landing Page (`src/pages/LandingPage.tsx`)

Neue Route `/setup`. Zeigt zwei Optionen:

**Option A – Lokal (kein Backend)**
- Sofortige Weiterleitung zu `/` nach Auswahl

**Option B – Eigenes Backend**
- Eingabefeld für die Site-Backend-URL
- Beim Bestätigen: Fetch gegen `GET {url}/` mit Timeout
- Auswertungslogik:
  - Netzwerkfehler → "Backend nicht erreichbar"
  - Response kein JSON / `ok !== true` → "Kein gültiger Server"
  - `services` enthält nicht `"storage"` → "Dieser Server bietet keinen Storage-Service an"
  - Alles OK → URL + Modus speichern, Weiterleitung zu `/`
- Status-Feedback während der Prüfung (Spinner), danach Erfolg oder Fehler-Badge

---

### 5. Router anpassen (`src/App.tsx`)

- Route `/setup` → `<LandingPage />`
- Beim App-Start prüfen: Ist bereits ein Modus gespeichert? Falls nicht → Redirect zu `/setup`
- `Layout`-Komponente bekommt Zugriff auf `StorageModeContext` um den aktiven Modus in der Sidebar anzuzeigen

---

### 6. `useServers` Hook anpassen (`src/hooks/useServers.ts`)

- Nutzt jetzt den aktiven `StorageAdapter` statt direkt localStorage
- CRUD-Funktionen werden `async` (für Backend-Kompatibilität)
- `ServerContext` bleibt das API nach außen, übernimmt intern das Warten auf Promises

---

### 7. Spieler-Endpunkt anpassen (`src/hooks/useDatabasePlayers.ts`)

- Endpunkt wird von `/api/servers/:id/players` auf `/api/player` geändert (Game-Backend-API-Spec)
- Player-Detail-Endpunkt `GET /api/player/:id` vorbereiten
- `DbPlayer`-Typ entsprechend aktualisieren

---

### 8. `ServerDetail`-Komponente aktualisieren (`src/components/ServerDetail.tsx`)

- `RisingWorldQueryData`-Felder angepasst (z.B. `name` statt `servername`, `playercount` statt `players`, `maxplayers` statt `maxPlayers`, `gamemode` als Zahl 0/1 mit Anzeige "Survival"/"Creative")
- Übersichts-Tab: Alle neuen Felder aus dem Query-Schema anzeigen (uptime, OS, SteamID, Kontakt, PvP/PvE, Whitelist, Mods, etc.)
- Spieler-Tab: Nur verfügbar wenn `backendUrl` gesetzt ist (Game-Backend)

---

### 9. `ServerCard`-Komponente aktualisieren (`src/components/ServerCard.tsx`)

- Feldnamen an neues Schema anpassen (`name`, `playercount`, `maxplayers`, `map`)

---

### Dateiübersicht

| Datei | Aktion |
|---|---|
| `src/types/server.ts` | Aktualisieren |
| `src/lib/storage.ts` | Neu erstellen |
| `src/context/StorageModeContext.tsx` | Neu erstellen |
| `src/pages/LandingPage.tsx` | Neu erstellen |
| `src/App.tsx` | Anpassen (Route + Guard) |
| `src/hooks/useServers.ts` | Async + Adapter nutzen |
| `src/context/ServerContext.tsx` | Async CRUD |
| `src/hooks/useDatabasePlayers.ts` | Endpunkt + Typen anpassen |
| `src/components/ServerDetail.tsx` | Felder + Spieler-Tab |
| `src/components/ServerCard.tsx` | Felder anpassen |

---

### API-Erwartungen (zur Referenz für dein Backend)

**Site-Backend:**
- `GET /` → `{ ok: true, services: ["storage"] }`
- `GET /api/server` → `ServerConfig[]`
- `POST /api/server` → `ServerConfig`
- `DELETE /api/server/:id` → `204`

**Game/Server-Backend:**
- `GET /` → `{ ok: true, services: ["fetch-players", ...] }`
- `GET /api/player` → `DbPlayer[]` (id, steamId, name, playTime, lastLogin, group)
- `GET /api/player/:id` → vollständige Spielerdaten
