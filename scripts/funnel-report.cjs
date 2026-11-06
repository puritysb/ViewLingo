'use strict';

// Offline aggregate reconciliation only. No SDK, credentials, ingestion or network access.
const fs = require('node:fs');
const CHANNELS = new Map([
  ['vl_google_us_l01', 'google_search'], ['vl_dg_us_01', 'google_demand_gen'],
  ['vl_google_tw_s01', 'google_search'], ['vl_google_tw_d01', 'google_demand_gen'],
  ['vl_ly_jp_s01', 'yahoo_search'], ['vl_ly_jp_d01', 'yahoo_display'],
  ['vl_meta_kr_awareness_20261104', 'meta'], ['vl_kakao_kr_pc_cpm_20261105', 'kakao'],
  ['vl_kakao_kr_sq_20261106', 'kakao'], ['vl_kakao_kr_wide_20261106', 'kakao']
]);
const MONEY = new Set(['spend', 'sales', 'proceeds', 'refunded_proceeds']);
const AD_METRICS = new Set(['impressions', 'ad_clicks', 'spend']);
const WEB_EVENTS = {landing_arrivals: 'landing_arrival', store_cta_clicks: 'store_cta_click'};
const METRICS = ['impressions', 'ad_clicks', 'landing_arrivals', 'store_cta_clicks',
  'apple_product_page_views', 'first_downloads', 'redownloads', 'total_downloads',
  'paid_app_purchases', 'refunded_purchases', 'paying_users', ...MONEY];
const STATUSES = new Set(['observed', 'not_collected', 'not_verified', 'not_yet_available', 'suppressed']);
const QA_LABEL = /(?:^|[^a-z0-9])(?:qa|test|testing|debug|synthetic|fixture|staging|development|dev|preview|sandbox)(?:$|[^a-z0-9])/i;
const RATIO_SPECS = {
  adCtr: ['ad_clicks', 'impressions'],
  landingPerAdClick: ['landing_arrivals', 'ad_clicks'],
  storeCtaPerLanding: ['store_cta_clicks', 'landing_arrivals', false, true],
  productPagePerStoreCta: ['apple_product_page_views', 'store_cta_clicks', false, true],
  paidAppPurchasePerAdClick: ['paid_app_purchases', 'ad_clicks'],
  costPerPaidAppPurchase: ['spend', 'paid_app_purchases'],
  costPerPayingUser: ['spend', 'paying_users'],
  proceedsPerSpend: ['proceeds', 'spend', true]
};
const LIMITATIONS = [
  'Offline, manually supplied aggregates only; no automatic import or live dashboard.',
  'Validation checks the evidence contract, not the authenticity or completeness of an export.',
  'Aggregate periods are not a person-level cohort; ratios are not causal conversion rates.',
  'GA4 event counts and Yahoo Ads attributed actions have different consent and attribution coverage.',
  'Consented web events exclude refusals and blockers; Apple uses separate attribution and privacy rules.',
  'No download, paying-user or revenue amount is converted into a paid-app purchase count.',
  'Apple proceeds are estimates, not settled bank receipts.',
  'Currencies, periods and timezones are preserved; no FX conversion or cross-campaign totals.'
];
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;

// Recognized flags and labels fail closed. Evidence filenames are not traffic labels.
function rejectQA(value, context) {
  for (const key of ['qa', 'isQA', 'test', 'isTest', 'synthetic', 'testTraffic', 'testMode']) {
    if (value[key] !== undefined && typeof value[key] !== 'boolean') throw new Error(`${context}: ${key} must be boolean`);
    if (value[key] === true) throw new Error(`${context}: QA/test rows are excluded from business reports`);
  }
  if (value.measurement_qa !== undefined && ![false, true, 0, 1, '0', '1'].includes(value.measurement_qa)) {
    throw new Error(`${context}: invalid measurement_qa flag`);
  }
  if ([true, 1, '1'].includes(value.measurement_qa)) throw new Error(`${context}: QA/test rows are excluded from business reports`);
  for (const key of ['campaign', 'source', 'medium', 'content', 'environment', 'trafficType', 'label', 'labels']) {
    if (value[key] === undefined) continue;
    const labels = key === 'labels' && Array.isArray(value[key]) ? value[key] : [value[key]];
    if (!labels.every(nonempty)) throw new Error(`${context}: ${key} must contain nonempty text`);
    if (labels.some(label => QA_LABEL.test(label))) throw new Error(`${context}: QA/test rows are excluded from business reports`);
  }
}

function validTimestamp(value) {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second, zone] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.getUTCMonth() + 1 !== +month || date.getUTCDate() !== +day ||
      +hour > 23 || +minute > 59 || +second > 59) return false;
  if (zone !== 'Z' && (+zone.slice(1, 3) > 23 || +zone.slice(4) > 59)) return false;
  return Number.isFinite(Date.parse(value));
}
function validatePeriod(period, name) {
  if (!isRecord(period) || !validTimestamp(period.start) || !validTimestamp(period.end) ||
      Date.parse(period.start) >= Date.parse(period.end) || !nonempty(period.timezone) || typeof period.final !== 'boolean') {
    throw new Error(`${name}: bounded period, timezone and finality required`);
  }
  try { new Intl.DateTimeFormat('en', {timeZone: period.timezone}); }
  catch { throw new Error(`${name}: recognized report timezone required`); }
}

function validateSource(name, metric, campaign) {
  const channel = CHANNELS.get(campaign);
  if (AD_METRICS.has(name)) {
    const allowed = channel.startsWith('google_') ? ['google_ads_report'] :
      channel.startsWith('yahoo_') ? ['yahoo_report', `${channel}_report`] : [`${channel}_report`];
    if (!allowed.includes(metric.source)) throw new Error(`${name}: matching ${channel} ad report required`);
    return;
  }
  if (Object.hasOwn(WEB_EVENTS, name)) {
    if (metric.source === 'ga4_report') {
      if (metric.measurementId !== 'G-HHSGB68SC4' || metric.eventName !== WEB_EVENTS[name] || !nonempty(metric.coverage) || metric.qaExcluded !== true) {
        throw new Error(`${name}: GA4 stream, exact eventName, verified coverage and qaExcluded: true required`);
      }
    } else if (channel.startsWith('yahoo_') && ['yahoo_report', `${channel}_report`].includes(metric.source)) {
      // Legacy Yahoo inputs remain valid, but are never relabelled as GA4 events.
      if (metric.eventName !== undefined && metric.eventName !== WEB_EVENTS[name]) throw new Error(`${name}: wrong Yahoo action eventName`);
    } else {
      throw new Error(`${name}: ga4_report or matching Yahoo action report required; ad clicks are not web events`);
    }
    return;
  }
  if (name === 'paying_users') {
    if (metric.source !== 'apple_app_paying_users' || metric.appId !== '6749508592' || metric.itemScope !== 'app_only') {
      throw new Error('paying_users: Apple app-only paying-user evidence required');
    }
    return;
  }
  if (name === 'paid_app_purchases' || name === 'refunded_purchases') {
    const proof = metric.paidAppEvidence;
    if (metric.source !== 'apple_paid_app_transactions' || !isRecord(proof) || proof.appId !== '6749508592' ||
        proof.itemType !== 'paid_app' || proof.positiveCustomerPrice !== true ||
        proof.excludesRedownloadsAndFreeUnits !== true || proof.refundsSeparate !== true) {
      throw new Error(`${name}: explicit Apple paid-app transaction evidence required; downloads are not purchases`);
    }
    return;
  }
  const allowed = ['first_downloads', 'redownloads', 'total_downloads'].includes(name) ?
    ['apple_downloads', 'apple_analytics'] : ['apple_analytics'];
  if (!allowed.includes(metric.source)) throw new Error(`${name}: matching Apple campaign report required`);
}

function validateNote(value, name) {
  if (value !== undefined && (!nonempty(value) || value.length > 2000)) throw new Error(`${name}: note must be nonempty text up to 2000 characters`);
}

function validateMetric(name, metric, campaign) {
  if (!isRecord(metric) || !STATUSES.has(metric.status)) throw new Error(`${name}: explicit status required`);
  rejectQA(metric, name);
  validateNote(metric.note, name);
  if (metric.observedAt !== undefined && !validTimestamp(metric.observedAt)) throw new Error(`${name}: observedAt must be a timestamp with offset`);
  if (metric.status !== 'observed') {
    if (metric.value !== null) throw new Error(`${name}: unavailable is null, never zero`);
    return;
  }
  if (!Number.isFinite(metric.value) || (!MONEY.has(name) && (!Number.isSafeInteger(metric.value) || metric.value < 0))) {
    throw new Error(`${name}: invalid value`);
  }
  if (!nonempty(metric.source) || metric.campaign !== campaign || !nonempty(metric.evidence)) {
    throw new Error(`${name}: campaign-specific source and evidence required`);
  }
  validateSource(name, metric, campaign);
  validatePeriod(metric.period, name);
  if (metric.coverage !== undefined && !nonempty(metric.coverage)) throw new Error(`${name}: nonempty coverage required`);
  if (MONEY.has(name) && !/^[A-Z]{3}$/.test(metric.currency || '')) throw new Error(`${name}: currency required`);
  if (name === 'spend' && metric.value < 0) throw new Error('spend: negative ad spend is not supported');
}

function compare(a, b) {
  if (a.status !== 'observed' || b.status !== 'observed') return 'unavailable';
  if (Date.parse(a.period.start) !== Date.parse(b.period.start) || Date.parse(a.period.end) !== Date.parse(b.period.end)) return 'different_periods';
  if (a.period.timezone !== b.period.timezone) return 'different_timezones';
  if (!a.period.final || !b.period.final) return 'provisional_period';
  return null;
}
function ratio(a, b, money = false, matchingCoverage = false) {
  const reason = compare(a, b);
  if (reason) return {value: null, reason};
  if (money && a.currency !== b.currency) return {value: null, reason: 'different_currencies'};
  // An identical free-text label cannot turn Yahoo-attributed actions into GA4 events.
  if (matchingCoverage && [a.source, b.source].includes('ga4_report') && a.source !== b.source) {
    return {value: null, reason: 'different_measurement_systems'};
  }
  if (matchingCoverage && (!a.coverage || !b.coverage)) return {value: null, reason: 'unverified_coverage'};
  if (matchingCoverage && a.coverage !== b.coverage) return {value: null, reason: 'different_coverage'};
  if (b.value <= 0) return {value: null, reason: 'zero_denominator'};
  const value = a.value / b.value;
  if (!Number.isFinite(value)) return {value: null, reason: 'nonfinite_ratio'};
  return {value, reason: null};
}

function measurementSystem(name, metric) {
  if (metric.status !== 'observed') return 'unverified';
  if (Object.hasOwn(WEB_EVENTS, name)) return metric.source === 'ga4_report' ? 'ga4_event_count' : 'yahoo_ads_attributed_action';
  if (AD_METRICS.has(name)) return 'ad_platform_report';
  return 'apple_campaign_report';
}
function report(input) {
  if (!isRecord(input) || input.schemaVersion !== 1 || !Array.isArray(input.rows)) throw new Error('schemaVersion 1 and rows required');
  rejectQA(input, 'input');
  const seen = new Set();
  return input.rows.map(row => {
    if (!isRecord(row)) throw new Error('campaign row object required');
    rejectQA(row, 'row');
    validateNote(row.notes, 'row.notes');
    if (!CHANNELS.has(row.campaign) || seen.has(row.campaign)) throw new Error('unique registered campaign required');
    seen.add(row.campaign);
    if (row.metrics !== undefined && !isRecord(row.metrics)) throw new Error('metrics must be an object');
    for (const name of Object.keys(row.metrics || {})) {
      if (!METRICS.includes(name)) throw new Error(`unknown metric: ${name}`);
    }
    const metrics = {};
    for (const name of METRICS) {
      metrics[name] = row.metrics && Object.hasOwn(row.metrics, name) ? row.metrics[name] : {status: 'not_verified', value: null};
      validateMetric(name, metrics[name], row.campaign);
    }
    const m = metrics;
    const result = {
      campaign: row.campaign, channel: CHANNELS.get(row.campaign), ...(row.notes ? {notes: row.notes} : {}), metrics,
      measurementSystems: Object.fromEntries(METRICS.map(name => [name, measurementSystem(name, m[name])])),
      purchaseStatus: m.paid_app_purchases.status === 'observed' ? 'apple_reported_paid_app_transactions' : 'not_verified',
      paidCustomerStatus: m.paying_users.status === 'observed' ?
        (m.paying_users.value > 0 ? 'apple_reported_paying_customers' : 'apple_reported_zero_paying_customers') : 'not_verified',
      ratios: Object.fromEntries(Object.entries(RATIO_SPECS).map(([name, [a, b, money, coverage]]) =>
        [name, ratio(m[a], m[b], money, coverage)])),
      limitations: [...LIMITATIONS]
    };
    for (const name of ['costPerPaidAppPurchase', 'costPerPayingUser']) {
      if (result.ratios[name].value !== null) result.ratios[name].currency = m.spend.currency;
    }
    return result;
  });
}

function csvCell(value) {
  if (value === null || value === undefined) return '""';
  let text = String(value);
  // Quoting alone does not prevent spreadsheet formula execution. Keep numbers numeric.
  if (typeof value === 'string' && (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text))) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
function toCSV(rows) {
  const headers = ['campaign', 'channel', 'kind', 'name', 'status', 'value', 'reason', 'currency',
    'measurement_system', 'source', 'evidence', 'row_notes', 'metric_note', 'observed_at', 'period_start', 'period_end', 'timezone', 'final', 'coverage',
    'event_name', 'measurement_id', 'qa_excluded', 'numerator', 'denominator'];
  const lines = [headers];
  for (const row of rows) {
    for (const name of METRICS) {
      const m = row.metrics[name];
      lines.push([row.campaign, row.channel, 'metric', name, m.status, m.value, null, m.currency,
        row.measurementSystems[name], m.source, m.evidence, row.notes, m.note, m.observedAt, m.period?.start, m.period?.end, m.period?.timezone,
        m.period?.final, m.coverage, m.eventName, m.measurementId, m.qaExcluded, null, null]);
    }
    for (const [name, r] of Object.entries(row.ratios)) {
      const [a, b] = RATIO_SPECS[name];
      lines.push([row.campaign, row.channel, 'ratio', name, r.value === null ? 'withheld' : 'calculated', r.value,
        r.reason, r.currency, 'aggregate_comparison', null, null, row.notes, null, null, null, null, null, null, null, null, null, null, a, b]);
    }
  }
  return lines.map(line => line.map(csvCell).join(',')).join('\r\n') + '\r\n';
}
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
}
function toHTML(rows) {
  const h = escapeHTML;
  const display = m => m.value === null ? `미확인 / Unknown (${h(m.status || m.reason)})` : h(m.value) + (m.currency ? ` ${h(m.currency)}` : '');
  const periods = m => m.period ? `${h(m.period.start)} to ${h(m.period.end)}<br>${h(m.period.timezone)}; ${m.period.final ? 'final' : 'provisional'}` : 'Unknown';
  const table = (headers, body) => `<table><thead><tr>${headers.map(x => `<th scope="col">${h(x)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>`;
  const summary = table(['캠페인', '매체', '광고 노출', '광고 클릭', '비용 (원통화)', '랜딩 도착', '스토어 CTA 클릭', '유료 앱 거래'],
    rows.map(row => `<tr><th scope="row">${h(row.campaign)}</th><td>${h(row.channel)}</td>${['impressions', 'ad_clicks', 'spend', 'landing_arrivals', 'store_cta_clicks', 'paid_app_purchases'].map(name => `<td>${display(row.metrics[name])}</td>`).join('')}</tr>`).join(''));
  const details = rows.map(row => `<section><h2>${h(row.campaign)}</h2>${row.notes ? `<p class="notes">${h(row.notes)}</p>` : ''}${table(['지표', '값 / 상태', '측정 체계', '출처 / 근거', '정확한 기간 [시작, 종료)', '집계 범위'],
    METRICS.map(name => { const m = row.metrics[name]; return `<tr><th scope="row">${h(name)}</th><td>${display(m)}</td><td>${h(row.measurementSystems[name])}</td><td>${h(m.source || 'Unknown')}<br>${h(m.evidence)}<br>${h(m.eventName)} ${h(m.measurementId)}${m.observedAt ? `<br>확인 시각: ${h(m.observedAt)}` : ''}${m.note ? `<br>${h(m.note)}` : ''}</td><td>${periods(m)}</td><td>${h(m.coverage || 'Unverified')}</td></tr>`; }).join(''))}
    <h3>조건부 집계 비율</h3><p>0.25는 25%입니다. 비용 비율은 표시된 통화 단위입니다. 이용자별 전환율이나 구매 경로를 증명하지 않습니다.</p>${table(['비율', '분자 / 분모', '값 / 보류 사유'], Object.entries(row.ratios).map(([name, r]) => `<tr><th scope="row">${h(name)}</th><td>${h(RATIO_SPECS[name].slice(0, 2).join(' / '))}</td><td>${display(r)}</td></tr>`).join(''))}</section>`).join('\n');
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>ViewLingo 매체별 집계 리포트</title><style>body{font:15px system-ui,sans-serif;line-height:1.5;margin:2rem;color:#17212b}table{border-collapse:collapse;width:100%;margin:1rem 0;overflow-wrap:anywhere}th,td{border:1px solid #cbd5e1;padding:.55rem;text-align:left;vertical-align:top}thead{background:#eef2f6}section{margin-top:3rem}.notes{white-space:pre-line}li{margin:.3rem 0}@media print{body{margin:0;font-size:10px}section{break-before:page}}</style></head><body>
<h1>ViewLingo 매체별 집계 리포트</h1><p>수동으로 입력한 비공개 집계입니다. 실시간 수집·자동 연동·출처 진위 검증은 수행하지 않습니다. 요약의 각 셀은 기간과 측정 체계가 다를 수 있으므로 아래 상세 기간과 출처를 확인한 뒤 비교하세요. 서로 다른 통화·캠페인을 합산하지 않습니다. 빈 값은 0이 아니라 미확인입니다.</p><p>GA4는 동의한 웹 이벤트 수, Yahoo Ads 액션은 광고 기여 집계입니다. 다운로드·수익·결제 이용자 수를 유료 앱 거래 수로 바꾸지 않습니다. QA/test 표식이 있거나 GA4의 QA 제외 확인이 없는 입력은 거부됩니다. 이 검증은 입력자의 근거 확인을 대신하지 않습니다.</p>
<ul>${LIMITATIONS.map(note => `<li>${h(note)}</li>`).join('')}</ul>${rows.length ? summary + details : '<p>입력된 캠페인이 없습니다. 활동 여부를 판단할 수 없습니다.</p>'}
</body></html>\n`;
}

function runCLI(args) {
  let format = 'json';
  let filename;
  let template = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      process.stdout.write('Usage: node scripts/funnel-report.cjs [private-input.json|-] [--format json|csv|html]\n       node scripts/funnel-report.cjs --template > private-input.json\nReads stdin by default. Offline only. Keep input and generated reports outside the public repository.\n');
      return;
    }
    if (arg === '--template') template = true;
    else if (arg === '--format') format = args[++i];
    else if (arg.startsWith('--format=')) format = arg.slice('--format='.length);
    else if (arg.startsWith('-') && arg !== '-') throw new Error(`unknown option: ${arg}`);
    else if (filename !== undefined) throw new Error('only one input file is supported');
    else filename = arg;
  }
  if (!['json', 'csv', 'html'].includes(format)) throw new Error('format must be json, csv or html');
  if (template) {
    if (filename !== undefined || format !== 'json') throw new Error('--template accepts no input file and emits JSON only');
    const rows = [...CHANNELS.keys()].map(campaign => ({campaign, metrics: Object.fromEntries(
      METRICS.map(name => [name, {status: 'not_verified', value: null}]))}));
    process.stdout.write(JSON.stringify({schemaVersion: 1, rows}, null, 2) + '\n');
    return;
  }
  const input = JSON.parse(fs.readFileSync(!filename || filename === '-' ? 0 : filename, 'utf8'));
  const rows = report(input); // Validate every row before emitting any business data.
  process.stdout.write(format === 'csv' ? toCSV(rows) : format === 'html' ? toHTML(rows) : JSON.stringify(rows, null, 2) + '\n');
}
if (require.main === module) {
  try { runCLI(process.argv.slice(2)); }
  catch (error) { process.stderr.write(`Invalid funnel input: ${error.message}\n`); process.exitCode = 1; }
}
module.exports = {report, toCSV, toHTML};
