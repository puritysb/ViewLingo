const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const root='https://puritysb.github.io/ViewLingo/';
// Offline fixture only. Not an issued property and never used by deployed HTML.
const fixtureID='G-OFFLINEONLY';
function harness({ads,analytics,blocked=false,dnt=false,qa=false,href=root+'ko/?utm_source=meta&utm_medium=paid_social&utm_campaign=vl_meta_kr_awareness_20261104&utm_content=screen_translation_a&email=private',referrer='',id=fixtureID,values={}}={}) {
  const nodes=[],scripts=[],events=[],listeners={};
  function node(tag){return {tag,children:[],hidden:false,setAttribute(){},getAttribute(){return id;},appendChild(n){this.children.push(n);return n;},addEventListener(k,f){this[k]=f;},querySelector(){return this.children.flatMap(x=>x.children||[]).find(x=>x.tag==='button');},focus(){},scrollIntoView(){}};}
  for(const [key,value] of [['viewlingo_ad_measurement_v2',ads],['viewlingo_analytics_v1',analytics]]) if(value) values[key]=JSON.stringify({choice:value,expires:Date.now()+10000});
  const doc={currentScript:{hasAttribute:()=>true,getAttribute:()=>id},referrer,readyState:'complete',cookie:'',title:'ViewLingo',documentElement:{lang:'ko'},getElementById:()=>null,createElement:node,querySelectorAll:()=>[],querySelector:()=>null,head:{appendChild:n=>scripts.push(n)},body:{appendChild:n=>nodes.push(n)},addEventListener(k,f){(listeners[k]??=[]).push(f);},dispatchEvent:e=>events.push(e)};
  const location={href,hostname:qa?'localhost':'puritysb.github.io',reload(){location.reloaded=true;},assign(){}};
  const context={URL,Date,document:doc,location,window:{location},navigator:{globalPrivacyControl:blocked,doNotTrack:dnt?'1':'0'},localStorage:{getItem:k=>values[k]??null,setItem:(k,v)=>values[k]=v},CustomEvent:function(type,v){this.type=type;this.detail=v.detail;},setTimeout(){}};
  for(const name of ['common','measurement','analytics']) vm.runInNewContext(fs.readFileSync(`js/${name}.js`,'utf8'),context);
  function click(slot){const link={href:'https://apps.apple.com/app/id6749508592',closest:selector=>selector===slot?{}:null};const e={target:{closest:()=>link},button:0,preventDefault(){this.defaultPrevented=true;}};for(const fn of listeners.click||[])fn(e);}
  return {context,doc,location,values,nodes,scripts,events,click,buttons:i=>nodes[i].children[2].children,commands:()=>Array.from(context.window.dataLayer||[],x=>Array.from(x))};
}
const isGA=x=>(x[0]==='config'&&x[1]===fixtureID)||(x[0]==='event'&&x[2]?.send_to===fixtureID);
test('four independent consent combinations load only authorized destinations on one queue',()=>{
  for(const ads of ['granted','denied']) for(const analytics of ['granted','denied']) {
    const h=harness({ads,analytics});h.click();h.click();const c=h.commands();
    assert.equal(h.scripts.length,ads==='granted'||analytics==='granted'?1:0);
    assert.equal(c.filter(x=>x[0]==='config'&&x[1].startsWith('AW-')).length,ads==='granted'?1:0);
    assert.equal(c.filter(x=>x[0]==='config'&&x[1]===fixtureID).length,analytics==='granted'?1:0);
    assert.equal(c.filter(x=>x[0]==='event'&&x[2]?.send_to===fixtureID).length,analytics==='granted'?2:0);
    const consent=c.filter(x=>x[0]==='consent'&&x[1]==='update').at(-1);
    if(consent) {assert.equal(consent[2].ad_storage,ads);assert.equal(consent[2].analytics_storage,analytics);assert.equal(consent[2].ad_personalization,'denied');}
    assert.equal(h.context.window.yjDataLayer,undefined);
  }
});
test('old Ads permission, missing or expired Analytics consent never activates Analytics',()=>{
  for(const values of [{},{viewlingo_analytics_v1:JSON.stringify({choice:'granted',expires:1})}]) {
    const h=harness({ads:'granted',values});h.click();assert.equal(h.commands().filter(isGA).length,0);
    assert.equal(h.commands().find(x=>x[0]==='consent'&&x[1]==='update')[2].analytics_storage,'denied');
  }
});
test('GPC, DNT and QA never append a provider loader or queue an Analytics request',()=>{
  for(const opts of [{blocked:true},{dnt:true},{qa:true}]) {
    const h=harness({ads:'granted',analytics:'granted',...opts});h.click();
    assert.equal(h.scripts.length,0);assert.equal(h.commands().length,0);
    assert.equal(h.events.filter(e=>e.type==='viewlingo:analytics-qa').length,opts.qa?2:0);
  }
});
test('granting purposes in either order preserves independent consent and one loader',()=>{
  for(const order of [[0,3],[3,0]]){
    const h=harness();for(const n of order)h.buttons(n)[0].click();h.click();
    assert.equal(h.scripts.length,1);
    const update=h.commands().filter(x=>x[0]==='consent'&&x[1]==='update').at(-1)[2];
    assert.equal(update.ad_storage,'granted');assert.equal(update.analytics_storage,'granted');
    assert.equal(h.commands().filter(x=>x[0]==='event'&&x[2]?.send_to===fixtureID).length,2);
  }
});
test('Analytics withdrawal removes its queued events, disables its tag and preserves Ads choice',()=>{
  const h=harness({ads:'granted',analytics:'granted'});h.click();h.buttons(3)[1].click();
  assert.equal(h.location.reloaded,true);assert.equal(h.context.window['ga-disable-'+fixtureID],true);
  assert.equal(h.commands().filter(isGA).length,0);h.click();assert.equal(h.commands().filter(isGA).length,0);
  assert.equal(JSON.parse(h.values.viewlingo_ad_measurement_v2).choice,'granted');
  const after=harness({values:h.values});assert.equal(after.commands().filter(isGA).length,0);assert.equal(after.scripts.length,1);
});
test('Ads withdrawal preserves Analytics choice and reload enables only Analytics',()=>{
  const h=harness({ads:'granted',analytics:'granted'});h.buttons(0)[1].click();assert.equal(h.location.reloaded,true);
  assert.equal(JSON.parse(h.values.viewlingo_analytics_v1).choice,'granted');
  const after=harness({values:h.values});after.click();assert.equal(after.commands().filter(x=>x[0]==='event'&&x[1]==='conversion').length,0);
  assert.equal(after.commands().filter(x=>x[0]==='event'&&x[2]?.send_to===fixtureID).length,2);
  assert.equal(after.commands().filter(x=>x[0]==='consent'&&x[1]==='update').at(-1)[2].ad_storage,'denied');
});
test('registered public campaigns populate standard campaign fields and event-scoped reports without raw URLs',()=>{
  for(const [campaign,source,medium] of [['vl_meta_kr_awareness_20261104','meta','paid_social'],['vl_kakao_kr_pc_cpm_20261105','kakao','display'],['vl_google_tw_s01','google','cpc'],['vl_google_tw_d01','google','display'],['vl_ly_jp_s01','yahoo','cpc'],['vl_ly_jp_d01','yahoo','display']]){
    const h=harness({analytics:'granted',href:root+'zh-hant/?campaign='+campaign+'&email=private&fbclid=private#gclid=private'});h.click();
    const config=h.commands().find(x=>x[0]==='config'&&x[1]===fixtureID)[2];
    assert.equal(config.campaign_source,source);assert.equal(config.campaign_medium,medium);assert.equal(config.campaign_name,campaign);
    assert.equal(config.send_page_view,false);assert.equal(config.allow_google_signals,false);assert.equal(config.allow_ad_personalization_signals,false);
    assert.equal(config.cookie_expires,60*24*60*60);assert.equal(config.cookie_update,false);
    const events=h.commands().filter(x=>x[0]==='event');assert.deepEqual(events.map(x=>x[1]),['landing_arrival','store_cta_click']);
    for(const e of events){assert.equal(e[2].value,0);assert.equal(e[2].vl_campaign,campaign);assert.equal(e[2].page_location,root+'zh-hant/');assert.equal(e[2].page_referrer,'');}
    assert.ok(!JSON.stringify(h.commands()).includes('private'));
  }
});
test('internal navigation, FAQ and duplicate Store CTAs do not fabricate entry counts or purchases',()=>{
  for(const opts of [{referrer:root+'ko/privacy.html'},{href:root+'ko/faq.html?campaign=vl_google_tw_s01',referrer:root+'ko/'}]){
    const h=harness({analytics:'granted',...opts});h.click();h.click();
    assert.deepEqual(h.commands().filter(x=>x[0]==='event').map(x=>x[1]),['store_cta_click']);
  }
});
test('unverified stream ID fails closed and unknown campaign data becomes fixed unattributed metadata',()=>{
  const h=harness({analytics:'granted',id:''});h.click();assert.equal(h.scripts.length,0);assert.equal(h.commands().length,0);
  const bad=harness({analytics:'granted',href:root+'?campaign=unknown&email=private'});
  const config=bad.commands().find(x=>x[0]==='config')[2];assert.equal(config.campaign_name,'web');assert.equal(config.campaign_source,'unattributed');
  assert.ok(!JSON.stringify(bad.commands()).includes('private'));
});

test('page paths normalize directory/index variants and discard arbitrary URL metadata',()=>{
  for(const path of ['ko/','ja/','zh-hant/','zh-hans/','']) for(const suffix of ['','index.html']) {
    const h=harness({analytics:'granted',href:root+path+suffix+'?campaign=vl_google_tw_s01&gclid=secret&email=secret#secret'});h.click();
    const c=h.commands().find(x=>x[0]==='config')[2];assert.equal(c.page_location,root+path);
    for(const e of h.commands().filter(x=>x[0]==='event'))assert.equal(e[2].vl_page_path,'/ViewLingo/'+path);
    assert.ok(!JSON.stringify(h.commands()).includes('secret'));
  }
});
test('CTA position uses a fixed layout bucket, separate from entry and current page path',()=>{
  for(const [selector,slot] of [['header','navigation'],['footer','footer'],['.hero','hero'],['.purchase-fit','proof'],['.purchase-section','purchase'],['#private-input','body']]) {
    const h=harness({analytics:'granted',href:root+'ko/index.html?campaign=vl_google_tw_s01'});h.click(selector);h.click('.purchase-fit');
    const events=h.commands().filter(x=>x[0]==='event');
    assert.equal(events[0][2].vl_cta_location,'none');assert.equal(events[1][2].vl_cta_location,slot);
    assert.equal(events[1][2].vl_page_path,'/ViewLingo/ko/');assert.equal(events.length,2);
    assert.ok(!JSON.stringify(events).includes('private-input'));
  }
});
test('an internally reached CTA page retains source without falsely relabeling it as an entry page',()=>{
  const h=harness({analytics:'granted',href:root+'ja/faq.html?campaign=vl_google_tw_s01',referrer:root+'zh-hant/'});h.click();
  const events=h.commands().filter(x=>x[0]==='event');assert.equal(events.length,1);
  assert.equal(events[0][1],'store_cta_click');assert.equal(events[0][2].vl_page_path,'/ViewLingo/ja/faq.html');
  assert.equal(events[0][2].vl_campaign,'vl_google_tw_s01');assert.equal(events[0][2].vl_cta_location,'body');
});

test('external entries on allowlisted guides and FAQ have their own normalized arrival page',()=>{
  for(const path of ['guide.html','ko/faq.html','ja/privacy.html']) {
    const h=harness({analytics:'granted',href:root+path+'?campaign=vl_google_tw_s01',referrer:'https://example.com/'});h.click();
    const events=h.commands().filter(x=>x[0]==='event');assert.equal(events[0][1],'landing_arrival');assert.equal(events[0][2].vl_page_path,'/ViewLingo/'+path);
    assert.equal(events[1][1],'store_cta_click');
  }
});
test('every public page wires the verified stream after the shared consent bridge',()=>{
  const paths=['index.html','faq.html','privacy.html','guide.html','featuring.html','translate-japanese-games-on-mac.html'];
  for(const locale of ['ko','ja','zh-hans','zh-hant']) for(const page of ['index','faq','privacy'])paths.push(`${locale}/${page}.html`);
  for(const file of paths){const html=fs.readFileSync(file,'utf8');
    assert.equal((html.match(/js\/analytics\.js\?v=2026110501/g)||[]).length,1,file);
    assert.ok(html.includes('data-measurement-id="G-HHSGB68SC4"'),file);
    assert.ok(html.indexOf('js/common.js?')<html.indexOf('js/measurement.js?'),file);
    assert.ok(html.indexOf('js/measurement.js?')<html.indexOf('js/analytics.js?'),file);
    assert.ok(!html.includes('G-OFFLINEONLY'),file);
  }
  for(const file of ['privacy.html','ko/privacy.html','ja/privacy.html','zh-hans/privacy.html','zh-hant/privacy.html']){
    const html=fs.readFileSync(file,'utf8');assert.ok(html.includes('id="website-analytics"'));assert.ok(html.includes('https://policies.google.com/technologies/partner-sites'));
  }
});
