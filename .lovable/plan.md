
## Session-Management, Spieler-Sortierung, Benutzerprofil & UI-Verbesserungen

### 1. Automatischer Logout bei 401 (Session abgelaufen)

**`src/lib/authApi.ts`:**
- In `authFetch`: Bei HTTP 401 ein Custom-Event `rwm:session-expired` auf `window` dispatchen, bevor der Fehler geworfen wird

**`src/context/AuthContext.tsx`:**
- Neuer `useEffect`: Lauscht auf `rwm:session-expired` Event
- Bei Empfang: `validate()` aufrufen. Wenn validate auch 401 liefert: Token loeschen, User auf null setzen, `sessionExpired`-Flag auf true setzen
- Neues Feld im Context: `sessionExpired: boolean` und `clearSessionExpired: () => void`

**`src/App.tsx`:**
- In `Layout` oder `AuthGuard`: Wenn `sessionExpired === true`, AlertDialog anzeigen mit Meldung "Ihre Sitzung ist abgelaufen"
- Nach Bestaetigung: `clearSessionExpired()` aufrufen, bei `forceAuth` zu `/auth/login` navigieren, sonst im Dashboard bleiben als Gast

---

### 2. Spieler-Tabelle: Sortierung + Pagination

**`src/components/ServerDetail.tsx` (PlayersTab):**

**Sortierung:**
- State: `sortField` (name | platform | permissiongroup | playtime | lastseen), `sortDir` (asc | desc)
- Klickbare Spaltenheader mit Pfeil-Icons (ArrowUp/ArrowDown)
- `filteredDb` wird nach dem Filtern sortiert

**Pagination:**
- State: `pageSize` (10 | 25 | 50 | 100 | -1 fuer "alle"), `currentPage`
- Default: 50, gespeichert im localStorage unter `rwm_player_page_size`
- Select-Dropdown unter der Tabelle fuer Seitengroesse
- Prev/Next Buttons und Seitenanzeige ("Seite 1 von 3")
- Bei Aenderung der Seitengroesse: `currentPage` auf 0 zuruecksetzen

---

### 3. Benutzerverwaltung: Sortierung + Bugfixes

**`src/pages/UserManagementPage.tsx`:**

**Sortierung:**
- State: `sortField` (username | state | role | createdAt), `sortDir`
- Klickbare Spaltenheader wie bei Spielern

**Bugfix -- Reaktives Update:**
- `handleUpdate`: Die API gibt `{user: PublicUserInterface}` zurueck. Aktuell wird `updated` direkt gespreizt, aber die Antwort hat die Form `{user: ...}`. Fix: `updated.user` verwenden statt `updated` direkt. Da `authFetch` den gesamten Body zurueckgibt, muss der Rueckgabetyp von `updateUser` in `authApi.ts` auf `{ user: PublicUserInterface }` geaendert werden, und in `handleUpdate` muss `updated.user` verwendet werden.

**Superadmin darf sich nicht selbst bearbeiten:**
- Die eigene User-ID mit `user.id` aus dem AuthContext vergleichen
- Select-Dropdowns und Delete-Button fuer den eigenen User deaktivieren/ausblenden

---

### 4. Benutzerprofil (neue Seite)

**Neue API-Funktionen (`src/lib/authApi.ts`):**
- `steamConnect(baseUrl, openIdParams)` -- `POST /api/auth/steam-connect` (ersetzt `linkSteamId` mit Route `steam-id`)
- `steamDisconnect(baseUrl, token)` -- `POST /api/auth/steam-disconnect` body: {}, response: {user, token}
- `updateSelf(baseUrl, token, data: {name: string})` -- `PATCH /api/auth/self` response: {user}
- `deleteSelf(baseUrl, token)` -- `DELETE /api/auth/self` response: {ok: true}

**Neue Seite: `src/pages/ProfilePage.tsx`:**
- Erreichbar ueber Klick auf den Benutzernamen in der Sidebar
- Route: `/profile`
- Anzeige: Username, Email, SteamID, Rolle (read-only Badge), Status (read-only Badge)
- Benutzername aendern: Inline-Editierfeld mit Speichern-Button
- Steam verbinden: Button "Mit Steam verbinden" (loest Steam-Redirect aus, Callback geht an `/api/auth/steam-connect`)
- Steam trennen: Button "Steam trennen" mit Bestaetigung
- Account loeschen: Button mit AlertDialog-Bestaetigung, danach Logout und Redirect zu /setup

**`src/components/AppSidebar.tsx`:**
- Klick auf den Benutzernamen navigiert zu `/profile`
- Username wird als klickbarer Link gestylt

**`src/App.tsx`:**
- Neue Route `/profile` innerhalb des Layouts

**`src/context/AuthContext.tsx`:**
- `linkSteamId` Route von `steam-id` zu `steam-connect` aendern
- Neue Methoden: `disconnectSteam`, `updateProfile`, `deleteAccount`

---

### 5. Server-Konfiguration: Gaeste ausgesperrt

**`src/components/ServerDetail.tsx`:**
- Der Konfigurations-Tab wird fuer nicht-authentifizierte Benutzer als disabled dargestellt
- TabsTrigger fuer "config" erhaelt: `disabled={!isAuthenticated}`, Schloss-Icon wenn disabled, ausgegraut
- Tooltip oder visuelle Kennzeichnung: "Anmeldung erforderlich"

---

### 6. Setup-Seite: Dediziert ohne Login-Pflicht + Layout-Fix

**`src/pages/LandingPage.tsx`:**
- "fixedBullet2" (Login erforderlich): Nur anzeigen wenn das Backend tatsaechlich `forceAuth` hat
  - Dazu: Nach dem erfolgreichen `checkBackend()` die Services pruefen
  - Alternativ: Den Text dynamisch aendern basierend auf den zurueckgegebenen Services
- Buttons aller 3 Karten am unteren Rand ausrichten: Cards bekommen `flex flex-col` und der Button-Bereich `mt-auto`

---

### 7. i18n Erweiterungen

Neue Schluessel in `de.json` und `en.json`:

```text
sessionExpiredTitle / sessionExpiredMessage / sessionExpiredConfirm
profile / profileDesc / changeName / nameUpdated
connectSteam / disconnectSteam / disconnectSteamConfirm / steamConnected / steamDisconnected
deleteAccount / deleteAccountConfirm / deleteAccountDesc / accountDeleted
pageSize / page / of / all / sortBy
configRequiresAuth
```

---

### Dateiuebersicht

| Datei | Aktion |
|---|---|
| `src/lib/authApi.ts` | 401-Event, neue Endpunkte (steam-connect, steam-disconnect, self), updateUser Rueckgabetyp fix |
| `src/context/AuthContext.tsx` | Session-Expired Handling, neue Methoden, Route-Umbenennung |
| `src/App.tsx` | Session-Expired Dialog, `/profile` Route |
| `src/components/ServerDetail.tsx` | Spieler-Sortierung, Pagination, Config-Tab disabled fuer Gaeste |
| `src/pages/UserManagementPage.tsx` | Sortierung, reaktives Update Fix, Selbst-Bearbeitung blockieren |
| `src/pages/ProfilePage.tsx` | NEU: Benutzerprofil |
| `src/components/AppSidebar.tsx` | Username klickbar zu /profile |
| `src/pages/LandingPage.tsx` | Login-Pflicht dynamisch, Button-Alignment |
| `src/i18n/de.json` | Neue Schluessel |
| `src/i18n/en.json` | Neue Schluessel |
