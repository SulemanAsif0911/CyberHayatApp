# New Google Sheet backend — setup

1. **Create a new Google Sheet** (e.g. "Cyber Hayat Data") in the Google account you want to own the data.
2. **Extensions → Apps Script.** Delete the sample code and paste all of `Code.gs`.
3. Change `SHARED_SECRET` (top of the file) to a long random string.
4. **Project Settings (gear icon) → Script properties → Add script property**
   - `LLM_API_KEY` = your key from https://openrouter.ai/keys (free account works; it serves Llama models)
   - optional `LLM_MODELS` = `meta-llama/llama-3.3-70b-instruct:free,meta-llama/llama-3.3-70b-instruct`
5. In the editor choose function **`setup`** → Run. Approve the permissions (Sheets, Gmail, external requests).
   You should now see the tabs and a **Dashboard** sheet.
6. Choose **`testChat`** → Run → open **Execution log**: you should see a Llama reply.
7. **Deploy → New deployment → Web app** — Execute as: *Me*, Who has access: *Anyone*. Copy the `/exec` URL.
8. Open `app/src/main/assets/www/assets/js/config.js` and fill in:
   ```js
   APPS_SCRIPT_URL: "https://script.google.com/macros/s/.../exec",
   SHARED_SECRET: "the same secret from step 3"
   ```
9. Rebuild the APK. Anything users saved while offline uploads automatically on first connection.

If you edit `Code.gs` later: **Deploy → Manage deployments → Edit → New version** (the URL stays the same).
