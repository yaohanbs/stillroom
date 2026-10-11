/* Account-scoped cache + versioned cloud workspace. Attachments stay on-device. */
const cloudState = {client:null,user:null,ready:false,busy:false,conflict:false,status:'Guest · saved on this device',timer:null,googleEnabled:false,revision:0};
const baseCloudSave=save, baseCloudRender=render, baseCloudSettings=settingsView;
settingsView=()=>baseCloudSettings().replace('Saved in this browser. Uploaded files remain private on this device.',cloudState.user?'Study records sync to your account. Uploaded files and audio remain on this device.':'Guest workspace: saved in this browser. Sign in above to sync study records.');
const cloudMetaKey=()=>stillroomStorageKey()+'-sync';
function cloudMeta(){try{return JSON.parse(localStorage.getItem(cloudMetaKey())||'null')||{revision:0,dirty:false}}catch{return {revision:0,dirty:false}}}
function setCloudMeta(value){localStorage.setItem(cloudMetaKey(),JSON.stringify(value))}
function cloudPayload(workspace=data){const copy=JSON.parse(JSON.stringify(workspace));for(const key of ['timer','files','audioName'])delete copy[key];return copy}
function cloudApply(workspace){const device={timer:data.timer,files:data.files||[],audioName:data.audioName};data={...fresh(),...workspace,...device};growthInit();refineDefaults();localSave();render()}
function cloudStatus(message){cloudState.status=message;const bar=$('#account-status');if(bar)bar.textContent=message;const state=$('#save-state');if(state)state.textContent=message}
function cloudBar(){return `<section class="account-bar"><button class="btn" data-account="open">${cloudState.user?'Account':'Sign in / Sign up'}</button><small id="account-status">${esc(cloudState.status)}</small>${cloudState.user?'<button class="text-button" data-account="sync">Sync now</button>':''}</section>`}
render=()=>{baseCloudRender();if(!$('#account-bar-anchor'))$('#content').insertAdjacentHTML('afterbegin',`<div id="account-bar-anchor">${cloudBar()}</div>`);cloudStatus(cloudState.status)};
save=()=>{
  baseCloudSave();
  if(cloudState.user){const meta=cloudMeta();if(cloudState.ready)meta.revision=cloudState.revision;meta.dirty=true;setCloudMeta(meta);cloudStatus('Saved on this device · waiting to sync');clearTimeout(cloudState.timer);cloudState.timer=setTimeout(cloudSync,900)}
};
async function cloudRead(){const {data:row,error}=await cloudState.client.from('study_workspaces').select('workspace,revision').eq('user_id',cloudState.user.id).maybeSingle();if(error)throw error;return row}
function cloudFailure(error){
  const missing=['PGRST205','PGRST202','42P01','42883','42501'].includes(error?.code);
  cloudStatus(missing?'Cloud setup incomplete · saved on this device':'Cloud unavailable · saved on this device');
  return missing?'The database setup is not complete. Run supabase-setup.sql in your Supabase SQL Editor, then choose Sync now.':error?.message||'Could not connect. Your changes are saved on this device.';
}
async function cloudLoad(){
  try{const row=await cloudRead(),meta=cloudMeta();
    if(meta.dirty){if(Number(row?.revision||0)!==Number(meta.revision)){cloudState.conflict=true;cloudStatus('Sync paused · choose which copy to keep');return}}
    else {setCloudMeta({revision:Number(row?.revision||0),dirty:!row});if(row)cloudApply(row.workspace)}
    cloudState.revision=Number(row?.revision||0);cloudState.ready=true;await cloudSync();
  }catch(error){cloudFailure(error)}
}
async function cloudSync(){
  if(!cloudState.user||cloudState.busy||cloudState.conflict)return;
  if(!cloudState.ready){await cloudLoad();return}
  const meta=cloudMeta();if(!meta.dirty){cloudStatus('Saved to your account');return}
  const payload=cloudPayload(),serialized=JSON.stringify(payload),scope=stillroomScope;
  cloudState.busy=true;cloudStatus('Saving to your account…');
  try{
    const {data:revision,error}=await cloudState.client.rpc('save_study_workspace',{payload,expected_revision:cloudState.revision});
    if(scope!==stillroomScope)return;
    if(error)throw error;
    const changed=JSON.stringify(cloudPayload())!==serialized;
    cloudState.revision=Number(revision);setCloudMeta({revision:cloudState.revision,dirty:changed});cloudStatus(changed?'Saved on this device · waiting to sync':'Saved to your account');
    if(changed){clearTimeout(cloudState.timer);cloudState.timer=setTimeout(cloudSync,500)}
  }catch(error){if(error?.code==='40001'){cloudState.conflict=true;cloudStatus('Sync paused · choose which copy to keep')}else cloudFailure(error)}
  finally{cloudState.busy=false}
}
function accountMessage(message){const el=$('#auth-message');if(el)el.textContent=message}
function accountDialog(){
  if(cloudState.user){
    modal(`<h2>Your account</h2><p>${esc(cloudState.user.email||'Google account')}</p><p>${esc(cloudState.status)}</p><p class="muted">Completed sessions, streaks, tasks, calendar, notes and preferences sync. Uploaded files, your audio and an active timer stay on this device.</p><div class="actions"><button class="btn" data-account="sync">Sync now</button><button class="btn" data-account="import">Copy guest progress into this account</button><button class="btn" data-account="signout">Sign out</button></div>${cloudState.conflict?'<h3>Two copies need your attention</h3><p>Export a backup in Settings before replacing either copy. Your local changes are still saved.</p><div class="actions"><button class="btn" data-account="remote">Use cloud copy</button><button class="btn" data-account="local">Replace cloud with this device’s copy</button></div>':''}<p id="auth-message" role="status" class="auth-error"></p>`);return;
  }
  modal(`<h2>A space that follows you.</h2><p class="muted">Sign in to save your study progress across devices, or keep using your guest space.</p><button class="btn" data-account="google" ${cloudState.googleEnabled?'':'disabled'}>${cloudState.googleEnabled?'Continue with Google':'Google sign-in · setup pending'}</button><form id="auth-form" class="auth-form"><label>Email<input name="email" type="email" autocomplete="email" required maxlength="254"></label><label>Password<input name="password" type="password" autocomplete="current-password" minlength="12" required placeholder="At least 12 characters"></label><div class="actions"><button class="primary" name="intent" value="signin">Sign in</button><button class="btn" name="intent" value="signup">Create account</button></div></form><button class="text-button" data-account="reset">Forgot password?</button><p id="auth-message" role="status" class="auth-error"></p>`);
  $('#auth-form').onsubmit=async e=>{
    e.preventDefault();const form=e.currentTarget,email=form.elements.email.value.trim(),password=form.elements.password.value,intent=e.submitter?.value||'signin';
    const buttons=[...form.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);accountMessage('Please wait…');
    try{if(!cloudState.client)throw Error('Sign-in could not load. Check your connection and refresh.');
      const result=intent==='signup'?await cloudState.client.auth.signUp({email,password,options:{emailRedirectTo:STILLROOM_CLOUD.redirect}}):await cloudState.client.auth.signInWithPassword({email,password});
      if(result.error)throw result.error;
      if(intent==='signup'&&!result.data.session)accountMessage('Check your inbox for a confirmation link, then return here to sign in. If you already have an account, sign in instead.');
    }catch(error){accountMessage(error.message)}finally{buttons.forEach(b=>b.disabled=false)}
  };
}
async function switchAccount(user){
  const target=user?.id||'guest';
  if(target!==stillroomScope){
    clearTimeout(cloudState.timer);stopSound();localSave();
    stillroomScope=target;if(user)localStorage.setItem('stillroom-account',target);else localStorage.removeItem('stillroom-account');
    // Reload resets note editors, cached audio and file handles for account isolation.
    location.reload();return;
  }
  cloudState.user=user;cloudState.ready=false;cloudState.conflict=false;
  if(user)await cloudLoad();else cloudStatus('Guest · saved on this device');
  document.documentElement.classList.remove('auth-loading');render();
}
document.addEventListener('click',async e=>{
  const action=e.target.closest('[data-account]')?.dataset.account;
  if(!action)return;
  if(action==='open'){accountDialog();return}
  try{
    if(!cloudState.client)throw Error('Sign-in could not load. Check your connection and refresh.');
    if(action==='google'){const {error}=await cloudState.client.auth.signInWithOAuth({provider:'google',options:{redirectTo:STILLROOM_CLOUD.redirect}});if(error)throw error}
    if(action==='sync'){if(cloudState.user&&!cloudMeta().dirty&&!cloudState.busy&&!cloudState.conflict)await cloudLoad();else await cloudSync();if(cloudState.conflict)accountDialog();else accountMessage(cloudState.status)}
    if(action==='signout'){
      if(data.timer)throw Error('End your active focus session before signing out.');
      await cloudSync();if(cloudMeta().dirty&&!confirm('Some changes have not synced. They remain cached for this account on this device. Sign out anyway?'))return;
      const {error}=await cloudState.client.auth.signOut({scope:'local'});if(error)throw error;await switchAccount(null);
    }
    if(action==='import'){
      if(data.timer)throw Error('End your active session before importing.');
      const guest=JSON.parse(localStorage.getItem('stillroom')||'null');if(!guest)throw Error('There is no guest workspace on this browser.');
      if(!confirm('Replace this account’s notes, tasks, sessions and preferences with this browser’s guest workspace? Export your account first if needed. Guest files and audio will stay in the guest space.'))return;
      cloudApply(cloudPayload(guest));save();await cloudSync();accountDialog();
    }
    if(action==='remote'||action==='local'){
      if(data.timer)throw Error('End your active session before resolving a sync conflict.');
      if(!confirm(action==='remote'?'Replace this device’s study records with the cloud copy?':'Replace the cloud study records with this device’s copy?'))return;
      const row=await cloudRead();if(action==='remote')cloudApply(row?.workspace||fresh());
      setCloudMeta({revision:Number(row?.revision||0),dirty:action==='local'});cloudState.conflict=false;cloudState.revision=Number(row?.revision||0);cloudState.ready=true;await cloudSync();accountDialog();
    }
    if(action==='reset'){
      const email=$('#auth-form')?.elements.email.value.trim();if(!email)throw Error('Enter your email above first.');
      const {error}=await cloudState.client.auth.resetPasswordForEmail(email,{redirectTo:STILLROOM_CLOUD.redirect});if(error)throw error;accountMessage('If an account exists, check your email for a password reset link.');
    }
  }catch(error){accountMessage(error.message);toast(error.message)}
});
// The existing local-delete control must save the cleared workspace to the account too.
document.addEventListener('click',e=>{
  if(!cloudState.user||!e.target.closest('[data-action="delete"]'))return;
  e.stopImmediatePropagation();
  if(!confirm('Clear this account’s study workspace and this account’s files on this device? This does not delete your sign-in account. Export a backup first.'))return;
  (async()=>{try{clearTimeout(saveDelay);await clearStoredFiles();data=fresh();growthInit();refineDefaults();stopSound();save();render();await cloudSync();toast(cloudState.status)}catch(error){toast(error.message)}})();
},true);
window.addEventListener('online',()=>{if(cloudState.user)cloudSync()});
window.addEventListener('storage',e=>{if(e.key==='stillroom-account'&&e.newValue!==(stillroomScope==='guest'?null:stillroomScope))location.reload();else if(cloudState.user&&e.key===stillroomStorageKey()){cloudState.conflict=true;cloudStatus('Sync paused · workspace changed in another tab')}});
setInterval(()=>{if(cloudState.user&&cloudMeta().dirty)cloudSync()},30000);
async function cloudStart(){
  try{
    if(!window.supabase?.createClient)throw Error('The sign-in library could not load. Refresh when you are online.');
    cloudState.client=window.supabase.createClient(STILLROOM_CLOUD.url,STILLROOM_CLOUD.key);
    try{const response=await fetch(STILLROOM_CLOUD.url+'/auth/v1/settings',{headers:{apikey:STILLROOM_CLOUD.key}});if(response.ok)cloudState.googleEnabled=!!(await response.json()).external?.google}catch{}
    let recovery=sessionStorage.getItem('stillroom-recovery')==='1';
    cloudState.client.auth.onAuthStateChange((event,session)=>{
      if(event==='PASSWORD_RECOVERY'){recovery=true;sessionStorage.setItem('stillroom-recovery','1')}
      // Run outside the auth callback lock; never await client methods in it.
      if(['SIGNED_IN','SIGNED_OUT','PASSWORD_RECOVERY'].includes(event))setTimeout(async()=>{
        if((session?.user?.id||'guest')!==stillroomScope){await switchAccount(session?.user||null);return}
        if(!cloudState.user&&session?.user)await switchAccount(session.user);
        if(recovery){recovery=false;sessionStorage.removeItem('stillroom-recovery');passwordDialog()}
      },0);
    });
    const {data:sessionData,error}=await cloudState.client.auth.getSession();if(error)throw error;
    await switchAccount(sessionData.session?.user||null);
    if(recovery&&cloudState.user){recovery=false;sessionStorage.removeItem('stillroom-recovery');passwordDialog()}
  }catch(error){if(stillroomScope!=='guest')cloudState.user={id:stillroomScope};cloudStatus('Sign-in unavailable · device cache only');document.documentElement.classList.remove('auth-loading');render()}
}
function passwordDialog(){modal('<h2>Choose a new password</h2><form id="password-form" class="auth-form"><label>New password<input type="password" minlength="12" required autocomplete="new-password"></label><button class="primary">Update password</button></form><p id="auth-message" role="status"></p>');$('#password-form').onsubmit=async e=>{e.preventDefault();const button=e.currentTarget.querySelector('button');button.disabled=true;const {error}=await cloudState.client.auth.updateUser({password:e.currentTarget.querySelector('input').value});button.disabled=false;if(error)accountMessage(error.message);else{closeModal();toast('Password updated.')}}}
render();cloudStart();
