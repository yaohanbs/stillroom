(function(root){
  const milestones=[1,5,10,25,50,100,250,500,1000];
  const titles=['First Steps','Getting Started','Finding Your Focus','Consistency Builder','Dedicated Scholar','Master of Discipline','Elite Scholar','Focus Legend','Grandmaster'];
  const characters=[
    {id:'sprout',name:'Moss',kind:'sprout',color:'#88a477',price:0,rarity:'Your first companion',description:'A quiet little sprout. Growing at your pace.'},
    {id:'star',name:'Luma',kind:'star',color:'#d7b66c',price:30,rarity:'Uncommon',description:'A small star with a very big curiosity.'},
    {id:'cat',name:'Inkwell',kind:'cat',color:'#54516b',price:60,rarity:'Uncommon',description:'A midnight cat who always saves you a seat.'},
    {id:'apple',name:'Pip',kind:'apple',color:'#c58576',price:90,rarity:'Rare',description:'An apple a day. One good idea at a time.'},
    {id:'orb',name:'Orbit',kind:'orb',color:'#8f94bf',price:120,rarity:'Rare',description:'A tiny universe of possibilities.'}
  ];
  function eligible(sessions){const seen=new Set();return sessions.filter(s=>{if(!s.id||seen.has(s.id)||s.source==='manual'||s.abandoned||s.break||!Number.isFinite(s.minutes)||s.minutes<(s.source==='stopwatch'?1/60:1)||s.minutes>240||!/^\d{4}-\d{2}-\d{2}$/.test(s.date))return false;seen.add(s.id);return true})}
  function stats(sessions,day){const rows=eligible(sessions),minutes=rows.reduce((a,s)=>a+s.minutes,0),hours=minutes/60,level=milestones.filter(x=>hours>=x).length,next=milestones[level]??null;return {rows,minutes,hours,level,title:level?titles[level-1]:'Curious Beginner',next,today:rows.filter(s=>s.date===day).reduce((a,s)=>a+s.minutes,0),month:rows.filter(s=>s.date.slice(0,7)===day.slice(0,7)).reduce((a,s)=>a+s.minutes,0),flames:rows.reduce((a,s)=>a+Math.floor(s.minutes/5),0)+level*10}}
  function economy(data,day){const s=stats(data.sessions,day),purchases=[],owned=new Set(['sprout']);let spent=0;for(const id of data.purchases||[]){const item=characters.find(c=>c.id===id);if(item&&!owned.has(id)&&spent+item.price<=s.flames){owned.add(id);spent+=item.price;purchases.push(id)}}return {earned:s.flames,spent,balance:s.flames-spent,owned,purchases}}
  function evolution(hours){const thresholds=[0,1,10,50],stage=Math.max(0,thresholds.filter(t=>hours>=t).length-1);return {stage,name:['Seedling','Awakening','Scholar','Radiant'][stage],next:thresholds[stage+1]??null}}
  const api={milestones,titles,characters,eligible,stats,economy,evolution};root.StillroomGrowth=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
