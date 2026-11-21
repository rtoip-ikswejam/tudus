Doodle.reg('postacie','sowa',E=>{
const {W,H,OX,OY,sx,sy,pt,sh,hs,poly,bx,bxv,bxTiles,q,P,ln,A,AP,sd,boot,bucket,SK,DK,HU,WH,BL,TC,PKS,GRS,panL,panR,wallB,doorL,winL,winR,vineL,vineR,pot,bed,blob,tree,pine,pumpkin,leaves,leafPile,rockV,snowPile,palm,parasol,towel,ball,board,tower,igloo,BFLY,cloud}=E;
const BODY=[[1,1,0,6,5,8,'#8b5cf6'],[1,1,8,1.6,1.6,1.5,'#7c3aed'],[5.4,1,8,1.6,1.6,1.5,'#7c3aed'],[1.5,6,.5,5,.3,3.2,'#ddd6fe'],[1.6,6,4.6,2,.3,2,'#fef08a'],[4.4,6,4.6,2,.3,2,'#fef08a'],[2.3,6.3,5.2,.8,.2,1,DK],[5,6.3,5.2,.8,.2,1,DK],[3.6,6,3.6,1,.8,1,'#f59e0b'],[7,1.5,1.5,1,3.5,5,'#6d28d9']];
const BOOK=[[.2,7.6,3.4,7.2,5.2,.7,'#92400e'],[.7,8.1,4.1,3.1,4.2,.5,'#fff7d6'],[3.9,8.1,4.1,3.0,4.2,.5,'#fff7d6'],[3.7,8.1,4.1,.3,4.2,.55,'#b45309'],[1.1,8.7,4.6,2.1,.3,.14,'#a8a29e'],[1.1,9.7,4.6,2.1,.3,.14,'#a8a29e'],[4.3,8.7,4.6,2.1,.3,.14,'#a8a29e'],[4.3,9.7,4.6,2.1,.3,.14,'#a8a29e']];
const PAGE=[[3.95,8.1,4.6,2.9,4.1,.16,'#ffffff']];
const SPARK=[[1.4,9.0,5.6,.7,.7,.7,'#fde047'],[5.6,10.2,6.0,.6,.6,.6,'#fb923c'],[3.4,8.6,6.4,.6,.6,.6,'#fef08a']];
return {id:'sowa',name:{pl:'Sowa Czytelniczka',en:'Reading Owl'},
 cap:{pl:'Czyta książkę, która unosi się przed nią, i przewraca kolejne strony.',en:'Reads a book floating in front of her and turns the pages.'},
 o:[9,10],f:(x,y)=>sd(x,y,2)+AP('rock','2.2',x,y,[4,3,0],q(x,y,BODY),'4deg')
  +A('bob','2.2','50% 100%',q(x,y,BOOK)+AP('owl-page','2.6',x,y,[3.85,10,4.6],q(x,y,PAGE),'0deg')+A('owl-rise','2.8','50% 50%',q(x,y,SPARK)))};
});
