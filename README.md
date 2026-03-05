# Professional Terminal Start Page — Browser Extension

A sleek, fast, and feature-rich **browser extension** that replaces your new tab page with an interactive terminal. Boost your productivity with semantic AI routing, direct Gemini integration, open directory search, and a suite of built-in utility tools—all wrapped in a premium, modern aesthetic.

> This is the **Extension branch** of the project. For the standalone web version, see the [`master` branch](../../tree/master).

**→ Try the web version live: [caffienerd.github.io/startpage](https://caffienerd.github.io/startpage/)**

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

## Features

- **Interactive Terminal**: Command-driven interface with autocomplete (`Tab`), syntax highlighting per command type, and command history (`Up`/`Down`).
- **Semantic AI Router**: Use the `ai:` prefix to navigate based on intent. Intelligently routes you to YouTube, Maps, Reddit, or search.
- **Gemini Integration**: Direct AI prompting via `gem:` or `gemini:`. View responses in a clean, non-intrusive modal.
- **Open Directory Search**: Power-user Google dorking via `dir/<category>/<engine>: keyword`. Search public open directory indexes filtered by file type, with full autocomplete and an interactive builder (`:dir`).
- **Rich Aesthetics**: Premium design with support for **Light**, **Dark**, **AMOLED (Black)**, **Nord**, **Newspaper**, **Coffee**, **Root (Hacker)**, and **Neon (Cyberpunk)** themes.
- **Syntax Highlighting**: Color-coded input for commands, themes, search prefixes, open directory tokens, URLs, and more — fully customizable via `:customize`.
- **Live Dashboard**: Instant access to local time and real-time weather updates.
- **Utility Suite**:
  - **IP Info**: Detailed network information via `:ipconfig`.
  - **Speed Test**: Integrated network performance testing via `:netspeed`.
  - **Spell Check**: Smart spelling suggestions via `spell:`.
- **Bookmark Management**: Fully customizable bookmark categories via visual grid editor or raw JSON.
- **Default Search Engine**: Choose between Google, DuckDuckGo, or Bing for plain-text searches.

---

## Installation

### Chrome / Brave / Edge

1. Clone or download this branch.
2. Run the build:
   ```bash
   npm install
   npm run build
   ```
3. Open your browser and go to `chrome://extensions` (or `edge://extensions`).
4. Enable **Developer mode** (top right toggle).
5. Click **Load unpacked** and select the `dist/` folder.
6. Open a new tab — you're done.

### Opera

Use `manifest.opera.json` instead. Rename it to `manifest.json` before loading unpacked, or follow the same steps above with the Opera-specific build output.

### Firefox

Firefox extension support may vary. Use the standalone web version on `master` for the best Firefox experience.

---

## Configuration

Run `:config` in the terminal to open the settings modal.

1. **Identity**: Customize your terminal `username`.
2. **Weather**: Set your location (e.g., `New York`, `London`, `Jerusalem`, `Delhi`).
3. **Gemini AI**:
   - **API Key**: Get one from [Google AI Studio](https://aistudio.google.com/app/apikey).
   - **Model**: Default is `gemini-2.5-flash-lite`.
   - **System Prompt**: Optional personality for your AI assistant.
4. **AI Mode**: Toggle between explicit (`ai:`) and automatic intent routing.
5. **AI Route Badge**: Control when the route preview badge is shown.
6. **Default Search Engine**: Set Google, DuckDuckGo, or Bing as your fallback search. Also used as the default engine for `dir:` searches.

Run `:customize` to open the customization modal.

1. **Theme**: Switch between all 8 themes with a single click.
2. **Syntax Colors**: Independently customize the highlight color for each input type. Colors persist across all themes.

---

## Command Reference

### Search Prefixes

| Prefix | Usage | Destination |
| :--- | :--- | :--- |
| `yt:` | `yt: youtube search` | YouTube Search |
| `r:` | `r: something to find in reddit` | Reddit Search |
| `maps:` | `maps: location` | Google Maps |
| `ddg:` | `ddg: search with DuckDuckGo` | DuckDuckGo |
| `ggl:` | `ggl: search with Google` | Google (explicit) |
| `bing:` | `bing: search with bing` | Bing Search |
| `amazon:` | `amazon: mechanical keyboards` | Amazon Search |
| `imdb:` | `imdb: Breaking Bad` | IMDb Search |
| `alt:` | `alt: alternative of something` | AlternativeTo |
| `def:` | `def: definition of something` | Dictionary (OneLook) |
| `the:` | `the: a phrase to get the thesaurus of` | Thesaurus (OneLook) |
| `syn:` | `syn: synonyms of something` | Synonyms (OneLook) |
| `quote:` | `quote: quotes containing keywords` | Quotes (OneLook) |
| `spell:` | `spell: word / phrase to check` | Built-in Spell Checker |
| `cws:` | `cws: extension` | Chrome/Firefox Extension Store |
| `gem:` | `gem: talk to gemini` | Gemini Direct Prompt |
| `ai:` | `ai: directions to central park` | Semantic AI Router |

### Open Directory Prefixes

```
dir/<category>/<engine>: keyword
```

| Prefix | Example | Description |
| :--- | :--- | :--- |
| `dir:` | `dir: interstellar` | Open dir search, no file filter |
| `dir/media:` | `dir/media: interstellar` | Video files (mkv, mp4, avi…) |
| `dir/books:` | `dir/books: dune` | Ebook formats (pdf, epub, mobi…) |
| `dir/music:` | `dir/music: pink floyd` | Audio files (mp3, flac, ogg…) |
| `dir/software:` | `dir/software: photoshop` | Executables & archives (exe, iso, zip, apk…) |
| `dir/images:` | `dir/images: wallpapers 4k` | Image files (jpg, png, psd…) |
| `dir/other:` | `dir/other: keyword` | Raw open dir, no file filter |

Engine override: append `/ggl`, `/ddg`, or `/bing` before the colon.  
Category aliases: `vid`, `book`, `audio`, `soft`, `img` and more. See `:help` in the terminal.

### System Commands

| Command | Description |
| :--- | :--- |
| `:help` | Show all commands |
| `:config` | Open settings |
| `:customize` / `:custom` | Open customization (colors & theme) |
| `:bookmarks` / `:bm` | Edit bookmarks |
| `:dir` | Open interactive directory search builder |
| `:dirconfig` | Customize file extensions per `dir/` category |
| `:prompts` | Edit terminal placeholder suggestions |
| `:ipconfig` / `:ip` | Show network info |
| `:netspeed` / `:speed` | Run speed test |
| `:aimode` | Toggle automatic AI routing |
| `:version` | Show app version |
| `:gemini` | Open Gemini website |
| `:tags` | Override search URLs & add custom prefix shortcuts |
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

| Shortcut | Action |
| :--- | :--- |
| `Tab` or `→` | Accept autocomplete suggestion |
| `Enter` | Execute command / navigate |
| `Ctrl+Enter` | Open result in new background tab |
| `Ctrl+Shift+Enter` | Open result in new focused tab |
| `↑` / `↓` | Navigate command history |

---

## Customization

### Bookmarks

Run `:bookmarks` to use the grid-based visual editor or toggle to raw JSON for bulk edits.

### Search Overrides & Custom Tags

Run `:tags` to override built-in prefix URLs or define entirely new prefix shortcuts. Use **⊞ Dir Extensions** in `:tags` to customize file extensions per `dir/` category.

### Syntax Colors

Run `:customize` to set highlight colors per input type. Colors persist independently of themes.

### Backup & Restore

Use **↓ Export** and **↑ Import** in `:config` to back up all settings — bookmarks, colors, API keys, custom tags, dir extensions, and prompts — to a JSON file.

---

## Privacy

All settings, including your **Gemini API Key**, are stored locally in your browser's `localStorage`. No data is sent to external servers except for necessary API calls to Google Gemini and Open-Meteo (weather). The extension does not collect or transmit any personal data.