# startup

A fast, keyboard-driven browser start page. Terminal-style search with bookmark management, system tools, and syntax highlighting.

Live at `http://localhost:6174/`

---

## Structure

```
startup/
├── Caddyfile
├── README.md
└── src/
    ├── index.html
    ├── style.css
    ├── version/
    │   ├── version.js       ← edit this to change version
    │   └── version.ini      
    └── script/
        ├── bookmarks.js
        ├── commands.js
        ├── script.js
        ├── storage.js
        ├── terminal.js
        ├── time-weather.js
        └── modals/
            ├── config.js
            ├── help.js
            ├── ipinfo.js
            ├── speedtest.js
            └── spell.js
```

---

## Commands

### System

| Command | Action |
|---|---|
| `:config` | Open settings (bookmarks, weather, timezone, username) |
| `:ipconfig` / `:ip` | Show network info (IP, ISP, ASN, latency, VPN status) |
| `:netspeed` / `:speed` | Run speed test |
| `:dark` / `:light` | Toggle theme |
| `:version` / `:ver` | Show app version |
| `:help` | Show all commands |

### Search

| Prefix | Destination |
|---|---|
| `yt:query` | YouTube |
| `r:query` | Reddit (via Google) |
| `ddg:query` | DuckDuckGo |
| `imdb:movie` | IMDb |
| `alt:query` | AlternativeTo |
| `def:word` | Dictionary (OneLook) |
| `the:phrase` | Thesaurus (OneLook) |
| `syn:words` | Synonyms (OneLook) |
| `quote:phrase` | Quotes (OneLook) |
| `maps:location` | Google Maps |
| `spell:word` | Spell check |
| `cws:extension` | Chrome / Firefox extension search |

### General

| Input | Action |
|---|---|
| `website.com` | Navigate directly |
| anything else | Google search |
| `Enter` | Go (current tab) |
| `Ctrl+Enter` | Open in new tab, stay on start page |
| `Tab` / `→` | Accept autocomplete suggestion |
| `Ctrl+C` | Clear input |
| `↑` / `↓` | Command history |
| `PageUp` / `PageDown` | Scroll active bookmark card |

### Input color coding

| Color | Meaning |
|---|---|
| Blue | Known system command (`:help`, `:config`, etc.) |
| Orange | Search prefix (`yt:`, `r:`, `maps:`, etc.) |
| Green | Version command (`:version`) |
| Red | Unknown command (will Google search) |

---

## Configuration

Open `:config` to set:
- **Username** — shown in terminal prompt
- **Weather location** — city name
- **Timezone** — e.g. `UTC+5:30`
- **Bookmarks** — JSON array of `{ href, title }` objects

Bookmarks are stored in `localStorage` and sorted alphabetically. They're split into groups of 5 per card.

---

## Version

Edit `src/version/version.js` to update the version number:

```js
window.APP_VERSION = '1.0.0';
```

Run `:version` in the terminal to check the current version.

---