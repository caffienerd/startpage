# Semantic Intent Router + Gemini Setup

## What was added
- `ai:your request` command in the terminal to route intent to the best site/tool.
- `gem:your prompt` / `gemini:your prompt` to query Gemini directly.
- `:gemini` shortcut to open Gemini website quickly.
- Gemini response modal in-app.
- Gemini API key + model fields in config.

## How to enable Gemini
1. Create an API key in Google AI Studio: https://aistudio.google.com/app/apikey
2. Run this project through a local server (recommended), for example:
   ```powershell
   cd A:\Second_Mind\Coding\Projects\RishitShit\Idk_StartPage_Ig\src
   python -m http.server 8080
   ```
3. Open `http://localhost:8080` in your browser.
4. In the app, run `:config` (or `:gemini`).
5. Set:
   - `Gemini API Key` = your key (`AIza...`)
   - `Gemini Model` = `gemini-2.0-flash` (default, good for speed/cost)
6. Save config.
7. Use Gemini from terminal:
   - `gem:write a 3 line summary of TCP vs UDP`

## Using `ai:` semantic intent routing
`ai:` is a navigation decision engine, not a Q&A assistant.

Examples:
- `ai:find me rust async tutorials` -> routes to YouTube
- `ai:directions to jfk airport` -> routes to Google Maps
- `ai:best alternative to notion` -> routes to AlternativeTo
- `ai:how do you spell accommodation` -> routes to spell check

## Notes
- The API key is stored in `localStorage` on this browser profile.
- If you rotate/delete your key, update it in `:config`.
- If a model name is invalid, Gemini will return an error in the modal.
