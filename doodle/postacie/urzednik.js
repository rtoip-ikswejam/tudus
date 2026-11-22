Doodle.reg('postacie','urzednik',E=>{
const {W,H,OX,OY,sx,sy,pt,sh,hs,poly,bx,bxv,bxTiles,q,P,ln,A,AP,sd,boot,bucket,SK,DK,HU,WH,BL,TC,PKS,GRS,panL,panR,wallB,doorL,winL,winR,vineL,vineR,pot,bed,blob,tree,pine,pumpkin,leaves,leafPile,rockV,snowPile,palm,parasol,towel,ball,board,tower,igloo,BFLY,cloud}=E;
const MAN=HU(SK,'#475569','#334155').filter((_,i)=>i!==6).concat([[1.3,1.3,10.8,5.4,4.4,1.2,'#6b7280'],[3,4.5,3.6,1,.4,3.6,'#dc2626'],[2.2,4.5,6.6,2.6,.35,1.3,'#f8fafc']]);
const DESK=[[-2,5.3,0,11.5,4.6,3.7,'#92400e'],[-2.2,5.1,3.7,12,5,.8,'#b45309']];
const PAPERS=[[-.8,6.4,4.5,3.2,2.6,.9,'#fffbeb'],[-.6,6.6,5.4,2.8,2.2,.5,'#e5e7eb']];
const SHEET=[[4.6,6.2,4.5,3.8,3.2,.18,'#ffffff']];
const CHECK=[[5.3,7.1,4.7,.55,.55,.12,'#16a34a'],[5.8,7.6,4.7,.55,.55,.12,'#16a34a'],[6.3,7.1,4.7,.55,.55,.12,'#16a34a'],[6.8,6.6,4.7,.55,.55,.12,'#16a34a'],[7.3,6.1,4.7,.55,.55,.12,'#16a34a']];
const STAMP=[[5.1,6.4,6.4,1.9,1.9,1,'#b91c1c'],[5.6,6.9,7.4,.9,.9,2,'#7c2d12'],[5.3,6.6,9.4,1.5,1.5,.7,'#991b1b']];
const F=(x,y)=>sd(x,y,2.6)+q(x,y,MAN)+q(x,y,DESK)+q(x,y,PAPERS)+q(x,y,SHEET)
 +A('clerk-mark','2.2','50% 50%',q(x,y,CHECK))
 +A('clerk-stamp','2.2','50% 0%',ln(x,y,[6.8,3,7],[6.1,7,9.8],'#475569',2.6)+q(x,y,STAMP));
return {id:'urzednik',name:{pl:"Urzędnik z Pieczątką",en:"Clerk with a Stamp"},
 cap:{pl:"Pieczętuje papiery miarowym stuknięciem, a na każdym ląduje zielony ptaszek.",en:"Stamps papers with a steady thump and every one gets a green check mark."},
 css:`@keyframes clerk-stamp{0%,100%{transform:translateY(-6px)}36%{transform:translateY(3px)}50%{transform:translateY(3px)}74%{transform:translateY(-6px)}}@keyframes clerk-mark{0%,40%{opacity:0}48%,88%{opacity:1}100%{opacity:0}}`,
 o:[8,8],f:F};
});
