Doodle.reg('postacie','listonosz',E=>{
const {W,H,OX,OY,sx,sy,pt,sh,hs,poly,bx,bxv,bxTiles,q,P,ln,A,AP,sd,boot,bucket,SK,DK,HU,WH,BL,TC,PKS,GRS,panL,panR,wallB,doorL,winL,winR,vineL,vineR,pot,bed,blob,tree,pine,pumpkin,leaves,leafPile,rockV,snowPile,palm,parasol,towel,ball,board,tower,igloo,BFLY,cloud}=E;
const MAN=HU(SK,'#1d4ed8','#1e3a8a').filter((_,i)=>i!==6).concat([[1.2,1.2,10.8,5.6,4.6,1,'#1d4ed8'],[1.2,5.4,10.8,5.6,1.8,.5,'#1e3a8a'],[2.8,4.5,6.8,1.6,.35,1.6,'#fbbf24']]);
const BAG=[[-3.4,1.6,1.6,3.2,3.4,3.8,'#a16207'],[-3.4,1.6,4.8,3.2,3.4,.7,'#854d0e'],[-2.6,5,3.4,1.4,.3,1.2,'#fde68a']];
const BOX=[[11.4,3.2,0,1.1,1.1,5.6,'#64748b'],[9.6,2.5,5.6,4.8,3.3,3.6,'#dc2626'],[9.6,2.5,9.2,4.8,3.3,.7,'#b91c1c'],[10.3,5.8,7.3,3.4,.3,.6,'#7f1d1d']];
const FLAG=[[14.4,2.8,7.6,.6,.6,2.8,'#fbbf24'],[14.4,2.8,9.6,1.6,.6,.9,'#f59e0b']];
const LET=[[10.8,5.2,6.6,1.9,.35,1.3,'#ffffff'],[11.2,5.2,7.2,1.1,.3,.2,'#93c5fd']];
const F=(x,y)=>sd(x,y,2.2)+sd(x+2.2,y+.4,2)+q(x,y,BOX)
 +AP('rock','2.8',x,y,[14.7,3.1,7.6],q(x,y,FLAG),'12deg')
 +A('bob','2.8','50% 100%',q(x,y,MAN)+q(x,y,BAG)+ln(x,y,[6.6,3,6.6],[10.4,4.6,7.6],'#1d4ed8',2.6))
 +A('post-letter','2.8','50% 50%',q(x,y,LET));
return {id:'listonosz',name:{pl:"Listonosz",en:"Postman"},
 cap:{pl:"Wrzuca listy do skrzynki, a chorągiewka na skrzynce podskakuje.",en:"Posts letters into the mailbox and the little flag on it wobbles."},
 css:`@keyframes post-letter{0%{opacity:0;transform:translate(-16px,-14px) rotate(-12deg)}22%{opacity:1}58%{opacity:1;transform:translate(0,0)}70%{opacity:0;transform:translate(1px,3px) scale(.45)}100%{opacity:0}}`,
 o:[10,8],f:F};
});
