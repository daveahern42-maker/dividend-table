When you change `index.html` and push to GitHub, Vercel auto-deploys within ~30 seconds.

## Common tasks

### Add a new stock
1. Open the Sheet.
2. Add a row: column A = company name, column B = ticker symbol.
3. Click Dividends → 🔄 Refresh from FMP.
4. Done. Live page updates on next reload.

### Remove a stock
1. Delete the row in the Sheet.
2. Reload the live page.

### Refresh all data manually
Sheet → Dividends → 🔄 Refresh from FMP. The script processes 8 tickers per run; for a fresh re-fetch of everything, click Refresh up to 3 times in a row, or use Dividends → 🔁 Force Full Refresh.

### Set up automatic weekly refresh
1. Open the Sheet → Extensions → Apps Script.
2. Click ⏰ Triggers in the left sidebar.
3. Click "+ Add Trigger".
4. Function: `refreshFromFMP`. Event source: Time-driven. Type: Week timer. Pick a day/time.
5. Save.

### Change the page colors / typography / layout
1. Open this folder in Claude Cowork.
2. Tell Cowork what to change in `index.html`.
3. Cowork edits it and you commit + push (or it does it for you). Vercel auto-deploys in ~30 seconds.

### A ticker keeps showing blank rows
Most likely: FMP's free tier doesn't cover that symbol. The error message in Apps Script Executions panel will say "Premium Query Parameter" if so. Two options:
1. **Drop the ticker** from your Sheet.
2. **Fill that row manually** — Apps Script won't overwrite cells once they have data.

### Replace your FMP API key
1. Sheet → Extensions → Apps Script → ⚙️ Project Settings → Script Properties → edit `FMP_API_KEY`.

## What NOT to change without thinking

- **Sheet column order.** The Apps Script writes to specific columns (C through H).
- **Sheet name (`Sheet1`).** The page fetches by sheet name.
- **Sharing settings.** Must stay "Anyone with the link → Viewer."

## If something breaks

1. **Page shows "Could not load data from Google Sheets"** — check Sheet sharing is set to "Anyone with the link, Viewer."
2. **Refresh button missing from menu** — reload the Sheet (close tab, reopen).
3. **Refresh runs but cells stay empty** — likely FMP free tier limits. Check Apps Script Executions panel for specific errors.
4. **Vercel page is stale** — Vercel deploys take ~30 seconds after a push. Hard-refresh your browser.
5. **Anything else** — open this folder in Cowork, paste the error, ask for help.
