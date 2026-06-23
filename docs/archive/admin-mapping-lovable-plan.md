# Lovable Plan: Admin Mapping V2 und installierte Plugins

## Status

Archiviert am 18. Juni 2026 nach erfolgreicher Implementierung und
mehrtägigem produktivem Betrieb.

## Ziel
Das Server-Detail zeigt die vom Manager-Backend gerenderte V2-Karte. Der
bestehende geplante Reiter für installierte Plugins bleibt Bestandteil des
Features.

Das Frontend liest weder Admin-Utils-Datenbanken noch Tile-Dateien direkt.
Die Einstellungen `enableMapGen` und `onlyAdminMapGen` gehören zur bestehenden
In-Game-Admin-Settings-UI von Admin Utils und nicht zum Manager-Frontend.

## Abhängige Verträge
Der gemeinsame V2-Vertrag ist im Workspace-Root unter
`docs/active/admin-mapping-v2-contract.md` definiert.
Vor der Umsetzung die finalen Backend-Antworten gegen diesen Vertrag prüfen:

- `GET /api/data/server/map`
- `GET /api/data/server/map/tiles/:worldKey/:z/:x/:y.png`
- `GET /api/data/server/plugins`

Die Map-Metadaten müssen die V2-Geometrie beschreiben:

- Schema-Version `5`
- `32x32` Blöcke pro Chunk
- `4x4` Pixel pro Block
- `128x128` Pixel pro Chunk
- `2x2` Chunks beziehungsweise `256x256` Pixel pro nativer Tile
- native Zoomstufe `8` und minimale Zoomstufe `0`
- transparente fehlende Chunks

Keine Dateisystem- oder Datenbankpfade im Frontend verwenden. Tile-URLs,
Bounds und Zoomstufen kommen ausschließlich aus Backend-Metadaten.

## UI-Entscheidungen
- Der Reiter `Karte` steht zwischen `Spieler` und `Plugins`.
- `Karte` wird nur angezeigt, wenn ein Backend konfiguriert ist und
  `available: true` meldet.
- Der Reiter `Plugins` wird angezeigt, wenn ein Backend konfiguriert ist.
- Die Karte verwendet Leaflet mit `CRS.Simple`, ohne World-Wrapping.
- Backend-Metadaten bestimmen Tile-Größe, Zoom-Grenzen, native Zoomstufe,
  Bounds, Orientierung und URL-Template.
- Fehlende oder transparente Tiles bleiben leer und erzeugen keinen UI-Fehler.
- Die Plugin-Liste zeigt mindestens Plugin-Name, Version und Verzeichnis.
  Ungültige Metadaten werden sichtbar als ungültig markiert.
- Hilfetexte erklären, dass die Karte beim Verlassen von Chunks erfasst und
  zeitversetzt durch das Backend gerendert wird.
- Lade-, Leer- und Fehlerzustände erhalten deutsche und englische Texte.

## Umsetzung
- [x] Gemeinsamen V2-Metadaten- und Plugin-Settings-Vertrag dokumentieren.
- [x] Backend-Antworten bei Implementierungsbeginn gegen den Vertrag prüfen.
- [x] Geeignete Leaflet-Pakete ergänzen und bestehende
  Vite-/React-Konventionen beibehalten.
- [x] V2-Map- und Plugin-Response-Typen in `src/types/` ergänzen.
- [x] Getrennte API-/Hook-Funktionen für Map-Metadaten und Plugin-Liste
  ergänzen beziehungsweise auf V2 anpassen.
- [x] `MapTab` mit Leaflet, `CRS.Simple`, Bounds und Backend-Tile-URL erstellen.
- [x] `PluginsTab` als responsive Liste/Tabelle erstellen.
- [x] Tabs in `ServerDetail.tsx` in der Reihenfolge
  `Übersicht`, `Spieler`, `Karte`, `Plugins`, `Konfiguration` integrieren.
- [x] Karte nur bei gemeldeter V2-Verfügbarkeit rendern.
- [x] i18n-Schlüssel für Karte, Plugins sowie Lade-/Leer-/Fehlerzustände in
  Deutsch und Englisch ergänzen.
- [x] Frontend-Tests für V2-Karte, bedingten Karten-Reiter, Plugin-Liste und
  Fehlerfälle ergänzen.
- [x] Build und vorhandene Tests ausführen.
- [ ] Bestehende repositoryweite Lint-Fehler bereinigen oder separat
  akzeptieren; die neuen Mapping-Dateien erzeugen keine Lint-Fehler.
- [ ] Alle Lovable-Änderungen in einem fokussierten Commit speichern.

## Akzeptanzkriterien
- Ohne Backend gibt es weder Karte noch Plugin-Liste.
- Ohne gerenderte V2-Karte fehlt nur der Karten-Reiter; Plugins und
  Konfiguration bleiben verfügbar.
- Mit Karte werden vorhandene positive und negative Koordinaten korrekt
  orientiert dargestellt.
- Zoomen fordert die vom V2-Metadatenvertrag beschriebenen Ebenen an.
- Fehlende Chunks/Tiles bleiben transparent und beschädigen das
  Server-Detail nicht.
- Die UI verspricht keine sofortige Aktualisierung nach Chunk-Erfassung und
  zeigt den zeitversetzten Backend-Rendering-Ablauf verständlich an.
- Leere Plugin-Listen und API-Fehler beschädigen das Server-Detail nicht.
- Konfiguration bleibt weiterhin nur für authentifizierte Benutzer zugänglich.

## Validierung
- [x] Typ-/Contract-Test für V2-Metadaten mit `2x2`-Chunk-Nativetiles.
- [x] Test für sichtbaren und fehlenden Karten-Reiter.
- [x] Test für transparente/fehlende Tiles ohne UI-Fehler.
- [x] Test für positive und negative Kartenkoordinaten.
- [x] Test für Lade-, Leer- und Fehlerzustände.
- [x] Test für unveränderte Plugin-Liste.
- [x] Build, fokussierter Lint und Tests erfolgreich.

## Risiken
- Ein nicht finaler V2-Metadatenvertrag erzeugt doppelte Frontend-Arbeit; erst
  nach Backend-Vertragsabschluss implementieren.
- Leaflet-Koordinaten können von der Backend-Orientierung abweichen; mit
  bekannten Landmarken und negativen Koordinaten prüfen.

## Rollback
Den Karten-Reiter ausblenden, wenn das Backend keine gültige V2-Karte meldet.
Plugin-Liste und übrige Konfiguration bleiben funktionsfähig.
