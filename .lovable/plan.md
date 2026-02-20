
## RisingWorld Server Manager – MVP Plan

### Überblick
Ein game-thematisches Admin-Dashboard zur Verwaltung von RisingWorld-Servern. Das Frontend kommuniziert mit zwei Datenquellen: der öffentlichen Query-URL des Servers (JSON-Statusabfrage) und einem selbst gehosteten Backend (für lokale Datei- & Datenbankzugriffe).

---

### Seiten & Features

#### 1. Server-Dashboard (Startseite)
- **Server hinzufügen**: Formular mit Query-URL (z.B. `http://gs1.omega-zirkel.de:4254/`) und optionaler backend-url (falls backend installiert wurde auf dem server)
- **Server-Liste**: Übersichts-Cards mit:
  - Servername & Map
  - Online/Offline-Status (mit farbiger Indikator-Badge)
  - Aktuelle Spieleranzahl (z.B. 3/20)
  - Server-Version
  - Letzter Check-Zeitstempel
- **Auto-Refresh**: Status wird alle 60 Sekunden automatisch aktualisiert

#### 2. Server-Detailansicht
Nach Klick auf einen Server gelangt man in eine dedizierte Detailseite mit Tabs:

**Tab: Übersicht**
- Alle Infos aus der Query-JSON: Servername, Map, Version, Max. Spieler, Spielmodus, Passwortschutz (ja/nein)
  - Beispielwerte:
    - "version": "0.9.1"
    - "legacy": false
    - "ip": ""
    - "port": 5255
    - "steamid": 76561197960265730
    - "contact": "Discord:devidian"
    - "name": "Omega Zirkel - Plugin development & Testing, currently: <color=orange>testing and improve plugins</color>"
    - "map": "New World"
    - "os": "LinuxServer"
    - "uptime": 185
    - "visible": true
    - "locked": false
    - "whitelist": false
    - "pvp": true
    - "pve": true
    - "gamemode": 0  # (0=survival,1=creative)
    - "peaceful": false
    - "maxplayers": 16
    - "playercount": 0
    - "mods": true
- Große Online/Offline-Statusanzeige

**Tab: Spieler**
- Nur verfügbar wenn Backend installiert ist
- Tabelle der Spieler über backend-api (Spieler-Daten aus `Player.db`), Spielername, db-id, steam-id, spielzeit, aktuelle permission-gruppe
- Suchfunktion nach Spielername oder SteamID
- Klickbare Zeilen, öffnen Spieler Profil mit weiteren Details (TBD)

---

### Design & UX
- **Game-thematisches Design**: Dunkles Theme mit erdigen Tönen (braun, beige, dunkelgrün), rustikale Schrift-Akzente für Überschriften, Holz/Stein-inspirierte Hintergrundtexturen als subtile CSS-Patterns
- **Sidebar-Navigation**: Aufklappbare linke Sidebar mit Server-Liste und schnellem Wechsel zwischen Servern
- **Responsive**: Funktioniert auf Desktop, Tablet und Mobile
- **Leere Zustände**: Freundliche Placeholder wenn noch kein Server hinzugefügt wurde oder der Server offline ist

---

### API-Schnittstellen (die das Frontend erwartet)
Das Frontend wird so gebaut, dass es folgende Endpunkte von deinem Backend erwartet (du implementierst diese):
- `GET /api/servers` – Liste aller gespeicherten Server
- `POST /api/servers` – Neuen Server hinzufügen
- `DELETE /api/servers/:id` – Server entfernen
- `GET /api/servers/:id/players` – Spieler aus lokaler Player.db

Für die Query-URL wird direkt vom Browser zum RisingWorld-Server gefetcht (kein Backend-Proxy nötig, sofern CORS erlaubt).

---

### Lokale Datenspeicherung
Da kein Lovable-Backend genutzt wird, werden die Server-Konfigurationen (URLs, lokale Pfade, benutzerdefinierte Labels) im **localStorage** des Browsers gespeichert – kein Login, kein Benutzerkonto nötig für den MVP.

---

### Nicht im MVP (aber erweiterbar)
- Steam-Login & Rechteverwaltung
- Permissions-Editor (Groups/Areas JSON)
- server.properties & scheduler.txt bearbeiten
- Plugin-Übersicht
