presets.unshift(
 ['Obsidian Gold','#08090b','#141518','#e2bb63','#202023','dark'],
 ['Ember Orange','#090a0c','#151619','#ff9a45','#24201c','dark'],
 ['Arctic Cyan','#070c10','#101a21','#60d8ef','#192b35','dark'],
 ['Amethyst Night','#0c0911','#19131f','#c8a1ff','#2a2035','dark'],
 ['Emerald Ink','#070d0b','#111c18','#66deb1','#1b2d25','dark'],
 ['Rose Noir','#10090c','#211419','#f5a0bb','#34212a','dark']
);
function themePalette(config,mode,systemDark=false){
 const dark=mode==='dark'||mode==='system'&&systemDark;
 const c=validTheme(config)?{...config}:configFromPreset(dark?presets[0]:presets.find(p=>p[0]==='Matcha Study Room'));
 if(c.mode!==(dark?'dark':'light'))Object.assign(c,dark?{bg:'#08090b',panel:'#141518',soft:'#202023',mode:'dark'}:{bg:'#f7f8f4',panel:'#ffffff',soft:'#edf2e8',mode:'light'});
 return c;
}
function relativeLuminance(hex){const rgb=hex.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]}
function contrastInk(bg){return relativeLuminance(bg)>.179?'#17191c':'#f5f4ef'}
applyTheme=()=>{
 growthInit();
 // One-time upgrade applies the black-and-gold palette explicitly selected by the user.
 if(!data.themeFixVersion){data.theme='dark';data.themeConfig=configFromPreset(presets[0]);data.themeFixVersion=1;save()}
 const c=themePalette(data.themeConfig,data.theme,matchMedia('(prefers-color-scheme:dark)').matches),dark=c.mode==='dark';
 const vars={'--bg':c.bg,'--panel':c.panel,'--soft':c.soft,'--sage':c.accent,'--ink':contrastInk(c.bg),'--muted':dark?'#b5b5bc':'#58615a','--line':dark?'#35363c':'#dce1d7','--card-ink':contrastInk(c.panel),'--card-muted':contrastInk(c.panel),'--soft-ink':contrastInk(c.soft),'--button-ink':contrastInk(c.accent)};
 for(const [k,v]of Object.entries(vars)){document.documentElement.style.setProperty(k,v);document.body.style.setProperty(k,v)}
 document.body.classList.toggle('dark',dark);
 document.body.classList.toggle('density-compact',c.density==='compact');document.body.classList.toggle('font-book',c.font==='book');document.body.classList.toggle('ring-square',c.ring==='square');
 document.documentElement.style.colorScheme=c.mode;
 const mode=$('#pref-theme');if(mode)mode.value=data.theme;
 document.querySelectorAll('[data-preset]').forEach(button=>{const p=presets[Number(button.dataset.preset)];button.setAttribute('aria-pressed',String(p[1]===c.bg&&p[2]===c.panel&&p[3]===c.accent))});
};
const modeChanges=matchMedia('(prefers-color-scheme:dark)');modeChanges.addEventListener('change',()=>{if(data.theme==='system')render()});
render();
