Doodle.reg('postacie','archeolog',E=>{
const {W,H,OX,OY,sx,sy,pt,sh,hs,poly,bx,bxv,bxTiles,q,P,ln,A,AP,sd,boot,bucket,SK,DK,HU,WH,BL,TC,PKS,GRS,panL,panR,wallB,doorL,winL,winR,vineL,vineR,pot,bed,blob,tree,pine,pumpkin,leaves,leafPile,rockV,snowPile,palm,parasol,towel,ball,board,tower,igloo,BFLY,cloud}=E;
const def={o:[15,8],f:(x,y)=>sd(x,y,2)+sd(x+2.2,y,1.8)+A('bob','2.2','50% 100%',q(x,y,[...HU(SK,'#a16207','#78716c'),[.5,.5,11,6.5,6.5,.7,'#d6b87a'],[1.8,1.8,11.7,3.5,3.5,1.8,'#e7cf94']]))
 +q(x,y,[[9,0,0,7,7,1.5,'#7c5a3a'],[10,1,1.5,5,5,1,'#6b4c30']])+A('bob','1.2','50% 100%',q(x,y,[[10,1.5,2.5,4,4,.9,'#d97706'],[10,1.5,3.4,4,4,.7,'#4ade80'],[10,1.5,4.1,4,4,.7,'#fb7185'],[10,1.5,4.8,4,4,.9,'#f59e0b']]))
 +AP('rock','1.2',x,y,[7,3,6],ln(x,y,[7,3,6],[9,7,1],'#78350f',2.2)+q(x,y,[[8,6.5,0,2.5,1.2,1.6,'#94a3b8']]),'14deg')};
return {id:'archeolog',name:{pl:"Archeolog",en:"Archaeologist"},cap:{pl:"Odkopuje skarby pędzelkiem i łopatką, układając znaleziska w skrzynce.",en:"Brushes and digs out treasures and sorts the finds into a crate."},o:def.o,f:(x,y)=>def.f(x,y)};
});
