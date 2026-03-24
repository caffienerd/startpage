# Terminal Start Page

A sleek, fast, and feature-rich browser start page driven by an interactive terminal. Boost your productivity with semantic AI routing, direct Gemini integration, open directory search, and a growing suite of built-in utility tools — all wrapped in a premium, modern aesthetic.

**→ Try it live: [caffienerd.github.io/startpage](https://caffienerd.github.io/startpage/)**

> Inspired by [ahmetdem/start-page](https://github.com/ahmetdem/start-page)  
> Open directory search inspired by [ewasion/opendirectory-finder](https://ewasion.github.io/opendirectory-finder/#)

---

## Demo

<video src="https://github.com/user-attachments/assets/00b84648-b7f3-46f2-a4ea-d0494217559c" width="100%" muted autoplay loop controls>
</video>

---

## Themes

<video src="https://github.com/user-attachments/assets/b2a2c9b2-5a87-40fc-b0e8-1ed5b7170b7f" width="100%" muted autoplay loop controls>
</video>

---

## Install as Browser Extension

Use Terminal Start Page as your new tab page — works in Chrome, Firefox, Brave, Edge, and more.

| Browser | Status | Link |
| :--- | :--- | :--- |
| **Chrome / Brave / Edge** | ✅ Available | *Coming soon to Chrome Web Store* |
| **Firefox** | ✅ Available | *Coming soon to Firefox Add-ons* |
| **Opera** | ✅ Available | Load manually (see below) |
| **Vivaldi** | ❌ Not supported | Vivaldi blocks new tab overrides |

### Load manually (all Chromium browsers)

```bash
node build.js chrome        # sets manifest.json for Chrome/Brave/Edge
```

1. Open `chrome://extensions` (or `brave://extensions`, `edge://extensions`)
2. Enable **Developer mode**
3. Click **Load unpacked** → select this folder

### Firefox

```bash
node build.js firefox       # sets manifest.json for Firefox
```

1. Open `about:debugging` → **This Firefox**
2. Click **Load Temporary Add-on** → select `manifest.json`

> **Focus tip:** For best experience in Firefox, go to `about:config` and set  
> `browser.newtabpage.activity-stream.improvesearch.handoffToAwesomebar` → `false`  
> This lets the terminal receive focus automatically on new tab.

### Opera

```bash
node build.js opera         # sets manifest.json for Opera
```

Load via Opera's extension developer mode. The extension uses a background service worker to intercept new tabs since Opera doesn't support `chrome_url_overrides`.

---

## Features

- **Interactive Terminal** — Command-driven interface with autocomplete (`Tab`), syntax highlighting per command type, and command history (`↑`/`↓`).
- **Semantic AI Router** — Use `ai:` to navigate by intent. Intelligently routes to YouTube, Maps, Reddit, or search.
- **Gemini Integration** — Direct AI prompting via `gem:` or `gemini:`. Responses appear in a clean, non-intrusive modal.
- **Open Directory Search** — Power-user Google dorking via `dir/<category>/<engine>: keyword`. Search public open directory indexes filtered by file type, with full autocomplete and an interactive builder (`:dir`).
- **8 Themes** — Light, Dark, AMOLED Black, Nord, Newspaper, Coffee, Root (Hacker), and Neon (Cyberpunk).
- **Syntax Highlighting** — Color-coded input for commands, themes, search prefixes, directory tokens, URLs, and more — fully customizable via `:customize`.
- **Live Dashboard** — Local time and real-time weather at a glance.
- **Onboarding Tour** — Interactive guided tour on first launch. Replay anytime with `:tour`.
- **Utility Suite**:
  - **Spell Check** — Smart spelling suggestions via `spell:`. Press `D` to define the selected word.
  - **Pronunciation** — Human-readable syllable breakdown + audio playback via `pronounce:`. Works on any word, including scientific and technical terms.
  - **IP Info** — Detailed network info (IPv4, IPv6, ISP, ASN, location) via `:ipconfig`.
  - **Speed Test** — Integrated network performance testing via `:netspeed`.
- **Bookmark Management** — Fully customizable bookmark categories via visual grid editor or raw JSON.
- **Custom Tags** — Override built-in search prefixes or define entirely new ones via `:tags`.
- **Backup & Restore** — Export and import all settings as a single JSON file.

---

## Getting Started

### As a localhost web page

You need a static file server. Opening `index.html` directly works for most features, but serving it properly is recommended for API requests.

#### Option 1: Python (Quickest)
```bash
python -m http.server 6174
```

#### Option 2: Caddy
Copy `Caddyfile.example` to `Caddyfile`, set your directory path, then:
```bash
caddy run --config Caddyfile
```

#### Other options
Any static server works — `npx serve`, nginx, etc.

Visit `http://localhost:6174` in your browser.

### Version management

Version is defined once in `version/version.js` and stamped into all manifests by the build script:

```bash
# Edit version/version.js, then:
node build.js chrome     # stamp + set Chrome manifest
node build.js firefox    # stamp + set Firefox manifest
node build.js opera      # stamp + set Opera manifest
node build.js            # stamp only, don't touch manifest.json
```

---

## Configuration

Run `:config` to open the settings modal.

| Setting | Description |
| :--- | :--- |
| **Identity** | Customize your terminal `username` |
| **Weather** | Set your location (e.g. `New York`, `London`, `Delhi`) |
| **Gemini API Key** | Get one from [Google AI Studio](https://aistudio.google.com/app/apikey) |
| **Gemini Model** | Default is `gemini-2.5-flash-lite` |
| **System Prompt** | Optional personality for your Gemini assistant |
| **AI Mode** | Toggle between explicit (`ai:`) and automatic intent routing |
| **AI Route Badge** | Control when the route preview badge is shown |
| **Default Search Engine** | Google, DuckDuckGo, or Bing — also used as the fallback for `dir:` searches |

Run `:customize` to change the active theme and independently adjust the syntax highlight color for each input type. Colors persist across theme changes.

---

## Command Reference

### Search Prefixes

| Prefix | Example | Destination |
| :--- | :--- | :--- |
| `yt:` | `yt: lo-fi beats` | YouTube Search |
| `r:` | `r: mechanical keyboards` | Reddit Search |
| `maps:` | `maps: central park` | Google Maps |
| `ddg:` | `ddg: privacy tools` | DuckDuckGo |
| `ggl:` | `ggl: something` | Google (explicit) |
| `bing:` | `bing: something` | Bing Search |
| `amazon:` | `amazon: mechanical keyboards` | Amazon Search |
| `imdb:` | `imdb: Breaking Bad` | IMDb Search |
| `alt:` | `alt: notion` | AlternativeTo |
| `def:` | `def: ephemeral` | Dictionary (OneLook) |
| `the:` | `the: happy` | Thesaurus (OneLook) |
| `syn:` | `syn: fast` | Synonyms (OneLook) |
| `quote:` | `quote: time` | Quotes (OneLook) |
| `spell:` | `spell: recieve` | Built-in Spell Checker |
| `pronounce:` | `pronounce: ephemeral` | Built-in Pronunciation |
| `cws:` | `cws: ublock origin` | Chrome/Firefox Extension Store |
| `gem:` | `gem: explain black holes` | Gemini Direct Prompt |
| `ai:` | `ai: directions to central park` | Semantic AI Router |

### Open Directory Prefixes

Search public open directory indexes using Google dorking (`intitle:index.of`). Syntax:

```
dir/<category>/<engine>: keyword
```

Both `<category>` and `<engine>` are optional. Omitting the engine uses your configured default.

| Prefix | Example | Description |
| :--- | :--- | :--- |
| `dir:` | `dir: interstellar` | Open dir search, no file filter |
| `dir/media:` | `dir/media: interstellar` | Video files (mkv, mp4, avi…) |
| `dir/books:` | `dir/books: dune` | Ebook formats (pdf, epub, mobi…) |
| `dir/music:` | `dir/music: pink floyd` | Audio files (mp3, flac, ogg…) |
| `dir/software:` | `dir/software: photoshop` | Executables & archives (exe, iso, zip, apk…) |
| `dir/images:` | `dir/images: wallpapers 4k` | Image files (jpg, png, psd…) |
| `dir/other:` | `dir/other: keyword` | Raw open dir, no file filter |

**Engine override** — append `/ggl`, `/ddg`, or `/bing` before the colon:

```
dir/music/ddg: flac albums
dir/books/bing: operating systems pdf
dir//ggl: keyword        ← no category, explicit Google
```

**Category aliases:**

| Category | Aliases |
| :--- | :--- |
| `media` | `vid`, `video` |
| `books` | `book`, `ebook` |
| `music` | `audio`, `mus` |
| `software` | `soft`, `iso`, `app` |
| `images` | `img`, `pics` |

> `Tab` autocomplete works after `dir/` (suggests categories) and after `dir/category/` (suggests engines).

### System Commands

| Command | Description |
| :--- | :--- |
| `:help` | Show all commands |
| `:config` | Open settings |
| `:customize` / `:custom` | Open customization (theme & syntax colors) |
| `:bookmarks` / `:bm` | Edit bookmarks |
| `:dir` | Open interactive directory search builder |
| `:dirconfig` | Customize file extensions per `dir/` category |
| `:ipconfig` / `:ip` | Show detailed network info |
| `:netspeed` / `:speed` | Run speed test |
| `:aimode` | Toggle automatic AI routing |
| `:update` | Check for a newer version on GitHub |
| `:version` | Show current app version |
| `:export` | Export all settings to a JSON backup file |
| `:import` | Import settings from a JSON backup file |
| `:reset` | Clear all settings, cache & localStorage (with confirmation) |
| `:gemini` | Open Gemini website |
| `:tags` | Override search URLs & add custom prefix shortcuts |
| `:tour` | Replay the onboarding tour |
| `:help_ai_router` | Guide for `ai:` routing |

### Theme Commands

| Command | Theme |
| :--- | :--- |
| `:light` | Light mode |
| `:dark` | Dark mode |
| `:black` / `:amoled` | Full black / AMOLED |
| `:nord` | Arctic Nord |
| `:newspaper` | Classic Newspaper |
| `:coffee` | Organic Coffee |
| `:root` / `:hacker` | Hacker terminal |
| `:neon` / `:cyberpunk` | Cyberpunk Neon |

---

## Keyboard Shortcuts

### Terminal

| Shortcut | Action |
| :--- | :--- |
| `Tab` or `→` | Accept autocomplete suggestion |
| `Enter` | Execute command / navigate |
| `Ctrl+Enter` | Open result in new background tab |
| `Ctrl+Shift+Enter` | Open result in new focused tab |
| `↑` / `↓` | Navigate command history |

> `Ctrl+Enter` and `Ctrl+Shift+Enter` work for bookmarks, search prefixes, direct URLs, plain-text searches, and `dir:` queries.

### Spell Check (`spell:`)

| Key | Action |
| :--- | :--- |
| `↑` / `↓` | Navigate suggestions |
| `Enter` | Copy selected suggestion to terminal |
| `D` | Define the selected (or confirmed) word via OneLook |
| `Esc` | Close |

### Pronunciation (`pronounce:`)

| Key | Action |
| :--- | :--- |
| `Space` | Play / stop audio |
| `D` | Define the word via OneLook |
| `Esc` | Close |

---

## Utility Tools

### Spell Check — `spell:word`

Checks spelling using the Datamuse phonetic API with frequency scoring to eliminate false positives. Works on single words and multi-word phrases.

- `↑` / `↓` to navigate suggestions, `Enter` to copy the selected correction to the terminal.
- Click or press `D` on any suggestion — or on a confirmed-correct word — to open its definition in OneLook.

### Pronunciation — `pronounce:word`

Displays a human-readable syllable breakdown (e.g. `nyoo·muh·noh·uhl·truh...`) with the original IPA below it for reference. Plays audio using real MP3 recordings where available, falling back to browser speech synthesis for any word that lacks one — including scientific, chemical, and technical terms.

- Works on single words and multi-word phrases. Each word is fetched independently and played in sequence.
- Press `Space` or click **Play** to hear the pronunciation.
- Press `D` to jump to the OneLook definition.

### IP Info — `:ipconfig`

Shows your IPv4 and IPv6 addresses fetched from separate protocol-locked endpoints, plus ISP, ASN, timezone, location, and VPN detection from ipapi.co.

### Speed Test — `:netspeed`

Runs an in-browser download/upload speed test and displays latency.

---

## Customization

### Bookmarks

The start page uses a 4-column layout. Customize bookmarks two ways:

1. **Visual Editor** (`:bookmarks`) — grid editor that maps directly to the 4-column layout.
2. **JSON Mode** — toggle "Edit as JSON" inside the bookmarks modal for bulk edits or to share your setup.

### Search Overrides & Custom Tags

Run `:tags` to override built-in search prefix URLs (e.g. point `amazon:` to `amazon.in`) or define entirely new prefixes. Custom prefixes get full syntax highlighting and autocomplete automatically.

### Open Directory Extensions

Run `:dirconfig` to customize which file extensions each `dir/` category searches for. Click `×` on a pill to remove an extension, type a new one and press `Enter` to add it, or use `↺` to reset to defaults.

### Syntax Colors

Run `:customize` to set the highlight color for each input type independently. Colors are stored separately from themes — switching themes never resets your color choices.

### Backup & Restore

Use **↓ Export** and **↑ Import** in `:config` to save all settings (bookmarks, colors, API keys, custom tags, dir extensions) to a single JSON file and restore them anytime.

---

## Privacy

All settings, including your **Gemini API Key**, are stored locally in your browser. When running as an extension, the API key is stored in the browser's encrypted extension storage (`chrome.storage.local`) — never in plain `localStorage`. No data is sent to any external server except for:

- **Google Gemini** — when using `gem:` or `ai:` prompts
- **Open-Meteo** — for real-time weather
- **Wiktionary / Free Dictionary API** — for `pronounce:` IPA lookup (no key, no tracking)
- **Datamuse** — for `spell:` suggestions (no key, no tracking)
- **ipapi.co / ident.me** — for `:ipconfig` (your IP is sent by nature of the request)

[![Star History Chart](https://api.star-history.com/svg?repos=caffienerd/startpage&type=Date)](https://star-history.com/#caffienerd/startpage&Date)