/*
  Phu Hoang portfolio
  Page behavior: section tracking, menu, project popups, video, code viewer, resume links
*/
(function(){
  try{ if(window.Prism) Prism.highlightElement(document.getElementById('codeText')); }catch(e){}
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

  function copyText(btn,text,node){
    function sel(){ var r=document.createRange(); r.selectNodeContents(node); var s=getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent='Selected'; }
    try{ navigator.clipboard.writeText(text).then(function(){ var o=btn.dataset.l||btn.textContent; btn.dataset.l=o; btn.textContent='Copied'; setTimeout(function(){btn.textContent=o},1600); }, sel); }catch(e){ sel(); }
  }
  var em=document.getElementById('em');
  document.getElementById('copyEmail').addEventListener('click',function(){copyText(this,em.textContent,em)});
  var code=document.getElementById('codeText');
  document.getElementById('copyCode').addEventListener('click',function(){copyText(this,code.textContent,code)});
  var cs=document.getElementById('codeScroll');
  document.getElementById('expandCode').addEventListener('click',function(){ var o=cs.classList.toggle('open'); this.textContent=o?'Collapse':'Show all'; });

  /* coil table explorer */
  var COILS=[[1,0,0,0],[1,1,0,0],[0,1,0,0],[0,1,1,0],[0,0,1,0],[0,0,1,1],[0,0,0,1],[1,0,0,1]];
  var NAMES={w:'wave',f:'full step',h:'half step'};
  var mode='f',row=1,stepSize=2,timer=null;
  var tbody=document.querySelector('#ct tbody');
  COILS.forEach(function(r,i){ var tr=document.createElement('tr'); tr.innerHTML='<td>'+i+'</td>'+r.map(function(v){return '<td class="c'+v+'">'+v+'</td>'}).join(''); tbody.appendChild(tr); });
  var cg=document.getElementById('coils'),lbl=['A','B',"A'","B'"],poles=[];
  for(var k=0;k<4;k++){ var a=(k*90-90)*Math.PI/180,x=85+62*Math.cos(a),y=85+62*Math.sin(a); var g=document.createElementNS('http://www.w3.org/2000/svg','g'); g.innerHTML='<rect class="coil" x="'+(x-15)+'" y="'+(y-11)+'" width="30" height="22" rx="8"></rect><text class="ct-l" x="'+x+'" y="'+y+'">'+lbl[k]+'</text>'; cg.appendChild(g); poles.push(g.querySelector('rect')); }
  var rotorEl=document.getElementById('rotor');
  var hz=document.getElementById('hz'),hzR=document.getElementById('hzRange');
  function calc(){
    var f=parseFloat(hz.value),spr=(stepSize===1)?4096:2048,w=document.getElementById('oWarn');
    document.getElementById('oMode').textContent=NAMES[mode]; document.getElementById('oSpr').textContent=spr;
    if(!(f>=1&&f<=3000)){ document.getElementById('oPer').textContent='n/a'; document.getElementById('oRpm').textContent='n/a'; w.textContent='Enter a rate from 1 to 3000 steps/s, the same range the code accepts.'; return; }
    var rpm=f*60/spr; document.getElementById('oPer').textContent=Math.floor(1e6/f).toLocaleString()+' µs'; document.getElementById('oRpm').textContent=rpm.toFixed(1)+' rpm';
    w.textContent=rpm>20.5?'Above the measured stall speed of about 20.5 rpm without the ramp.':'';
  }
  function render(){
    [].forEach.call(tbody.rows,function(tr,i){ var used=mode==='h'||(mode==='w'?i%2===0:i%2===1); tr.classList.toggle('unused',!used); tr.classList.toggle('cur',i===row); });
    COILS[row].forEach(function(v,i){poles[i].classList.toggle('on',!!v)});
    rotorEl.setAttribute('transform','rotate('+(row*45)+' 85 85)'); calc();
  }
  function setMode(m){ mode=m; if(m==='w'){row=0;stepSize=2} if(m==='f'){row=1;stepSize=2} if(m==='h'){stepSize=1}
    document.querySelectorAll('[data-mode]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.mode===m?'true':'false')}); render(); }
  function oneStep(){ row=(row+stepSize)%8; render(); }
  document.querySelectorAll('[data-mode]').forEach(function(b){b.addEventListener('click',function(){setMode(b.dataset.mode)})});
  document.getElementById('stepBtn').addEventListener('click',oneStep);
  var playBtn=document.getElementById('playBtn');
  playBtn.addEventListener('click',function(){ if(timer){clearInterval(timer);timer=null;playBtn.textContent='Play';playBtn.setAttribute('aria-pressed','false')} else {timer=setInterval(oneStep,450);playBtn.textContent='Pause';playBtn.setAttribute('aria-pressed','true')} });
  hz.addEventListener('input',function(){ if(+hz.value>=100&&+hz.value<=1500) hzR.value=hz.value; calc(); });
  hzR.addEventListener('input',function(){ hz.value=hzR.value; calc(); });
  setMode('f');

  /* ===== pages, dial, dialogs, video ===== */
  var pages=[].slice.call(document.querySelectorAll('.page'));
  var navA=[].slice.call(document.querySelectorAll('.nav a'));
  var orbItems=[].slice.call(document.querySelectorAll('.orb-item'));
  var knob=document.getElementById('knob'), N=pages.length, cur=0;
  function pad(n){return (n<10?'0':'')+n}
  var reduceMo=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  function setCur(i){
    if(i===cur && setCur.done) return; setCur.done=true; cur=i; var pg=pages[i];
    navA.forEach(function(a,k){ a.classList.toggle('active',k===i); a.setAttribute('aria-current',k===i?'true':'false'); });
    var na=navA[i], nv=na.parentNode; if(nv.scrollWidth>nv.clientWidth){ nv.scrollLeft=na.offsetLeft-nv.offsetLeft-nv.clientWidth/2+na.offsetWidth/2; }
    knob.style.transform='rotate('+(i*360/N)+'deg)';
    orbItems.forEach(function(b,k){ b.classList.toggle('cur',k===i); });
    document.getElementById('pageNum').textContent=pad(i+1)+' / '+pad(N);
    document.getElementById('pageName').textContent=pg.dataset.title;
    updatePeels(i);
  }
  /* scroll smoothly to a section */
  function show(i){
    i=Math.max(0,Math.min(N-1,i)); var pg=pages[i];
    var y=i===0?0:pg.getBoundingClientRect().top+window.scrollY-70;
    window.scrollTo({top:y,behavior:reduceMo?'auto':'smooth'});
    try{history.replaceState(null,'','#'+pg.id)}catch(_){}
  }
  /* work out which section is on screen */
  function onScroll(){
    var line=window.innerHeight*0.35, k=0;
    pages.forEach(function(p,j){ if(p.getBoundingClientRect().top<=line) k=j; });
    if(window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-4) k=N-1;
    setCur(k);
  }
  window.addEventListener('scroll',onScroll,{passive:true});
  document.querySelectorAll('[data-go]').forEach(function(a){ a.addEventListener('click',function(e){ e.preventDefault(); show(+a.dataset.go); closeOrb(); }); });
  /* in-page links like "See my projects" / "Get in touch" */
  document.querySelectorAll('a[href^="#"]:not([data-go])').forEach(function(a){
    var id=a.getAttribute('href').slice(1), k=pages.findIndex(function(p){return p.id===id});
    if(k>=0) a.addEventListener('click',function(e){e.preventDefault(); show(k);});
  });
  var openModal=null, lastFocus=null;
  document.addEventListener('keydown',function(e){
    if(openModal){ if(e.key==='Escape') closeM(); return; }
  });
  /* Resume buttons: hide them if the PDF file is missing */
  (function(){ var links=document.querySelectorAll('[data-resume]');
    var btns=document.getElementById('resumeBtns'), miss=document.getElementById('resumeMissing');
    function missing(){ btns.hidden=true; miss.hidden=false; document.querySelectorAll('.sheet').forEach(function(s){ s.removeAttribute('href'); s.removeAttribute('target'); s.querySelector('.sheet-cta').textContent='PDF coming soon'; }); }
    if(location.protocol==='file:') return;
    try{ fetch('assets/docs/Phu_Hoang_Resume.pdf',{method:'HEAD',cache:'no-store'}).then(function(r){ if(!r.ok) missing(); }).catch(missing); }catch(e){ missing(); }
  })();

  /* ===== page-curl corners: hover to peek, click or drag the corner across to turn ===== */
  var peelPrev=document.getElementById('peelPrev'), peelNext=document.getElementById('peelNext');
  function updatePeels(i){
    peelPrev.hidden=i===0; peelNext.hidden=i===N-1;
    if(i>0){ var a=pages[i-1].dataset.title; document.getElementById('peelPrevName').textContent=a; peelPrev.setAttribute('aria-label','Previous section: '+a); }
    if(i<N-1){ var b=pages[i+1].dataset.title; document.getElementById('peelNextName').textContent=b; peelNext.setAttribute('aria-label','Next section: '+b); }
  }
  function turn(d){ show(cur+d); }
  [[peelPrev,-1],[peelNext,1]].forEach(function(pair){
    var el=pair[0], d=pair[1], st=null;
    el.addEventListener('mouseenter',function(){ el.classList.remove('hint'); });
    el.addEventListener('pointerdown',function(e){ el.classList.remove('hint'); st={x:e.clientX,y:e.clientY,moved:false}; try{el.setPointerCapture(e.pointerId)}catch(_){} });
    el.addEventListener('pointermove',function(e){ if(!st) return; var dx=Math.abs(e.clientX-st.x),dy=Math.abs(e.clientY-st.y); if(!st.moved&&Math.hypot(dx,dy)>6){ st.moved=true; el.classList.add('dragging','big'); }
      if(st.moved){ var W=document.documentElement.clientWidth,H=window.innerHeight; var cx=d>0?W:0; var s=Math.max(44,Math.min(W*0.7,Math.abs(cx-e.clientX)*1.5)); el.style.setProperty('--s',s+'px'); } });
    function end(){ if(!st) return; var moved=st.moved; st=null; var s=parseFloat(el.style.getPropertyValue('--s'))||44; el.classList.remove('dragging','big'); el.style.removeProperty('--s');
      if(!moved || s>Math.min(240,window.innerWidth*0.45)) turn(d); }
    el.addEventListener('pointerup',end); el.addEventListener('pointercancel',function(){ st=null; el.classList.remove('dragging','big'); el.style.removeProperty('--s'); });
    el.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); turn(d); } });
  });
  /* reveal a curl only when the mouse comes near that edge */
  var ZONE=110, hideT={};
  function near(el,on){ if(on){ clearTimeout(hideT[el.id]); el.classList.add('near'); } else if(el.classList.contains('near')&&!el.classList.contains('dragging')){ clearTimeout(hideT[el.id]); hideT[el.id]=setTimeout(function(){ if(!el.matches(':hover')) el.classList.remove('near'); },350); } }
  document.addEventListener('mousemove',function(e){ var W=document.documentElement.clientWidth, H=window.innerHeight, mid=e.clientY>H*0.14&&e.clientY<H*0.86;
    near(peelNext, mid && e.clientX>W-ZONE); near(peelPrev, mid && e.clientX<ZONE); },{passive:true});
  document.addEventListener('mouseleave',function(){ near(peelNext,false); near(peelPrev,false); });
  /* ===== floating rotor: drag anywhere, tap to open a ring that faces the screen centre ===== */
  var orb=document.getElementById('orb'), core=document.getElementById('orbCore'), S=72, M=16;
  var pos=null; try{ pos=JSON.parse(localStorage.getItem('orbPos')||'null'); }catch(e){}
  function clamp(p){ var W=document.documentElement.clientWidth, H=window.innerHeight; return {x:Math.max(M,Math.min(W-S-M,p.x)), y:Math.max(M+60,Math.min(H-S-M-28,p.y))}; }
  function place(p){ pos=clamp(p); orb.style.transform='translate('+pos.x+'px,'+pos.y+'px)'; orb.classList.toggle('flip',pos.y>window.innerHeight-140); }
  place(pos||{x:document.documentElement.clientWidth-S-24,y:window.innerHeight-S-60});
  window.addEventListener('resize',function(){ place(pos); if(orb.classList.contains('open')) layoutRing(); });
  function layoutRing(){
    var W=document.documentElement.clientWidth,H=window.innerHeight,cx=pos.x+S/2,cy=pos.y+S/2,n=orbItems.length,gap=46;
    var side=cx<W/2?1:-1, total=(n-1)*gap, top=Math.max(76,Math.min(H-24-total, cy-total/2));
    orb.style.setProperty('--ax',side>0?'0%':'-100%');
    orbItems.forEach(function(b,k){ var y=top+k*gap-cy, u=n>1?(k-(n-1)/2)/((n-1)/2):0, x=side*(58+46*(1-u*u));
      b.style.setProperty('--x',x.toFixed(1)+'px'); b.style.setProperty('--y',y.toFixed(1)+'px'); });
  }
  function openOrb(){ layoutRing(); orb.classList.add('open'); core.setAttribute('aria-expanded','true'); document.getElementById('orbRing').removeAttribute('aria-hidden'); }
  function closeOrb(){ orb.classList.remove('open'); core.setAttribute('aria-expanded','false'); document.getElementById('orbRing').setAttribute('aria-hidden','true'); }
  var drag=null;
  core.addEventListener('pointerdown',function(e){ drag={sx:e.clientX,sy:e.clientY,ox:pos.x,oy:pos.y,moved:false}; try{core.setPointerCapture(e.pointerId)}catch(_){} });
  core.addEventListener('pointermove',function(e){ if(!drag) return; var dx=e.clientX-drag.sx,dy=e.clientY-drag.sy; if(!drag.moved&&Math.hypot(dx,dy)>6){ drag.moved=true; orb.classList.add('dragging'); closeOrb(); } if(drag.moved) place({x:drag.ox+dx,y:drag.oy+dy}); });
  core.addEventListener('pointerup',function(){ if(!drag) return; var moved=drag.moved; drag=null; orb.classList.remove('dragging'); if(moved){ try{localStorage.setItem('orbPos',JSON.stringify(pos))}catch(e){} } else { orb.classList.contains('open')?closeOrb():openOrb(); } });
  core.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); orb.classList.contains('open')?closeOrb():(openOrb(),orbItems[cur].focus()); } });
  document.addEventListener('pointerdown',function(e){ if(orb.classList.contains('open')&&!orb.contains(e.target)) closeOrb(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&orb.classList.contains('open')){ closeOrb(); core.focus(); } });
  var start=0, h=(location.hash||'').slice(1); pages.forEach(function(p,k){ if(p.id===h) start=k; });
  cur=-1; setCur(start); if(start>0){ setTimeout(function(){ show(start); },60); } onScroll();

  /* tabs inside project pop-ups */
  document.querySelectorAll('.mtabs').forEach(function(tl){ var box=tl.parentNode;
    tl.querySelectorAll('.mtab').forEach(function(b){ b.addEventListener('click',function(){
      tl.querySelectorAll('.mtab').forEach(function(x){ x.setAttribute('aria-selected',x===b?'true':'false'); });
      box.querySelectorAll('.mpane').forEach(function(p){ p.hidden=p.dataset.pane!==b.dataset.pane; });
      var mb=box.closest('.modal-box'); if(mb) mb.scrollTop=0;
    }); }); });

  /* dialogs */
  function openM(key){ var m=document.getElementById('m-'+key); if(!m) return; lastFocus=document.activeElement; m.hidden=false; document.body.classList.add('noscroll'); openModal=m; m.querySelector('.modal-box').scrollTop=0; m.querySelectorAll('video[autoplay]').forEach(function(v){ v.muted=true; var p=v.play(); if(p&&p.catch) p.catch(function(){}); }); var ft=m.querySelector('.mtab'); if(ft) ft.click(); setTimeout(function(){ m.querySelector('.modal-close').focus(); },30); }
  function closeM(){ if(!openModal) return; var v=openModal.querySelector('video'); if(v){ try{v.pause()}catch(e){} } openModal.hidden=true; document.body.classList.remove('noscroll'); openModal=null; if(lastFocus) try{lastFocus.focus()}catch(e){} }
  document.querySelectorAll('[data-open]').forEach(function(b){ b.addEventListener('click',function(){ openM(b.dataset.open); setHash(b.dataset.open); }); });
  document.querySelectorAll('.modal').forEach(function(m){ m.addEventListener('click',function(e){ if(e.target===m||e.target.hasAttribute('data-close')){ closeM(); setHash('projects'); } }); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&location.hash&&PROJECT_LINKS[location.hash.slice(1).toLowerCase()]&&!openModal) setHash('projects'); });

  /* ===== direct links to a project: tranthanhphuhoang.us.com/#stepper (or /stepper) opens that project ===== */
  var PROJECT_LINKS={
    stepper:'stepper', 'singing-stepper':'stepper', singingstepper:'stepper',
    bridge:'bridge', 'truss-bridge':'bridge', truss:'bridge',
    sauna:'sauna', lamppa:'sauna',
    arduino:'arduino', circuits:'arduino',
    vsm:'vsm', 'value-stream-map':'vsm', 'value-stream':'vsm',
    dash:'dash', dashboard:'dash', finance:'dash', 'finance-dashboard':'dash'
  };
  function setHash(h){ try{ history.replaceState(null,'','#'+h); }catch(_){} }
  function openFromHash(){
    var key=PROJECT_LINKS[(location.hash||'').slice(1).toLowerCase()]; if(!key) return false;
    var p=pages.findIndex(function(pg){return pg.id==='projects'});
    if(p>=0){ var pg=pages[p]; window.scrollTo(0,pg.getBoundingClientRect().top+window.scrollY-70); setCur(p); }
    if(openModal&&openModal.id!=='m-'+key) closeM();
    if(!openModal) openM(key);
    return true;
  }
  openFromHash();
  window.addEventListener('hashchange',openFromHash);

  /* arduino video: plays only when asked, once, with sound */
  (function(){ var v=document.getElementById('ardVid'), b=document.getElementById('ardPlay'); if(!v||!b) return;
    b.addEventListener('click',function(){ v.muted=false; v.controls=true; v.currentTime=0; var p=v.play(); if(p&&p.catch)p.catch(function(){}); b.hidden=true; });
    v.addEventListener('ended',function(){ b.hidden=false; b.querySelector('span').textContent='Play again'; v.controls=false; });
  })();
})();
