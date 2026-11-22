Doodle.reg('pogoda','slonce',E=>{
const {W,H,OX,OY,sx,sy,pt,sh,hs,poly,bx,bxv,bxTiles,q,P,ln,A,AP,sd,boot,bucket,SK,DK,HU,WH,BL,TC,PKS,GRS,panL,panR,wallB,doorL,winL,winR,vineL,vineR,pot,bed,blob,tree,pine,pumpkin,leaves,leafPile,rockV,snowPile,palm,parasol,towel,ball,board,tower,igloo,BFLY,cloud}=E;
const f=()=>`<circle cx="318" cy="68" r="52" fill="url(#dd-glow)"/>`+`<g class="fa" style="--k:spin;--t:30s;transform-origin:318px 68px">`+[...Array(8)].map((_,i)=>`<rect x="315" y="18" width="6" height="10" fill="#ffd66f" transform="rotate(${i*45} 318 68)"/>`).join('')+`</g>`+A('bob','3','50% 50%',bx(6.5,-1,6,2,2,2,'#ffd23f')+bx(6.6,1,6.5,.4,.01,.5,'#b45309'));
return {id:'slonce',name:{pl:"Słonecznie",en:"Sunny"},f};
});
