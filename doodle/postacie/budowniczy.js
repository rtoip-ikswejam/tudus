Doodle.reg('postacie','budowniczy',E=>{
const {W,H,OX,OY,sx,sy,pt,sh,hs,poly,bx,bxv,bxTiles,q,P,ln,A,AP,sd,boot,bucket,SK,DK,HU,WH,BL,TC,PKS,GRS,panL,panR,wallB,doorL,winL,winR,vineL,vineR,pot,bed,blob,tree,pine,pumpkin,leaves,leafPile,rockV,snowPile,palm,parasol,towel,ball,board,tower,igloo,BFLY,cloud}=E;
const MAN=HU(SK,'#f97316','#334155').slice(0,6).concat([[1,4.5,4.6,5,.3,.7,'#fef9c3'],[1.3,1.3,10.8,5.4,4.6,1.4,'#facc15'],[1,1,10.5,6,5.2,.4,'#eab308'],[1.3,5.5,10.4,5.4,1.4,.4,'#ca8a04']]);
const GROUND=[[1.8,5.6,0,5.4,4.4,.25,'#475569']];
const JACK=[[3.4,6.1,.4,1.6,1.6,5.4,'#64748b'],[2,5.9,5.8,4.4,1,.8,'#1f2937'],[3.9,6.6,0,.7,.7,.5,'#cbd5e1']];
const COMP=[[9.8,5.2,0,4.6,3.6,3.2,'#ef4444'],[10.2,5.6,3.2,3.8,2.8,.6,'#991b1b'],[10.2,8.8,0,.9,.4,1.3,'#1f2937']];
const CHIPS=[[2.2,7.6,.8,.8,.8,.8,'#94a3b8'],[5.6,7.8,1.2,.7,.7,.7,'#64748b'],[3.8,8.4,1.6,.7,.7,.7,'#cbd5e1']];
const F=(x,y)=>sd(x,y,2.4)+sd(x+2.6,y+1,2)+q(x,y,GROUND)+q(x,y,COMP)
 +ln(x,y,[5.9,6.4,6.4],[10.2,6.6,3],'#1f2937',1.8)
 +A('bob','3','50% 100%',q(x,y,MAN))
 +A('jack-shake','1.6','50% 100%',ln(x,y,[6.6,3,6.8],[5.9,6.2,6.2],'#f97316',2.6)+ln(x,y,[.2,3,6.8],[2.4,6.2,6.2],'#f97316',2.6)+q(x,y,JACK))
 +A('jack-chips','1.6','50% 50%',q(x,y,CHIPS));
return {id:'budowniczy',name:{pl:"Budowniczy",en:"Builder"},
 cap:{pl:"Kuje nawierzchnię młotem pneumatycznym, aż sypią się okruchy.",en:"Breaks up the pavement with a jackhammer until the chips fly."},
 css:`@keyframes jack-shake{0%,100%{transform:translateY(0)}10%{transform:translateY(2.6px)}20%{transform:translateY(0)}32%{transform:translateY(2.2px)}42%{transform:translateY(0)}}@keyframes jack-chips{0%,6%{opacity:0;transform:translate(0,0)}12%{opacity:1;transform:translate(3px,-8px)}34%{opacity:1;transform:translate(9px,-14px)}52%{opacity:0;transform:translate(14px,-4px)}100%{opacity:0}}`,
 o:[14,10],f:F};
});
