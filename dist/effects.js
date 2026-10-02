export function createEffects() {
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const canvas=document.querySelector('#sky'); const ctx=canvas.getContext('2d');
  const front=document.createElement('canvas');front.className='fx-canvas';front.setAttribute('aria-hidden','true');document.body.append(front);
  const fx=front.getContext('2d'); let width=0,height=0,stars=[],particles=[],frame=0,last=0,slow=0,enabled=true,bright=false;
  const resize=()=>{width=innerWidth;height=innerHeight;const ratio=Math.min(devicePixelRatio||1,1.5);for(const c of [canvas,front]){c.width=width*ratio;c.height=height*ratio;c.getContext('2d')?.setTransform(ratio,0,0,ratio,0,0)}const count=motion.matches?25:width<600?45:85;stars=Array.from({length:count},()=>({x:Math.random()*width,y:Math.random()*height,r:Math.random()*1.2+.3,p:Math.random()*6.28}));draw(performance.now());};
  function draw(now){if(!ctx||!fx)return;ctx.clearRect(0,0,width,height);for(const s of stars){ctx.globalAlpha=(bright?.85:.5)+(motion.matches?0:Math.sin(now/1800+s.p)*.23);ctx.fillStyle='#e9dcca';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;fx.clearRect(0,0,width,height);const delta=Math.min((now-last)||16,45)/16;for(const p of particles){p.x+=p.vx*delta;p.y+=p.vy*delta;p.vy+=.026*delta;p.life-=.015*delta;fx.globalAlpha=Math.max(p.life,0);fx.fillStyle=p.color;fx.save();fx.translate(p.x,p.y);fx.rotate(p.life*4);fx.fillRect(-p.size/2,-p.size/2,p.size,p.size*.55);fx.restore()}particles=particles.filter(p=>p.life>0);fx.globalAlpha=1;last=now;}
  function tick(now){if(!enabled)return;frame=requestAnimationFrame(tick);if(now-last<30)return;if(now-last>65&&last){slow++;if(slow>12&&stars.length>25){stars=stars.slice(0,Math.floor(stars.length*.7));slow=0}}draw(now);if(motion.matches&&particles.length===0){cancelAnimationFrame(frame);frame=0;}}
  const animate=()=>{if(!frame&&enabled)frame=requestAnimationFrame(tick)};
  function burst(x=width/2,y=height/2,large=false){if(!ctx||!fx)return;const count=motion.matches?6:large?(width<600?75:120):14;particles=particles.concat(Array.from({length:count},()=>{const a=Math.random()*6.28;const v=Math.random()*(large?6:3)+.6;return{x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-(large?1:0),life:1,size:Math.random()*4+2,color:['#efd49b','#b7a5ed','#f6e9d0','#93abc9'][Math.floor(Math.random()*4)]}})).slice(-160);animate();}
  window.addEventListener('resize',resize);motion.addEventListener('change',()=>{resize();animate()});document.addEventListener('visibilitychange',()=>{enabled=!document.hidden;if(enabled){last=0;frame=0;animate()}else{cancelAnimationFrame(frame);frame=0}});
  document.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')burst(e.clientX,e.clientY)},{passive:true});
  resize();animate();
  return {burst, bright(value){bright=value;draw(performance.now())}, get reduced(){return motion.matches}};
}
