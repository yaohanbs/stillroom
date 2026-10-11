const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
function harness(){
 const store=new Map(),elements=new Map(),calls=[],responses=[];
 const context={console,JSON,Number,Error,STILLROOM_CLOUD:{url:'https://test.supabase.co',key:'sb_publishable_test',redirect:'https://example.com/'},
  data:{notes:[{id:'n',text:'private'}],sessions:[],files:[{id:'private-file'}],audioName:'local.mp3',timer:{id:'active'}},
  localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},sessionStorage:{getItem:()=>null},
  document:{addEventListener(){},documentElement:{classList:{remove(){}}}},
  setTimeout:()=>1,clearTimeout(){},setInterval(){},confirm:()=>true,location:{reload(){calls.push('reload')}},
  $:selector=>selector==='#content'?{insertAdjacentHTML(){}}:selector==='#account-bar-anchor'?{}:null,
  settingsView:()=>'',save(){calls.push('local-save')},render(){},fresh:()=>({notes:[],sessions:[],files:[]}),growthInit(){},refineDefaults(){},localSave(){},esc:String,modal(){},toast(){},stopSound(){}};
 context.window=context;context.addEventListener=()=>{};
 vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/static/cloud-boot.js','utf8').replace("document.documentElement.classList.add('auth-loading')",'void 0'),context);
 vm.runInContext(fs.readFileSync(__dirname+'/static/cloud.js','utf8').replace('render();cloudStart();',''),context);
 const run=s=>vm.runInContext(s,context);
 context.client={rpc:async(name,args)=>{calls.push({name,args});return responses.shift()||{data:1,error:null}}};
 run("cloudState.client=client;cloudState.user={id:'alice',email:'a@example.com'};stillroomScope='alice';cloudState.ready=true;");
 return {context,store,calls,responses,run};
}
(async()=>{
 const h=harness();
 assert.equal(h.run('stillroomStorageKey()'),'stillroom-user-alice');
 const payload=JSON.parse(h.run('JSON.stringify(cloudPayload())'));
 assert(!('timer'in payload));assert(!('files'in payload));assert(!('audioName'in payload));assert.equal(payload.notes[0].text,'private');
 h.run('save()');assert.equal(JSON.parse(h.store.get('stillroom-user-alice-sync')).dirty,true);
 await h.run('cloudSync()');assert.equal(h.calls[1].args.expected_revision,0);assert.equal(h.run('cloudMeta().revision'),1);assert.equal(h.run('cloudMeta().dirty'),false);
 h.run('save()');h.responses.push({error:{code:'40001'}});await h.run('cloudSync()');assert.equal(h.run('cloudState.conflict'),true);assert.equal(h.run('cloudMeta().dirty'),true);
 const count=h.calls.length;await h.run('cloudSync()');assert.equal(h.calls.length,count,'conflicts must stop writes');
 h.run('cloudState.conflict=false');h.responses.push({error:{message:'Offline'}});await h.run('cloudSync()');assert.equal(h.run('cloudMeta().dirty'),true);assert.match(h.run('cloudState.status'),/saved on this device/);
 h.run("stillroomScope='bob'");assert.equal(h.run('cloudMeta().dirty'),false);assert(!h.store.has('stillroom-user-bob'));
 h.run("stillroomScope='guest'");assert.equal(h.run('stillroomStorageKey()'),'stillroom');
 // Shared localStorage metadata must not advance this tab's baseline.
 h.run("stillroomScope='alice';cloudState.revision=1;setCloudMeta({revision:99,dirty:true})");
 h.responses.push({error:{code:'40001'}});const before=h.calls.length;await h.run('cloudSync()');assert.equal(h.calls[before].args.expected_revision,1);h.run('cloudState.conflict=false');
 // A newer local edit during an in-flight request must remain dirty.
 h.run("stillroomScope='alice';cloudState.conflict=false");
 h.context.client.rpc=async()=>{h.run("data.notes.push({id:'new',text:'edited while saving'})");return {data:2,error:null}};
 await h.run('cloudSync()');assert.equal(h.run('cloudMeta().revision'),2);assert.equal(h.run('cloudMeta().dirty'),true);
 console.log('PASS: account cache isolation, device-only attachments/timer, revision writes, conflict protection, offline retention and in-flight edits');
})().catch(error=>{console.error(error);process.exitCode=1});
