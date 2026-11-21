Doodle.reg('tla','jesien',E=>{
const {W,H,OX,OY,sx,sy,pt,sh,hs,poly,bx,bxv,bxTiles,q,P,ln,A,AP,sd,boot,bucket,SK,DK,HU,WH,BL,TC,PKS,GRS,panL,panR,wallB,doorL,winL,winR,vineL,vineR,pot,bed,blob,tree,pine,pumpkin,leaves,leafPile,rockV,snowPile,palm,parasol,towel,ball,board,tower,igloo,BFLY,cloud}=E;
const S={t:['#cfa951','#c49d45'],p:['#eadcc0','#d3b987'],stone:(x,y)=>x==y||x==y+1,
 s:'#e6d6b6',d:'#cdb284',r:'#a98f68',sky:['#8f80c8','#f7c796'],
 deco:()=>[
  [2.0,wallB(2.2,.3,2.6,.5,.95)+winL(3.0,.8,.3)+vineL(2.3,.8,.2,.7,1.3,18)],
  [4.0,leaves(.4,.3,2.6,2.6,22,['#d9531e','#e8902a','#c0392b','#f2b632'])+tree(1.0,1.2,['#e8751a','#d9531e','#f2a52e','#c0392b','#f7c548'],3)],
  [6.5,leaves(4.4,.2,3.2,2.8,24,['#f2b632','#e8902a','#c0392b','#d9531e'])+tree(5.6,1.0,['#c0392b','#e8751a','#f2b632','#d9531e','#f7c548'],3)],
  [8.2,leafPile(.8,5.3)],
  [9.9,pumpkin(6.1,5.9)+pumpkin(7.0,5.4)+bx(6.5,6.9,0,.7,.7,.5,'#ea7a14',.35,.05)],
  [8.0,pot(.7,3.9,'#b45309','#f59e0b')],
  [11,leaves(1.6,4.6,2,1.6,10,['#e8902a','#d9531e','#f2b632'])+leaves(3.8,5.8,2,1.8,10,['#c0392b','#e8902a','#f2b632'])],
  [11,A('fl','5.5','50% 50%',bx(1.2,1.4,4.2,.2,.2,.1,'#e8751a'),'animation-delay:-1s')+A('fl','6.5','50% 50%',bx(5.4,1.2,4.5,.2,.2,.1,'#c0392b'),'animation-delay:-3s')+A('fl','6','50% 50%',bx(1.8,1.0,3.8,.2,.2,.1,'#f2b632'),'animation-delay:-4.5s')+A('fl','7','50% 50%',bx(6.2,1.0,4,.2,.2,.1,'#f2a52e'),'animation-delay:-2s')]
 ]};
return Object.assign({id:'jesien',idx:2,name:{pl:'Jesień',en:'Autumn'}},S);
});
