# Professional Terminal Start Page

A sleek, fast, and feature-rich browser start page driven by an interactive terminal. Boost your productivity with semantic AI routing, direct Gemini integration, and a suite of built-in utility tools—all wrapped in a premium, modern aesthetic.

**→ Try it live: [caffienerd.github.io/startpage](https://caffienerd.github.io/startpage/)**

> Inspired by [ahmetdem/start-page](https://github.com/ahmetdem/start-page)

---

## Demo

### Overview

https://github.com/user-attachments/assets/videos/demo.mp4

### Themes

https://github.com/user-attachments/assets/videos/themes.mp4

---

## Features

- **Interactive Terminal**: Command-driven interface with autocomplete (`Tab`), syntax highlighting per command type, and command history (`Up`/`Down`).
- **Semantic AI Router**: Use the `ai:` prefix to navigate based on intent. Intelligently routes you to YouTube, Maps, Reddit, or search.
- **Gemini Integration**: Direct AI prompting via `gem:` or `gemini:`. View responses in a clean, non-intrusive modal.
- **Rich Aesthetics**: Premium design with support for **Light**, **Dark**, **AMOLED (Black)**, **Nord**, **Newspaper**, **Coffee**, **Root (Hacker)**, and **Neon (Cyberpunk)** themes.
- **Syntax Highlighting**: Color-coded input for commands, themes, search prefixes, URLs, and more — fully customizable via `:customize`.
- **Live Dashboard**: Instant access to local time and real-time weather updates.
- **Utility Suite**:
  - **IP Info**: Detailed network information via `:ipconfig`.
  - **Speed Test**: Integrated network performance testing via `:netspeed`.
  - **Spell Check**: Smart spelling suggestions via `spell:`.
- **Bookmark Management**: Fully customizable bookmark categories via visual grid editor or raw JSON.
- **Default Search Engine**: Choose between Google, DuckDuckGo, or Bing for plain-text searches.

---

## Getting Started

### Prerequisites

You need a way to serve the static files locally. While you can open `index.html` directly, some features (like API requests) work better when served.

#### Option 1: Python (Quickest)
```bash
python -m http.server 6174
```

#### Option 2: Caddy (Recommended for production)
```bash
caddy run --config Caddyfile
```

Visit `http://localhost:6174` in your browser.

---

## Configuration

Run `:config` in the terminal to open the settings modal.

1. **Identity**: Customize your terminal `username`.
2. **Weather**: Set your location (e.g., `New York, US`).
3. **Gemini AI**:
   - **API Key**: Get one from [Google AI Studio](https://aistudio.google.com/app/apikey).
   - **Model**: Default is `gemini-2.5-flash-lite`.
   - **System Prompt**: Optional personality for your AI assistant.
4. **AI Mode**: Toggle between explicit (`ai:`) and automatic intent routing.
5. **AI Route Badge**: Control when the route preview badge is shown.
6. **Default Search Engine**: Set Google, DuckDuckGo, or Bing as your fallback search.

Run `:customize` to open the customization modal.

1. **Theme**: Switch between all 8 themes with a single click.
2. **Syntax Colors**: Independently customize the highlight color for each input type (commands, themes, search prefixes, URLs, version, unknown). Colors persist across all themes.

---

## Command Reference

### Search Prefixes

| Prefix | Usage | Destination |
| :--- | :--- | :--- |
| `yt:` | `yt: lofi hip hop` | YouTube Search |
| `r:` | `r: webdev` | Reddit Search |
| `maps:` | `maps: cafes near me` | Google Maps |
| `ddg:` | `ddg: privacy` | DuckDuckGo |
| `ggl:` | `ggl: something` | Google (explicit) |
| `bing:` | `bing: something` | Bing Search |
| `amazon:` | `amazon: mechanical keyboard` | Amazon Search |
| `imdb:` | `imdb: inception` | IMDb Search |
| `alt:` | `alt: notion` | AlternativeTo |
| `def:` | `def: ephemeral` | Dictionary (OneLook) |
| `the:` | `the: happy` | Thesaurus (OneLook) |
| `syn:` | `syn: fast` | Synonyms (OneLook) |
| `quote:` | `quote: churchill` | Quotes (OneLook) |
| `spell:` | `spell: accomodation` | Built-in Spell Checker |
| `cws:` | `cws: ublock` | Chrome/Firefox Extension Store |
| `gem:` | `gem: explain quantum` | Gemini Direct Prompt |
| `gemini:` | `gemini: summarize this` | Gemini Direct Prompt (alias) |
| `ai:` | `ai: directions to central park` | Semantic AI Router |

### System Commands

| Command | Description |
| :--- | :--- |
| `:help` | Show all commands |
| `:config` | Open settings |
| `:customize` / `:custom` | Open customization (colors & theme) |
| `:bookmarks` / `:bm` | Edit bookmarks |
| `:ipconfig` / `:ip` | Show network info |
| `:netspeed` / `:speed` | Run speed test |
| `:aimode` | Toggle automatic AI routing |
| `:version` | Show app version |
| `:gemini` | Open Gemini website |
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
| `Ctrl+C` | Clear current input |

> `Ctrl+Enter` and `Ctrl+Shift+Enter` work for bookmarks, search prefixes, direct URLs, and plain-text searches.

---

## Customization

### Bookmarks

The start page features a 4-column layout. You can customize bookmarks in two ways:

1. **Visual Editor (Recommended)**: Run `:bookmarks` to use the grid-based editor. It maps directly to the 4-column layout, letting you organize links by column and row.
2. **JSON Mode**: Toggle "Edit as JSON" in the bookmarks modal for bulk edits or sharing your setup.

### Syntax Colors

Run `:customize` to independently set the highlight color for each input type. Colors are stored separately from themes — changing themes won't reset your colors.

---

## Privacy

All settings, including your **Gemini API Key**, are stored locally in your browser's `localStorage`. No data is sent to external servers except for necessary API calls to Google Gemini and Open-Meteo (weather).