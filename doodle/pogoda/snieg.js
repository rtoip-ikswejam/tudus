Doodle.reg('pogoda','snieg',E=>{
const {W,H,OX,OY,sx,sy,pt,sh,hs,poly,bx,bxv,bxTiles,q,P,ln,A,AP,sd,boot,bucket,SK,DK,HU,WH,BL,TC,PKS,GRS,panL,panR,wallB,doorL,winL,winR,vineL,vineR,pot,bed,blob,tree,pine,pumpkin,leaves,leafPile,rockV,snowPile,palm,parasol,towel,ball,board,tower,igloo,BFLY,cloud}=E;
const f=()=>A('drift','10','50% 50%',cloud(0,4,6.2,'#e7eef7'))+[...Array(26)].map((_,i)=>`<rect class="fa" style="--k:snow;--t:${3+i%4*.5}s;animation-delay:-${(i*.77%3).toFixed(1)}s" x="${35+i*13.3%330}" y="${40+i*17%70}" width="${3+i%3}" height="${3+i%3}" fill="#fff"/>`).join('');
return {id:'snieg',name:{pl:"Śnieg",en:"Snow"},f};
});
