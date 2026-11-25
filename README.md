# dividend-table

Live dividend stock analysis dashboard — fed by a Google Sheet, refreshable from FMP, deployed on Vercel.

**Live page:** https://dividend-table.vercel.app
**Source data:** https://docs.google.com/spreadsheets/d/1kZqoldvudEdciv_m4jmbOgX6klykcNSf_jARm0mQA2w/edit

By Dave Ahern · Dividend.School

## How it works

The Sheet holds the data. An Apps Script bound to the Sheet pulls fresh numbers from the FMP API on demand. This page reads the Sheet's public CSV on every load — so what you see is always what's in the Sheet.

To make changes, see `SETUP.md`.

## Last-posted dates (activity.json)

`activity.json` holds the last time Dave posted on each channel, keyed by the same slug as the `data-channel` attribute on the Where I post cards (platform name lowercased, bracketed text dropped, other characters turned into hyphens, e.g. `linkedin`, `substack-notes`). Any page that includes `<script src="activity.js"></script>` gets a "Last posted …" line under each matching card, with a "quiet" badge after 7 days and "stale" after 30.

The LinkedIn entry is refreshed daily by a scheduled Claude job that reads AuthoredUP (feed posts only, not group cross-posts). Other channels can be added by hand with the same fields: `last_posted` (ISO date), optional `last_post_title`, `next_scheduled`, `followers`.
