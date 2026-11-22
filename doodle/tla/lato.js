Doodle.reg('tla','lato',E=>{
const {W,H,OX,OY,sx,sy,pt,sh,hs,poly,bx,bxv,bxTiles,q,P,ln,A,AP,sd,boot,bucket,SK,DK,HU,WH,BL,TC,PKS,GRS,panL,panR,wallB,doorL,winL,winR,vineL,vineR,pot,bed,blob,tree,pine,pumpkin,leaves,leafPile,rockV,snowPile,palm,parasol,towel,ball,board,tower,igloo,BFLY,cloud}=E;
const S={t:['#f4e2b4','#edd6a0'],p:['#f2ecdf','#dcc79a'],stone:(x,y)=>x>=4&&x<=7&&y<=2,lq:(x,y)=>x+y<=3,lc:['#59c4ec','#4bb5e2'],lz:-.12,wet:(x,y)=>x+y==4,
 s:'#efe6d2',d:'#dac69a',r:'#b9a47c',sky:['#2fa7e8','#fff2cf'],
 deco:()=>[
  [4.5,tower(4.0,.4)],
  [6.2,pot(3.6,1.0,'#2ba354','#f43f5e')],
  [6.6,board(7.2,3.0)],
  [5.0,palm(.4,1.9)],
  [9.4,towel(1.0,5.6)+parasol(2.4,5.9)],
  [10.4,palm(6.6,5.9)],
  [10.8,ball(5.2,6.9)],
  [8.0,pot(.6,3.4,'#2ba354','#e0457e')]
 ]};
return Object.assign({id:'lato',idx:1,name:{pl:'Lato',en:'Summer'}},S);
});
