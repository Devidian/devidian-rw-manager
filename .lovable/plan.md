## Dritter Modus: Fixed-Backend, Authentifizierung (Steam OpenID + lokal)

Dieses Update fuehrt einen dritten Speicher-Modus ein ("fixed"), bei dem eine Backend-URL per Umgebungsvariable vorgegeben wird. Zusaetzlich wird ein vollstaendiges Authentifizierungssystem implementiert (Steam OpenID + lokaler Login), das bei Bedarf erzwungen werden kann.

---

### 1. Neue Umgebungsvariablen

In `.env` und `.env.production`:

```
VITE_FIXED_BACKEND_URL=
VITE_FIXED_BACKEND_ADMIN=
VITE_STEAM_API_KEY=
```

- `VITE_FIXED_BACKEND_URL`: Wenn gesetzt (nicht leer), wird der Fixed-Modus verfuegbar. Standard leer.
- `VITE_FIXED_BACKEND_ADMIN`: Steam 64-bit ID des Administrators als String.
- `VITE_STEAM_API_KEY`: Steam Web API Key fuer OpenID-Verifikation.

---

### 2. Typen erweitern (`src/types/server.ts`)

**ServerConfig** erhaelt ein neues optionales Feld:

- `public?: boolean` -- Im Fixed-Modus kann ein Admin festlegen ob ein Server oeffentlich sichtbar ist

**Neuer Typ fuer authentifizierte Benutzer:**

```text
interface AuthUser {
  id: string;
  username?: string;
  email?: string;
  steamId?: string;
  role: 'guest' | 'user' | 'admin';
}
```

**BackendInfo** Services-Array wird erweitert: neben `"storage"` und `"data"` koennen jetzt auch `"auth"` und `"forceAuth"` enthalten sein.

---

### 3. StorageMode erweitern (`src/context/StorageModeContext.tsx`)

**StorageMode** Typ wird zu `'local' | 'backend' | 'fixed'`.

Neues Verhalten:

- Beim Laden pruefen: Ist `VITE_FIXED_BACKEND_URL` gesetzt und nicht leer?
  - Falls ja: Fixed-Backend-URL als Konstante verfuegbar machen
  - Der User kann trotzdem einen anderen Modus waehlen (lokal oder custom)
- Neue Methode `setFixedMode()`: Setzt den Modus auf 'fixed' und nutzt die ENV-URL
- `isConfigured` gibt true zurueck wenn ein Modus gewaehlt wurde
- `fixedBackendUrl: string | null` als neuer Wert im Context (aus ENV gelesen)
- `hasFixedBackend: boolean` -- ob die ENV gesetzt ist

---

### 4. Auth-Context (`src/context/AuthContext.tsx`) -- NEU

Zentraler Kontext fuer Authentifizierung:

```text
AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  requiresAuth: boolean;       // true wenn Backend "forceAuth" hat
  authServices: string[];      // verfuegbare auth-services
  login(username, password): Promise<void>;
  register(data): Promise<void>;
  loginWithSteam(): void;
  logout(): Promise<void>;
  linkSteamId(steamId): Promise<void>;
  validate(): Promise<void>;
}
```

**Session-Management:**

- Nach erfolgreichem Login/Register speichert der Context ein Session-Token (JWT oder Cookie-basiert, je nach Backend) im localStorage (`rwm_auth_token`)
- Bei jedem App-Start wird `GET /api/auth/validate` aufgerufen um die Session zu pruefen
- Token wird als `Authorization: Bearer {token}` Header in allen Backend-Requests mitgeschickt
- `BackendStorageAdapter` wird erweitert um den Token automatisch mitzusenden

**Admin-Erkennung:**

- Ein Benutzer ist Admin wenn:
  - Seine `steamId` mit `VITE_FIXED_BACKEND_ADMIN` uebereinstimmt, ODER
  - Das Backend ihn als Admin zurueckgibt (Feld `role: 'admin'` im User-Objekt)

---

### 5. Steam OpenID Login (`src/lib/steamAuth.ts`) -- NEU

Implementiert den Steam OpenID 2.0 Flow:

1. `loginWithSteam()`: Leitet den Browser zu `https://steamcommunity.com/openid/login` mit den noetigen OpenID-Parametern weiter:
  - `openid.ns`, `openid.mode=checkid_setup`
  - `openid.return_to` = aktuelle App-URL + `/auth/steam/callback`
  - `openid.realm` = App-Origin
  - `openid.identity` / `openid.claimed_id` = Steam-Spec-URLs
2. Callback-Handling: Eine neue Route `/auth/steam/callback` liest die OpenID-Parameter aus der URL und sendet sie an das Backend zur Verifikation:
  - `POST /api/auth/steam` mit den OpenID-Parametern
  - Backend verifiziert gegen Steam und gibt `{user}` + Token zurueck

**Provider-Erweiterbarkeit:** Der Code wird so strukturiert, dass spaeter weitere OpenID/OAuth-Provider ergaenzt werden koennen (generisches `AuthProvider`-Interface).

---

### 6. Auth-API Integration (`src/lib/authApi.ts`) -- NEU

Kapselt alle Auth-Endpunkte:

```text
register(baseUrl, { username?, email, password, steamId? }): Promise<AuthUser>
login(baseUrl, { username, password }): Promise<{ user: AuthUser; token: string }>
validate(baseUrl, token): Promise<AuthUser>
logout(baseUrl, token): Promise<void>
linkSteamId(baseUrl, token, steamId): Promise<AuthUser>
steamCallback(baseUrl, openIdParams): Promise<{ user: AuthUser; token: string }>
```

Alle Funktionen nutzen `fetch` mit Timeout und geben strukturierte Fehler zurueck.

---

### 7. Login-Seite (`src/pages/LoginPage.tsx`) -- NEU

Wird angezeigt wenn `requiresAuth === true` und der User nicht angemeldet ist.

**Layout:**

- Zentrierte Card aehnlich der Landing Page
- Zwei Bereiche:
  1. **Steam Login** -- grosser Button "Mit Steam anmelden" (immer sichtbar wenn Backend `auth` anbietet und VITE_STEAM_API_KEY nicht leer ist)
  2. **Lokaler Login** -- Email/Username + Passwort Formular (nur wenn Backend `auth` anbietet)
- Link zu Registrierungsformular
- Fehlermeldungen fuer falsche Credentials, gesperrte Accounts etc.

**Registrierungsformular** (ausklappbar oder separate Ansicht):

- Username (optional), Email, Passwort, Steam-ID (optional)
- Validierung mit Zod
- Nach erfolgreicher Registrierung automatisch einloggen

---

### 8. Landing Page erweitern (`src/pages/LandingPage.tsx`)

Wenn `VITE_FIXED_BACKEND_URL` gesetzt ist, wird eine dritte Karte angezeigt:

**Karte 3: "Dedizierter Server"**

- Icon: Server/Shield
- Beschreibung: "Vorkonfiguriertes Backend -- Server werden zentral verwaltet"
- Bullet Points: "Zentral verwaltete Server-Liste", "Login erforderlich", "Vom Administrator vorgegeben"
- Button: "Verbinden" -- prueft die Fixed-URL und wechselt in den Fixed-Modus
- Grid aendert sich zu `md:grid-cols-3` wenn die dritte Option verfuegbar ist

---

### 9. App-Routing anpassen (`src/App.tsx`)

Neuer Routing-Flow:

```text
App Start
  |
  +-- VITE_FIXED_BACKEND_URL gesetzt?
  |     |
  |     +-- Modus bereits gewaehlt?
  |     |     |
  |     |     +-- fixed: Backend erreichbar? -> forceAuth? -> Login noetig? -> Layout
  |     |     +-- local/backend: wie bisher
  |     |
  |     +-- Nein: -> /setup (3 Optionen)
  |
  +-- Nicht gesetzt?
        |
        +-- Modus gewaehlt? -> Layout (wie bisher)
        +-- Nein: -> /setup (2 Optionen, wie bisher)
```

Neue Routen:

- `/auth/login` -- Login-Seite
- `/auth/steam/callback` -- Steam OpenID Callback

**Auth-Guard:** Wenn im Fixed-Modus das Backend `forceAuth` als Service hat, wird ein Wrapper um Layout gelegt der bei fehlender Authentifizierung zu `/auth/login` redirectet.

---

### 10. Layout/Sidebar Anpassungen

**Modus-Badge in der Sidebar:**

- Neuer Modus "Fixed" wird mit eigenem Badge angezeigt (z.B. Shield-Icon + "Dediziert")
- Klick auf den Badge oder ein kleiner "Aendern"-Link darunter fuehrt zurueck zu `/setup`

**User-Anzeige in der Sidebar (Footer):**

- Wenn authentifiziert: Avatar/Name des Benutzers + Logout-Button
- Wenn nicht authentifiziert aber Auth verfuegbar: "Anmelden"-Button
- Admin-Badge wenn der User Admin ist

**Server hinzufuegen:**

- Im Fixed-Modus: "Server hinzufuegen"-Button nur fuer Admins sichtbar
- Im Fixed-Modus: `AddServerDialog` bekommt ein zusaetzliches Feld `public: boolean` (Checkbox)
- Nicht-eingeloggte Benutzer sehen den Button nicht

---

### 11. BackendStorageAdapter erweitern (`src/lib/storage.ts`)

- Alle fetch-Aufrufe erhalten optional einen `Authorization`-Header
- Neuer Konstruktor-Parameter: `token?: string`
- Der Token wird aus dem AuthContext durchgereicht
- `addServer` im Fixed-Modus sendet auch `public` und `userId` mit

---

### 12. i18n Erweiterungen

Neue Uebersetzungsschluessel in `de.json` und `en.json`:

```text
fixedBackend / fixedBackendDesc / fixedBullet1-3 / fixedConnect
storageFixed
loginTitle / loginDesc
loginWithSteam / loginSteamDesc
loginEmail / loginPassword / loginSubmit / loginRegisterLink
registerTitle / registerDesc / registerUsername / registerEmail
registerPassword / registerSteamId / registerSubmit
logoutButton / loggedInAs / adminBadge
authRequired / authRequiredDesc
errLoginFailed / errRegisterFailed / errSessionExpired
serverPublic / serverPublicDesc
```

---

### Dateiuebersicht


| Datei                                | Aktion                                                                           |
| ------------------------------------ | -------------------------------------------------------------------------------- |
| `.env`                               | VITE_FIXED_BACKEND_URL, VITE_FIXED_BACKEND_ADMIN, VITE_STEAM_API_KEY hinzufuegen |
| `.env.production`                    | Platzhalter fuer die neuen ENV-Vars                                              |
| `src/types/server.ts`                | `AuthUser` Interface, `ServerConfig.public`, BackendInfo Services                |
| `src/context/StorageModeContext.tsx` | `'fixed'` Modus, ENV-Lesung, `setFixedMode()`                                    |
| `src/context/AuthContext.tsx`        | NEU: Auth-State, Login/Logout/Register, Session                                  |
| `src/lib/authApi.ts`                 | NEU: Auth-API fetch-Funktionen                                                   |
| `src/lib/steamAuth.ts`               | NEU: Steam OpenID Redirect + Callback                                            |
| `src/lib/storage.ts`                 | Token-Header in BackendStorageAdapter                                            |
| `src/pages/LoginPage.tsx`            | NEU: Login + Registrierung                                                       |
| `src/pages/LandingPage.tsx`          | Dritte Karte fuer Fixed-Modus                                                    |
| `src/App.tsx`                        | Neue Routen, Auth-Guard, AuthProvider                                            |
| `src/components/AppSidebar.tsx`      | User-Anzeige, Modus-Link, Admin-Gate                                             |
| `src/components/AddServerDialog.tsx` | `public`-Checkbox im Fixed-Modus                                                 |
| `src/i18n/de.json`                   | Neue Schluessel                                                                  |
| `src/i18n/en.json`                   | Neue Schluessel                                                                  |


---

### Technische Details

**Steam OpenID 2.0 Ablauf:**

1. Frontend leitet zu Steam weiter mit `openid.return_to` = `{origin}/auth/steam/callback`
2. Steam redirected zurueck mit signierten Parametern in der URL
3. Frontend extrahiert die Parameter und sendet sie an `POST {backendUrl}/api/auth/steam`
4. Backend verifiziert die Signatur gegen Steam und erstellt/aktualisiert den User
5. Backend gibt `{ user, token }` zurueck
6. Frontend speichert Token und setzt User im AuthContext

**Token-Weitergabe:** Der `BackendStorageAdapter` wird nicht direkt mit einem Token instanziiert. Stattdessen wird der Token ueber einen Getter/Setter oder eine Factory-Funktion injiziert, damit er sich bei Login/Logout dynamisch aendert ohne den Adapter neu zu erstellen.

**forceAuth-Pruefung:** Beim App-Start im Fixed-Modus wird `checkBackend()` aufgerufen. Wenn die Services `forceAuth` enthalten, wird `requiresAuth` im AuthContext auf `true` gesetzt. Dadurch greift der Auth-Guard und leitet nicht-authentifizierte Benutzer auf `/auth/login` um.