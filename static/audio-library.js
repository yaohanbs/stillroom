// Keep audio metadata on this device, outside the cloud workspace snapshot.
const audioLibraryKey=()=> (window.stillroomStorageKey?.()||'stillroom')+'-audio-library';
function readAudioLibrary(){try{const value=JSON.parse(localStorage.getItem(audioLibraryKey())||'null');if(value&&Array.isArray(value.tracks))return value}catch{}return {tracks:[],selected:null}}
let audioLibrary=readAudioLibrary();
function saveAudioLibrary(){localStorage.setItem(audioLibraryKey(),JSON.stringify(audioLibrary))}
function selectedTrack(){return audioLibrary.tracks.find(t=>t.id===audioLibrary.selected)}
const originalAudioFileGet=fileGet;
fileGet=id=>originalAudioFileGet(id==='ambient-track'?(selectedTrack()?.id||id):id);
const originalLibrarySoundView=soundView;
soundView=()=>originalLibrarySoundView().replace('Add my audio','＋ Add tracks').replace('id="audio-upload" accept="audio/*"','id="audio-upload" multiple accept="audio/*"').replace('</div><button class="play"',`${audioLibrary.tracks.length?`<label class="muted" for="saved-audio">Your saved tracks</label><select id="saved-audio" class="audio-select" aria-label="Your saved tracks">${audioLibrary.tracks.map(t=>`<option value="${esc(t.id)}" ${t.id===audioLibrary.selected?'selected':''}>${esc(t.name)}</option>`).join('')}</select><button class="text-button" data-audio-library="manage">Manage tracks (${audioLibrary.tracks.length})</button>`:''}<small class="muted" style="display:block">Saved on this browser and device. Adding a track keeps your other tracks.</small></div><button class="play"`).replace(esc(data.audioName||'Add a track you enjoy'),esc(selectedTrack()?.name||data.audioName||'Add a track you enjoy'));
function showAudioLibrary(){modal(`<h2>Your audio library</h2><p class="muted">Keep several recordings and choose one whenever you study. Up to 50 MB per track. These recordings stay on this device.</p>${audioLibrary.tracks.map(t=>`<div class="card-head" style="margin:16px 0;gap:12px"><span style="overflow-wrap:anywhere;flex:1">${esc(t.name)}</span><button class="btn" data-audio-select="${esc(t.id)}">${t.id===audioLibrary.selected?'Selected':'Select'}</button><button class="text-button" data-audio-remove="${esc(t.id)}">Remove</button></div>`).join('')||'<p>No saved tracks yet.</p>'}`)}
function chooseAudioTrack(id){if(!audioLibrary.tracks.some(t=>t.id===id))return;stopSound();audioLibrary.selected=id;saveAudioLibrary();data.audioName=selectedTrack().name;data.sound='My audio';save();render()}
document.addEventListener('change',async e=>{
  if(e.target.id==='saved-audio'){chooseAudioTrack(e.target.value);return}
  if(e.target.id!=='audio-upload')return;
  // Override the original single-slot upload handler, which replaced ambient-track.
  e.stopImmediatePropagation();const files=[...e.target.files];if(!files.length)return;
  let added=0;for(const file of files){
    if(file.size>50*1048576){toast(`${file.name}: maximum 50 MB per track.`);continue}
    if(!file.type.startsWith('audio/')&&!/\.(mp3|wav|ogg|m4a|aac|flac|webm|opus)$/i.test(file.name)){toast(`${file.name}: choose an audio file.`);continue}
    const id='audio-'+uid();
    try{await filePut(id,file);const previous=audioLibrary.selected;audioLibrary.tracks.push({id,name:file.name,size:file.size});audioLibrary.selected=id;
      try{saveAudioLibrary()}catch(error){audioLibrary.tracks=audioLibrary.tracks.filter(t=>t.id!==id);audioLibrary.selected=previous;await fileDelete(id);throw error}
      added++;
    }catch{toast('Could not store this track. Browser storage may be full. Your existing tracks are kept.')}
  }
  if(added){chooseAudioTrack(audioLibrary.selected);toast(`${added} track${added===1?'':'s'} saved. Choose one from Your saved tracks.`)}
},true);
document.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.audioLibrary==='manage')showAudioLibrary();
  if(b.dataset.audioSelect){chooseAudioTrack(b.dataset.audioSelect);showAudioLibrary()}
  if(b.dataset.audioRemove){const id=b.dataset.audioRemove,track=audioLibrary.tracks.find(t=>t.id===id);if(!track||!confirm(`Remove the saved copy of ${track.name}? Your original file is unchanged.`))return;
    try{await fileDelete(id);if(id===audioLibrary.selected)stopSound();audioLibrary.tracks=audioLibrary.tracks.filter(t=>t.id!==id);if(audioLibrary.selected===id)audioLibrary.selected=audioLibrary.tracks[0]?.id||null;saveAudioLibrary();data.audioName=selectedTrack()?.name||'';if(!audioLibrary.tracks.length)data.sound='Gentle keys';save();render();showAudioLibrary()}catch{toast('Could not remove the saved track. Try again.')}
  }
});
const originalClearAudioFiles=clearStoredFiles;
clearStoredFiles=async()=>{await originalClearAudioFiles();audioLibrary={tracks:[],selected:null};localStorage.removeItem(audioLibraryKey())};
async function migrateSavedAudio(){
  if(!audioLibrary.tracks.some(t=>t.id==='ambient-track')){
    try{const legacy=await originalAudioFileGet('ambient-track');if(legacy&&!audioLibrary.tracks.some(t=>t.id==='ambient-track')){audioLibrary.tracks.unshift({id:'ambient-track',name:data.audioName||'Previously saved track',size:legacy.size});audioLibrary.selected??='ambient-track';saveAudioLibrary()}}catch{toast('Audio storage is unavailable. Your study records are unaffected.')}
  }
  render();
}
render();migrateSavedAudio();

