<div align="center">

# ezSphere

[![Version](https://img.shields.io/github/v/release/yangbf1999/ezsphere?color=blue&label=version)](https://github.com/yangbf1999/ezsphere/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/yangbf1999/ezsphere/releases)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%202-orange.svg)](https://tauri.app/)
[![Downloads](https://img.shields.io/github/downloads/yangbf1999/ezsphere/total)](https://github.com/yangbf1999/ezsphere/releases/latest)


### 🌐 Die einzige offizielle Website: **https://github.com/yangbf1999/ezsphere**

[English](README.md) | [中文](README_ZH.md) | [日本語](README_JA.md) | Deutsch | [Changelog](CHANGELOG.md)

</div>

## Warum ezSphere?

Vibe Coding — menschlich-KI-gestützte Programmierung — ist zu einem unumkehrbaren Trend geworden.
Claude Code, Codex und Hermes sind weltweit als die leistungsstärksten Coding-Tools anerkannt
und haben die Arbeitsweise der Softwareentwicklung grundlegend verändert.
Doch diese drei Tools stehen auf dem chinesischen Markt vor erheblichen Hürden:

- **Netzwerkhürden**: Einige Tools benötigen Zugang zu ausländischen Diensten, der in Campus-/Firmennetzwerken eingeschränkt ist
- **Account-Hürden**: Alle erfordern eine ausländische Kreditkarte oder Enterprise-SSO, für viele schwer zu bekommen
- **Umgebungshürden**: Komplexe Einrichtung mit langen Abhängigkeitsketten (Node.js, Python, Docker usw.),
oft 1-3 Tage Fehlersuche für eine funktionierende Umgebung

**CC-Switch** hat als erstes einheitliches Konfigurationsmanagement für KI-Coding-Tools eingeführt —
mit Anbieterwechsel, API-Key-Verwaltung, Proxy-Routing und Konfigurationssynchronisation
für Claude Code, Codex und Hermes, und wurde schnell unverzichtbar für Entwickler.
Doch CC-Switch löste nur das "Konfigurations"-Problem. Die größeren Schmerzpunkte —
Installation, Bereitstellung und Reparatur — blieben ungelöst.
Neue Mitarbeiter-Onboarding, neue Semesterlabore, Geräteaustausch — jede Umgebungseinrichtung bedeutet
Tools einzeln herunterzuladen, Abhängigkeiten zu installieren, Umgebungsvariablen zu konfigurieren,
Netzwerkprobleme zu debuggen, Versionskonflikte zu lösen...
Tage vergehen, bevor die eigentliche Arbeit oder der Kurs beginnen kann.

Um diesen gesamten Prozess von "Tagen" auf "Minuten" zu verkürzen, haben wir ezSphere entwickelt —
eine tiefgreifende Weiterentwicklung von CC-Switch, die drei entscheidende Fähigkeiten hinzufügt:

1. **Komplette UI/UX-Überarbeitung** — Weg vom entwicklerzentrierten CLI-Stil von CC-Switch,
neu gestaltet für Lehrer, Studenten, Betriebspersonal und Gelegenheitsnutzer.
Vom "Entwicklerwerkzeug" zur "Desktop-App für alle".
2. **Ein-Klick-Installation von Vibe-Coding-Tools** — Integrierte KI-gestützte Installationsengine
für Claude Code, Codex und Hermes. Umgebungserkennung, Abhängigkeitsabruf und Versionsprüfung
sind vollständig automatisiert. Studenten und Lehrer ohne Vorkenntnisse haben in 5 Minuten eine komplette KI-Coding-Umgebung.
3. **Konversations-KI-Installations- und Reparaturassistent** — Bei Umgebungsproblemen
müssen Sie nicht mehr in Dokumentationen, Logs oder Stack Overflow suchen.
Stellen Sie einfach eine Frage in natürlicher Sprache in ezSphere — der KI-Assistent diagnostiziert automatisch,
schlägt eine Lösung vor und führt sie aus. Verkürzen Sie 1-2 Tage Fehlersuche auf eine Kaffeepause.

Kurz gesagt: CC-Switch machte KI-Tools "nutzbar"; ezSphere macht KI-Coding
"einfach zu installieren, einfach zu nutzen, einfach zu reparieren".
Wir stehen auf den Schultern von CC-Switch und verbinden die letzte Meile für Vibe Coding
in Unternehmen und Universitäten weltweit.

**ezSphere** gibt Ihnen eine einzige Desktop-App, um alle unterstützten KI-Werkzeuge zu verwalten. Statt Konfigurationsdateien von Hand zu bearbeiten, erhalten Sie eine visuelle Oberfläche, um Anbieter mit einem Klick zu importieren und sofort zwischen ihnen zu wechseln — mit integrierten inländischen Anbieter-Presets, einheitlicher MCP- und Skills-Verwaltung und schnellem Umschalten über das System-Tray. Das Ganze gestützt auf eine zuverlässige SQLite-Datenbank mit atomaren Schreibvorgängen, die Ihre Konfigurationen vor Beschädigung schützen.

- **Kein manuelles Bearbeiten mehr** — Inländische Mainstream-Anbieter-Presets inkl. DeepSeek, Doubao, Zhipu GLM, Kimi usw.; einfach auswählen und umschalten
- **Einheitliche MCP- & Skills-Verwaltung** — Ein Panel zur Verwaltung von MCP-Servern und Skills für Claude, Codex und Hermes mit bidirektionaler Synchronisierung
- **Schnellumschaltung über System-Tray** — Wechseln Sie Anbieter sofort über das Tray-Menü, ohne die vollständige App öffnen zu müssen
- **Cloud-Synchronisierung** — Synchronisieren Sie Anbieterdaten geräteübergreifend über Dropbox, OneDrive, iCloud oder WebDAV-Server
- **Plattformübergreifend** — Native Desktop-App für Windows und macOS, gebaut mit Tauri 2
- **Integrierte Hilfsprogramme** — Enthält diverse Hilfsprogramme für die Login-Bestätigung beim Erststart, das Umgehen von Signaturen, die Synchronisierung von Plugin-Erweiterungen und mehr

## Screenshots

![ezSphere](assets/screenshots/ezsphere.png)

## Funktionen

[Vollständiges Changelog](CHANGELOG.md)

### Anbieterverwaltung

- **3 unterstützte Werkzeuge** — Claude Code, Codex, Hermes; Schlüssel kopieren und mit einem Klick importieren
- **Universelle Anbieter** — Eine Konfiguration synchronisiert sich mit Claude Code, Codex und Hermes
- Umschaltung mit einem Klick, Schnellzugriff über System-Tray, Sortierung per Drag-and-drop, Import/Export

### Werkzeuginstallation & -reparatur

- **KI-gestützte automatische Installation** — Ein-Klick-Installation von Claude Code, Codex, Hermes mit automatischer Versionserkennung und Abhängigkeitsauflösung
- **Intelligente Fehlerbehebung** — Bei fehlgeschlagener Installation diagnostiziert der integrierte Agent automatisch die Ursache und repariert sie, manuelle Fehlersuche nicht erforderlich
- **Versionsverwaltung** — Aktuelle Version erkennen, nach Updates suchen, mit einem Klick auf die neueste Version aktualisieren

### Proxy & Failover

- **Lokaler Proxy mit Hot-Switching** — Formatkonvertierung, automatisches Failover, Circuit Breaker, Anbieter-Health-Monitoring und Request-Rectifier
- **Übernahme auf App-Ebene** — Claude, Codex unabhängig über den Proxy leiten, bis hinunter auf einzelne Anbieter

### MCP, Prompts & Skills

- **Einheitliches MCP-Panel** — Verwalten Sie MCP-Server für Claude, Codex und Hermes mit bidirektionaler Synchronisierung und Deep-Link-Import
- **Prompts** — Markdown-Editor mit App-übergreifender Synchronisierung (CLAUDE.md / AGENTS.md) und Backfill-Schutz
- **Skills** — Installation mit einem Klick aus GitHub-Repositorys oder ZIP-Dateien, Verwaltung eigener Repositorys, mit Unterstützung für Symlinks und Dateikopien

### Nutzungs- & Kostenverfolgung

- **Nutzungs-Dashboard** — Verfolgen Sie Ausgaben, Anfragen und Token mit Trenddiagrammen, detaillierten Anfrageprotokollen und eigener Preisgestaltung pro Modell

### Session Manager & Workspace

- Gesprächsverlauf aus unterstützten Sitzungsquellen durchsuchen, suchen und wiederherstellen

### System & Plattform

- **Cloud-Synchronisierung** — Eigenes Konfigurationsverzeichnis (Dropbox, OneDrive, iCloud, NAS), WebDAV-Server- und S3-kompatible Speichersynchronisierung
- **Deep Link** (`ezsphere://`) - Importieren Sie Anbieter, MCP-Server, Prompts und Skills per URL
- Dunkles / Helles / System-Theme, automatischer Start, automatischer Updater, atomare Schreibvorgänge, automatische Backups, i18n (zh/zh-TW/en/ja)

## FAQ

<details>
<summary><strong>Welche KI-Werkzeuge unterstützt ezSphere?</strong></summary>

ezSphere unterstützt derzeit **drei** KI-Coding-Werkzeuge:

| Werkzeug | Beschreibung |
|---|---|
| **Claude Code** | Anthropic's agentic Coding-CLI — unterstützt Hot-Switching von Anbietern ohne Neustart |
| **Codex** | OpenAI's Coding-Agent — unterstützt Wechsel zwischen mehreren offiziellen Konten (Plus/Team) |
| **Hermes** | Open-Source KI-Agenten-Runner — unterstützt mehrere Modell-Backends |

Jedes Werkzeug hat eigene Anbieter-Presets, MCP/Skills-Verwaltung und Konfigurationssynchronisierung.
</details>

<details>
<summary><strong>Muss ich das Terminal nach einem Anbieterwechsel neu starten?</strong></summary>

Bei den meisten Werkzeugen ja — starten Sie Ihr Terminal oder das CLI-Werkzeug neu, damit die Änderungen wirksam werden. Die Ausnahme ist **Claude Code**, das derzeit das Hot-Switching von Anbieterdaten ohne Neustart unterstützt.

</details>

<details>
<summary><strong>Meine Plugin-Konfiguration ist nach einem Anbieterwechsel verschwunden — was ist passiert?</strong></summary>

ezSphere bietet eine Funktion „Gemeinsames Konfigurations-Snippet", um gemeinsame Daten (über API-Schlüssel und Endpunkte hinaus) zwischen Anbietern weiterzugeben. Gehen Sie zu „Anbieter bearbeiten" → „Panel für gemeinsame Konfiguration" → klicken Sie auf „Aus aktuellem Anbieter extrahieren", um alle gemeinsamen Daten zu speichern. Aktivieren Sie beim Anlegen eines neuen Anbieters die Option „Gemeinsame Konfiguration schreiben" (standardmäßig aktiviert), um die Plugin-Daten in den neuen Anbieter aufzunehmen. Alle Ihre Konfigurationspunkte bleiben im Standardanbieter erhalten, der beim ersten Start der App importiert wurde.

</details>

<details>
<summary><strong>Installation unter macOS</strong></summary>
> **Note**: If you see "ezSphere cannot be opened because the developer cannot be verified", run:
> ```bash
> sudo xattr -r -d com.apple.quarantine /Applications/ezSphere.app/
> ```


</details>

<details>
<summary><strong>Warum kann ich den aktuell aktiven Anbieter nicht löschen?</strong></summary>

ezSphere folgt dem Designprinzip der „minimalen Eingriffstiefe" — selbst wenn Sie die App deinstallieren, funktionieren Ihre CLI-Werkzeuge weiterhin normal. Das System behält immer eine aktive Konfiguration bei, da das Löschen aller Konfigurationen das entsprechende CLI-Werkzeug unbrauchbar machen würde. Wenn Sie ein bestimmtes CLI-Werkzeug selten verwenden, können Sie es in den Einstellungen ausblenden. Wie Sie zurück zum offiziellen Login wechseln, erfahren Sie in der nächsten Frage.

</details>

<details>
<summary><strong>Wie wechsle ich zurück zum offiziellen Login?</strong></summary>

Fügen Sie einen offiziellen Anbieter aus der Preset-Liste hinzu. Führen Sie nach dem Wechsel den Abmelde-/Anmelde-Vorgang aus; anschließend können Sie frei zwischen dem offiziellen Anbieter und Drittanbietern wechseln. Codex unterstützt den Wechsel zwischen verschiedenen offiziellen Anbietern, was das Umschalten zwischen mehreren Plus- oder Team-Konten erleichtert.

</details>

<details>
<summary><strong>macOS-Installation</strong></summary>

Laden Sie die DMG aus dem obenstehenden Abschnitt [Download & Installation](#download--installation) herunter.

1. Öffnen Sie die `.dmg`-Datei und ziehen Sie ezSphere in Applications
2. Falls "kann nicht geöffnet werden" angezeigt wird:

```bash
sudo xattr -r -d com.apple.quarantine /Applications/ezSphere.app/
```

3. Starten Sie ezSphere aus Applications oder Spotlight

</details>

<details>
<summary><strong>Wo werden meine Daten gespeichert?</strong></summary>

- **Datenbank**: `~/.ezsphere/ezsphere.db` (SQLite — Anbieter, MCP, Prompts, Skills)
- **Lokale Einstellungen**: `~/.ezsphere/settings.json` (gerätebezogene UI-Einstellungen)
- **Backups**: `~/.ezsphere/backups/` (automatisch rotiert, behält die 10 neuesten)
- **Skills**: `~/.ezsphere/skills/` (standardmäßig per Symlink mit den entsprechenden Apps verbunden)
- **Skill-Backups**: `~/.ezsphere/skill-backups/` (vor der Deinstallation automatisch erstellt, behält die 20 neuesten)

</details>

## Schnellstart

### Grundlegende Verwendung

1. **Anbieter hinzufügen**: Gehen Sie zur Seite "Modellzentrum" -> Wählen Sie ein Preset oder erstellen Sie eine benutzerdefinierte Konfiguration
2. **Anbieter wechseln**:
   - App-Manager: Anbieter auswählen -> Auf "Aktivieren" klicken
   - System-Tray: Anbietername direkt anklicken (sofort wirksam)
3. **Aktivierung**: Terminal oder das entsprechende CLI-Werkzeug neu starten, um Änderungen anzuwenden (Claude Code erfordert keinen Neustart)
4. **Zurück zu offiziell**: Ein "Offizielle Anmeldung"-Preset hinzufügen, CLI-Werkzeug neu starten und dem Login/OAuth-Flow folgen

### MCP, Prompts, Skills & Sitzungen

- **MCP**: Gehen Sie zur Seite "MCP-Verwaltung", klicken Sie auf die "MCP"-Schaltfläche -> Server über Vorlagen oder benutzerdefinierte Konfiguration hinzufügen -> Per-App-Synchronisierung umschalten
- **Prompts**: Gehen Sie zur Seite "Prompts-Verwaltung" -> Presets mit Markdown-Editor erstellen -> Aktivieren, um mit Live-Dateien zu synchronisieren
- **Skills**: Gehen Sie zur Seite "Skills-Verwaltung" -> Skills lokal importieren -> Ein-Klick-Installation in unterstützte Apps
- **Sitzungen**: Gehen Sie zur Seite "Sitzungsverwaltung" -> Unterstützte Sitzungsquellen durchsuchen, suchen und wiederherstellen

> **Hinweis**: Beim ersten Start können Sie vorhandene CLI-Tool-Konfigurationen manuell als Standardanbieter importieren.

## Download & Installation

### Systemanforderungen

- **Windows**: Windows 10 und höher
- **macOS**: macOS 12 (Monterey) und höher

### Windows-Nutzer

Laden Sie das neueste Installationsprogramm herunter:

- `ezSphere_1.0.0_x64-setup.exe` — [Herunterladen](https://github.com/yangbf1999/ezSphere/releases/download/v1.0.0/ezSphere_1.0.0_x64-setup.exe)
- `ezSphere_1.0.0_x64_en-US.msi` — [Herunterladen](https://github.com/yangbf1999/ezSphere/releases/download/v1.0.0/ezSphere_1.0.0_x64_en-US.msi)

### macOS-Nutzer

Laden Sie die neueste DMG herunter:

- `ezSphere_1.0.0_aarch64.dmg` (Apple Silicon) - [Herunterladen](https://github.com/yangbf1999/ezSphere/releases/download/v1.0.0/ezSphere_1.0.0_aarch64.dmg)
- `ezSphere_1.0.0_x86_64.dmg` (Intel) - [Herunterladen](https://github.com/yangbf1999/ezSphere/releases/download/v1.0.0/ezSphere_1.0.0_x86_64.dmg)

> **Hinweis**: Falls "kann nicht geöffnet werden" angezeigt wird:
> ```bash
> sudo xattr -r -d com.apple.quarantine /Applications/ezSphere.app/
> ```

<details>
<summary><strong>Architekturüberblick</strong></summary>

### Designprinzipien

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TS)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ Components  │  │    Hooks     │  │  TanStack Query  │    │
│  │   (UI)      │──│ (Bus. Logic) │──│   (Cache/Sync)   │    │
│  └─────────────┘  └──────────────┘  └──────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │ Tauri IPC
┌────────────────────────▼────────────────────────────────────┐
│                  Backend (Tauri + Rust)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  Commands   │  │   Services   │  │  Models/Config   │    │
│  │ (API Layer) │──│ (Bus. Layer) │──│     (Data)       │    │
│  └─────────────┘  └──────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Kern-Designmuster**

- **SSOT** (Single Source of Truth): Alle Daten werden in `~/.ezsphere/ezsphere.db` (SQLite) gespeichert
- **Zweischichtiger Speicher**: SQLite für synchronisierbare Daten, JSON für gerätebezogene Einstellungen
- **Bidirektionale Synchronisierung**: Schreiben in Live-Dateien beim Umschalten, Backfill aus den Live-Dateien beim Bearbeiten des aktiven Anbieters
- **Atomare Schreibvorgänge**: Das Muster aus temporärer Datei + Umbenennen verhindert die Beschädigung von Konfigurationen
- **Nebenläufigkeitssicher**: Eine durch Mutex geschützte Datenbankverbindung vermeidet Race Conditions
- **Geschichtete Architektur**: Klare Trennung (Commands → Services → DAO → Database)

**Schlüsselkomponenten**

- **ProviderService**: Anbieter-CRUD, Umschaltung, Backfill, Sortierung
- **McpService**: Verwaltung von MCP-Servern, Import/Export, Synchronisierung von Live-Dateien
- **ProxyService**: Lokaler Proxy-Modus mit Hot-Switching und Formatkonvertierung
- **SessionManager**: Durchsuchen des Gesprächsverlaufs über alle unterstützten Apps hinweg
- **ConfigService**: Konfigurations-Import/-Export, Backup-Rotation
- **SpeedtestService**: Messung der Latenz von API-Endpunkten

</details>

<details>
<summary><strong>Entwicklungsleitfaden</strong></summary>

### Umgebungsanforderungen

- Node.js 18+
- pnpm 8+
- Rust 1.85+
- Tauri CLI 2.8+

### Entwicklungsbefehle

```bash
# Abhängigkeiten installieren
pnpm install

# Entwicklungsmodus (Hot Reload)
pnpm tauri dev

# Nur Frontend-Entwicklungsserver starten
pnpm dev:renderer

# Nur Frontend bauen
pnpm build:renderer

# Typprüfung
pnpm typecheck

# Code formatieren
pnpm format

# Formatierung prüfen
pnpm format:check

# Frontend-Komponententests ausführen
pnpm test:unit

# Watch-Modus (automatisch bei Änderungen)
pnpm test:unit:watch

# Anwendung bauen (Produktion)
pnpm build

# Debug-Version bauen
pnpm tauri build --debug
```

### Entwicklung des Rust-Backends

```bash
cd src-tauri

# Rust-Code formatieren
cargo fmt

# Clippy-Prüfungen ausführen
cargo clippy

# Backend-Tests ausführen
cargo test

# Bestimmte Tests ausführen
cargo test test_name

# Tests mit dem Feature test-hooks ausführen
cargo test --features test-hooks
```

### Testleitfaden

**Frontend-Tests**:

- Verwendet **vitest** als Test-Framework
- Verwendet **MSW (Mock Service Worker)**, um Tauri-API-Aufrufe zu mocken
- Verwendet **@testing-library/react** für Komponententests

**Tests ausführen**:

```bash
# Alle Tests ausführen
pnpm test:unit

# Watch-Modus (automatische erneute Ausführung)
pnpm test:unit:watch

# Mit Coverage-Bericht
pnpm test:unit --coverage
```

### Tech-Stack

**Frontend**: React 18 · TypeScript · Vite · TailwindCSS 3.4 · TanStack Query v5 · react-i18next · react-hook-form · zod · shadcn/ui · @dnd-kit

**Backend**: Tauri 2.8 · Rust · serde · tokio · thiserror · tauri-plugin-updater/process/dialog/store/log

**Testing**: vitest · MSW · @testing-library/react

</details>

<details>
<summary><strong>Projektstruktur</strong></summary>

```
├── src/                          # Frontend (React + TypeScript)
│   ├── api/                      # Tauri IPC wrappers
│   ├── assets/                   # Static assets (fonts, icons)
│   ├── components/               # UI components
│   │   ├── agents/               # Agent prompt editor
│   │   ├── chat/                 # Chat UI components
│   │   ├── common/               # Shared UI components
│   │   ├── deeplink/             # Deep Link import UI
│   │   ├── env/                  # Environment variable editor
│   │   ├── hermes/               # Hermes config panels
│   │   ├── icons/                # Provider icon components
│   │   ├── mcp/                  # MCP management UI
│   │   ├── models/               # Model center
│   │   ├── prompts/              # Prompts management UI
│   │   ├── providers/            # Provider list/card/form
│   │   ├── proxy/                # Proxy & failover UI
│   │   ├── sessions/             # Session manager UI
│   │   ├── settings/             # Settings panels
│   │   ├── skills/               # Skills management UI
│   │   ├── ui/                   # shadcn/ui component library
│   │   ├── universal/            # Universal provider UI
│   │   ├── usage/                # Usage dashboard UI
│   │   └── workspace/            # Workspace editor UI
│   ├── config/                   # Preset configs (providers/mcp/prompts)
│   ├── contexts/                 # React contexts
│   ├── hooks/                    # Custom React hooks
│   ├── i18n/                     # Translations (locales)
│   ├── icons/                    # Extracted SVG icons
│   ├── layouts/                  # Shell/app layouts
│   ├── lib/                      # Core library
│   │   ├── api/                  # Type-safe API wrapper
│   │   ├── errors/               # Error utilities
│   │   ├── query/                # TanStack Query setup
│   │   ├── schemas/              # Form validation schemas
│   │   └── utils/                # UI utilities (cn, etc.)
│   ├── pages/                    # Page-level components
│   ├── stores/                   # Zustand stores
│   ├── types/                    # TypeScript definitions
│   └── utils/                    # Helper utilities
├── src-tauri/                    # Backend (Rust)
│   ├── src/
│   │   ├── commands/             # Tauri command layer (by domain)
│   │   ├── database/             # SQLite schema + DAO
│   │   │   └── dao/              # Data access objects
│   │   ├── deeplink/             # Deep Link parsing/handling
│   │   ├── deployment/           # AI install & repair (Agent chain)
│   │   ├── mcp/                  # MCP sync modules (per-app)
│   │   ├── proxy/                # Local proxy engine
│   │   │   ├── providers/        # Protocol converters (per-app)
│   │   │   └── usage/            # Usage tracking middleware
│   │   ├── resources/            # Bundled resources
│   │   ├── services/             # Business logic layer
│   │   │   ├── provider/         # Provider CRUD, live config
│   │   │   └── webdav_sync/      # WebDAV cloud sync
│   │   └── session_manager/      # Session history browsing
│   ├── tests/                    # Backend integration tests
│   └── Cargo.toml                # Rust dependencies
├── tests/                        # Frontend unit tests
├── assets/                       # Screenshots & partner banners
│   └── screenshots/              # Product screenshots
├── docs/                         # Documentation (api/ bundled assets)
├── flatpak/                      # Flatpak packaging config
├── scripts/                      # Build/release scripts
└── *.json / *.ts / *.cjs         # Config files (package, vite, tailwind, tsconfig)
```

</details>

## Mitwirken

Issues und Vorschläge sind willkommen!

Bitte stellen Sie vor dem Einreichen von PRs Folgendes sicher:

- Typprüfung besteht: `pnpm typecheck`
- Formatprüfung besteht: `pnpm format:check`
- Unit-Tests bestehen: `pnpm test:unit`

Eröffnen Sie für neue Funktionen bitte vor dem Einreichen eines PR ein Issue zur Diskussion. PRs für Funktionen, die nicht gut zum Projekt passen, können geschlossen werden.

## Danksagung

ezSphere baut auf der Arbeit dieser hervorragenden Open-Source-Projekte auf:

- **[CC-Switch 3.16.4](https://github.com/farion1231/CC-Switch)** (MIT) - Konfigurations-Orchestrierungs-Host; Anbieter/Proxy/Datenbank-Fundament

Herzlichen Dank an die Autoren und Mitwirkenden dieser Projekte! 🙏

## Lizenz

MIT © Jason Young
