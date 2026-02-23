# Professional Terminal Start Page

A sleek, fast, and feature-rich browser start page driven by an interactive terminal. Boost your productivity with semantic AI routing, direct Gemini integration, and a suite of built-in utility tools—all wrapped in a premium, modern aesthetic.

---

## Features

- **Interactive Terminal**: Command-driven interface with autocomplete (`Tab`), syntax highlighting, and command history (`Up`/`Down`).
- **Semantic AI Router**: Use the ai: prefix to navigate based on intent. It intelligently routes you to YouTube, Maps, Reddit, or search.
- **Gemini Integration**: Direct AI prompting via `gem:` or `gemini:`. View responses in a beautiful, non-intrusive modal.
- **Rich Aesthetics**: Premium design with support for **Dark**, **AMOLED (Black)**, **coffee**, **newspaper** and **Light** themes.
- **Live Dashboard**: Instant access to local time and real-time weather updates.
- **Utility Suite**:
  - **IP Info**: Detailed network information via `:ipconfig`.
  - **Speed Test**: Integrated network performance testing via `:netspeed`.
  - **Spell Check**: Smart spelling suggestions via `spell:`.
- **Bookmark Management**: Fully customizable bookmark categories managed via JSON.

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

1.  **Identity**: Customize your terminal `username`.
2.  **Weather**: Set your location (e.g., `New York, US`).
3.  **Gemini AI**:
    *   **API Key**: Get one from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   **Model**: Default is `gemini-2.0-flash`.
    *   **System Prompt**: Optional personality for your AI assistant.
4.  **AI Mode**: Toggle between explicit (`ai:`) and automatic intent routing.

---

## Command Reference

| Prefix | Usage | Destination |
| :--- | :--- | :--- |
| `gem:` | `gem: explain quantum entanglement` | Gemini Direct Prompt |
| `ai:` | `ai: directions to central park` | Semantic Router |
| `yt:` | `yt: lofi hip hop` | YouTube Search |
| `r:` | `r: webdev` | Reddit Search |
| `maps:` | `maps: cafes near me` | Google Maps |
| `spell:` | `spell: accomodation` | Built-in Spell Checker |
| `def:` | `def: ephemeral` | Dictionary (OneLook) |
| `ddg:` | `ddg: privacy` | DuckDuckGo |
| `:light` | Switch to Light mode | Change Theme |
| `:dark` | Switch to Dark mode | Change Theme |
| `:black` | Switch to AMOLED mode | Change Theme |
| `:nord` | Switch to Arctic Nord mode | Change Theme |
| `:newspaper` | Switch to Classic Newspaper mode | Change Theme |
| `:coffee` | Switch to Organic Coffee mode | Change Theme |

### System Commands

- `:help` → Show all commands.
- `:config` → Open settings.
- `:bookmarks` → Edit bookmarks.
- `:dark` | `:black` | `:light` → Change theme.
- `:ipconfig` → Show network info.
- `:netspeed` → Run speed test.
- `:aimode` → Toggle automatic AI routing.

---

## Customization

### Bookmarks

The start page features a 4-column layout. You can customize these bookmarks to fit your needs:
1.  **Visual Editor (Recommended)**: Open `:config` to use the grid-based editor. It maps directly to the 4-column layout on the page, allowing you to organize your links by column and row.
2.  **JSON Mode**: Toggle "Edit as JSON" in the configuration modal for bulk edits or sharing your setup.
3.  **Code**: You can also modify the defaults in `script/storage.js` or `script/bookmarks.js`.

---

## Keyboard Shortcuts

- `Tab` or `Right Arrow`: Accept autocomplete suggestions.
- `Enter`: Execute command.
- `Up` / `Down Arrow`: Navigate command history.
- `Ctrl + C`: Clear current input.

---

## Privacy

All settings, including your **Gemini API Key**, are stored locally in your browser's `localStorage`. No data is sent to external servers except for the necessary API calls to Google Gemini and Open-Meteo (Weather).
