const test = require('node:test');
const assert = require('node:assert/strict');
const {report} = require('../scripts/funnel-report.cjs');
const campaign = 'vl_ly_jp_s01';
const period = {start:'2026-01-01T00:00:00Z',end:'2026-01-02T00:00:00Z',timezone:'Asia/Tokyo',final:true};
function observed(value, extra={}) {return {status:'observed',value,source:'yahoo_report',campaign,evidence:'offline-test-only',period:{...period},...extra};}
function input(metrics) {return {schemaVersion:1,rows:[{campaign,metrics}]};}
const paidAppEvidence = {appId:'6749508592',itemType:'paid_app',positiveCustomerPrice:true,excludesRedownloadsAndFreeUnits:true,refundsSeparate:true};
test('synthetic ad observations yield CTR while unknown downstream stages remain null',()=>{
  const r=report(input({impressions:observed(100),ad_clicks:observed(20),spend:observed(1000,{currency:'JPY'})}))[0];
  assert.equal(r.ratios.adCtr.value,20/100);
  assert.equal(r.ratios.landingPerAdClick.value,null);
  assert.equal(r.ratios.costPerPaidAppPurchase.value,null);
  assert.equal(r.purchaseStatus,'not_verified');
});
test('downloads, paying users and revenue never become paid app purchases',()=>{
  const r=report(input({first_downloads:observed(20,{source:'apple_downloads'}),total_downloads:observed(9),
    paying_users:observed(20,{source:'apple_app_paying_users',appId:'6749508592',itemScope:'app_only'}),proceeds:observed(50,{currency:'USD',source:'apple_analytics'})}))[0];
  assert.equal(r.metrics.paid_app_purchases.value,null);
  assert.equal(r.paidCustomerStatus,'apple_reported_paying_customers');
  assert.equal(r.ratios.paidAppPurchasePerAdClick.value,null);
  assert.throws(()=>report(input({paid_app_purchases:observed(20,{source:'apple_downloads'})})),/transaction evidence/);
});
test('all-purchase or app-wide paying-user totals cannot be substituted for campaign app-only buyers',()=>{
  assert.throws(()=>report(input({paying_users:observed(20)})),/app-only/);
  assert.throws(()=>report(input({paying_users:observed(20,{source:'apple_app_paying_users',appId:'6749508592',itemScope:'all_purchases'})})),/app-only/);
});
test('missing and privacy-suppressed values cannot masquerade as measured zero',()=>{
  assert.throws(()=>report(input({paid_app_purchases:{status:'suppressed',value:0}})),/null/);
  const r=report(input({paid_app_purchases:{status:'suppressed',value:null}}))[0];
  assert.equal(r.purchaseStatus,'not_verified');
  assert.throws(()=>report(input({ad_clicks:observed(1,{campaign:'web'})})),/campaign-specific/);
});
test('period boundaries, maturity and currencies prevent misleading ratios',()=>{
  const spend=observed(1000,{currency:'JPY'});
  const r=report(input({spend,proceeds:observed(50,{currency:'USD'}),ad_clicks:observed(20),
    landing_arrivals:observed(3,{period:{...period,start:'2026-01-01T15:00:00Z',end:'2026-01-02T15:00:00Z'}})}))[0];
  assert.equal(r.ratios.proceedsPerSpend.reason,'different_currencies');
  assert.equal(r.ratios.landingPerAdClick.reason,'different_periods');
  const provisional=report(input({impressions:observed(100,{period:{...period,final:false}}),ad_clicks:observed(20)}))[0];
  assert.equal(provisional.ratios.adCtr.reason,'provisional_period');
});
test('explicit paid-app evidence permits a campaign period cost ratio; zero denominator stays undefined',()=>{
  const purchases=observed(2,{source:'apple_paid_app_transactions',paidAppEvidence});
  const r=report(input({spend:observed(1000,{currency:'JPY'}),paid_app_purchases:purchases,ad_clicks:observed(20)}))[0];
  assert.equal(r.ratios.costPerPaidAppPurchase.value,500);
  assert.equal(r.ratios.costPerPaidAppPurchase.currency,'JPY');
  assert.equal(r.ratios.paidAppPurchasePerAdClick.value,2/20);
  const zero=report(input({spend:observed(1000,{currency:'JPY'}),paid_app_purchases:{...purchases,value:0}}))[0];
  assert.equal(zero.ratios.costPerPaidAppPurchase.reason,'zero_denominator');
});
test('separate consent populations cannot be represented as a Store conversion rate',()=>{
  const metrics={landing_arrivals:observed(10,{coverage:'yahoo_landing_additional_consent'}),
    store_cta_clicks:observed(3,{coverage:'yahoo_store_existing_consent'}),apple_product_page_views:observed(2)};
  const r=report(input(metrics))[0];
  assert.equal(r.ratios.storeCtaPerLanding.reason,'different_coverage');
  assert.equal(r.ratios.productPagePerStoreCta.reason,'unverified_coverage');
  const same=report(input({...metrics,store_cta_clicks:observed(3,{coverage:'yahoo_landing_additional_consent'})}))[0];
  assert.equal(same.ratios.storeCtaPerLanding.value,0.3);
});
