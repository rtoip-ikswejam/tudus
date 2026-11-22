Doodle.reg('postacie','krasnal',E=>{
const {W,H,OX,OY,sx,sy,pt,sh,hs,poly,bx,bxv,bxTiles,q,P,ln,A,AP,sd,boot,bucket,SK,DK,HU,WH,BL,TC,PKS,GRS,panL,panR,wallB,doorL,winL,winR,vineL,vineR,pot,bed,blob,tree,pine,pumpkin,leaves,leafPile,rockV,snowPile,palm,parasol,towel,ball,board,tower,igloo,BFLY,cloud}=E;
const HAT=[[.6,1,9.4,5.4,5,1.1,'#b91c1c'],[1.2,1.6,10.5,4.2,3.8,1.1,'#dc2626'],[1.8,2.1,11.6,3,2.8,1.1,'#dc2626'],[2.4,2.6,12.7,1.8,1.6,1.1,'#ef4444'],[3,3.1,13.8,.7,.7,.9,'#fca5a5']];
const BODY=[[-.5,2,2.6,1.2,1.4,3,'#2f7d6d'],[1.2,2,0,1.8,1.8,2,'#5b3a1e'],[3.8,2,0,1.8,1.8,2,'#5b3a1e'],[.8,1.4,2,5.2,3.6,3.4,'#2f7d6d'],[.8,1.4,3.6,5.2,3.6,.55,'#fbbf24'],[1,1.3,5.4,4.8,4.2,4,SK],[1.9,5.5,7.5,.9,.3,.9,DK],[3.8,5.5,7.5,.9,.3,.9,DK],[2.8,5.5,6.5,1.1,1,.9,'#f4a29a'],[1.1,5.4,3.6,4.6,1,2.9,'#f1f5f9'],[5.9,2,2.6,1.2,1.4,3,'#2f7d6d']];
const PIT=[[.2,6.4,0,6.4,4.6,.6,'#3b2a1a'],[.8,7,.6,5.2,3.4,.12,'#1c1208'],[3.2,7.1,.7,.9,.9,.9,'#f472b6']];
const SACK=[[8.4,2.4,0,3.8,3.4,4,'#a16207'],[8.8,2.8,4,3,2.6,.8,'#854d0e'],[9.2,3.2,4.8,2.2,1.8,.7,'#facc15']];
const GEM1=[[1.6,7.4,1.8,1.4,1.4,1.4,'#22d3ee'],[2,7.8,3.1,.7,.7,.7,'#a5f3fc']],GEM2=[[4,8.4,1.8,1.2,1.2,1.2,'#facc15'],[4.3,8.7,3,.6,.6,.6,'#fef08a']];
const F=(x,y)=>sd(x,y,2.2)+q(x,y,PIT)+q(x,y,SACK)
 +AP('rock','2.8',x,y,[3,3,0],A('bob','2.8','50% 100%',q(x,y,BODY)+q(x,y,HAT)),'3deg')
 +A('dw-gem','2.8','50% 50%',q(x,y,GEM1))+A('dw-gem','2.8','50% 50%',q(x,y,GEM2),'animation-delay:-1.4s')
 +A('tw','1.8','50% 50%',q(x,y,[[1.4,7.2,3.2,.5,.5,.5,'#fef08a'],[5.4,7.8,2.6,.5,.5,.5,'#ffffff']]));
return {id:'krasnal',name:{pl:"Krasnal Skarbnik",en:"Treasure Dwarf"},
 cap:{pl:"Wyciąga skarby z dziury do worka, a klejnoty błyszczą.",en:"Pulls treasures out of a hole into a sack while the gems sparkle."},
 css:`@keyframes dw-gem{0%,6%{opacity:0;transform:translate(0,0) scale(.5)}18%{opacity:1;transform:translate(0,-12px) scale(1)}55%{opacity:1;transform:translate(12px,-22px)}78%{opacity:1;transform:translate(21px,-14px) scale(.9)}90%,100%{opacity:0;transform:translate(22px,-8px) scale(.5)}}`,
 o:[11,12],f:F};
});
