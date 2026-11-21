Doodle.reg('tla','zima',E=>{
const {W,H,OX,OY,sx,sy,pt,sh,hs,poly,bx,bxv,bxTiles,q,P,ln,A,AP,sd,boot,bucket,SK,DK,HU,WH,BL,TC,PKS,GRS,panL,panR,wallB,doorL,winL,winR,vineL,vineR,pot,bed,blob,tree,pine,pumpkin,leaves,leafPile,rockV,snowPile,palm,parasol,towel,ball,board,tower,igloo,BFLY,cloud}=E;
const S={t:['#f7fafd','#e8f0f8'],p:['#e3ecf6','#cddced'],stone:(x,y)=>x==y||x==y+1,lq:(x,y)=>x>=1&&x<=2&&y>=5&&y<=6,lc:['#c4e4f7','#b3d8f0'],lz:-.08,
 s:'#e5edf6',d:'#c7d4e4',r:'#9eaec4',sky:['#5a7fb3','#dbe9f7'],
 deco:()=>[
  [3.0,igloo(3.9,.1)],
  [4.5,pine(1.2,1.0,'#2a7d52')],
  [10.5,pine(.9,6.0,'#2c7a56')],
  [6.4,pot(6.8,2.2,'#2a7d52','#f9c9dc')],
  [8.4,snowPile(.8,5.6)+rockV(2.6,6.6,'#a9b9d0')],
  [9.8,snowPile(6.4,3.6)],
  [7.6,pot(.7,3.4,'#2a7d52','#e0457e')]
 ]};
return Object.assign({id:'zima',idx:3,name:{pl:'Zima',en:'Winter'}},S);
});
