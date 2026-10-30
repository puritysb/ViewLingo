const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source=fs.readFileSync('js/measurement.js','utf8');
function page({general='granted',landing,blocked=false,dnt=false,campaign='vl_ly_jp_s01',path='ja/',referrer='',qa=false,query='',expiry=Date.now()+10000,lang='ja'}={}) {
  const nodes=[],scripts=[],events=[],values={},listeners={};
  if(general)values.viewlingo_ad_measurement_v2=JSON.stringify({choice:general,expires:Date.now()+10000});
  if(landing)values.viewlingo_yahoo_landing_v1=JSON.stringify({choice:landing,expires:expiry});
  function node(tag){return{tag,children:[],appendChild(n){this.children.push(n);return n;},setAttribute(){},addEventListener(k,f){this[k]=f;},querySelector(){return this.children.flatMap(n=>n.children||[]).find(n=>n.tag==='button');},focus(){},scrollIntoView(){}};}
  const document={documentElement:{lang},title:'ViewLingo',readyState:'complete',referrer,cookie:'',getElementById:()=>null,createElement:node,querySelector:()=>null,addEventListener:(k,f)=>listeners[k]=f,dispatchEvent:e=>events.push(e),head:{appendChild:n=>scripts.push(n)},body:{appendChild:n=>nodes.push(n)}};
  const location={href:`https://puritysb.github.io/ViewLingo/${path}?campaign=${campaign}${query}${qa?'&measurement_qa=1':''}`,hostname:'puritysb.github.io',reload(){this.reloaded=true;},assign(){}};
  const context={document,location,navigator:{globalPrivacyControl:blocked,doNotTrack:dnt?'1':'0'},window:{location},URL,Date,CustomEvent:function(type,{detail}){this.type=type;this.detail=detail;},localStorage:{getItem:k=>values[k]||null,setItem:(k,v)=>values[k]=v},setTimeout(){}};
  vm.runInNewContext(fs.readFileSync('js/common.js','utf8'),{...context,document:{readyState:'complete',currentScript:{hasAttribute:()=>true},querySelectorAll:()=>[]}});
  vm.runInNewContext(source,context);
  const click=()=>listeners.click({target:{closest:()=>({href:'https://apps.apple.com/jp/app/id6749508592'})},button:0,preventDefault(){}});
  return{nodes,scripts,events,values,context,click,allow:()=>nodes[0].children[2].children[0].click(),deny:()=>nodes[0].children[2].children[1].click(),allowLanding:()=>nodes[1].children[2].children[0].click(),denyLanding:()=>nodes[1].children[2].children[1].click(),settings:()=>nodes[2].click(),tags:()=>Array.from(context.window.yjDataLayer||[],a=>a[0])};
}
const landingLabels=['7ZqyCOKHhq8dELel-PZE','P2MNJGRW9YB00BZUKQ1388965'];
const landingTags=h=>h.tags().filter(t=>landingLabels.includes(t.config?.yahoo_conversion_label||t.config?.yahoo_ydn_conv_label));
test('old permission does not expand to landing; a landing refusal preserves Store permission',()=>{
  const h=page();assert.equal(h.nodes[1].hidden,false);assert.equal(landingTags(h).length,0);
  h.denyLanding();h.click();assert.equal(h.tags().length,2);assert.equal(landingTags(h).length,0);
  assert.equal(JSON.parse(h.values.viewlingo_ad_measurement_v2).choice,'granted');
  assert.equal(JSON.parse(h.values.viewlingo_yahoo_landing_v1).choice,'denied');
});
test('separate explicit landing grant selects real zero-value label once; Store remains distinct',()=>{
  for(const [campaign,label] of [['vl_ly_jp_s01',landingLabels[0]],['vl_ly_jp_d01',landingLabels[1]],['vl_ly_jp_macfan_display_20261030',landingLabels[1]]]) {
    const h=page({general:null,campaign});h.allowLanding();assert.equal(h.tags().length,0);
    h.allow();h.allowLanding();h.allowLanding();h.click();
    assert.equal(landingTags(h).length,1);assert.ok(Object.values(landingTags(h)[0].config).includes(label));
    assert.equal(h.tags().length,3);
    assert.ok(h.tags().filter(t=>t.type!=='ycl_cookie').every(t=>Object.entries(t.config).some(([k,v])=>/value$/.test(k)&&v==='0')));
  }
});
test('global refusal, GPC/DNT and saved or expired purpose choices are respected',()=>{
  for(const opts of [{general:'denied',landing:'granted'},{landing:'denied'},{landing:'granted',blocked:true},{landing:'granted',dnt:true},{landing:'granted',expiry:Date.now()-1}]) {
    const h=page(opts);h.click();assert.equal(landingTags(h).length,0);
  }
  const h=page({landing:'granted',dnt:true});h.allow();h.allowLanding();assert.equal(h.scripts.length,0);
});
test('eligible saved grants cover all locales; internal pages and unsafe contexts do not create arrivals',()=>{
  for(const path of ['', 'ja/', 'ko/index.html', 'zh-hans/', 'zh-hant/index.html']) {
    const h=page({landing:'granted',path});assert.equal(landingTags(h).length,1);
  }
  for(const opts of [{path:'ja/faq.html'},{referrer:'https://puritysb.github.io/ViewLingo/ja/privacy.html?campaign=vl_ly_jp_s01'},{query:'&email=secret'},{referrer:'https://example.com/?secret=private'},{campaign:'unknown'}]) {
    const h=page({...opts,landing:'granted'});assert.equal(landingTags(h).length,0);
  }
});
test('landing withdrawal removes queued landing only; full refusal removes all queued events',()=>{
  const h=page({landing:'granted',campaign:'vl_ly_jp_d01'});h.click();assert.equal(h.tags().length,3);
  h.settings();h.denyLanding();assert.equal(landingTags(h).length,0);assert.equal(h.tags().length,2);
  assert.equal(JSON.parse(h.values.viewlingo_ad_measurement_v2).choice,'granted');
  h.deny();assert.equal(h.tags().length,0);assert.equal(h.context.location.reloaded,true);
});
test('QA queues no external command even after both grants and both event types',()=>{
  for(const lang of ['en','ko','ja','zh-Hans','zh-Hant']) {
    const h=page({general:null,qa:true,lang});h.allow();h.allowLanding();h.click();
    assert.equal(h.scripts.length,0);assert.equal(h.tags().length,0);assert.equal(h.context.window.dataLayer,undefined);
    assert.deepEqual(h.events.filter(e=>e.type==='viewlingo:measurement-qa'&&e.detail.provider==='yahoo').map(e=>e.detail.event),['landing','store']);
    assert.ok(!JSON.stringify(h.events).includes('secret'));
  }
});
