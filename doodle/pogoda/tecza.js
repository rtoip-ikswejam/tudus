Doodle.reg('pogoda','tecza',E=>{
const {W,H,OX,OY,sx,sy,pt,sh,hs,poly,bx,bxv,bxTiles,q,P,ln,A,AP,sd,boot,bucket,SK,DK,HU,WH,BL,TC,PKS,GRS,panL,panR,wallB,doorL,winL,winR,vineL,vineR,pot,bed,blob,tree,pine,pumpkin,leaves,leafPile,rockV,snowPile,palm,parasol,towel,ball,board,tower,igloo,BFLY,cloud}=E;
const f=()=>cloud(1.2,3.6,5.2)+cloud(5.2,.4,5.2)+A('rb','4','50% 50%',['#ff6d76','#ffbd65','#ffe779','#8be39d','#78d9f3','#a9a0f5'].map((c,i)=>`<path d="M${108+i*8} 124 Q200 ${6+i*9} ${292-i*8} 124" fill="none" stroke="${c}" stroke-width="8" stroke-dasharray="14 1.5"/>`).join(''));
return {id:'tecza',name:{pl:"Tęcza",en:"Rainbow"},f};
});
