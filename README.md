# Gemini AI Setup (for this start page)

## What was added
- `gem:your prompt` command in the terminal to query Gemini.
- `:gemini` shortcut to open config quickly.
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
7. Use AI from terminal:
   - `gem:write a 3 line summary of TCP vs UDP`

## Notes
- The API key is stored in `localStorage` on this browser profile.
- If you rotate/delete your key, update it in `:config`.
- If a model name is invalid, Gemini will return an error in the modal.
