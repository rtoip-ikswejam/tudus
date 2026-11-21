Doodle.reg('postacie','gornik',E=>{
const {W,H,OX,OY,sx,sy,pt,sh,hs,poly,bx,bxv,bxTiles,q,P,ln,A,AP,sd,boot,bucket,SK,DK,HU,WH,BL,TC,PKS,GRS,panL,panR,wallB,doorL,winL,winR,vineL,vineR,pot,bed,blob,tree,pine,pumpkin,leaves,leafPile,rockV,snowPile,palm,parasol,towel,ball,board,tower,igloo,BFLY,cloud}=E;
const def={o:[10,8],f:(x,y)=>{
  const digPit=sd(x+2.6,y+1,2.2)+q(x,y,[[10.5,4,0,4.5,3.5,.7,'#78350f'],[12.2,5.4,.7,1.4,1.2,.8,'#64748b']]);
  const pivot=P(x,y,[7,3,6.5]);
  const pick=ln(x,y,[7,3,6.5],[12.5,5.5,10.5],'#92400e',2.2)+ln(x,y,[11.2,4.8,11.8],[14.2,6.4,8.2],'#94a3b8',2.4);
  const chips=A('miner-chips','1.4','50% 50%',q(x,y,[[12.4,5.2,1.2,.8,.8,.8,'#a16207'],[13.5,6.0,1.8,.7,.7,.7,'#64748b'],[11.8,6.2,1.4,.7,.7,.7,'#92400e']]));
  return sd(x,y,2)+digPit
    +A('bob','2.5','50% 100%',q(x,y,[...HU(SK,'#eab308','#334155'),[1.2,1.2,11,4.6,4.6,1.4,'#facc15'],[2.6,5.8,11.6,1.2,.5,1,'#fef08a']]))
    +A('miner-pick','1.4',`${pivot[0]}px ${pivot[1]}px`,pick,'transform-box:view-box')
    +chips;
}};
return {id:'gornik',name:{pl:"Górnik",en:"Miner"},cap:{pl:"Zaciska dłonie na trzonku kilofa i rąbie w ziemi, wzbijając grudki ziemi i kamienia.",en:"Grips the pickaxe and hacks at the ground, sending up chips of earth and stone."},o:def.o,f:(x,y)=>def.f(x,y)};
});
