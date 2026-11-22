Doodle.reg('pogoda','deszcz',E=>{
const {W,H,OX,OY,sx,sy,pt,sh,hs,poly,bx,bxv,bxTiles,q,P,ln,A,AP,sd,boot,bucket,SK,DK,HU,WH,BL,TC,PKS,GRS,panL,panR,wallB,doorL,winL,winR,vineL,vineR,pot,bed,blob,tree,pine,pumpkin,leaves,leafPile,rockV,snowPile,palm,parasol,towel,ball,board,tower,igloo,BFLY,cloud}=E;
const f=()=>cloud(1,3,6,'#8ba0b8')+cloud(4.2,.4,6.6,'#7d93ad')+[...Array(16)].map((_,i)=>`<rect class="fa" style="--k:rain;--t:${.9+i%3*.15}s;animation-delay:-${(i*.37%1).toFixed(2)}s" x="${70+i*17}" y="${72+i*5%24}" width="2.4" height="9" fill="#8fdcff"/>`).join('');
return {id:'deszcz',name:{pl:"Deszcz",en:"Rain"},f};
});
