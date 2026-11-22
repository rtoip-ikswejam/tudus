Doodle.reg('postacie','wedkarz',E=>{
const {W,H,OX,OY,sx,sy,pt,sh,hs,poly,bx,bxv,bxTiles,q,P,ln,A,AP,sd,boot,bucket,SK,DK,HU,WH,BL,TC,PKS,GRS,panL,panR,wallB,doorL,winL,winR,vineL,vineR,pot,bed,blob,tree,pine,pumpkin,leaves,leafPile,rockV,snowPile,palm,parasol,towel,ball,board,tower,igloo,BFLY,cloud}=E;
const def={o:[8,8],f:(x,y)=>{
  const pivot=P(x,y,[7,3,6]);
  const rodGroup=ln(x,y,[7,3,6],[13.5,7,14.5],'#78350f',2.2)+ln(x,y,[13.5,7,14.5],[14.5,8.5,5.5],'#e2e8f0',1.1);
  const movingBoot=A('fish-boot','4.4','50% 50%',boot(x+3.1,y+1.6,'#ef4444'));
  const drops=A('fish-drop','4.4','50% 50%',q(x,y,[[13.8,8,.5,.7,.7,.7,'#7dd3fc'],[14.6,8.8,1.5,.7,.7,.7,'#bae6fd']]));
  return sd(x,y,2)
    +A('bob','2.6','50% 100%',q(x,y,[...HU(SK,'#f59e0b','#475569'),[.8,.8,11,5.5,5.5,.8,'#7c3f12'],[1.8,1.8,11.8,3.5,3.5,1.6,'#92400e']]))
    +A('fish-rod','4.4',`${pivot[0]}px ${pivot[1]}px`,rodGroup,'transform-box:view-box')
    +movingBoot+drops;
}};
return {id:'wedkarz',name:{pl:"Wędkarz",en:"Angler"},cap:{pl:"Wyciąga mokry czerwony kalosz na żyłce, kieruje go nad wiaderko i zarzuca wędkę ponownie.",en:"Pulls a wet red boot out of the water on a line, swings it over the bucket and casts again."},o:def.o,f:(x,y)=>def.f(x,y)};
});
