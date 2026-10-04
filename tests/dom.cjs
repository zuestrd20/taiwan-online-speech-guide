// Dependency-free DOM contract checks. Real-browser coverage is in ui.cjs.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),data=JSON.parse(fs.readFileSync(path.join(root,'data/content.json')));
const elements=new Map();
class Element {constructor(id){this.id=id;this.innerHTML='';this.textContent='';this.value='';this.hidden=false;this.open=false;this.listeners={};this.attrs={};this.checks=[];}setAttribute(k,v){this.attrs[k]=v;}addEventListener(k,fn){this.listeners[k]=fn;}querySelectorAll(sel){if(sel===':checked')return this.checks.filter(x=>x.checked);if(sel==='input')return this.checks;return [];}focus(){this.focused=true;}showModal(){this.open=true;}close(){this.open=false;}}
const get=id=>{if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id);};
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');for(const m of html.matchAll(/id="([^"]+)"/g))get(m[1]);
const events={};const context={window:{GUIDE_DATA:data,addEventListener:(k,v)=>events[k]=v},document:{getElementById:get},location:{hash:'',href:'https://example.test/#case/c01'},history:{back(){context.location.hash='';events.hashchange();},replaceState(a,b,hash){context.location.hash=hash;}},navigator:{clipboard:{writeText:async()=>{}}},console};
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/app.js'),'utf8'),context);
assert.equal((get('case-grid').innerHTML.match(/class="case-card"/g)||[]).length,8);
assert.equal((get('template-grid').innerHTML.match(/class="template-card"/g)||[]).length,3);
assert.ok(get('law-update').innerHTML.includes('2026-09-24'));
get('search').value='六個月';get('search').listeners.input();assert.ok(get('search-results').innerHTML.includes('class="search-result"'));
get('clear-search').listeners.click();assert.equal(get('search-results').innerHTML,'');
get('search').value='zzzznotfound';get('search').listeners.input();assert.ok(get('search-results').innerHTML.includes('0 筆'));
get('checklist').checks=[{checked:true},{checked:true},{checked:false}];get('checklist').listeners.change();assert.match(get('check-progress').textContent,/2 \/ 6/);get('reset-checklist').listeners.click();get('reset-checklist').listeners.click();assert.match(get('check-progress').textContent,/0 \/ 6/);
get('case-filters').listeners.click({target:{closest:()=>({dataset:{filter:'不成立／無罪'}})}});assert.equal((get('case-grid').innerHTML.match(/class="case-card"/g)||[]).length,4);
get('step-tabs').listeners.click({target:{closest:()=>({dataset:{step:'4'}})}});assert.ok(get('step-panel').innerHTML.includes('准許提起自訴'));
context.location.hash='#case/c01';events.hashchange();assert.equal(get('case-dialog').open,true);assert.ok(get('case-detail').innerHTML.includes('不能將侮辱部分'));assert.ok(get('case-detail').innerHTML.includes('案件類型：刑事'));get('case-dialog').listeners.cancel({preventDefault(){}});assert.equal(get('case-dialog').open,false);
context.location.hash='#case/c07';events.hashchange();assert.equal(get('case-dialog').open,true);context.location.hash='#cases';events.hashchange();assert.equal(get('case-dialog').open,false);
console.log('PASS: DOM contracts for rendering, search, zero results, repeated clear, counts, stepper, filters, detail labels, direct hash, Escape and Back-equivalent route. Real layout/keyboard behavior requires browser QA.');
