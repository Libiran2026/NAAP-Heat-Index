(function(){
"use strict";
document.documentElement.classList.add("js");
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ================= SOUND (synthesised in the browser, no audio files) ================= */
const SND={ctx:null,on:true,nb:null};
function ac(){ if(!SND.ctx){ const A=window.AudioContext||window.webkitAudioContext; if(A){ SND.ctx=new A(); const n=SND.ctx.sampleRate*2,b=SND.ctx.createBuffer(1,n,SND.ctx.sampleRate),d=b.getChannelData(0); for(let i=0;i<n;i++) d[i]=Math.random()*2-1; SND.nb=b; } } return SND.ctx; }
function tone(f,t,d,v,f2,type){ const c=ac(); if(!c) return; const s=c.currentTime+t,o=c.createOscillator(),g=c.createGain(); o.type=type||"sine"; o.frequency.setValueAtTime(f,s); if(f2) o.frequency.exponentialRampToValueAtTime(f2,s+d); g.gain.setValueAtTime(.0001,s); g.gain.exponentialRampToValueAtTime(v,s+.015); g.gain.exponentialRampToValueAtTime(.0001,s+d); o.connect(g); g.connect(c.destination); o.start(s); o.stop(s+d+.05); }
function noise(t,d,v,f0,f1){ const c=ac(); if(!c) return; const s=c.currentTime+t,n=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(); n.buffer=SND.nb; n.loop=true; f.type="bandpass"; f.Q.value=1; f.frequency.setValueAtTime(f0,s); f.frequency.exponentialRampToValueAtTime(f1,s+d); g.gain.setValueAtTime(.0001,s); g.gain.exponentialRampToValueAtTime(v,s+d*.3); g.gain.exponentialRampToValueAtTime(.0001,s+d); n.connect(f); f.connect(g); g.connect(c.destination); n.start(s); n.stop(s+d+.05); }
const bell=(f,t,d,v)=>{ tone(f,t,d,v); tone(f*2.76,t,d*.4,v*.3); };
const P=[523,587,659,784,880,1047,1175];
const SFX={
  click(){ tone(520,0,.09,.07,780); }, pop(){ tone(380,0,.09,.07,620); }, tick(p){ tone(330+p*600,0,.05,.045); },
  open(){ bell(660,0,.3,.07); bell(880,.07,.3,.06); },
  bump(k){ bell(P[(k===undefined?Math.floor(Math.random()*7):k)%7],0,.28,.06); },
  whoosh(){ noise(0,.6,.12,300,3200); tone(300,0,.5,.04,900); },
  sparkle(){ [1568,2093,2637].forEach((f,i)=>bell(f,i*.06,.3,.04)); },
  giggle(){ tone(800,0,.07,.07,1100); tone(900,.1,.08,.07,1250); tone(850,.2,.07,.06,1180); },
  hello(){ bell(784,0,.35,.07); bell(988,.12,.4,.07); },
  yay(){ [523,659,784,1047,1319].forEach((f,i)=>bell(f,i*.09,.5,.08)); },
  glug(){ for(let i=0;i<4;i++){ tone(180+i*30,i*.22,.14,.14,320+i*40); noise(i*.22,.1,.04,900,2000); } },
  zzz(){ tone(330,0,.5,.06,260); tone(294,.5,.5,.05,220); },
  shade(){ noise(0,.4,.1,2500,500); bell(660,.2,.4,.06); },
  ping(){ bell(1175,0,.35,.08); bell(1568,.1,.35,.06); },
  heat0(){ bell(784,0,.35,.06); bell(988,.08,.4,.05); },
  heat1(){ tone(330,0,.25,.07); tone(370,.14,.2,.05); },
  heat2(){ tone(392,0,.14,.08,0,"triangle"); tone(311,.17,.26,.08,0,"triangle"); },
  heat3(){ for(let i=0;i<4;i++) noise(i*.2,.16,.1,1400,800); },
  heat4(){ tone(520,0,.85,.05,150,"sawtooth"); tone(540,0,.85,.04,160,"sawtooth"); },
  dial(k){ bell(330+k*140,0,.35,.08); noise(0,.15,.05,2500,900); },
  trail(k){ bell(P[k%7],0,.5,.08); tone(P[k%7]/2,0,.3,.05); }
};
function sfx(n,a){ if(!SND.on||document.hidden||!SND.ctx||SND.ctx.state!=="running") return; try{ SFX[n](a); }catch(e){} }
["pointerdown","keydown","touchend"].forEach(ev=>addEventListener(ev,function f(){ const c=ac(); if(c&&c.state==="suspended") c.resume().then(()=>sfx("hello")); },{once:true,passive:true}));
$("#snd").addEventListener("click",e=>{ SND.on=!SND.on; e.currentTarget.textContent=SND.on?"🔊":"🔇"; e.currentTarget.setAttribute("aria-pressed",SND.on); if(SND.on) sfx("click"); });
document.addEventListener("click",e=>{ if(e.target.closest&&e.target.closest("a.btn")) sfx("click"); });

/* ================= HEAT INDEX: NOAA / NWS method, °C in and out =================
   1) simple (Steadman) formula; 2) if the average of it and T is 80 °F or more, use the full Rothfusz regression
   with the two NWS adjustments (very dry air, or humid air at 80-87 °F). */
function heatIndexC(tc,rh){
  const T=tc*9/5+32,R=rh;
  let HI=0.5*(T+61+(T-68)*1.2+R*0.094);
  if((HI+T)/2>=80){
    HI=-42.379+2.04901523*T+10.14333127*R-.22475541*T*R-.00683783*T*T-.05481717*R*R+.00122874*T*T*R+.00085282*T*R*R-.00000199*T*T*R*R;
    if(R<13&&T>=80&&T<=112) HI-=((13-R)/4)*Math.sqrt((17-Math.abs(T-95))/17);
    else if(R>85&&T>=80&&T<=87) HI+=((R-85)/10)*((87-T)/5);
  }
  return (HI-32)*5/9;
}
const COL=["#8fdcae","#f1bd5a","#ff9a3c","#e5484d","#7b3fb8"];
const LEVELS=[
  {min:27,max:32,name:"Caution",range:"27–32 °C",emoji:"🟡",color:COL[1],effect:"You may feel tired if you stay in the heat for a long time.",more:"Fatigue is possible with long exposure and activity. Drink water regularly and notice how you feel."},
  {min:33,max:41,name:"Extreme Caution",range:"33–41 °C",emoji:"🟠",color:COL[2],effect:"Muscle cramps and heat exhaustion are possible.",more:"Take breaks in shade or a cool place. Reduce hard activity outdoors and watch for dizziness, heavy sweating and weakness."},
  {min:42,max:51,name:"Danger",range:"42–51 °C",emoji:"🔴",color:COL[3],effect:"Cramps and heat exhaustion are likely. Heat stroke is possible with continued exposure.",more:"Avoid unnecessary time outdoors. Rest often, drink water, and look after classmates who look unwell."},
  {min:52,max:Infinity,name:"Extreme Danger",range:"52 °C and above",emoji:"🟣",color:COL[4],effect:"Heat stroke is imminent. This is very dangerous.",more:"Stay in a cool place. Do not do strenuous activity outdoors. Get help right away if serious symptoms appear."}
];
const lvl=hi=>{ const r=Math.round(hi); const i=LEVELS.findIndex(l=>r>=l.min&&r<=l.max); return i<0?(r>32?2:0):i+1; };   /* 0 = below the warning levels */
const levelOf=hi=>{ const n=lvl(hi); return n?LEVELS[n-1]:null; };

/* ================= FLORA (guide flower) ================= */
const fl=$("#flora"),mc=$("#fchar"),bub=$("#fbub");
const SPOT={hero:[0,.88],what:[1,.82],levels:[0,.55],body:[1,.5],safety:[0,.85],authors:[1,.85]};
let curSec="",bt,mt,fMood="hello";
function setMood(m){ fMood=m; fl.dataset.mood=m; }
function say(t,m){ if(m) setMood(m); bub.textContent=t; bub.classList.remove("show"); void bub.offsetWidth; bub.classList.add("show"); clearTimeout(bt); bt=setTimeout(()=>bub.classList.remove("show"),6500); }
function fxy(id){ const sp=SPOT[id]||[0,1],w=mc.offsetWidth||70,h=mc.offsetHeight||90; return {x:sp[0]?innerWidth-w-14:14,y:70+sp[1]*Math.max(0,innerHeight-h-84),r:!!sp[0]}; }
function fgo(id,anim){
  const p=fxy(id); fl.classList.toggle("right",p.r);
  if(!anim||reduce){ fl.style.transition="none"; fl.style.transform=`translate3d(${p.x}px,${p.y}px,0)`; void fl.offsetWidth; fl.style.transition=""; return 0; }
  fl.classList.add("moving"); bub.classList.remove("show"); sfx("whoosh");
  fl.style.transform=`translate3d(${p.x}px,${p.y}px,0)`;
  clearTimeout(mt); mt=setTimeout(()=>{ fl.classList.remove("moving"); sfx("sparkle"); },1200);
  return 1200;
}
const secs=$$("[data-flora]").filter(s=>s.tagName==="SECTION");
function floraSpy(){
  let cur=secs[0].id; const line=innerHeight*.55; secs.forEach(s=>{ if(s.getBoundingClientRect().top<=line) cur=s.id; });
  if(cur===curSec) return; const first=!curSec; curSec=cur; const s=document.getElementById(cur), d=fgo(cur,!first);
  setTimeout(()=>{ if(curSec===cur) say(s.dataset.flora,s.dataset.mood); },d+60);
}
const TIPS=["Drink water before you feel thirsty. 💧","Shade first, then keep going. 🌳","Feeling dizzy? Sit down in a cool spot. 🪑","Heat index is how hot it feels, not just the thermometer. 🌡️","Check on your classmates too. 🤝"];
let tipI=0;
mc.addEventListener("click",e=>{ sfx("giggle"); say(TIPS[tipI++%TIPS.length],"excited"); mc.classList.remove("hop"); void mc.offsetWidth; mc.classList.add("hop"); });
mc.addEventListener("mouseenter",()=>{ if(!fl.classList.contains("moving")) sfx("bump"); });
$("#fx").addEventListener("click",()=>{ fl.style.display="none"; });
addEventListener("resize",()=>{ if(curSec) fgo(curSec,false); });

/* ================= HERO: living thermometer ================= */
const H={on:true,boost:0,lv:-1}, heater=$("#heater"), merc=$("#mercury");
const HMIN=20,HMAX=62;
$("#ticks").innerHTML=[27,33,42,52].map((v,i)=>`<span class="tk" style="bottom:${46+(v-HMIN)/(HMAX-HMIN)*204}px">${v}°</span>`).join("");
function heroFrame(now){
  if(H.on){
    let v=24+30*(.5-.5*Math.cos(now/1000*2*Math.PI/16))+H.boost; H.boost*=.97;
    const n=lvl(v), k=n?LEVELS[n-1]:null, col=COL[n];
    merc.style.height=Math.min(100,Math.max(6,(v-HMIN)/(HMAX-HMIN)*100))+"%";
    heater.style.setProperty("--hc",col); heater.style.setProperty("--sc",(.8+Math.min(1,Math.max(0,(v-20)/40))*.9).toFixed(2));
    $("#hNum").textContent=Math.round(v); $("#hLvl").textContent=k?k.name:"Comfortable"; $("#hLvl").style.setProperty("--c",col);
    if(n!==H.lv){ if(H.lv>=0) sfx("heat"+n); H.lv=n; heater.dataset.l=n; }
  }
  requestAnimationFrame(heroFrame);
}
if(reduce){ merc.style.height="50%"; } else requestAnimationFrame(heroFrame);
new IntersectionObserver(es=>es.forEach(e=>{ H.on=e.isIntersecting; }),{threshold:.1}).observe(heater);
heater.addEventListener("click",()=>{ H.boost=28; sfx("whoosh"); say("Whoa, it's heating up! 🔥","wow"); });

/* ================= WORD BUMP + ICON BUMP ================= */
$$(".bw").forEach(el=>{ el.innerHTML=el.textContent.split(/\s+/).map(w=>`<span class="bwd">${w}</span>`).join(" "); });
document.addEventListener("mouseover",e=>{ const w=e.target.closest&&e.target.closest(".bwd"); if(w&&!w._b){ w._b=1; w.classList.add("b"); sfx("bump"); setTimeout(()=>{ w.classList.remove("b"); w._b=0; },450); } });
$$(".cardb").forEach((c,i)=>c.addEventListener("mouseenter",()=>{ const ic=$(".ic",c); ic.classList.remove("hit"); void ic.offsetWidth; ic.classList.add("hit"); sfx("bump",i*2); }));

/* ================= CALCULATOR + GIRL ================= */
const hT=$("#hT"),hH=$("#hH"),girl=$("#girl");
const CAPS=["Feeling fine! 😊","A little warm… 😅","Getting really hot 😓","Struggling with the heat 🥵","Needs to cool down NOW 😵"];
function grad(fn,min,max){ const n=30,s=[]; for(let i=0;i<n;i++){ const c=COL[lvl(fn(min+(max-min)*(i+.5)/n))]; s.push(`${c} ${(i/n*100).toFixed(1)}%`,`${c} ${((i+1)/n*100).toFixed(1)}%`); } return `linear-gradient(90deg,${s.join(",")})`; }
function firstT(h,n){ for(let t=24;t<=45;t+=.5) if(lvl(heatIndexC(t,h))>=n) return t; return null; }
let lastS=-1;
function calc(){
  const t=+hT.value,h=+hH.value; $("#hTo").textContent=t+" °C"; $("#hHo").textContent=h+" %";
  const hi=heatIndexC(t,h), n=lvl(hi), k=n?LEVELS[n-1]:null, b=$("#hiBadge");
  $("#hiVal").textContent=hi.toFixed(1);
  b.style.setProperty("--c",COL[n]); b.textContent=k?k.emoji+" "+k.name:"🟢 Below the warning levels";
  $("#hiEffect").textContent=k?k.effect:"It does not feel hot enough to reach the lowest warning level.";
  girl.dataset.s=n; $("#gCap").textContent=CAPS[n];
  hT.style.setProperty("--grad",grad(v=>heatIndexC(v,h),24,45)); hH.style.setProperty("--grad",grad(v=>heatIndexC(t,v),20,100));
  const f=x=>{ const v=firstT(h,x); return v===null?"not before 45 °C":v+" °C"; };
  $("#gT").innerHTML=`At <b>${h}%</b> humidity: Caution from <b>${f(1)}</b> · Danger from <b>${f(3)}</b> · Extreme Danger from <b>${f(4)}</b>`;
  return n;
}
[hT,hH].forEach(i=>i.addEventListener("input",()=>{
  const n=calc(); sfx("tick",(i.value-i.min)/(i.max-i.min));
  if(n!==lastS){ if(lastS>=0) sfx("heat"+n); lastS=n; }
  clearTimeout(i._m); i._m=setTimeout(()=>{ const hi=heatIndexC(+hT.value,+hH.value);
    say(n?`Heat index ${hi.toFixed(0)} °C: ${LEVELS[n-1].name}. ${LEVELS[n-1].emoji}`:`Heat index ${hi.toFixed(0)} °C: still comfortable. 🙂`,n>=3?"wow":n?"think":"happy"); },500);
}));
calc(); lastS=lvl(heatIndexC(+hT.value,+hH.value));

/* ================= LEVELS: the dial ================= */
const DMIN=20,DMAX=60, ang=v=>(180-(v-DMIN)/(DMAX-DMIN)*180)*Math.PI/180;
const pt=(v,r)=>[150+r*Math.cos(ang(v)),150-r*Math.sin(ang(v))];
const SEG=[[20,27,0],[27,33,1],[33,42,2],[42,52,3],[52,60,4]];
$("#arcs").innerHTML=SEG.map(([a,b,c])=>{ const p1=pt(a,108),p2=pt(b,108); return `<path id="arc${c}" class="arc" d="M${p1[0]} ${p1[1]} A108 108 0 0 1 ${p2[0]} ${p2[1]}" fill="none" stroke="${COL[c]}" stroke-width="24"/>`; }).join("");
$("#dticks").innerHTML=[27,33,42,52].map(v=>{ const a=pt(v,128); return `<text x="${a[0]}" y="${a[1]}" font-size="10" font-weight="700" text-anchor="middle" fill="#8a4a66">${v}</text>`; }).join("");
const needle=$("#needle"),dbox=$("#dialbox"),tabs=$("#lvtabs"),panel=$("#lvpanel");
function dialTo(v){ needle.style.transform=`rotate(${(v-DMIN)/(DMAX-DMIN)*180}deg)`; }
function pick(i,quiet){
  const l=LEVELS[i]; dialTo((l.min+Math.min(l.max,60))/2>57?57:(l.min+(l.max===Infinity?60:l.max))/2);
  $$(".arc").forEach(a=>a.classList.toggle("on",a.id==="arc"+(i+1)));
  $$("button",tabs).forEach((b,k)=>b.setAttribute("aria-selected",k===i));
  $("#dName").textContent=l.name; $("#dName").setAttribute("fill",i>=2?l.color:"#4a1330");
  panel.style.setProperty("--c",l.color);
  panel.innerHTML=`<h3>${l.emoji} ${l.name} <small>${l.range}</small></h3><p><b>What it means:</b> ${l.effect}</p><p><b>What to do:</b> ${l.more}</p>`;
  dbox.className="glass dialbox hot"+i;
  if(!quiet){ sfx("dial",i); if(i>=2) sfx(i===3?"heat4":"heat3"); say(i>=2?`${l.name}! Be very careful. ${l.emoji}`:`${l.name}. ${l.emoji}`,i>=2?"wow":"think"); }
}
LEVELS.forEach((l,i)=>{ const b=document.createElement("button"); b.type="button"; b.role="tab"; b.className="glass lvtab"; b.style.setProperty("--c",l.color); b.innerHTML=`<span>${l.emoji}</span><b>${l.name}</b><small>${l.range}</small>`; b.addEventListener("click",()=>pick(i)); tabs.appendChild(b); });
dialTo(DMIN); let swept=false;
new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting&&!swept){ swept=true; [0,1,2,3,0].forEach((k,j)=>setTimeout(()=>pick(k,j<4&&!1),500+j*1100)); } }),{threshold:.5}).observe(dbox);

/* ================= BODY: the trail ================= */
const BODY=[
 ["💦","Sweating","Mild",COL[1],"Sweat is how you cool down. In humid air it does not evaporate well, so you stay hot and sticky even while sweating.",["💦","💧","💦"]],
 ["🏜️","Dehydration","Mild",COL[1],"You lose water and salts. Signs: thirst, dry mouth, dark urine, feeling tired.",["🥤","🏜️","🥵"]],
 ["😴","Fatigue","Mild",COL[1],"Heat makes your body work harder, so you feel drained and find it hard to concentrate.",["💤","😪","💤"]],
 ["🤕","Headache","Mild",COL[1],"A common early sign of too much heat or too little water. Rest in a cool place and drink water.",["⚡","🤕","💢"]],
 ["💫","Dizziness","Warning",COL[2],"Feeling lightheaded or unsteady is a warning sign. Sit or lie down in a cool place and drink water.",["💫","😵‍💫","💫"]],
 ["💪","Heat cramps","Warning",COL[2],"Painful muscle spasms, usually in the legs or stomach, after hard activity in heat. Stop, rest, cool down and drink fluids.",["💪","⚡","😖"]],
 ["🥴","Heat exhaustion","Serious",COL[3],"Heavy sweating, weakness, cold clammy skin, nausea, fast pulse, headache, faintness. Move to a cool place, loosen clothing, sip water, and get help if it does not improve.",["🥴","🤢","💦"]],
 ["🚨","Heat stroke","Emergency",COL[4],"Very high body temperature, confusion, fainting or seizures. The skin may be hot and dry or damp. Call emergency services, move the person to shade and cool them while waiting.",["🚨","🔥","🆘"]]
];
const tr=$("#trail");
BODY.forEach((x,i)=>{ const s=document.createElement("div"); s.className="stop "+(i%2?"r":"l"); s.style.setProperty("--c",x[3]);
  s.innerHTML=`<div class="pin"><span class="em2">${x[0]}</span><span class="num">${i+1}</span><div class="chips">${x[5].map(c=>`<i>${c}</i>`).join("")}</div></div><div class="info glass"><span class="tag" style="--c:${x[3]}">${x[2]}</span><h3>${x[1]}</h3><p>${x[4]}</p></div>`; tr.appendChild(s); });
const TR={len:0,ys:[],pl:[],on:[]};
function trailBuild(){
  const svg=$("#tsvg"),fg=$("#tfg"),bg=$("#tbg"),stops=$$(".stop",tr),br=tr.getBoundingClientRect(),bw=tr.offsetWidth,bh=tr.offsetHeight; if(!bw) return;
  const pts=stops.map(s=>{ const r=$(".pin",s).getBoundingClientRect(); return [r.left+r.width/2-br.left,r.top+r.height/2-br.top]; });
  svg.setAttribute("viewBox",`0 0 ${bw} ${bh}`); const f=n=>n.toFixed(1), lead=Math.min(90,pts[0][1]-6);
  let d=`M${f(pts[0][0])} ${f(pts[0][1]-lead)} L${f(pts[0][0])} ${f(pts[0][1])}`;
  for(let i=0;i<pts.length-1;i++){ const [x1,y1]=pts[i],[x2,y2]=pts[i+1],dy=(y2-y1)*.6; d+=` C${f(x1)} ${f(y1+dy)} ${f(x2)} ${f(y2-dy)} ${f(x2)} ${f(y2)}`; }
  bg.setAttribute("d",d); fg.setAttribute("d",d); TR.len=fg.getTotalLength(); fg.style.strokeDasharray=TR.len+" "+TR.len;
  const N=200,sp=[]; TR.ys=[]; for(let k=0;k<=N;k++){ const q=fg.getPointAtLength(TR.len*k/N); sp.push(q); TR.ys.push(q.y); }
  TR.pl=pts.map(p=>{ let best=0,bd=1e12; sp.forEach((q,k)=>{ const dd=(q.x-p[0])**2+(q.y-p[1])**2; if(dd<bd){ bd=dd; best=k; } }); return TR.len*best/N; });
  if(!TR.on.length) TR.on=pts.map(()=>false);
}
function trailFX(){
  if(!TR.len) return; const fg=$("#tfg"),dot=$("#tdot"),r=tr.getBoundingClientRect(),lineY=innerHeight*.62-r.top,n=TR.ys.length-1; let L=0;
  if(reduce||lineY>=TR.ys[n]) L=TR.len; else if(lineY>TR.ys[0]){ let k=0; while(k<n&&TR.ys[k+1]<=lineY) k++; L=TR.len*k/n; }
  fg.style.strokeDashoffset=(TR.len-L).toFixed(1);
  if(L>0){ const q=fg.getPointAtLength(L); dot.setAttribute("cx",q.x.toFixed(1)); dot.setAttribute("cy",q.y.toFixed(1)); } else { dot.setAttribute("cx",-30); dot.setAttribute("cy",-30); }
  $$(".stop",tr).forEach((s,i)=>{ const on=L>=TR.pl[i]-2&&L>0; if(on===TR.on[i]) return; TR.on[i]=on; s.classList.toggle("on",on);
    if(on){ sfx("trail",i); if(i>=6) sfx("heat3"); say(BODY[i][1]+": "+BODY[i][2].toLowerCase()+". "+BODY[i][0],i>=6?"wow":"curious"); } });
}

/* ================= SAFETY: Flora enlarges and acts it out ================= */
const stage=$("#stage"),sbig=$(".sbig",stage),sprop=$(".prop",stage),scap=$(".scap",stage);
sbig.appendChild(mc.querySelector("svg").cloneNode(true));
const HAB=[
 ["drink","💧","Drink enough water","Sip through the day, before you feel thirsty. Bring your own bottle.","🥤","Sip water often, before you feel thirsty! 💧","glug","happy"],
 ["break","⏸️","Take breaks","Pause regularly when you are exposed to heat, especially during activity.","💤","Short breaks let your body cool down.","zzz","happy"],
 ["shade","🌳","Find shade or cool air","Use covered areas, fans or air-conditioned rooms when you can.","☂️","Shade or a cool room makes a big difference.","shade","love"],
 ["sun","🕛","Limit long sun time","Avoid unnecessary long exposure when the heat index is very high.","🕶️","Limit long sun time when it is very hot.","ping","cool"],
 ["signs","👀","Watch for warning signs","Dizziness, headache, cramps, nausea or weakness: stop and cool down.","🔍","Spot dizziness, cramps and headaches early.","sparkle","wow"],
 ["help","🤝","Ask for help early","Tell a teacher, instructor or medic if you or a classmate feel seriously unwell.","🙋","Ask for help early. It is the smart move!","hello","excited"]
];
let stT;
function showAct(cls,prop,cap,snd,mood){
  clearTimeout(stT); stage.className="stage"; void stage.offsetWidth; stage.className="stage show a-"+cls;
  sprop.textContent=prop; scap.textContent=cap; sbig.dataset.mood=mood; sfx(snd);
  stT=setTimeout(()=>stage.classList.remove("show"),cls==="all"?3600:3000);
}
stage.addEventListener("click",()=>{ clearTimeout(stT); stage.classList.remove("show"); });
HAB.forEach((x,i)=>{
  const b=document.createElement("button"); b.className="glass card chk rv"; b.type="button"; b.setAttribute("aria-pressed","false"); b.style.setProperty("--d",(i%3)*.07+"s");
  b.innerHTML=`<span class="box" aria-hidden="true"></span><span><h3>${x[1]} ${x[2]}</h3><p>${x[3]}</p></span>`;
  b.addEventListener("click",()=>{ const p=b.getAttribute("aria-pressed")!=="true"; b.setAttribute("aria-pressed",p); if(!p){ sfx("click"); return; }
    if($$(".chk[aria-pressed=true]").length===HAB.length) setTimeout(()=>{ showAct("all","🎉","You did all six! You are heat safe. 🌸","yay","love"); confetti(); },3200);
    showAct(x[0],x[4],x[5],x[6],x[7]); });
  $("#checks").appendChild(b);
});
function confetti(){ if(reduce) return; for(let i=0;i<26;i++){ const e=document.createElement("i"); e.className="fall"; e.textContent=["🌸","🌼","💖","✨"][i%4]; e.style.left=Math.random()*100+"vw"; e.style.animationDelay=Math.random()*1.2+"s"; document.body.appendChild(e); setTimeout(()=>e.remove(),4200); } }

/* ================= SCROLL ================= */
const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } }),{threshold:.12});
$$(".rv").forEach(el=>io.observe(el));
const sbar=$("#sbar"); let tk=false,lastY=scrollY;
function onScroll(){ tk=false; const d=document.documentElement.scrollHeight-innerHeight; sbar.style.transform="scaleX("+(d>0?Math.min(1,scrollY/d):0)+")";
  floraSpy(); trailFX();
  const dy=scrollY-lastY; lastY=scrollY; mc.style.setProperty("--lean",Math.max(-14,Math.min(14,dy*.6))+"deg"); }
addEventListener("scroll",()=>{ if(!tk){ tk=true; requestAnimationFrame(onScroll); } },{passive:true});
addEventListener("resize",()=>{ trailBuild(); trailFX(); });
addEventListener("load",()=>{ trailBuild(); trailFX(); });
if("ResizeObserver" in window) new ResizeObserver(()=>{ trailBuild(); trailFX(); }).observe(tr);
trailBuild(); onScroll(); fgo(curSec||"hero",false);
})();
