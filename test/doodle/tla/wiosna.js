Doodle.reg('tla','wiosna',E=>{
const {W,H,OX,OY,sx,sy,pt,sh,hs,poly,bx,bxv,bxTiles,q,P,ln,A,AP,sd,boot,bucket,SK,DK,HU,WH,BL,TC,PKS,GRS,panL,panR,wallB,doorL,winL,winR,vineL,vineR,pot,bed,blob,tree,pine,pumpkin,leaves,leafPile,rockV,snowPile,palm,parasol,towel,ball,board,tower,igloo,BFLY,cloud}=E;
const S={t:['#9fd870','#92d064'],p:['#efe6d2','#dcc89c'],stone:(x,y)=>x==y||x==y+1,lq:(x,y)=>x>=4&&x<=6&&y>=4&&y<=6,lc:['#5cc3ea','#4bb5e2'],lz:-.12,
 s:'#ebe1cc',d:'#d8c59b',r:'#b8a47c',sky:['#7ec4f2','#eaf6ff'],
 deco:()=>[
  [2.5,wallB(.3,.6,.55,2.9,.95)+winR(.85,1.15,.3)+vineR(.85,2.3,.15,1.2,1.4,26)],
  [4.5,pot(1.0,3.7,'#4aa84f','#e0457e')],
  [6.6,tree(5.3,1.2,['#f4a6c6','#ee86b3','#f9c9dc','#e86aa0','#ffffff','#7fc45a'],3)],
  
  [8.1,tree(1.6,5.0,['#4fb35a','#6cc766','#3a9a4c','#86d77a'],2)],
  [10.6,bed(.8,6.2,1.8,1.2,['#ec4899','#fbbf24','#ffffff','#a78bfa'])],
  [9.8,bed(6.0,6.0,1.6,1.4,['#fbbf24','#ec4899','#ffffff','#f97316'])],
  [6.2,pot(6.5,2.4,'#4aa84f','#f59e0b')],
  [11,BFLY(3.0,6.2,2.2,'#ec4899')+BFLY(6.0,3.5,3.6,'#fbbf24')],
  [11,A('fl','6','50% 50%',bx(5.5,2.0,4,.18,.18,.1,'#f9c9dc'),'animation-delay:-1s')+A('fl','7','50% 50%',bx(6.3,1.6,4.4,.18,.18,.1,'#ee86b3'),'animation-delay:-3.5s')+A('fl','6.5','50% 50%',bx(4.8,2.2,4.2,.18,.18,.1,'#ffffff'),'animation-delay:-5s')]
 ]};
return Object.assign({id:'wiosna',idx:0,name:{pl:'Wiosna',en:'Spring'}},S);
});
