

## Public-Flag, Rollenbasierte Zugriffskontrolle & Benutzerverwaltung

### Zusammenfassung

Drei Aenderungen: (1) Public-Flag fuer Server beim Erstellen und Bearbeiten, (2) Nur Admins duerfen Server hinzufuegen/bearbeiten/loeschen im Backend-Modus, (3) Superadmin-Benutzerverwaltung im dedizierten Modus.

---

### 1. Typen erweitern (`src/types/server.ts`)

Neue Typen und Interfaces:

```text
type UserState = "new" | "verified" | "closed";
type UserRole = "guest" | "user" | "admin";

interface PublicUserInterface {
  id: string;
  username: string;
  state: UserState;
  role: UserRole;
  steamId?: string;
  createdAt: string;
}
```

`StorageAdapter.updateServer` Signatur erweitern: `data` bekommt zusaetzlich `public` als optionales Feld (neben `label` und `backendUrl`).

---

### 2. Server-Admin-Erkennung via Game-Backend

Neuer Hook: `src/hooks/useServerAdmins.ts`
- Ruft `GET {backendUrl}/api/data/server/admins` ab
- Gibt `{ admins: string[] }` zurueck (Liste von Steam-IDs)
- Wird im `ServerDetail` verwendet, um zu pruefen ob der aktuelle User ein Server-Admin ist (unabhaengig von seiner Benutzerrolle)

AuthContext erhaelt eine neue Hilfsfunktion:
- `isSuperAdmin: boolean` -- true wenn `user.steamId === VITE_FIXED_BACKEND_ADMIN`
- `isAdmin` bleibt wie bisher (Rolle oder VITE_FIXED_BACKEND_ADMIN Match)

---

### 3. Public-Flag in Dialogen

**AddServerDialog** (`src/components/AddServerDialog.tsx`):
- Die `public`-Checkbox wird jetzt sowohl im `fixed`- als auch im `backend`-Modus angezeigt (nicht nur fixed)
- Prop `isFixedMode` wird zu `isBackendMode: boolean` umbenannt (true fuer fixed und backend)

**EditServerDialog** (`src/components/EditServerDialog.tsx`):
- Neues Formularfeld: `public` (Checkbox), vorausgefuellt mit dem aktuellen Wert
- `onSave` Signatur wird erweitert um `public` im data-Objekt

**StorageAdapter** (`src/lib/storage.ts`):
- `updateServer` akzeptiert jetzt auch `public` im Partial-Objekt
- `BackendStorageAdapter.addServer` sendet `public` im Body mit
- `BackendStorageAdapter.updateServer` sendet `public` im Body mit

---

### 4. Rollenbasierte Zugriffskontrolle

**Regel:** Im `backend`- und `fixed`-Modus duerfen nur Admins Server hinzufuegen, bearbeiten oder loeschen.

Betroffene Stellen:

**`src/App.tsx` (Layout)**:
- `canAddServer` Logik aendern: `mode === 'local' || isAdmin` (statt nur fixed-Modus zu pruefen)

**`src/pages/Index.tsx`**:
- "Add Server" Button nur anzeigen wenn `mode === 'local' || isAdmin`
- "Add First Server" Button im Leer-Zustand ebenfalls nur fuer Admins oder lokalen Modus
- Delete-Button auf ServerCard nur fuer Admins oder lokalen Modus

**`src/components/ServerCard.tsx`**:
- `onDelete` Prop wird optional: `onDelete?: () => void`
- Delete-Button nur rendern wenn `onDelete` uebergeben wird

**`src/components/ServerDetail.tsx`**:
- Edit-Button nur anzeigen wenn der User Admin ist oder lokaler Modus aktiv

---

### 5. Benutzerverwaltung fuer Superadmin

**Neue API-Funktionen** (`src/lib/authApi.ts`):
- `getUsers(baseUrl, token): Promise<{ users: PublicUserInterface[] }>`
- `updateUser(baseUrl, token, id, data: { state?: UserState; role?: UserRole }): Promise<PublicUserInterface>`
- `deleteUser(baseUrl, token, id): Promise<void>`

**Neue Seite:** `src/pages/UserManagementPage.tsx`
- Nur erreichbar im Fixed-Modus und nur fuer den Superadmin (`isSuperAdmin`)
- Tabelle mit allen Benutzern: Username, State (Badge), Role (Badge), SteamID (als Link), CreatedAt
- Pro Zeile:
  - Rolle aendern: Dropdown/Select mit "user" und "admin"
  - State aendern: Dropdown/Select mit "new", "verified", "closed"
  - Loeschen: Button mit Bestaetigung (AlertDialog)

**Routing** (`src/App.tsx`):
- Neue Route `/admin/users` innerhalb des Layout, nur fuer Superadmin

**Sidebar** (`src/components/AppSidebar.tsx`):
- Neuer Navigationseintrag "Benutzer" (Users-Icon) unter der Navigation-Gruppe, nur sichtbar fuer Superadmin im Fixed-Modus

---

### 6. i18n Erweiterungen

Neue Schluessel fuer `de.json` und `en.json`:

```text
userManagement / userManagementDesc
username / state / role / createdAt
stateNew / stateVerified / stateClosed
roleGuest / roleUser / roleAdmin
changeRole / changeState / deleteUser / deleteUserConfirm
deleteUserDesc / userDeleted / userUpdated
noUsers / superAdminOnly
```

---

### Dateiuebersicht

| Datei | Aktion |
|---|---|
| `src/types/server.ts` | `PublicUserInterface`, `UserState`, `UserRole` |
| `src/lib/authApi.ts` | `getUsers`, `updateUser`, `deleteUser` |
| `src/lib/storage.ts` | `updateServer` mit `public`, `addServer` mit `public` |
| `src/hooks/useServerAdmins.ts` | NEU: Server-Admin-Liste laden |
| `src/pages/UserManagementPage.tsx` | NEU: Benutzerverwaltung |
| `src/App.tsx` | Route `/admin/users`, `canAddServer` Logik |
| `src/pages/Index.tsx` | Rollenbasierte Buttons |
| `src/components/ServerCard.tsx` | `onDelete` optional |
| `src/components/ServerDetail.tsx` | Edit-Button rollenbasiert |
| `src/components/AddServerDialog.tsx` | `isBackendMode` statt `isFixedMode` |
| `src/components/EditServerDialog.tsx` | `public`-Checkbox |
| `src/components/AppSidebar.tsx` | "Benutzer"-Link fuer Superadmin |
| `src/context/AuthContext.tsx` | `isSuperAdmin` Property |
| `src/i18n/de.json` | Neue Schluessel |
| `src/i18n/en.json` | Neue Schluessel |

