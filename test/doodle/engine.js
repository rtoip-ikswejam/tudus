/* Doodle dnia: silnik izometrycznych scen z wokseli (SVG). Moduły z katalogów tla/, postacie/, pogoda/ rejestrują się przez Doodle.reg(rodzaj, id, fabryka). */
(function(g){
'use strict';
const D=g.Doodle=g.Doodle||{};
if(D.E)return;
let CROP=null,CK=2.2;

/* ===== silnik izometryczny: miękkie woksele jak w grafice z domkiem ===== */
const W=16,H=17,OX=200,OY=118;
const sx=(x,y)=>OX+(x-y)*W, sy=(x,y,z)=>OY+(x+y)*W/2-z*H;
const pt=(x,y,z)=>sx(x,y).toFixed(1)+','+sy(x,y,z).toFixed(1);
function sh(c,t){if(c.length===4)c='#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3];const n=parseInt(c.slice(1),16);let v=[n>>16,n>>8&255,n&255].map(a=>t>0?a+(255-a)*t:a*(1+t));return '#'+v.map(a=>Math.max(0,Math.min(255,Math.round(a))).toString(16).padStart(2,'0')).join('')}
const hs=(a,b,c)=>{const n=Math.sin(a*127.1+b*311.7+c*74.7+1.7)*43758.5453;return n-Math.floor(n)};
const poly=(p,k,st=k,sw=.4)=>{const s=p.map(a=>[sx(a[0],a[1]),sy(a[0],a[1],a[2])]);
  if(CROP){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const v of s){if(v[0]<x0)x0=v[0];if(v[0]>x1)x1=v[0];if(v[1]<y0)y0=v[1];if(v[1]>y1)y1=v[1]}if(x1<CROP[0]||x0>CROP[2]||y1<CROP[1]||y0>CROP[3])return''}
  return `<polygon points="${s.map(v=>v[0].toFixed(1)+','+v[1].toFixed(1)).join(' ')}" fill="${k}" stroke="${st}" stroke-width="${sw}" stroke-opacity=".5" stroke-linejoin="round"/>`};
/* kostka; cell>0 dzieli ściany na woksele z lekkim szumem koloru (kamień, liście) */
function bx(x,y,z,w,d,h,c,cell=0,j=.05,noTop=0){
  if(cell)cell*=CK;
  const T=sh(c,.12),L=sh(c,-.2),R=sh(c,-.05),sm=sh(c,-.34);
  if(!cell){
    return (noTop?'':poly([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]],T,sm))
      +poly([[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]],L,sm)
      +poly([[x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]],R,sm);
  }
  const nx=Math.max(1,Math.round(w/cell)),ny=Math.max(1,Math.round(d/cell)),nz=Math.max(1,Math.round(h/cell));
  const dx=w/nx,dy=d/ny,dz=h/nz;
  const J=(k,a,b,f)=>sh(k,(hs(x*3+a,y*3+b,z*3+f)-.5)*2*j);
  let o='';
  if(!noTop)for(let a=0;a<nx;a++)for(let b=0;b<ny;b++){const X=x+a*dx,Y=y+b*dy;o+=poly([[X,Y,z+h],[X+dx,Y,z+h],[X+dx,Y+dy,z+h],[X,Y+dy,z+h]],J(T,a,b,1),sm)}
  for(let a=0;a<nx;a++)for(let k=0;k<nz;k++){const X=x+a*dx,Z=z+k*dz;o+=poly([[X,y+d,Z],[X+dx,y+d,Z],[X+dx,y+d,Z+dz],[X,y+d,Z+dz]],J(L,a,k,2),sm)}
  for(let b=0;b<ny;b++)for(let k=0;k<nz;k++){const Y=y+b*dy,Z=z+k*dz;o+=poly([[x+w,Y,Z],[x+w,Y+dy,Z],[x+w,Y+dy,Z+dz],[x+w,Y,Z+dz]],J(R,b,k,3),sm)}
  return o;
}
const bxv=(x,y,z,w,d,h,c,j=.05,cell=.5)=>bx(x,y,z,w,d,h,c,cell,j);
const bxTiles=(x,y,z,w,d,h,c)=>bxv(x,y,z,w,d,h,c,.05);
const q=(x,y,l)=>l.map(a=>bx(x+a[0]/4,y+a[1]/4,a[2]/4,a[3]/4,a[4]/4,a[5]/4,a[6])).join('');
const P=(x,y,a)=>[sx(x+a[0]/4,y+a[1]/4).toFixed(1),sy(x+a[0]/4,y+a[1]/4,a[2]/4).toFixed(1)];
const ln=(x,y,a,b,c,w=1.6)=>{const[p,r]=[P(x,y,a),P(x,y,b)];return `<line x1="${p[0]}" y1="${p[1]}" x2="${r[0]}" y2="${r[1]}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`};
const A=(k,t,o,c,x='')=>`<g class="a" style="--k:${k};--t:${t}s;--o:${o};${x}">${c}</g>`;
const AP=(k,t,x,y,a,c,r='8deg')=>{const p=P(x,y,a);return A(k,t,`${p[0]}px ${p[1]}px`,c,`transform-box:view-box;--r:${r}`)};
const sd=(x,y,w)=>poly([[x,y,.02],[x+w,y,.02],[x+w,y+w,.02],[x,y+w,.02]],'rgba(0,0,0,.28)','none',0);
const boot=(x,y,c='#ef4444')=>q(x,y,[[0,0,0,2.2,1.6,1.2,c],[0,0,1.2,1.2,1.6,1.8,c]]);
const bucket=(x,y)=>q(x,y,[[0,0,0,2.6,2.6,2.2,'#94a3b8'],[.3,.3,2.2,2,2,.4,'#64748b']]);


/* ===== postacie – każda pracuje w pętli ===== */
const SK='#f4c99a',DK='#1e293b';
const HU=(s,t,p)=>[[1,2,0,2,2,3,p],[4,2,0,2,2,3,p],[1,1.5,3,5,3,4,t],[1.5,1.5,7,4,4,4,s],[2,5.5,8.8,.9,.3,1,DK],[4,5.5,8.8,.9,.3,1,DK],[6,2,3,1.4,1.5,3.6,s],[-.4,2,3,1.4,1.5,3.6,s]];


/* ===== elementy w stylu domku: biel, błękit, terakota, różowa bugenwilla ===== */
const WH='#f4f1ea',BL='#2a6bd1',TC='#c9703b';
const PKS=['#e0457e','#ee6aa0','#c93270','#f58fb8'],GRS=['#4f9a3c','#6bb34a','#3f8530'];
const panL=(x,Y,z,w,h,c,cell=.3,j=.05)=>{
  const nx=Math.max(1,Math.round(w/cell)),nz=Math.max(1,Math.round(h/cell)),dx=w/nx,dz=h/nz,b=sh(c,-.2),s=sh(c,-.4);let o='';
  for(let a=0;a<nx;a++)for(let k=0;k<nz;k++){const X=x+a*dx,Z=z+k*dz;
    o+=poly([[X,Y,Z],[X+dx,Y,Z],[X+dx,Y,Z+dz],[X,Y,Z+dz]],sh(b,(hs(X*3,Y,Z*3)-.5)*2*j),s)}
  return o};
const panR=(X,y,z,d,h,c,cell=.3,j=.05)=>{
  const ny=Math.max(1,Math.round(d/cell)),nz=Math.max(1,Math.round(h/cell)),dy=d/ny,dz=h/nz,b=sh(c,-.05),s=sh(c,-.4);let o='';
  for(let a=0;a<ny;a++)for(let k=0;k<nz;k++){const Y=y+a*dy,Z=z+k*dz;
    o+=poly([[X,Y,Z],[X,Y+dy,Z],[X,Y+dy,Z+dz],[X,Y,Z+dz]],sh(b,(hs(X,Y*3,Z*3)-.5)*2*j),s)}
  return o};
const wallB=(x,y,w,d,h)=>bxv(x,y,0,w,d,h,WH,.035)+bxv(x-.06,y-.06,h,w+.12,d+.12,.14,'#ffffff',.02);
const doorL=(x,Y)=>bx(x-.12,Y,0,1.14,.12,.08,'#ddd3bd')+panL(x,Y,.08,.9,1.45,BL,.3,.05)
  +panL(x+.16,Y,.3,.58,.5,sh(BL,-.16),.6,.03)+panL(x+.16,Y,.95,.58,.4,sh(BL,-.16),.6,.03)+bx(x+.7,Y,.78,.09,.07,.09,'#d9a521');
const winL=(x,Y,z,w=.9,h=.9)=>panL(x,Y,z,w,h,'#3d5f8f',.45,.04)+panL(x+w/2-.03,Y,z,.06,h,WH,.3,0)+bx(x-.1,Y,z-.1,w+.2,.14,.1,WH)
  +panL(x-.42,Y,z-.05,.36,h+.1,BL,.36,.05)+panL(x+w+.06,Y,z-.05,.36,h+.1,BL,.36,.05);
const winR=(X,y,z,d=.9,h=.9)=>panR(X,y,z,d,h,'#3d5f8f',.45,.04)+panR(X,y+d/2-.03,z,.06,h,WH,.3,0)+bx(X,y-.1,z-.1,.14,d+.2,.1,WH)
  +panR(X,y-.42,z-.05,.36,h+.1,BL,.36,.05)+panR(X,y+d+.06,z-.05,.36,h+.1,BL,.36,.05);
const vineL=(x,Y,z,w,h,n)=>{const cols=[...PKS,...PKS,...PKS,...GRS],it=[];
  for(let i=0;i<n;i++){const s=.3+.16*hs(i,x,9);it.push([x+hs(i,Y,7)*(w-s),Math.max(0,z+h*(1-Math.pow(hs(i,z,3),1.6))-s*.5),s,cols[Math.floor(hs(i,x+z,5)*cols.length)]])}
  it.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);return it.map(a=>bx(a[0],Y,a[1],a[2],.3,a[2],a[3])).join('')};
const vineR=(X,y,z,d,h,n,cols0)=>{const cols=cols0||[...PKS,...PKS,...PKS,...GRS],it=[];
  for(let i=0;i<n;i++){const s=.3+.16*hs(i,y,9);it.push([y+hs(i,X,7)*(d-s),Math.max(0,z+h*(1-Math.pow(hs(i,z,3),1.6))-s*.5),s,cols[Math.floor(hs(i,y+z,5)*cols.length)]])}
  it.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);return it.map(a=>bx(X,a[0],a[1],.3,a[2],a[2],a[3])).join('')};
const pot=(x,y,leaf='#4aa84f',bloom='#e0457e')=>bxv(x+.06,y+.06,0,.68,.68,.42,TC,.06,.35)+bxv(x,y,.42,.8,.8,.2,sh(TC,.1),.05,.4)
  +bx(x+.1,y+.1,.62,.6,.6,.06,'#5a3822')
  +bx(x+.12,y+.15,.68,.26,.26,.3,leaf)+bx(x+.42,y+.12,.68,.26,.26,.24,sh(leaf,.1))+bx(x+.2,y+.42,.68,.26,.26,.26,sh(leaf,-.08))+bx(x+.42,y+.42,.68,.26,.26,.34,leaf)
  +bx(x+.1,y+.12,.98,.26,.26,.22,bloom)+bx(x+.4,y+.38,1.02,.28,.28,.22,sh(bloom,.12))+bx(x+.26,y+.24,1.15,.24,.24,.2,sh(bloom,.2));
const bed=(x,y,w,d,cols)=>{let o=bxv(x,y,0,w,d,.18,'#7a5230',.05,.4);
  for(let i=0;i<Math.floor(w/.5);i++)for(let j=0;j<Math.floor(d/.5);j++){const X=x+.1+i*.5,Y=y+.1+j*.5,t=.18+.28+.14*hs(i,j,2),c=cols[(i*3+j*5+i*j)%cols.length];
    o+=bx(X+.12,Y+.12,.18,.1,.1,t-.18,'#4f9a3c')+bx(X,Y,t,.34,.34,.2,c)+bx(X+.08,Y+.08,t+.2,.18,.18,.12,sh(c,.25))}
  return o};
const blob=(cx,cy,cz,n,s,cols,half=0)=>{
  const inS=(i,j,k)=>i*i+j*j+(k*1.1)*(k*1.1)<=n*n+.4&&(!half||k>=0);let o='';
  for(let i=-n;i<=n;i++)for(let j=-n;j<=n;j++)for(let k=-n;k<=n;k++){
    if(!inS(i,j,k)||(inS(i+1,j,k)&&inS(i,j+1,k)&&inS(i,j,k+1)))continue;
    const c=cols[Math.floor(hs(cx*5+i,cy*5+j,cz*5+k)*cols.length)];
    o+=bx(cx+i*s-s/2,cy+j*s-s/2,cz+k*s-s/2,s,s,s,sh(c,k*.02))}
  return o};
const tree=(x,y,cols,n=3,trunk=1.0)=>bxv(x,y,0,.6,.6,trunk+.4,'#8a5a36',.06)
  +A('rock','4.2','50% 100%',blob(x+.3,y+.3,trunk+n*.4,n,.5,cols),'--r:1.4deg');
const pine=(x,y,c)=>{let o=bxv(x,y,0,.5,.5,.9,'#6b4423',.05),L=[[2.4,.8,.6],[1.9,1.4,.6],[1.4,2.0,.6],[.9,2.6,.6],[.5,3.2,.5]],s='';
  for(const[w,z,h]of L){const a=x+.25-w/2,b=y+.25-w/2;s+=bxv(a,b,z,w,w,h,c,.08)+bx(a+.1,b+.1,z+h,w-.2,w-.2,.14,'#ffffff',.5,.02)}
  return o+A('rock','4.6','50% 100%',s,'--r:1.2deg')};
const pumpkin=(x,y)=>bx(x,y,0,.9,.9,.34,'#ea7a14',.45,.05)+bx(x+.1,y+.1,.34,.7,.7,.3,'#f28a22',.35,.05)+bx(x+.38,y+.38,.64,.16,.16,.22,'#4d7c0f');
const leaves=(x,y,w,d,n,cols)=>{const it=[];for(let i=0;i<n;i++)it.push([x+hs(i,x,1)*w,y+hs(i,y,2)*d,cols[i%cols.length]]);
  it.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);return it.map(a=>bx(a[0],a[1],0,.34,.34,.08,a[2])).join('')};
const leafPile=(x,y,c=['#d9531e','#e8902a','#c0392b'])=>bxv(x,y,0,1.5,1.5,.3,c[0],.12,.5)+bxv(x+.25,y+.25,.3,1,1,.3,c[1],.12,.5)+bxv(x+.5,y+.5,.6,.5,.5,.25,c[2],.1,.5);
const rockV=(x,y,c)=>bxv(x,y,0,.95,.75,.52,c,.05,.5)+bxv(x+.16,y+.12,.52,.62,.5,.32,sh(c,.12),.05,.5);
const snowPile=(x,y)=>bxv(x,y,0,1.5,1.5,.3,'#ffffff',.025,.5)+bxv(x+.3,y+.3,.3,.9,.9,.25,'#ffffff',.025,.5);
const palm=(x,y)=>{let o='';for(let k=0;k<6;k++)o+=bx(x+.1*k,y,.45*k,.42,.42,.45,k%2?'#b98a52':'#a87a45',.5,.03);
  const cx=x+.5+.21,cy=y+.21,cz=2.7,it=[[0,0,.3,'#2fae5a'],[0,0,0,'#3cc06a']];
  [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]].forEach(([a,b],d)=>{for(let m=1;m<=3;m++)it.push([a*m*.45,b*m*.45,[.28,.2,-.1,-.4][m],d%2?'#2ea652':'#43c673'])});
  it.sort((p,q)=>p[0]-q[0]||p[1]-q[1]||p[2]-q[2]);
  o+=bx(cx-.1,cy+.2,2.35,.3,.3,.3,'#7c4a21')+bx(cx+.15,cy-.1,2.35,.3,.3,.3,'#8a5428');
  return o+A('rock','3.6','50% 100%',it.map(a=>bx(cx+a[0]-.25,cy+a[1]-.25,cz+a[2],.5,.5,.3,a[3])).join(''),'--r:3deg')};
const parasol=(x,y)=>{let o=bx(x-.05,y-.05,0,.12,.12,2.3,'#e8e4d8');
  for(let i=0;i<4;i++)o+=bx(x-.8+i*.4,y-.8,2.3,.4,1.6,.22,i%2?WH:BL);
  for(let i=0;i<2;i++)o+=bx(x-.4+i*.4,y-.4,2.52,.4,.8,.2,i%2?BL:WH);
  return o+bx(x-.1,y-.1,2.72,.22,.22,.2,BL)};
const towel=(x,y)=>{let o='';for(let i=0;i<6;i++)o+=bx(x,y+i*.3,0,1.3,.3,.06,i%2?WH:'#e0457e');return o};
const ball=(x,y)=>bx(x,y,0,.7,.7,.25,'#e53935')+bx(x-.05,y-.05,.25,.8,.8,.3,WH)+bx(x,y,.55,.7,.7,.25,BL);
const board=(x,y)=>bx(x,y,0,.42,.16,2.1,'#f7f2e4',.5,.02)+bx(x-.01,y-.01,1.0,.44,.18,.3,BL);
const tower=(x,y)=>{
  const pst=(a,b)=>bx(x+a,y+b,0,.24,.24,2.0,'#efe8d8',.5,.03);
  let o=bx(x+.24,y+1.96,.7,1.72,.24,.14,BL)+bx(x+1.96,y+.24,.7,.24,1.72,.14,BL)+pst(0,0)+pst(0,1.96)+pst(1.96,0)+pst(1.96,1.96);
  o+=bx(x+.55,y+2.2,0,.09,.1,2.15,'#c9b88e')+bx(x+1.3,y+2.2,0,.09,.1,2.15,'#c9b88e');
  for(let k=0;k<5;k++)o+=bx(x+.55,y+2.2,.3+k*.38,.84,.1,.07,'#c9b88e');
  o+=bxv(x-.15,y-.15,2,2.5,2.5,.2,sh(WH,-.03),.03);
  o+=bxv(x+.15,y+.15,2.2,1.9,1.9,1.5,WH,.035);
  const Y=y+2.05,X=x+2.05;
  o+=panL(x+.3,Y,2.28,.8,1.2,BL,.3,.05)+panL(x+.44,Y,2.5,.52,.4,sh(BL,-.16),.6,.03)+bx(x+.98,Y,2.85,.08,.06,.08,'#d9a521');
  o+=panL(x+1.32,Y,2.95,.5,.16,'#e53935',.5,.02)+panL(x+1.49,Y,2.78,.16,.5,'#e53935',.5,.02);
  o+=winR(X,y+.55,2.65,.8,.8);
  o+=bxv(x-.05,y-.05,3.7,2.3,2.3,.22,BL,.04)+bxv(x+.35,y+.35,3.92,1.5,1.5,.18,WH,.03);
  o+=bx(x+1.05,y+1.05,4.1,.08,.08,1.2,'#e9e3d3')+A('rock','2.2','0% 50%',bx(x+1.13,y+1.0,4.85,.75,.06,.4,'#e53935'),'--r:6deg');
  return o};
const igloo=(x,y)=>{const cx=x+1.6,cy=y+1.6;
  return blob(cx,cy,0,4,.4,['#ffffff','#f3f8fd','#e8f1fa'],1)
   +bxv(cx-.65,cy+.9,0,1.3,1.1,1.6,'#f7fbff',.03,.4)+bxv(cx-.7,cy+.85,1.6,1.4,1.2,.14,'#ffffff',.02)
   +doorL(cx-.45,cy+2.0)};
/* ===== dioramy pór roku ===== */
const BFLY=(x,y,z,c)=>A('bob','1.8','50% 50%',bx(x,y,z,.14,.34,.1,c)+bx(x+.14,y+.04,z+.06,.2,.26,.06,sh(c,.2)),'');

const cloud=(x,y,z,c='#fff')=>bxv(x,y,z,2.6,1.6,.9,c,.02)+bxv(x+.5,y-.3,z+.9,1.8,1.4,.7,c,.02)+bxv(x+1.6,y+.2,z+.5,1.6,1.4,.9,c,.02);

function island(S,i){
 let o=bx(2.7,2.7,-4.7,2.6,2.6,1,sh(S.r,-.12),.5,.06,1)+bx(1.5,1.5,-3.7,5,5,1.2,S.r,.5,.06,1)
  +bx(.5,.5,-2.5,7,7,1.3,S.d,.5,.05,1)+bx(0,0,-1.2,8,8,1.2,S.s,.5,.035,1);
 for(let x=0;x<8;x++)for(let y=0;y<8;y++){
  const liq=S.lq&&S.lq(x,y),z=liq?S.lz:0,st=!liq&&S.stone&&S.stone(x,y),wet=!liq&&S.wet&&S.wet(x,y);
  for(let a=0;a<2;a++)for(let b=0;b<2;b++){
   let base;
   if(liq)base=S.lc[(x+y+a+b)&1];
   else if(wet)base='#e3c88c';
   else if(st)base=S.p[((x+y)&1)^(hs(x*2+a,y*2+b,4)>.86?1:0)];
   else base=S.t[(x+y)&1];
   const c=sh(base,(hs(x*2+a,y*2+b,i+1)-.5)*(st?.07:.1));
   const X=x+a/2,Y=y+b/2;
   o+=poly([[X,Y,z],[X+.5,Y,z],[X+.5,Y+.5,z],[X,Y+.5,z]],c,sh(c,-.2),.4);
  }
  if(liq&&(x*3+y)%2==0)o+=`<rect class="a" style="--k:tw;--t:${2+(x+y)%3}s;--o:50% 50%" x="${sx(x+.4,y+.4).toFixed(0)}" y="${sy(x+.4,y+.4,z).toFixed(0)}" width="9" height="2.5" fill="#ffffff" opacity=".75"/>`;
 }
 return o}


const E={W,H,OX,OY,sx,sy,pt,sh,hs,poly,bx,bxv,bxTiles,q,P,ln,A,AP,sd,boot,bucket,SK,DK,HU,WH,BL,TC,PKS,GRS,panL,panR,wallB,doorL,winL,winR,vineL,vineR,pot,bed,blob,tree,pine,pumpkin,leaves,leafPile,rockV,snowPile,palm,parasol,towel,ball,board,tower,igloo,BFLY,cloud,island};
D.E=E;
const R={tla:{},postacie:{},pogoda:{}},TX={};
D.reg=(k,id,f)=>{R[k][id]=f;};
D.has=(k,id)=>!!(R[k]&&R[k][id]);
D.get=(k,id)=>{const r=R[k]&&R[k][id];if(!r)return null;if(typeof r==='function'){const o=r(E);R[k][id]=o;if(o.css)D.css(o.css);return o}return r};
let st=null;
D.css=x=>{if(typeof document==='undefined')return;if(!st){st=document.getElementById('dd-css');if(!st){st=document.createElement('style');st.id='dd-css';st.textContent=BASE_CSS;document.head.appendChild(st)}}if(x&&st.textContent.indexOf(x)<0)st.textContent+=x};
D.VIEW=[72,70,240,160];
D.setCK=v=>{CK=v};
const ENT={'z-lewej':'anim-fly-left','z-prawej':'anim-fly-right','z-dolu':'anim-pop-floor','z-gory':'anim-fall-top','po-luku':'anim-swoop-in'};
D.entries=Object.keys(ENT);
D.sky=sc=>{const s=D.get('tla',sc.tlo);return s?s.sky:['#7ec4f2','#eaf6ff']};
D.svg=sc=>{
  const S=D.get('tla',sc.tlo),hero=D.get('postacie',sc.hero),wea=D.get('pogoda',sc.wea);
  if(!S||!hero||!wea)return'';
  D.css();
  const V=D.VIEW;CROP=[V[0]-24,V[1]-24,V[0]+V[2]+24,V[1]+V[3]+24];
  try{
    const deco=S.deco().sort((a,b)=>a[0]-b[0]),idx=S.idx||0,hx=3.5,hy=3.5;
    const back=deco.filter(a=>a[0]<7.5).map(a=>a[1]).join(''),front=deco.filter(a=>a[0]>=7.5).map(a=>a[1]).join('');
    const motes=[...Array(8)].map((_,i)=>`<rect class="a" style="--k:tw;--t:${2+i%4}s;--o:50% 50%;animation-delay:-${i*.6}s" x="${V[0]+(i*61)%V[2]}" y="${V[1]+(i*37)%70}" width="3" height="3" fill="#fff"/>`).join('');
    const ec=ENT[sc.entry]||'';
    return `<svg class="dd-svg" viewBox="${V.join(' ')}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible" role="img" aria-label="${(hero.name&&hero.name.pl)||''}">`
     +`<defs><linearGradient id="dd-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${S.sky[0]}"/><stop offset="1" stop-color="${S.sky[1]}"/></linearGradient>`
     +`<radialGradient id="dd-glow"><stop offset="0" stop-color="#fff6b8" stop-opacity=".9"/><stop offset="1" stop-color="#fff6b8" stop-opacity="0"/></radialGradient></defs>`
     +`<rect x="${V[0]-600}" y="${V[1]-600}" width="${V[2]+1200}" height="${V[3]+1200}" fill="url(#dd-sky)"/>`
     +motes+`<g class="isle"><g>${island(S,idx)}</g><g>${back}</g><g class="entry ${ec}">${hero.f(hx-hero.o[0]/8,hy-hero.o[1]/8)}</g><g>${front}</g></g><g>${wea.f()}</g></svg>`;
  }finally{CROP=null}
};
/* ----- teksty ----- */
D.texts=(l,o)=>{TX[l]=Object.assign(TX[l]||{},o)};
D.hasTexts=l=>!!TX[l];
const form=(l,n,f)=>{n=Math.abs(n);if(l==='pl'){if(n===1)return f[0];const a=n%10,b=n%100;return(a>=2&&a<=4&&!(b>=12&&b<=14))?(f[1]||f[f.length-1]):f[f.length-1]}return n===1?f[0]:(f[1]||f[0])};
D.fmt=(l,tpl,p)=>String(tpl).replace(/\{(\w+)(?:\|([^}]+))?\}/g,(m,k,f)=>{const v=p&&p[k];if(v===undefined||v===null)return'';return f?v+' '+form(l,+v,f.split(',')):String(v)});
D.text=(l,t,r,p)=>{const a=(TX[l]||{})[t];if(!a||!a.length)return'';return D.fmt(l,a[Math.min(a.length-1,Math.floor((r||0)*a.length))],p)};
D.name=(k,id,l)=>{const o=D.get(k,id);return o&&o.name?(o.name[l]||o.name.pl||id):id};
D.cap=(id,l)=>{const o=D.get('postacie',id);return o&&o.cap?(o.cap[l]||o.cap.pl||''):''};
const BASE_CSS=`/* animacje – wszystkie ruchome części */
.a{transform-box:fill-box;transform-origin:var(--o);animation:var(--k) var(--t) ease-in-out infinite}
@keyframes bob{50%{transform:translateY(-3px)}}
@keyframes hop{30%{transform:translateY(-9px) rotate(-3deg)}55%{transform:none}75%{transform:translateY(-3px)}}
@keyframes rock{0%,100%{transform:rotate(calc(var(--r,8deg)*-1))}50%{transform:rotate(var(--r,8deg))}}
@keyframes pump{0%,100%{transform:scale(.85)}50%{transform:scale(1.15)}}
@keyframes slide{50%{transform:translateX(7px)}}
@keyframes sweep{0%,100%{transform:rotate(-16deg) translateX(-2px)}50%{transform:rotate(18deg) translateX(5px)}}
@keyframes catch-fly{
  0%{opacity:0;transform:translate(16px,-10px)}
  20%{opacity:1;transform:translate(10px,-4px)}
  55%{opacity:1;transform:translate(2px,1px)}
  80%,100%{opacity:0;transform:translate(-3px,4px) scale(.4)}
}
@keyframes drop{0%{opacity:0;transform:translateY(0)}30%{opacity:1}100%{opacity:0;transform:translateY(18px)}}
@keyframes fl{0%{opacity:0;transform:translate(-14px,-6px) rotate(0)}25%{opacity:1}100%{opacity:0;transform:translate(34px,30px) rotate(160deg)}}
@keyframes rain{0%{opacity:0;transform:translate(0,-10px)}20%{opacity:1}100%{opacity:0;transform:translate(-8px,48px)}}
@keyframes snow{0%{opacity:0;transform:translate(0,-10px)}20%{opacity:1}100%{opacity:0;transform:translate(14px,60px)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes tw{0%,100%{opacity:.2}50%{opacity:1}}
@keyframes drift{50%{transform:translateX(14px)}}
@keyframes isle{50%{transform:translateY(-5px)}}
@keyframes rb{0%,100%{opacity:.75}50%{opacity:1}}

/* Sekwencja wędkarza: 1) wyciąga kalosz z wody, 2) przenosi nad wiadro, 3) zarzuca z powrotem */
@keyframes fish-rod{
  0%,100%{transform:rotate(4deg)}
  28%{transform:rotate(-13deg)}
  58%{transform:rotate(9deg)}
  82%{transform:rotate(-16deg)}
}
@keyframes fish-boot{
  0%{opacity:0;transform:translate(18px,16px) rotate(14deg)}
  15%{opacity:1;transform:translate(14px,4px) rotate(8deg)}
  34%{opacity:1;transform:translate(4px,-11px) rotate(-4deg)}
  56%{opacity:1;transform:translate(-12px,-4px) rotate(-14deg)}
  68%{opacity:.35;transform:translate(-15px,6px) rotate(-8deg)}
  75%,100%{opacity:0;transform:translate(18px,16px) rotate(14deg)}
}
@keyframes fish-drop{
  0%,18%{opacity:0;transform:translate(14px,2px)}
  32%{opacity:1;transform:translate(12px,10px)}
  52%{opacity:0;transform:translate(8px,22px)}
  100%{opacity:0}
}

/* Kowal: zamach młotkiem w dół na rozgrzany miecz i rozprysk iskier */
@keyframes smith-hammer{
  0%,100%{transform:rotate(12deg)}
  35%{transform:rotate(-38deg)}
  55%{transform:rotate(24deg)}
  78%{transform:rotate(4deg)}
}
@keyframes smith-sparks{
  0%,48%{opacity:0;transform:translate(0,0) scale(.6)}
  58%{opacity:1;transform:translate(8px,-12px) scale(1.1)}
  85%{opacity:0;transform:translate(20px,-22px) scale(.5)}
  100%{opacity:0}
}

/* Górnik: zamach kilofem w górę i uderzenie w ziemię + odpryski */
@keyframes miner-pick{
  0%,100%{transform:rotate(8deg)}
  32%{transform:rotate(-42deg)}
  54%{transform:rotate(28deg)}
  76%{transform:rotate(4deg)}
}
@keyframes miner-chips{
  0%,48%{opacity:0;transform:translate(0,0)}
  58%{opacity:1;transform:translate(6px,-10px)}
  85%{opacity:0;transform:translate(16px,-18px)}
  100%{opacity:0}
}

.isle{animation:isle 6s ease-in-out infinite}
.fa{animation:var(--k) var(--t) linear infinite}
.sw{animation:rock 4s ease-in-out infinite}

/* Losowe sposoby wejścia postaci */
@keyframes inL{0%{opacity:0;transform:translate(-150px,-45px) rotate(-10deg)}70%{opacity:1;transform:translate(6px,3px) rotate(2deg)}100%{opacity:1;transform:none}}
@keyframes inR{0%{opacity:0;transform:translate(150px,-45px) rotate(10deg)}70%{opacity:1;transform:translate(-6px,3px) rotate(-2deg)}100%{opacity:1;transform:none}}
@keyframes inU{0%{opacity:0;transform:translateY(45px) scale(.72)}70%{opacity:1;transform:translateY(-5px) scale(1.03)}100%{opacity:1;transform:none}}
@keyframes inD{0%{opacity:0;transform:translateY(-95px) scale(.85)}72%{opacity:1;transform:translateY(5px) scale(1.02)}100%{opacity:1;transform:none}}
@keyframes inDrop{0%{opacity:0;transform:translate(35px,-85px) rotate(14deg) scale(.8)}68%{opacity:1;transform:translate(-3px,4px) rotate(-3deg)}100%{opacity:1;transform:none}}

.entry{transform-origin:200px 215px}
.anim-fly-left{animation:inL .85s cubic-bezier(.22,1,.36,1) forwards}
.anim-fly-right{animation:inR .85s cubic-bezier(.22,1,.36,1) forwards}
.anim-pop-floor{animation:inU .75s cubic-bezier(.22,1,.36,1) forwards}
.anim-fall-top{animation:inD .8s cubic-bezier(.22,1,.36,1) forwards}
.anim-swoop-in{animation:inDrop .85s cubic-bezier(.22,1,.36,1) forwards}

@media (prefers-reduced-motion:reduce){.a,.fa,.isle,.sw,.entry{animation:none!important}}

@keyframes owl-page{0%,100%{transform:scaleX(1)}38%{transform:scaleX(1)}55%{transform:scaleX(-1)}70%{transform:scaleX(-1)}86%{transform:scaleX(1)}}
@keyframes owl-rise{0%{opacity:0;transform:translate(0,0) scale(.6)}25%{opacity:1}100%{opacity:0;transform:translate(3px,-22px) scale(1)}}`;
})(typeof window!=='undefined'?window:globalThis);
