const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('js/measurement.js', 'utf8');
function harness({choice, qa=false, blocked=false, dnt=false, lang='en', oldChoice, referrer='', href='https://puritysb.github.io/ViewLingo/?campaign=vl_dg_us_01&email=private'}={}) {
  const listeners={}, nodes=[], scripts=[], events=[], funnelEvents=[], timers=[], values={};
  if(choice) values.viewlingo_ad_measurement_v2=JSON.stringify({choice,expires:Date.now()+10000});
  if(oldChoice) values.viewlingo_ad_measurement_v1=JSON.stringify({choice:oldChoice,expires:Date.now()+10000});
  function node(tag){return {tag,children:[],setAttribute(){},appendChild(n){this.children.push(n);return n;},addEventListener(k,f){this[k]=f;},querySelector(){return this.children.flatMap(x=>x.children||[]).find(x=>x.tag==='button');},focus(){}};}
  const document={referrer,getElementById:()=>null,documentElement:{lang},title:'ViewLingo',readyState:'complete',cookie:'',head:{appendChild:n=>scripts.push(n)},body:{appendChild:n=>nodes.push(n)},createElement:node,querySelector:()=>null,addEventListener:(k,f)=>listeners[k]=f,dispatchEvent:e=>(e.type==='viewlingo:funnel'?funnelEvents:events).push(e.detail)};
  const location={href,hostname:qa?'localhost':'puritysb.github.io',reload(){location.reloaded=true;},assign(url){location.destination=url;}};
  const context={document,location,navigator:{globalPrivacyControl:blocked,doNotTrack:dnt?'1':'0'},window:{},URL,Date,CustomEvent:function(type,arg){this.type=type;this.detail=arg.detail;},localStorage:{getItem:k=>values[k]??null,setItem:(k,v)=>values[k]=v},setTimeout:f=>timers.push(f)};
  context.window.location=location;
  // Initialize common.js first, before the consent UI creates its policy anchor.
  vm.runInNewContext(fs.readFileSync('js/common.js','utf8'),{...context, document:{readyState:'complete',currentScript:{hasAttribute:()=>true},querySelectorAll:()=>[]}});
  vm.runInNewContext(source,context);
  const buttons=nodes[0].children[2].children;
  return {context, scripts, events, funnelEvents, nodes, timers, yahoo:()=>Array.from(context.window.yjDataLayer||[],a=>a[0]), accept:()=>buttons[0].click(),decline:()=>buttons[1].click(),click(href='https://apps.apple.com/app/apple-store/id6749508592'){const e={target:{closest:()=>({href})},button:0,preventDefault(){this.defaultPrevented=true;}};listeners.click(e);return e;},commands:()=>Array.from(context.window.dataLayer||[],a=>Array.from(a))};
}
test('no tag or conversion before consent, including decline and store navigation',()=>{const h=harness();h.click();h.decline();assert.equal(h.scripts.length,0);assert.equal(h.commands().length,0);});
test('consent loads one tag and emits distinct zero-value visit and click events',()=>{const h=harness();h.accept();h.accept();h.click();assert.equal(h.scripts.length,1);const c=h.commands().filter(x=>x[0]==='event');assert.equal(c.length,2);assert.match(c[0][2].send_to,/IRJz/);assert.match(c[1][2].send_to,/ZHS8/);assert.ok(c.every(x=>x[2].value===0));const config=h.commands().find(x=>x[0]==='config')[2];assert.ok(!config.page_location.includes('email'));assert.equal(config.allow_ad_personalization_signals,false);assert.equal(h.context.location.destination,undefined);h.timers[0]();assert.match(h.context.location.destination,/apps.apple.com/);});
test('saved choice and withdrawal reload stop future events',()=>{const h=harness({choice:'granted'});assert.equal(h.scripts.length,1);h.decline();assert.equal(h.context.location.reloaded,true);const n=h.commands().length;h.click();assert.equal(h.commands().length,n);});
test('QA measures the interaction path without sending to Google',()=>{const h=harness({qa:true});h.accept();h.click();assert.equal(h.scripts.length,0);assert.deepEqual(h.events.map(x=>x.event),['visit','store']);});
test('browser privacy signal overrides even saved consent',()=>{const h=harness({blocked:true,choice:'granted'});h.accept();h.click();assert.equal(h.scripts.length,0);assert.equal(h.commands().length,0);});
test('Chinese page language tags resolve the existing localized consent copy',()=>{
  for(const [folder,language,title,decline] of [['zh-hans','zh-Hans','可选广告衡量','拒绝'],['zh-hant','zh-Hant','選用廣告評估','拒絕']]){
    for(const page of ['index','privacy','faq']){
      const html=fs.readFileSync(`${folder}/${page}.html`,'utf8');
      const lang=html.match(/<html\s+lang="([^"]+)"/)[1];
      assert.equal(lang,language,`${folder}/${page}.html`);
      const h=harness({lang});
      assert.equal(h.nodes[0].children[0].textContent,title);
      assert.equal(h.nodes[0].children[2].children[1].textContent,decline);
      assert.equal(h.scripts.length,0);
    }
  }
});


test('duplicate Store clicks across CTA variants produce one zero-value movement per page',()=>{
  for(const qa of [true,false]){
    const h=harness({qa});h.accept();h.click();h.click('https://apps.apple.com/app/id6749508592');
    if(qa) assert.equal(h.events.filter(x=>x.event==='store').length,1);
    else assert.equal(h.commands().filter(x=>x[0]==='event'&&/ZHS8/.test(x[2].send_to)).length,1);
  }
});


test('late-created consent policy link retains LY attribution through privacy, home and Store',()=>{
  for(const campaign of ['vl_ly_jp_s01','vl_ly_jp_d01','vl_ly_jp_macfan_display_20261030']){
    const expected=campaign==='vl_ly_jp_s01'?campaign:'vl_ly_jp_d01';
    for(const locale of ['', 'ja/', 'ko/', 'zh-hans/', 'zh-hant/']){
      const h=harness({qa:true,href:'https://puritysb.github.io/ViewLingo/'+locale+'index.html?campaign='+campaign+'&measurement_qa=1&yclid=private'});
      const policy=h.nodes[0].children[2].children[2].href;
      assert.equal(new URL(policy).search,'?campaign='+expected);
      const home=h.context.window.ViewLingoCampaign.link('index.html',policy);
      const store=h.context.window.ViewLingoCampaign.link('https://apps.apple.com/jp/app/id6749508592?pt=128040795&ct=web&mt=12',home);
      assert.equal(new URL(store).search,'?pt=128040795&ct='+expected+'&mt=12');
      assert.equal(h.scripts.length,0);
      assert.equal(h.commands().length,0);
    }
  }
});

test('dynamic policy links preserve campaign input validation and never forward arbitrary inputs',()=>{
  for(const query of ['campaign=unknown','campaign=vl_ly_jp_d01&campaign=vl_ly_jp_s01','email=private']){
    const h=harness({qa:true,href:'https://puritysb.github.io/ViewLingo/ja/?'+query});
    assert.equal(h.nodes[0].children[2].children[2].href,'privacy.html');
    assert.equal(h.scripts.length,0);
  }
});


const yahooURL=campaign=>'https://puritysb.github.io/ViewLingo/ja/?campaign='+campaign;
test('Google-only grant cannot authorize either new tag; an old refusal remains respected',()=>{
  const h=harness({oldChoice:'granted',href:yahooURL('vl_ly_jp_s01')});
  assert.equal(h.nodes[0].hidden,false);assert.equal(h.scripts.length,0);assert.equal(h.yahoo().length,0);
  h.click();assert.equal(h.scripts.length,0);h.decline();assert.equal(h.scripts.length,0);
  const denied=harness({oldChoice:'denied',href:yahooURL('vl_ly_jp_s01')});
  assert.equal(denied.nodes[0].hidden,true);assert.equal(denied.scripts.length,0);
});
test('each Yahoo campaign queues only its own zero-value Store movement after new consent',()=>{
  for(const [campaign,type,label] of [
    ['vl_ly_jp_s01','yss_conversion','xCqiCO3E6a4dELel-PZE'],
    ['vl_ly_jp_d01','yjad_conversion','PO8USX4JWB9FXBVRAM1388944'],
    ['vl_ly_jp_macfan_display_20261030','yjad_conversion','PO8USX4JWB9FXBVRAM1388944']]){
    const h=harness({href:yahooURL(campaign)});h.click();assert.equal(h.scripts.length,0);
    h.accept();h.accept();assert.equal(h.scripts.length,2);
    assert.equal(h.scripts.filter(s=>s.src==='https://s.yimg.jp/images/listing/tool/cv/ytag.js').length,1);
    assert.deepEqual(h.yahoo().map(t=>t.type),['ycl_cookie']);
    assert.equal(h.yahoo()[0].config.ycl_use_non_cookie_storage,false);
    h.click();h.click('https://apps.apple.com/jp/app/id6749508592');
    const tags=h.yahoo().filter(t=>t.type!=='ycl_cookie');assert.equal(tags.length,1);assert.equal(tags[0].type,type);
    assert.ok(Object.values(tags[0].config).includes(label));
    assert.equal(tags[0].config[type==='yss_conversion'?'yahoo_conversion_value':'yahoo_ydn_conv_value'],'0');
    if(type==='yjad_conversion')assert.equal(tags[0].config.yahoo_ydn_conv_transaction_id,'');
    assert.ok(!JSON.stringify(tags).includes('purchase'));
  }
});
test('Yahoo never loads on decline, privacy signal, unknown campaigns, arbitrary query or unsafe referrer',()=>{
  for(const params of [
    {href:yahooURL('vl_ly_jp_s01'),blocked:true},
    {href:yahooURL('unknown')},
    {href:yahooURL('vl_ly_jp_s01')+'&email=private'},
    {href:yahooURL('vl_ly_jp_d01')+'&campaign=vl_ly_jp_s01'},
    {href:yahooURL('vl_ly_jp_d01'),referrer:'https://example.com/private-input?q=secret'},
    {href:yahooURL('vl_ly_jp_d01'),referrer:'https://puritysb.github.io/ViewLingo/ja/?email=secret'}]){
    const h=harness(params);h.accept();h.click();assert.equal(h.scripts.filter(s=>/yimg/.test(s.src)).length,0);assert.equal(h.yahoo().length,0);
  }
  const h=harness({href:yahooURL('vl_ly_jp_s01')});h.decline();h.click();assert.equal(h.scripts.length,0);
});
test('withdrawing consent clears queued Yahoo commands and suppresses further Store events',()=>{
  const h=harness({choice:'granted',href:yahooURL('vl_ly_jp_d01')});h.click();assert.equal(h.yahoo().length,2);
  h.decline();assert.equal(h.yahoo().length,0);h.click();assert.equal(h.yahoo().length,0);assert.equal(h.context.location.reloaded,true);
});
test('QA covers Google and Yahoo selection without loading scripts or queuing external commands',()=>{
  for(const campaign of ['vl_ly_jp_s01','vl_ly_jp_d01']){
    const h=harness({qa:true,href:yahooURL(campaign)});h.accept();h.click();h.click();
    assert.equal(h.scripts.length,0);assert.equal(h.yahoo().length,0);assert.equal(h.commands().length,0);
    const events=h.events.filter(e=>e.provider==='yahoo');assert.equal(events.length,1);assert.equal(events[0].campaign,campaign);
  }
});


test('official Yahoo click ID forms are accepted, arbitrary click-ID input is skipped',()=>{
  for(const id of ['YSS.synthetic-ad-id','YSS.1001415750.synthetic-ad-id','YJAD.1793358000.synthetic-ad-id']){
    const h=harness({href:yahooURL('vl_ly_jp_s01')+'&yclid='+id});h.accept();h.click();
    assert.equal(h.yahoo().filter(t=>t.type==='yss_conversion').length,1);
  }
  const h=harness({href:yahooURL('vl_ly_jp_s01')+'&yclid=arbitrary-input'});h.accept();h.click();assert.equal(h.yahoo().length,0);
});

test('local funnel contract distinguishes a consented entry from internal page navigation, without new tags',()=>{
  for(const campaign of ['vl_ly_jp_s01','vl_ly_jp_d01','vl_ly_jp_macfan_display_20261030']) {
    for(const locale of ['', 'ja/', 'ko/', 'zh-hans/', 'zh-hant/']) {
      const h=harness({qa:true,href:`https://puritysb.github.io/ViewLingo/${locale}?campaign=${campaign}`});
      h.click();assert.equal(h.funnelEvents.length,0);
      h.accept();h.accept();h.click();h.click();
      assert.deepEqual(h.funnelEvents.map(e=>e.event),['landing_arrival','store_cta_click']);
      assert.ok(h.funnelEvents.every(e=>e.campaign===(campaign==='vl_ly_jp_s01'?campaign:'vl_ly_jp_d01')&&e.value===0));
      assert.equal(h.scripts.length,0);assert.equal(h.commands().length,0);assert.equal(h.yahoo().length,0);
    }
  }
  for(const [href,referrer] of [
    [yahooURL('vl_ly_jp_s01'),'https://puritysb.github.io/ViewLingo/ja/faq.html?campaign=vl_ly_jp_s01'],
    ['https://puritysb.github.io/ViewLingo/ja/faq.html?campaign=vl_ly_jp_s01','']]) {
    const h=harness({qa:true,href,referrer});h.accept();h.click();
    assert.deepEqual(h.funnelEvents.map(e=>e.event),['store_cta_click']);
  }
});
test('local funnel contract preserves refusal, withdrawal, GPC and URL privacy; it is not a purchase event',()=>{
  for(const params of [
    {blocked:true,href:yahooURL('vl_ly_jp_s01')},
    {dnt:true,href:yahooURL('vl_ly_jp_s01')},
    {href:yahooURL('vl_ly_jp_s01')+'&email=secret'},
    {href:yahooURL('vl_ly_jp_s01'),referrer:'https://example.com/?secret=input'},
    {href:yahooURL('unknown')}]) {
    const h=harness({...params,qa:true});h.accept();h.click();assert.equal(h.funnelEvents.length,0);
  }
  const denied=harness({qa:true,choice:'denied',href:yahooURL('vl_ly_jp_s01')});denied.click();assert.equal(denied.funnelEvents.length,0);
  const h=harness({qa:true,href:yahooURL('vl_ly_jp_d01')});h.accept();h.decline();h.click();
  assert.equal(h.funnelEvents.length,1);
  assert.deepEqual(Object.keys(h.funnelEvents[0]).sort(),['campaign','event','scope','value']);
  assert.ok(!JSON.stringify(h.funnelEvents).match(/purchase|yclid|https|secret/));
});
test('public QA parameter exercises the local entry contract without any provider requests',()=>{
  const h=harness({href:yahooURL('vl_ly_jp_s01')+'&measurement_qa=1'});
  h.accept();h.click();
  assert.deepEqual(h.funnelEvents.map(e=>e.event),['landing_arrival','store_cta_click']);
  assert.equal(h.scripts.length,0);assert.equal(h.commands().length,0);assert.equal(h.yahoo().length,0);
});
