Doodle.reg('postacie','kowal',E=>{
const {W,H,OX,OY,sx,sy,pt,sh,hs,poly,bx,bxv,bxTiles,q,P,ln,A,AP,sd,boot,bucket,SK,DK,HU,WH,BL,TC,PKS,GRS,panL,panR,wallB,doorL,winL,winR,vineL,vineR,pot,bed,blob,tree,pine,pumpkin,leaves,leafPile,rockV,snowPile,palm,parasol,towel,ball,board,tower,igloo,BFLY,cloud}=E;
const def={o:[10,8],f:(x,y)=>{
  const anvil=sd(x+2.4,y+.6,2.2)+q(x,y,[[10,2,0,5,4,1.6,'#475569'],[9.2,1.4,1.6,6.6,5.2,1.8,'#64748b'],[15.8,2.6,2.1,2.2,2.8,.8,'#64748b']]);
  const sword=q(x,y,[[10.6,2.8,3.5,4.2,1,.6,'#f97316'],[14.8,2.4,3.5,.5,1.8,.7,'#cbd5e1'],[15.3,3.05,3.6,1.6,.5,.5,'#78350f']]);
  const pivot=P(x,y,[7,3,6.5]);
  const hammer=ln(x,y,[7,3,6.5],[11.6,4.2,11.5],'#78350f',2.2)+q(x,y,[[11,3.5,10.8,2.2,2.2,2.2,'#334155']]);
  const sparks=A('smith-sparks','1.3','50% 50%',q(x,y,[[12.2,3.4,4.5,.7,.7,.7,'#fde047'],[13.4,4.2,5.4,.6,.6,.6,'#fb923c'],[11.6,4.6,5.0,.6,.6,.6,'#fef08a']]));
  return sd(x,y,2)+anvil+sword
    +A('bob','2.6','50% 100%',q(x,y,[...HU(SK,'#334155','#1e293b'),[1.5,1.5,11,4,4,.8,'#dc2626']]))
    +A('smith-hammer','1.3',`${pivot[0]}px ${pivot[1]}px`,hammer,'transform-box:view-box')
    +sparks;
}};
return {id:'kowal',name:{pl:"Kowal",en:"Blacksmith"},cap:{pl:"Wystukuje ostrze na kowadle miarowymi uderzeniami młotka, aż sypią się iskry.",en:"Hammers a blade on the anvil in steady strokes until the sparks fly."},o:def.o,f:(x,y)=>def.f(x,y)};
});
