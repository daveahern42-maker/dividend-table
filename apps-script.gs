/**
 * Dividend Dashboard — FMP Refresh Script (chunked + resumable)
 *
 * This is a backup copy of the script running in your Sheet's Apps Script.
 * If you ever lose it or need to recreate the Sheet, paste this back in.
 */

const FMP_BASE = 'https://financialmodelingprep.com/stable';
const SHEET_NAME = 'Sheet1';
const HEADER_ROW = 1;
const TICKER_COL = 2;
const FIRST_DATA_COL = 3;
const CHUNK_SIZE = 8;
const TIME_BUDGET_MS = 5 * 60 * 1000;

function refreshFromFMP() {
  const startTime = Date.now();
  const ui = SpreadsheetApp.getUi();
  const apiKey = PropertiesService.getScriptProperties().getProperty('FMP_API_KEY');
  if (!apiKey) {
    ui.alert('Missing API key', 'Set FMP_API_KEY in Project Settings → Script Properties.', ui.ButtonSet.OK);
    return;
  }

  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= HEADER_ROW) {
    ui.alert('No tickers', 'Add tickers in column B first.', ui.ButtonSet.OK);
    return;
  }

  const numRows = lastRow - HEADER_ROW;
  const tickers = sheet.getRange(HEADER_ROW + 1, TICKER_COL, numRows, 1)
                       .getValues().flat().map(t => String(t).trim());

  const dataRange = sheet.getRange(HEADER_ROW + 1, FIRST_DATA_COL, numRows, 6);
  const results = dataRange.getValues().map(row => row.slice());

  const toFetch = [];
  for (let i = 0; i < tickers.length; i++) {
    if (!tickers[i]) continue;
    const hasData = results[i].some(v => v !== '' && v !== null);
    if (!hasData) toFetch.push(i);
  }

  if (toFetch.length === 0) {
    ui.alert('Already up to date',
      'All rows have data. Use Dividends → Force Full Refresh to refetch fresh values.',
      ui.ButtonSet.OK);
    return;
  }

  const errors = [];
  let processedThisRun = 0;
  let stoppedEarly = false;

  for (let chunkStart = 0; chunkStart < toFetch.length; chunkStart += CHUNK_SIZE) {
    if (Date.now() - startTime > TIME_BUDGET_MS) {
      stoppedEarly = true;
      break;
    }

    const chunkIndexes = toFetch.slice(chunkStart, chunkStart + CHUNK_SIZE);
    const requests = [];
    const requestMap = [];
    for (const idx of chunkIndexes) {
      requests.push({
        url: `${FMP_BASE}/ratios-ttm?symbol=${encodeURIComponent(tickers[idx])}&apikey=${apiKey}`,
        muteHttpExceptions: true
      });
      requestMap.push({ tickerIndex: idx, type: 'ratios' });
      requests.push({
        url: `${FMP_BASE}/financial-growth?symbol=${encodeURIComponent(tickers[idx])}&limit=1&apikey=${apiKey}`,
        muteHttpExceptions: true
      });
      requestMap.push({ tickerIndex: idx, type: 'growth' });
    }

    let responses;
    try {
      responses = UrlFetchApp.fetchAll(requests);
    } catch (e) {
      errors.push(`Chunk fetch error: ${e.message || e}`);
      continue;
    }

    const dataByTicker = {};
    for (let i = 0; i < responses.length; i++) {
      const { tickerIndex, type } = requestMap[i];
      if (!dataByTicker[tickerIndex]) dataByTicker[tickerIndex] = {};
      try {
        dataByTicker[tickerIndex][type] = JSON.parse(responses[i].getContentText());
      } catch (e) {
        dataByTicker[tickerIndex][type] = null;
      }
    }

    for (const idx of chunkIndexes) {
      const ticker = tickers[idx];
      const data = dataByTicker[idx] || {};
      const ratios = data.ratios;
      const growth = data.growth;

      if (!Array.isArray(ratios) || !ratios.length || !Array.isArray(growth) || !growth.length) {
        const msg = (ratios && ratios['Error Message']) || (growth && growth['Error Message']) ||
                    'No data returned (FMP free tier may not cover this symbol).';
        errors.push(`${ticker}: ${msg}`);
        continue;
      }

      const r = ratios[0], g = growth[0];
      const yieldPct = (r.dividendYieldTTM || 0) * 100;
      const dps = r.dividendPerShareTTM;
      const eps = r.netIncomePerShareTTM;
      const fcfps = r.freeCashFlowPerShareTTM;
      const epsPayout = (eps && eps > 0 && dps != null) ? (dps / eps) * 100 : '';
      const fcfPayout = (fcfps && fcfps > 0 && dps != null) ? (dps / fcfps) * 100 : '';
      const div5y = annualize(g.fiveYDividendperShareGrowthPerShare, 5);
      const rev5y = annualize(g.fiveYRevenueGrowthPerShare, 5);
      const eps5y = annualize(g.fiveYNetIncomeGrowthPerShare, 5);

      results[idx] = [
        round(yieldPct, 2),
        round(epsPayout, 1),
        round(fcfPayout, 1),
        round(div5y, 1),
        round(rev5y, 1),
        round(eps5y, 1)
      ];
      processedThisRun++;
    }

    sheet.getRange(HEADER_ROW + 1, FIRST_DATA_COL, results.length, 6).setValues(results);
  }

  const meta = ss.getSheetByName('Meta') || ss.insertSheet('Meta');
  meta.getRange('A1').setValue('Last refresh');
  meta.getRange('B1').setValue(new Date().toLocaleString());

  const stillEmpty = results.filter((row, i) => tickers[i] && !row.some(v => v !== '' && v !== null)).length;
  let summary = `Refreshed ${processedThisRun} ticker(s) this run.`;
  if (stoppedEarly && stillEmpty > 0) {
    summary += `\n\n${stillEmpty} still empty (hit time budget). Click Refresh again to continue.`;
  } else if (stillEmpty > 0) {
    summary += `\n\n${stillEmpty} ticker(s) didn't return data (FMP free tier may not cover them).`;
  }
  if (errors.length) {
    const shown = errors.slice(0, 8);
    summary += '\n\nIssues:\n' + shown.join('\n');
    if (errors.length > shown.length) summary += `\n... and ${errors.length - shown.length} more`;
  }
  ui.alert('Refresh status', summary, ui.ButtonSet.OK);
}

function forceFullRefresh() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.getActiveSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= HEADER_ROW) return;
  sheet.getRange(HEADER_ROW + 1, FIRST_DATA_COL, lastRow - HEADER_ROW, 6).clearContent();
  refreshFromFMP();
}

function annualize(cumulative, years) {
  if (cumulative === null || cumulative === undefined || isNaN(cumulative)) return '';
  return (Math.pow(1 + cumulative, 1 / years) - 1) * 100;
}

function round(n, dp) {
  if (n === '' || n === null || n === undefined || isNaN(n)) return '';
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Dividends')
    .addItem('🔄 Refresh from FMP', 'refreshFromFMP')
    .addItem('🔁 Force Full Refresh (clear & refetch all)', 'forceFullRefresh')
    .addToUi();
}
