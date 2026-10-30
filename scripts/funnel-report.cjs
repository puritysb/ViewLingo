'use strict';

// Offline aggregate reconciliation only. No SDK, credentials or network access.
const fs = require('node:fs');
const CAMPAIGNS = new Set(['vl_ly_jp_s01', 'vl_ly_jp_d01']);
const MONEY = new Set(['spend', 'sales', 'proceeds', 'refunded_proceeds']);
const METRICS = ['impressions', 'ad_clicks', 'landing_arrivals', 'store_cta_clicks',
  'apple_product_page_views', 'first_downloads', 'redownloads', 'total_downloads',
  'paid_app_purchases', 'refunded_purchases', 'paying_users', ...MONEY];
const STATUSES = new Set(['observed', 'not_collected', 'not_verified', 'not_yet_available', 'suppressed']);

function validateMetric(name, metric, campaign) {
  if (!metric || !STATUSES.has(metric.status)) throw new Error(`${name}: explicit status required`);
  if (metric.status !== 'observed') {
    if (metric.value !== null) throw new Error(`${name}: unavailable is null, never zero`);
    return;
  }
  if (!Number.isFinite(metric.value) || (!MONEY.has(name) && (!Number.isInteger(metric.value) || metric.value < 0))) {
    throw new Error(`${name}: invalid value`);
  }
  if (!metric.source || metric.campaign !== campaign || !metric.evidence) {
    throw new Error(`${name}: campaign-specific source and evidence required`);
  }
  const p = metric.period;
  if (!p || !Number.isFinite(Date.parse(p.start)) || !Number.isFinite(Date.parse(p.end)) ||
      !/Z$|[+-]\d\d:\d\d$/.test(p.start) || !/Z$|[+-]\d\d:\d\d$/.test(p.end) ||
      Date.parse(p.start) >= Date.parse(p.end) || !p.timezone || typeof p.final !== 'boolean') {
    throw new Error(`${name}: bounded period, timezone and finality required`);
  }
  if (MONEY.has(name) && !/^[A-Z]{3}$/.test(metric.currency || '')) throw new Error(`${name}: currency required`);
  if (name === 'spend' && metric.value < 0) throw new Error('spend: negative ad spend is not supported');
  if (name === 'paying_users' && (metric.source !== 'apple_app_paying_users' || metric.appId !== '6749508592' || metric.itemScope !== 'app_only')) {
    throw new Error('paying_users: Apple app-only paying-user evidence required');
  }
  if (name === 'paid_app_purchases') {
    const proof = metric.paidAppEvidence;
    if (metric.source !== 'apple_paid_app_transactions' || !proof || proof.appId !== '6749508592' ||
        proof.itemType !== 'paid_app' || proof.positiveCustomerPrice !== true ||
        proof.excludesRedownloadsAndFreeUnits !== true || proof.refundsSeparate !== true) {
      throw new Error('paid_app_purchases: explicit Apple paid-app transaction evidence required; downloads are not purchases');
    }
  }
}

function compare(a, b) {
  if (!a || !b || a.status !== 'observed' || b.status !== 'observed') return 'unavailable';
  if (Date.parse(a.period.start) !== Date.parse(b.period.start) || Date.parse(a.period.end) !== Date.parse(b.period.end)) return 'different_periods';
  if (!a.period.final || !b.period.final) return 'provisional_period';
  return null;
}
function ratio(a, b, money = false, matchingCoverage = false) {
  const reason = compare(a, b);
  if (reason) return {value: null, reason};
  if (money && a.currency !== b.currency) return {value: null, reason: 'different_currencies'};
  if (matchingCoverage && (!a.coverage || !b.coverage)) return {value: null, reason: 'unverified_coverage'};
  if (matchingCoverage && a.coverage !== b.coverage) return {value: null, reason: 'different_coverage'};
  if (b.value <= 0) return {value: null, reason: 'zero_denominator'};
  return {value: a.value / b.value, reason: null};
}
function report(input) {
  if (input.schemaVersion !== 1 || !Array.isArray(input.rows)) throw new Error('schemaVersion 1 and rows required');
  const seen = new Set();
  return input.rows.map(row => {
    if (!CAMPAIGNS.has(row.campaign) || seen.has(row.campaign)) throw new Error('unique registered Yahoo campaign required');
    seen.add(row.campaign);
    const metrics = {};
    for (const name of METRICS) {
      metrics[name] = row.metrics?.[name] || {status: 'not_verified', value: null};
      validateMetric(name, metrics[name], row.campaign);
    }
    const m = metrics;
    const result = {
      campaign: row.campaign, metrics,
      purchaseStatus: m.paid_app_purchases.status === 'observed' ? 'apple_reported_paid_app_transactions' : 'not_verified',
      paidCustomerStatus: m.paying_users.status === 'observed' ?
        (m.paying_users.value > 0 ? 'apple_reported_paying_customers' : 'apple_reported_zero_paying_customers') : 'not_verified',
      // Cross-stage ratios are aggregate period comparisons, never individual-user drop-off.
      ratios: {
        adCtr: ratio(m.ad_clicks, m.impressions),
        landingPerAdClick: ratio(m.landing_arrivals, m.ad_clicks),
        storeCtaPerLanding: ratio(m.store_cta_clicks, m.landing_arrivals, false, true),
        productPagePerStoreCta: ratio(m.apple_product_page_views, m.store_cta_clicks, false, true),
        paidAppPurchasePerAdClick: ratio(m.paid_app_purchases, m.ad_clicks),
        costPerPaidAppPurchase: ratio(m.spend, m.paid_app_purchases),
        costPerPayingUser: ratio(m.spend, m.paying_users),
        proceedsPerSpend: ratio(m.proceeds, m.spend, true)
      },
      limitations: ['Aggregate periods are not a person-level cohort.',
        'Consented web events exclude refusals and blockers; Apple uses separate attribution and privacy rules.',
        'No download, paying-user or revenue amount is converted into a paid-app purchase count.',
        'Apple proceeds are estimates, not settled bank receipts.']
    };
    if (result.ratios.costPerPaidAppPurchase.value !== null) result.ratios.costPerPaidAppPurchase.currency = m.spend.currency;
    if (result.ratios.costPerPayingUser.value !== null) result.ratios.costPerPayingUser.currency = m.spend.currency;
    return result;
  });
}

if (require.main === module) {
  try {
    const input = JSON.parse(fs.readFileSync(process.argv[2] || 0, 'utf8'));
    process.stdout.write(JSON.stringify(report(input), null, 2) + '\n');
  } catch (error) {
    process.stderr.write(`Invalid funnel input: ${error.message}\n`);
    process.exitCode = 1;
  }
}
module.exports = {report};
