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
document.addEventListener("click",e=>{ if(e.target.closest&&e.target.closest("a.btn,.lbtn,.linkb,.pk,.dnav,.burger,.mclose,.lg")) sfx("click"); });

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
let curSec="",bt,mt,fMood="hello",curView="login";
function setMood(m){ fMood=m; fl.dataset.mood=m; }
function say(t,m){ if(m) setMood(m); bub.textContent=t; bub.classList.remove("show"); void bub.offsetWidth; bub.classList.add("show"); clearTimeout(bt); bt=setTimeout(()=>bub.classList.remove("show"),6500); }
function fxy(id){ const sp=SPOT[id]||[0,1],w=mc.offsetWidth||70,h=mc.offsetHeight||90; return {x:sp[0]?document.documentElement.clientWidth-w-14:14,y:70+sp[1]*Math.max(0,innerHeight-h-84),r:!!sp[0]}; }
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
  if(curView!=="intro"||fl.hidden) return;
  let cur=secs[0].id; const line=innerHeight*.55; secs.forEach(s=>{ if(s.getBoundingClientRect().top<=line) cur=s.id; });
  if(cur===curSec) return; const first=!curSec; curSec=cur; const s=document.getElementById(cur), d=fgo(cur,!first);
  setTimeout(()=>{ if(curSec===cur) say(s.dataset.flora,s.dataset.mood); },d+60);
}
const TIPS=["Drink water before you feel thirsty. 💧","Shade first, then keep going. 🌳","Feeling dizzy? Sit down in a cool spot. 🪑","Heat index is how hot it feels, not just the thermometer. 🌡️","Check on your classmates too. 🤝"];
let tipI=0;
mc.addEventListener("click",e=>{ sfx("giggle"); say(TIPS[tipI++%TIPS.length],"excited"); const sv=mc.firstElementChild; sv.classList.remove("hop"); void sv.offsetWidth; sv.classList.add("hop"); });
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

/* ================= LOGIN, MENU, SECTIONS, DATA, PROFILE ================= */
const app=$("#app"),login=$("#login"),burger=$("#burger"),VIEWS=["intro","data","user"];
function flower(cls,txt){ let p=""; for(let i=0;i<8;i++) p+=`<ellipse cx="50" cy="26" rx="11" ry="20" fill="#ff8fbd" stroke="#b32467" stroke-width="1.2" transform="rotate(${i*45} 50 50)"/>`;
  return `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true"><g class="petals">${p}</g><circle cx="50" cy="50" r="19" fill="#ffd54a" stroke="#e0a800" stroke-width="1.5"/>`+(txt?`<text x="50" y="59">${txt}</text>`:`<circle cx="43" cy="47" r="2.4" fill="#4a1330"/><circle cx="57" cy="47" r="2.4" fill="#4a1330"/><path d="M44 56 Q50 62 56 56" fill="none" stroke="#4a1330" stroke-width="2" stroke-linecap="round"/>`)+`</svg>`; }
$("#lflw").innerHTML=flower("lflower"); $("#rflw").innerHTML=flower("lflower"); $("#avt").innerHTML=flower("avatar","🌸");
document.body.style.overflow="hidden";
for(let i=0;i<16;i++){ const e=document.createElement("i"); e.className="lf"; e.textContent=["🌸","🌷","🌼","💮","🌺"][i%5]; e.style.cssText=`left:${Math.random()*96}%;font-size:${16+Math.random()*24}px;animation-duration:${9+Math.random()*10}s;animation-delay:-${Math.random()*14}s;--dx:${(Math.random()-.5)*160}px;opacity:.7`; login.appendChild(e); }

const toastEl=$("#toast"); let toastT;
function toast(m){ toastEl.textContent=m; toastEl.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(()=>toastEl.classList.remove("show"),2600); }

/* flower bloom transition between screens */
const bl=$("#bloom"),wash=$(".bwash",bl); let blBusy=false;
function bloom(mid){
  if(reduce){ mid(); return; } if(blBusy) return; blBusy=true; sfx("whoosh"); bl.classList.add("on");
  const E=["🌸","🌷","🌼","💮","🌺","🪷"],R=Math.max(innerWidth,innerHeight)*.5;
  for(let i=0;i<18;i++){ const f=document.createElement("i"); f.className="bf"; f.textContent=E[i%6]; f.style.cssText=`left:50%;top:50%;font-size:${28+Math.random()*34}px`; bl.appendChild(f);
    const a=Math.random()*Math.PI*2,r=100+Math.random()*R,x=Math.cos(a)*r,y=Math.sin(a)*r;
    f.animate([{transform:"translate(-50%,-50%) scale(0)",opacity:0},{transform:`translate(calc(-50% + ${x}px),calc(-50% + ${y}px)) scale(1.2) rotate(${(Math.random()-.5)*540}deg)`,opacity:1,offset:.55},{transform:`translate(calc(-50% + ${x*1.2}px),calc(-50% + ${y*1.2}px)) scale(1) rotate(300deg)`,opacity:0}],{duration:1200,delay:i*18,easing:"ease-out"}).onfinish=()=>f.remove(); }
  wash.animate([{clipPath:"circle(0% at 50% 50%)"},{clipPath:"circle(150% at 50% 50%)"}],{duration:650,easing:"ease-in",fill:"forwards"}).finished
   .then(()=>{ mid(); sfx("sparkle"); return wash.animate([{opacity:1},{opacity:0}],{duration:600,delay:250,fill:"forwards"}).finished; })
   .then(()=>{ wash.getAnimations().forEach(a=>a.cancel()); bl.classList.remove("on"); blBusy=false; });
}

/* hamburger drawer */
function menu(o){ document.body.classList.toggle("menu",o); burger.setAttribute("aria-expanded",o); burger.setAttribute("aria-label",o?"Close menu":"Open menu"); sfx(o?"open":"click"); }
burger.addEventListener("click",()=>menu(!document.body.classList.contains("menu")));
$("#scrim").addEventListener("click",()=>menu(false));
addEventListener("keydown",e=>{ if(e.key==="Escape"){ if(document.body.classList.contains("menu")) menu(false); if(!$("#modal").hidden) closeSign(); } });

/* sections */
let curV="intro";
function showView(v){
  curView=v; curV=v; VIEWS.forEach(n=>{ $("#v-"+n).hidden=n!==v; });
  $$(".dnav[data-v]").forEach(b=>b.classList.toggle("act",b.dataset.v===v));
  const de=document.documentElement; de.style.scrollBehavior="auto"; scrollTo(0,0); de.style.scrollBehavior="";
  fl.hidden=v!=="intro";
  if(v==="intro"){ curSec=""; fgo("hero",false); floraSpy(); trailBuild(); trailFX(); }
  if(v==="data") playData();
}
$$(".dnav[data-v]").forEach(b=>b.addEventListener("click",()=>{ const v=b.dataset.v; menu(false); if(v===curV) return; bloom(()=>showView(v)); }));

/* login / sign up / logout */
$$(".pk").forEach(b=>b.addEventListener("click",()=>{ const i=b.previousElementSibling,s=i.type==="password"; i.type=s?"text":"password"; b.textContent=s?"🙈":"👁️"; b.setAttribute("aria-label",s?"Hide password":"Show password"); }));
$$(".fld input").forEach(i=>{ i.addEventListener("input",()=>sfx("tick",Math.random())); i.addEventListener("focus",()=>sfx("pop")); });
$("#lform").addEventListener("submit",e=>{ e.preventDefault(); const n=$("#lu").value.trim()||"Friend"; sfx("yay");
  bloom(()=>{ login.hidden=true; app.hidden=false; document.body.style.overflow=""; showView("intro"); toast(`Welcome, ${n}! 🌸`); }); });
const modal=$("#modal");
function openSign(){ modal.hidden=false; void modal.offsetWidth; modal.classList.add("show"); sfx("open"); setTimeout(()=>$("#ru").focus(),350); }
function closeSign(){ modal.classList.remove("show"); sfx("click"); setTimeout(()=>{ modal.hidden=true; },350); }
$("#goSign").addEventListener("click",openSign); $("#mclose").addEventListener("click",closeSign); $("#mscrim").addEventListener("click",closeSign);
$("#rform").addEventListener("submit",e=>{ e.preventDefault(); const n=$("#ru").value.trim(); $("#lu").value=n; $("#lp").value=""; $("#rform").reset(); closeSign(); sfx("sparkle"); toast("Account created! You can log in now 🌸"); setTimeout(()=>$("#lp").focus(),450); });
$("#logout").addEventListener("click",()=>{ menu(false); bloom(()=>{ app.hidden=true; fl.hidden=true; login.hidden=false; document.body.style.overflow="hidden"; $("#lform").reset(); curV="intro"; curView="login"; curSec=""; }); });

/* ================= DATA: line, bar and pie ================= */
const DAT={ months:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], hi:[32,33,35,39,42,38,35,34,34,34,33,32],
  deaths:[["2022",61700],["2023",47700],["2024",62800]], pie:[["Below warning",20],["Caution",28],["Extreme Caution",36],["Danger",14],["Extreme Danger",2]] };
const lname=v=>{ const k=levelOf(v); return k?k.name:"Below warning"; };
const chip=(c,b,s)=>`<span class="chip" style="--c:${c}"><b>${b}</b><small>${s}</small></span>`;
(function line(){
  const s=$("#lchart"),W=320,H=190,L=34,R=10,T=14,B=26,mn=26,mx=44,X=i=>L+i*(W-L-R)/11,Y=v=>T+(1-(v-mn)/(mx-mn))*(H-T-B); let g="";
  [27,33,42].forEach((v,k)=>g+=`<line x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}" stroke="${COL[k+1]}" stroke-dasharray="4 4" opacity=".8"/><text x="${L-5}" y="${Y(v)+4}" text-anchor="end">${v}°</text>`);
  const P=DAT.hi.map((v,i)=>[X(i),Y(v)]);
  s.innerHTML=g+DAT.months.map((m,i)=>i%2?"":`<text x="${X(i)}" y="${H-8}" text-anchor="middle">${m}</text>`).join("")+`<path class="lp" pathLength="1" stroke="#b32467" d="M${P.map(p=>p[0].toFixed(1)+" "+p[1].toFixed(1)).join(" L")}"/><circle id="ldot" r="6" fill="#fff" stroke="#b32467" stroke-width="3"/><rect class="lhit" x="${L}" y="0" width="${W-L-R}" height="${H}"/>`;
  let last=-1; function at(i){ if(i===last) return; last=i; const v=DAT.hi[i],d=$("#ldot"); d.setAttribute("cx",P[i][0]); d.setAttribute("cy",P[i][1]); d.style.fill=COL[lvl(v)];
    $("#lread").innerHTML=chip(COL[lvl(v)],`${DAT.months[i]}: ${v} °C`,lname(v)); sfx("tick",i/11); }
  const move=e=>{ const r=s.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*W; at(Math.max(0,Math.min(11,Math.round((px-L)/((W-L-R)/11))))); };
  s.addEventListener("pointermove",move); s.addEventListener("pointerdown",move); at(4);
})();
(function bars(){
  const s=$("#bchart"),W=320,H=190,B=28,T=24,mx=70000,bw=64,gap=(W-3*bw)/4,C=["#e8588f","#ff9a3c","#e5484d"];
  s.innerHTML=DAT.deaths.map(([y,v],i)=>{ const h=v/mx*(H-B-T),x=gap+i*(bw+gap),yy=H-B-h;
    return `<rect class="bar" tabindex="0" role="button" aria-label="${y}: about ${v.toLocaleString()} deaths" data-i="${i}" x="${x}" y="${yy}" width="${bw}" height="${h}" rx="9" fill="${C[i]}" style="transition-delay:${i*.15}s"/><text class="bv" x="${x+bw/2}" y="${yy-7}" text-anchor="middle">${(v/1000).toFixed(1)}k</text><text x="${x+bw/2}" y="${H-9}" text-anchor="middle">${y}</text>`; }).join("");
  const sel=i=>{ $$(".bar",s).forEach((b,k)=>b.classList.toggle("sel",k===i)); const [y,v]=DAT.deaths[i]; $("#bread").innerHTML=chip(C[i],`${y}: about ${v.toLocaleString()} deaths`,"European summer, estimate"); sfx("dial",i); };
  $$(".bar",s).forEach((b,i)=>{ b.addEventListener("click",()=>sel(i)); b.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); sel(i); } }); });
  $("#bread").innerHTML=`<span class="rh">Tap a bar to see its value</span>`;
})();
(function pie(){
  const s=$("#pchart"),tot=DAT.pie.reduce((a,b)=>a+b[1],0); let a=-Math.PI/2;
  s.innerHTML=DAT.pie.map(([n,v],i)=>{ const f=v/tot,a0=a,a1=a+f*2*Math.PI,m=(a0+a1)/2,p=(r,t)=>[(150+r*Math.cos(t)).toFixed(1),(150+r*Math.sin(t)).toFixed(1)]; a=a1; const p0=p(110,a0),p1=p(110,a1);
    return `<path class="sl" tabindex="0" role="button" aria-label="${n}: ${v}%" data-i="${i}" style="--i:${i};--tx:${(Math.cos(m)*12).toFixed(1)}px;--ty:${(Math.sin(m)*12).toFixed(1)}px" fill="${COL[i]}" d="M150 150 L${p0[0]} ${p0[1]} A110 110 0 ${f>.5?1:0} 1 ${p1[0]} ${p1[1]}Z"/>`; }).join("");
  $("#plegend").innerHTML=DAT.pie.map(([n,v],i)=>`<button class="lg" type="button" data-i="${i}" style="--c:${COL[i]}"><i></i>${n} <b>${v}%</b></button>`).join("");
  const sel=i=>{ $$("#pchart .sl,#plegend .lg").forEach(e=>e.classList.toggle("hot",+e.dataset.i===i)); const [n,v]=DAT.pie[i]; $("#pread").innerHTML=chip(COL[i],`${n}: ${v}% of hot-season days`,["Comfortable","27–32 °C","33–41 °C","42–51 °C","52 °C and above"][i]); sfx("dial",i); };
  $$("#pchart .sl,#plegend .lg").forEach(e=>{ e.addEventListener("click",()=>sel(+e.dataset.i)); e.addEventListener("mouseenter",()=>sel(+e.dataset.i)); });
  $$("#pchart .sl").forEach(e=>e.addEventListener("keydown",ev=>{ if(ev.key==="Enter"||ev.key===" "){ ev.preventDefault(); sel(+e.dataset.i); } }));
  $("#pread").innerHTML=`<span class="rh">Tap a slice to see its share</span>`;
})();
function playData(){ const v=$("#v-data"); v.classList.remove("go"); void v.offsetWidth; setTimeout(()=>{ v.classList.add("go"); sfx("sparkle"); },250); }

/* ================= PROFILE ================= */
const pn=$("#pn"),pb=$("#pb"),abox=$("#agebox"); pb.max=new Date().toISOString().slice(0,10);
pn.addEventListener("input",()=>{ const n=pn.value.trim(); $("#hello").textContent=n?`Hello, ${n}! 🌸`:"Hello! 🌸"; $("#avt text").textContent=n?n[0].toUpperCase():"🌸"; });
pb.addEventListener("input",()=>{
  const b=new Date(pb.value+"T00:00:00"),n=new Date(); abox.classList.remove("pop");
  if(!pb.value||isNaN(b)||b>n){ $("#ageV").textContent="–"; $("#ageS").textContent="Pick your birthday to see your age"; return; }
  let age=n.getFullYear()-b.getFullYear(); const m=n.getMonth()-b.getMonth(); if(m<0||(m===0&&n.getDate()<b.getDate())) age--;
  const bd=m===0&&n.getDate()===b.getDate();
  void abox.offsetWidth; abox.classList.add("pop"); $("#ageV").textContent=age; $("#ageS").textContent=bd?"Happy birthday! 🎂":(age===1?"year old":"years old");
  sfx(bd?"yay":"sparkle"); if(bd) confetti();
});

trailBuild(); onScroll(); fgo(curSec||"hero",false);
})();
