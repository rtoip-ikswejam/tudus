Doodle.reg('postacie','balwan',E=>{
const {W,H,OX,OY,sx,sy,pt,sh,hs,poly,bx,bxv,bxTiles,q,P,ln,A,AP,sd,boot,bucket,SK,DK,HU,WH,BL,TC,PKS,GRS,panL,panR,wallB,doorL,winL,winR,vineL,vineR,pot,bed,blob,tree,pine,pumpkin,leaves,leafPile,rockV,snowPile,palm,parasol,towel,ball,board,tower,igloo,BFLY,cloud}=E;
const TRUNK=[[-.3,-.3,0,6.6,6.6,4.2,'#e3ecff'],[.6,.6,4.2,4.8,4.8,3,'#e9f0ff'],[2.4,5.4,5.4,.7,.3,.7,'#7c3aed'],[2.4,5.4,3.8,.7,.3,.7,'#7c3aed']];
const COLLAR=[[.85,.85,6.6,4.3,4.3,.8,'#fb7185']];
const HEAD=[[1,1,7.2,4,4,3.6,'#f2f6ff'],[1.6,5,8.9,.9,.3,.9,DK],[3.5,5,8.9,.9,.3,.9,DK],[2.5,5,8,.9,1.8,.8,'#f97316'],[1.6,5,7.5,.4,.3,.4,DK],[2.2,5,7.2,.4,.3,.4,DK],[3,5,7.2,.4,.3,.4,DK],[3.6,5,7.5,.4,.3,.4,DK]];
const TAIL=[[5.2,3.5,3.2,1,1.2,4.2,'#f43f5e']];
const HATB=[[.75,.75,10.9,4.5,4.5,.4,'#0f766e'],[1.4,1.4,11.3,3.2,3.2,2,'#14b8a6'],[1.4,1.4,11.5,3.2,3.2,.55,'#fbbf24']];
const PILE=[[12.4,7.6,0,3.8,3.2,1,'#dbeafe'],[13.1,8.1,1,2.4,1.8,.6,'#eff6ff'],[13.4,7.9,.5,1,1,.5,'#f97316']];
const F=(x,y)=>{const pv=P(x,y,[7.4,4.6,5.2]);
 const broom=ln(x,y,[7.4,4.6,5.2],[12,7.2,.5],'#16a34a',2.6)+q(x,y,[[10.9,6.6,0,2.8,2.1,.8,'#eab308'],[11.2,6.8,.8,2.2,1.6,.3,'#ca8a04']]);
 return sd(x,y,2.2)+q(x,y,PILE)
  +A('bob','3','50% 100%',ln(x,y,[.6,3,5.5],[-1.6,3.6,6.6],'#78350f',2.2)+q(x,y,TRUNK)+q(x,y,COLLAR)+q(x,y,HEAD)+q(x,y,TAIL)+q(x,y,HATB)+ln(x,y,[5.4,3,5.5],[7.4,4.6,5.2],'#78350f',2.2))
  +A('sweep','2.2',`${pv[0]}px ${pv[1]}px`,broom,'transform-box:view-box')
  +A('bw-flakes','2.2','50% 50%',q(x,y,[[12,6.2,1.2,.8,.8,.8,'#f8fafc'],[13.4,7,1.8,.7,.7,.7,'#f97316'],[11.6,7.2,1.4,.7,.7,.7,'#bfdbfe']]))};
return {id:'balwan',name:{pl:"Bałwan Zamiatacz",en:"Sweeping Snowman"},
 cap:{pl:"Zamiata miotłą, aż śnieg i liście lecą na kupkę.",en:"Sweeps with a broom until the snow and leaves fly into a pile."},
 css:`@keyframes bw-flakes{0%,40%{opacity:0;transform:translate(0,0)}52%{opacity:1;transform:translate(5px,-9px)}80%{opacity:1;transform:translate(12px,-13px)}100%{opacity:0;transform:translate(16px,-4px)}}`,
 hide:["igloo"],
 o:[15,10],f:F};
});
