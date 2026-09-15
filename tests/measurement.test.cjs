const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('js/measurement.js', 'utf8');
function harness({choice, qa=false, blocked=false}={}) {
  const listeners={}, nodes=[], scripts=[], events=[], timers=[], values={};
  if(choice) values.viewlingo_ad_measurement_v1=JSON.stringify({choice,expires:Date.now()+10000});
  function node(tag){return {tag,children:[],setAttribute(){},appendChild(n){this.children.push(n);return n;},addEventListener(k,f){this[k]=f;},querySelector(){return this.children.flatMap(x=>x.children||[]).find(x=>x.tag==='button');},focus(){}};}
  const document={documentElement:{lang:'en'},title:'ViewLingo',readyState:'complete',cookie:'',head:{appendChild:n=>scripts.push(n)},body:{appendChild:n=>nodes.push(n)},createElement:node,querySelector:()=>null,addEventListener:(k,f)=>listeners[k]=f,dispatchEvent:e=>events.push(e.detail)};
  const location={href:'https://puritysb.github.io/ViewLingo/?campaign=vl_dg_us_01&email=private',hostname:qa?'localhost':'puritysb.github.io',reload(){location.reloaded=true;},assign(url){location.destination=url;}};
  const context={document,location,navigator:{globalPrivacyControl:blocked},window:{},URL,Date,CustomEvent:function(type,arg){this.detail=arg.detail;},localStorage:{getItem:k=>values[k],setItem:(k,v)=>values[k]=v},setTimeout:f=>timers.push(f)};
  vm.runInNewContext(source,context);
  const buttons=nodes[0].children[2].children;
  return {context, scripts, events, nodes, timers, accept:()=>buttons[0].click(),decline:()=>buttons[1].click(),click(href='https://apps.apple.com/app/apple-store/id6749508592'){const e={target:{closest:()=>({href})},button:0,preventDefault(){this.defaultPrevented=true;}};listeners.click(e);return e;},commands:()=>Array.from(context.window.dataLayer||[],a=>Array.from(a))};
}
test('no tag or conversion before consent, including decline and store navigation',()=>{const h=harness();h.click();h.decline();assert.equal(h.scripts.length,0);assert.equal(h.commands().length,0);});
test('consent loads one tag and emits distinct zero-value visit and click events',()=>{const h=harness();h.accept();h.accept();h.click();assert.equal(h.scripts.length,1);const c=h.commands().filter(x=>x[0]==='event');assert.equal(c.length,2);assert.match(c[0][2].send_to,/IRJz/);assert.match(c[1][2].send_to,/ZHS8/);assert.ok(c.every(x=>x[2].value===0));const config=h.commands().find(x=>x[0]==='config')[2];assert.ok(!config.page_location.includes('email'));assert.equal(config.allow_ad_personalization_signals,false);assert.equal(h.context.location.destination,undefined);h.timers[0]();assert.match(h.context.location.destination,/apps.apple.com/);});
test('saved choice and withdrawal reload stop future events',()=>{const h=harness({choice:'granted'});assert.equal(h.scripts.length,1);h.decline();assert.equal(h.context.location.reloaded,true);const n=h.commands().length;h.click();assert.equal(h.commands().length,n);});
test('QA measures the interaction path without sending to Google',()=>{const h=harness({qa:true});h.accept();h.click();assert.equal(h.scripts.length,0);assert.deepEqual(h.events.map(x=>x.event),['visit','store']);});
test('browser privacy signal overrides even saved consent',()=>{const h=harness({blocked:true,choice:'granted'});h.accept();h.click();assert.equal(h.scripts.length,0);assert.equal(h.commands().length,0);});
