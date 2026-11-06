const test = require('node:test');
const assert = require('node:assert/strict');
// All numbers, dates and evidence references in this file are synthetic test fixtures.
const {report, toCSV, toHTML} = require('../scripts/funnel-report.cjs');
const {spawnSync} = require('node:child_process');
const path = require('node:path');
const campaign = 'vl_ly_jp_s01';
const period = {start:'2026-01-01T00:00:00Z',end:'2026-01-02T00:00:00Z',timezone:'Asia/Tokyo',final:true};
function observed(value, extra={}) {return {status:'observed',value,source:'yahoo_report',campaign,evidence:'offline-test-only',period:{...period},...extra};}
function input(metrics) {return {schemaVersion:1,rows:[{campaign,metrics}]};}
const paidAppEvidence = {appId:'6749508592',itemType:'paid_app',positiveCustomerPrice:true,excludesRedownloadsAndFreeUnits:true,refundsSeparate:true};
test('registered Meta and Kakao remain separate and cannot borrow Yahoo ad metrics or fabricate purchases',()=>{
  for(const [campaign,channel] of [['vl_meta_kr_awareness_20261104','meta'],['vl_kakao_kr_pc_cpm_20261105','kakao'],['vl_kakao_kr_sq_20261106','kakao'],['vl_kakao_kr_wide_20261106','kakao']]) {
    const impressions=observed(100,{campaign,source:channel+'_report'});
    const ad_clicks=observed(2,{campaign,source:channel+'_report'});
    const r=report({schemaVersion:1,rows:[{campaign,metrics:{impressions,ad_clicks}}]})[0];
    assert.equal(r.channel,channel);assert.equal(r.ratios.adCtr.value,0.02);
    assert.equal(r.metrics.landing_arrivals.value,null);assert.equal(r.metrics.paid_app_purchases.value,null);
    assert.throws(()=>report({schemaVersion:1,rows:[{campaign,metrics:{ad_clicks:{...ad_clicks,source:'yahoo_report'}}}]}),/matching/);
    assert.throws(()=>report({schemaVersion:1,rows:[{campaign,metrics:{paid_app_purchases:{...ad_clicks,source:'apple_downloads'}}}]}),/transaction evidence/);
  }
});
test('synthetic ad observations yield CTR while unknown downstream stages remain null',()=>{
  const r=report(input({impressions:observed(100),ad_clicks:observed(20),spend:observed(1000,{currency:'JPY'})}))[0];
  assert.equal(r.ratios.adCtr.value,20/100);
  assert.equal(r.ratios.landingPerAdClick.value,null);
  assert.equal(r.ratios.costPerPaidAppPurchase.value,null);
  assert.equal(r.purchaseStatus,'not_verified');
});
test('downloads, paying users and revenue never become paid app purchases',()=>{
  const r=report(input({first_downloads:observed(20,{source:'apple_downloads'}),total_downloads:observed(9,{source:'apple_downloads'}),
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
  const r=report(input({spend,proceeds:observed(50,{currency:'USD',source:'apple_analytics'}),ad_clicks:observed(20),
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
    store_cta_clicks:observed(3,{coverage:'yahoo_store_existing_consent'}),apple_product_page_views:observed(2,{source:'apple_analytics'})};
  const r=report(input(metrics))[0];
  assert.equal(r.ratios.storeCtaPerLanding.reason,'different_coverage');
  assert.equal(r.ratios.productPagePerStoreCta.reason,'unverified_coverage');
  const same=report(input({...metrics,store_cta_clicks:observed(3,{coverage:'yahoo_landing_additional_consent'})}))[0];
  assert.equal(same.ratios.storeCtaPerLanding.value,0.3);
});

function ga4(value, name, extra={}) {
  return observed(value, {source:'ga4_report',measurementId:'G-HHSGB68SC4',eventName:name,
    coverage:'ga4_analytics_consent_public_entry_and_cta',qaExcluded:true,...extra});
}
function cli(args=[], data=input({})) {
  return spawnSync(process.execPath,[path.join(__dirname,'../scripts/funnel-report.cjs'),...args],
    {input:JSON.stringify(data),encoding:'utf8'});
}

test('all four registered Google routes reconcile Google Ads and GA4 without inventing Apple purchases',()=>{
  for (const [campaign,channel] of [['vl_google_us_l01','google_search'],['vl_dg_us_01','google_demand_gen'],
    ['vl_google_tw_s01','google_search'],['vl_google_tw_d01','google_demand_gen']]) {
    const r=report({schemaVersion:1,rows:[{campaign,metrics:{
      impressions:observed(200,{source:'google_ads_report',campaign}),
      ad_clicks:observed(10,{source:'google_ads_report',campaign}),
      landing_arrivals:ga4(8,'landing_arrival',{campaign}),
      store_cta_clicks:ga4(2,'store_cta_click',{campaign})
    }}]})[0];
    assert.equal(r.channel,channel);assert.equal(r.ratios.adCtr.value,0.05);
    assert.equal(r.ratios.landingPerAdClick.value,0.8);assert.equal(r.ratios.storeCtaPerLanding.value,0.25);
    assert.equal(r.measurementSystems.landing_arrivals,'ga4_event_count');
    assert.equal(r.metrics.paid_app_purchases.value,null);assert.equal(r.metrics.paying_users.value,null);
  }
});
test('registered report campaigns stay compatible with public common.js campaign routing',()=>{
  const {campaignMetadata}=require('../js/common.js');
  const template=JSON.parse(cli(['--template']).stdout);
  assert.equal(template.rows.length,10);
  const routes={google_search:['google','cpc'],google_demand_gen:['google','display'],
    yahoo_search:['yahoo','cpc'],yahoo_display:['yahoo','display'],meta:['meta','paid_social'],kakao:['kakao','display']};
  for(const row of report(template)) {
    const metadata=campaignMetadata(`https://puritysb.github.io/ViewLingo/?campaign=${row.campaign}`);
    assert.equal(metadata.campaign,row.campaign);
    assert.deepEqual([metadata.source,metadata.medium],routes[row.channel]);
  }
});
test('each ad metric needs its own platform source, campaign and nonempty evidence',()=>{
  for (const campaign of ['vl_google_us_l01','vl_dg_us_01','vl_google_tw_s01','vl_google_tw_d01',
    'vl_ly_jp_s01','vl_ly_jp_d01','vl_meta_kr_awareness_20261104','vl_kakao_kr_pc_cpm_20261105']) {
    for(const source of ['', 'ga4_report', 'apple_analytics', 'unknown_report']) {
      assert.throws(()=>report({schemaVersion:1,rows:[{campaign,metrics:{ad_clicks:observed(1,{source,campaign})}}]}),/source|matching/);
    }
  }
  for(const evidence of ['', ' ', {}, null]) assert.throws(()=>report(input({ad_clicks:observed(1,{evidence})})),/evidence/);
  assert.throws(()=>report(input({ad_clicks:observed(1,{source:'google_ads_report'})})),/matching/);
  assert.throws(()=>report(input({ad_clicks:observed(1,{source:'yahoo_display_report'})})),/matching/);
  assert.equal(report(input({ad_clicks:observed(1,{source:'yahoo_search_report'})}))[0].metrics.ad_clicks.value,1);
});
test('GA4 requires the owned stream, exact named event and coverage rather than generic page views',()=>{
  for(const patch of [{measurementId:undefined},{measurementId:'G-OTHER'}, {eventName:undefined},
    {eventName:'page_view'},{eventName:'store_cta_click'},{coverage:undefined},{coverage:''},{qaExcluded:undefined},{qaExcluded:false}]) {
    assert.throws(()=>report(input({landing_arrivals:ga4(2,'landing_arrival',patch)})),/GA4/);
  }
  for(const campaign of ['vl_google_tw_s01','vl_meta_kr_awareness_20261104','vl_kakao_kr_sq_20261106']) {
    for(const source of ['google_ads_report','meta_report','kakao_report','yahoo_report']) {
      assert.throws(()=>report({schemaVersion:1,rows:[{campaign,metrics:{landing_arrivals:observed(1,{campaign,source})}}]}),/ga4_report/);
    }
  }
});
test('legacy Yahoo action totals remain distinct from GA4; identical labels cannot join different systems',()=>{
  const r=report(input({landing_arrivals:ga4(10,'landing_arrival',{coverage:'same'}),
    store_cta_clicks:observed(4,{coverage:'same'})}))[0];
  assert.equal(r.measurementSystems.landing_arrivals,'ga4_event_count');
  assert.equal(r.measurementSystems.store_cta_clicks,'yahoo_ads_attributed_action');
  assert.equal(r.ratios.storeCtaPerLanding.reason,'different_measurement_systems');
  assert.equal(r.ratios.storeCtaPerLanding.value,null);
  assert.equal(report(input({landing_arrivals:observed(3)}))[0].measurementSystems.landing_arrivals,'yahoo_ads_attributed_action');
  assert.throws(()=>report(input({store_cta_clicks:observed(3,{eventName:'landing_arrival'})})),/eventName/);
});
test('QA campaign IDs, explicit flags and QA-labelled rows or metrics fail before producing business output',()=>{
  for(const campaign of ['vl_dg_qa_01','vl_qa_260913','vl_google_test_01']) {
    assert.throws(()=>report({schemaVersion:1,rows:[{campaign}]}),/QA\/test/);
  }
  for(const label of ['QA','test','internal-test','debug traffic','synthetic','staging','preview']) {
    for(const key of ['label','environment','trafficType','source','medium','content']) {
      assert.throws(()=>report({schemaVersion:1,rows:[{campaign,[key]:label}]}),/QA\/test/);
    }
    assert.throws(()=>report({schemaVersion:1,rows:[{campaign,labels:['production',label]}]}),/QA\/test/);
  }
  for(const key of ['qa','isQA','test','isTest','synthetic','testTraffic','testMode','measurement_qa']) {
    assert.throws(()=>report({schemaVersion:1,rows:[{campaign,[key]:true}]}),/QA\/test/);
    assert.throws(()=>report(input({ad_clicks:observed(2,{[key]:true})})),/QA\/test/);
  }
  assert.throws(()=>report({...input({}),label:'QA'}),/QA\/test/);
  assert.throws(()=>report({schemaVersion:1,rows:[{campaign,isTest:'false'}]}),/boolean/);
  const result=cli([],{schemaVersion:1,rows:[{campaign},{campaign:'vl_dg_qa_01'}]});
  assert.equal(result.status,1);assert.equal(result.stdout,'');assert.match(result.stderr,/QA\/test/);
});
test('different report timezones with equal UTC boundaries withhold comparisons',()=>{
  const r=report(input({impressions:observed(100),ad_clicks:observed(2,{period:{...period,timezone:'UTC'}})}))[0];
  assert.equal(r.ratios.adCtr.value,null);assert.equal(r.ratios.adCtr.reason,'different_timezones');
  assert.equal(r.metrics.ad_clicks.period.timezone,'UTC');
  assert.equal(r.metrics.impressions.period.timezone,'Asia/Tokyo');
});
test('exact original periods survive normalization-free output; matching instants can use different timestamp offsets',()=>{
  const other={...period,start:'2026-01-01T09:00:00+09:00',end:'2026-01-02T09:00:00+09:00'};
  const r=report(input({impressions:observed(100),ad_clicks:observed(20,{period:other})}))[0];
  assert.equal(r.ratios.adCtr.value,0.2);assert.deepEqual(r.metrics.ad_clicks.period,other);
});
test('bad dates, omitted offsets, bogus timezones, non-final flags and unbounded periods are invalid',()=>{
  for(const patch of [{start:'2026-02-30T00:00:00Z'},{start:'2026-13-01T00:00:00Z'},
    {start:'2026-01-01T24:00:00Z'},{start:'2026-01-01T00:00:00'},{start:123},
    {timezone:'Not/AZone'},{timezone:''},{final:'true'},{end:period.start}]) {
    assert.throws(()=>report(input({impressions:observed(100,{period:{...period,...patch}})})),/period|timezone/);
  }
});
test('unknown metric states stay null in JSON, blank with status in CSV, and visible as unknown in HTML',()=>{
  const r=report(input({ad_clicks:observed(0),paid_app_purchases:{status:'suppressed',value:null}}));
  assert.equal(r[0].metrics.impressions.value,null);assert.equal(r[0].metrics.ad_clicks.value,0);
  const csv=toCSV(r);assert.match(csv,/"paid_app_purchases","suppressed",""/);
  assert.match(csv,/"ad_clicks","observed","0"/);
  const html=toHTML(r);assert.match(html,/Unknown \(suppressed\)/);assert.match(html,/Unknown \(not_verified\)/);
  assert.equal(JSON.parse(JSON.stringify(r))[0].metrics.paid_app_purchases.value,null);
});
test('Apple download and revenue evidence cannot come from Ads or turn into purchases',()=>{
  for(const name of ['apple_product_page_views','first_downloads','redownloads','total_downloads','sales','proceeds','refunded_proceeds']) {
    assert.throws(()=>report(input({[name]:observed(5,{currency:'USD'})})),/Apple campaign/);
  }
  assert.throws(()=>report(input({refunded_purchases:observed(1,{source:'apple_paid_app_transactions'})})),/transaction evidence/);
  const r=report(input({total_downloads:observed(10,{source:'apple_downloads'}),
    proceeds:observed(10,{source:'apple_analytics',currency:'USD'})}))[0];
  assert.equal(r.metrics.paid_app_purchases.value,null);assert.equal(r.metrics.paying_users.value,null);
});
test('native currencies are preserved without totals or implicit FX and invalid spend is rejected',()=>{
  const r=report({schemaVersion:1,rows:[{campaign,metrics:{spend:observed(1,{currency:'JPY'})}},
    {campaign:'vl_google_tw_s01',metrics:{spend:observed(2,{campaign:'vl_google_tw_s01',source:'google_ads_report',currency:'TWD'})}}]});
  assert.equal(r[0].metrics.spend.currency,'JPY');assert.equal(r[1].metrics.spend.currency,'TWD');
  assert.equal(r.totalSpend,undefined);
  for(const currency of ['', 'usd', 'US', 123]) assert.throws(()=>report(input({spend:observed(1,{currency})})),/currency/);
  assert.throws(()=>report(input({spend:observed(-1,{currency:'JPY'})})),/negative/);
});
test('invalid metrics and malformed input fail closed instead of silently becoming unknown',()=>{
  for(const data of [null,[],{}, {schemaVersion:2,rows:[]}, {schemaVersion:1,rows:[null]},
    {schemaVersion:1,rows:[{campaign,metrics:[]}]},input({ad_cliks:observed(2)}),input({ad_clicks:null}),
    input({ad_clicks:false}),input({ad_clicks:observed(2.5)}),input({ad_clicks:observed(-1)}),
    input({ad_clicks:observed(Number.MAX_SAFE_INTEGER+1)})]) assert.throws(()=>report(data));
  assert.throws(()=>report({schemaVersion:1,rows:[{campaign},{campaign}]}),/unique/);
  assert.throws(()=>report({schemaVersion:1,rows:[{campaign:'unknown'}]}),/registered/);
});
test('CSV quotes commas and newlines and neutralizes formulas; HTML escapes all supplied content without remote assets',()=>{
  const payload='<script>alert("x")</script>,\n=HYPERLINK("https://invalid.example")';
  const rows=report(input({ad_clicks:observed(1,{evidence:payload})}));
  const csv=toCSV(rows);assert.match(csv,/alert\(""x""\)/);assert.match(csv,/HYPERLINK\(""https:\/\/invalid.example""\)/);
  const html=toHTML(rows);assert.ok(!html.includes('<script>'));assert.match(html,/&lt;script&gt;/);
  assert.ok(!html.includes('<a '));assert.ok(!html.includes('<img'));assert.match(html,/default-src 'none'/);
  for(const evidence of ['=1+2','+SUM(1)','-SUM(1)','@SUM(1)',' \t=1','\tvalue','\nvalue']) {
    const output=toCSV(report(input({ad_clicks:observed(1,{evidence})})));
    assert.ok(output.includes(`"'${evidence}"`));
  }
});
test('CLI retains JSON default and supports stdin, CSV, HTML, help and failure exits',()=>{
  const json=cli();assert.equal(json.status,0);assert.equal(JSON.parse(json.stdout)[0].campaign,campaign);
  const csv=cli(['-','--format','csv']);assert.equal(csv.status,0);assert.match(csv.stdout,/^"campaign","channel"/);
  const html=cli(['--format=html']);assert.equal(html.status,0);assert.match(html.stdout,/<!doctype html>/);
  const help=cli(['--help']);assert.equal(help.status,0);assert.match(help.stdout,/Usage:/);
  for(const args of [['--format'],['--format','xml'],['--bad'],['one','two']]) {
    const result=cli(args);assert.equal(result.status,1);assert.equal(result.stdout,'');
  }
  const malformed=spawnSync(process.execPath,[path.join(__dirname,'../scripts/funnel-report.cjs')],{input:'not json',encoding:'utf8'});
  assert.equal(malformed.status,1);assert.equal(malformed.stdout,'');
});
test('blank template includes every business route with explicit unknowns and no claimed activity',()=>{
  const result=cli(['--template']);assert.equal(result.status,0);
  const data=JSON.parse(result.stdout);const rows=report(data);assert.equal(rows.length,10);
  for(const row of rows) for(const metric of Object.values(row.metrics)) {
    assert.equal(metric.status,'not_verified');assert.equal(metric.value,null);
  }
  assert.equal(cli(['--template','--format','html']).status,1);
  assert.equal(cli(['--template','private-input.json']).status,1);
});
test('operational notes and observation timestamps survive every output with safe escaping',()=>{
  const notes='Prepared route only; ad URL pending. <img src=x>\nDo not assign pre-cutover history.';
  const note='Source timezone unverified; <script>not executable</script>';
  const observedAt='2026-11-06T15:00:00+09:00';
  const rows=report({schemaVersion:1,rows:[{campaign,notes,metrics:{spend:{status:'not_verified',value:null,note,observedAt}}}]});
  assert.equal(rows[0].notes,notes);assert.equal(rows[0].metrics.spend.note,note);assert.equal(rows[0].metrics.spend.observedAt,observedAt);
  const csv=toCSV(rows);assert.ok(csv.includes(note));assert.ok(csv.includes(observedAt));assert.ok(csv.includes(notes));
  const html=toHTML(rows);assert.ok(html.includes('&lt;img src=x&gt;'));assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes(observedAt));
  for(const value of ['',[], 'x'.repeat(2001)]) {
    assert.throws(()=>report({schemaVersion:1,rows:[{campaign,notes:value}]}),/note/);
    assert.throws(()=>report(input({spend:{status:'not_verified',value:null,note:value}})),/note/);
  }
  assert.throws(()=>report(input({ad_clicks:observed(1,{observedAt:'2026-11-06'})})),/observedAt/);
});
test('all CSV metric and ratio rows have a stable header-width schema',()=>{
  // These simple fixtures have no embedded commas/newlines. Escaping is tested separately.
  const csv=toCSV(report(input({ad_clicks:observed(2)})));
  const widths=csv.trim().split('\r\n').map(line=>line.split(',').length);
  assert.equal(new Set(widths).size,1);assert.equal(widths[0],24);
});
