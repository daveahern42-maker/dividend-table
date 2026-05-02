# dividend-table

Live dividend stock analysis dashboard — fed by a Google Sheet, refreshable from FMP, deployed on Vercel.

**Live page:** {{VERCEL_URL}}
**Source data:** https://docs.google.com/spreadsheets/d/1kZqoldvudEdciv_m4jmbOgX6klykcNSf_jARm0mQA2w/edit

By Dave Ahern · Dividend.School

## How it works

The Sheet holds the data. An Apps Script bound to the Sheet pulls fresh numbers from the FMP API on demand. This page reads the Sheet's public CSV on every load — so what you see is always what's in the Sheet.

To make changes, see `SETUP.md`.
