import { mountGame } from '../dist/games.js';
import { CONFIG } from '../dist/config.js';
import { scope } from '../dist/ui.js';

const root=document.querySelector('#fixture'),result=document.querySelector('#result'),run=document.querySelector('#run');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const check=(condition,message)=>{if(!condition)throw new Error(message)};
function touch(target,type,id=7){
  const point={identifier:id,target,clientX:150,clientY:150};
  const event=new Event(type,{bubbles:true,cancelable:true});
  Object.defineProperties(event,{changedTouches:{value:[point]},touches:{value:type==='touchend'||type==='touchcancel'?[]:[point]}});
  target.dispatchEvent(event);return event;
}
run.onclick=async()=>{
  run.disabled=true;result.textContent='正在检查最长蓄力、手势取消和五份祝福……';
  // 桌面浏览器也检查手机 Touch Events 分支；不会伪称为实体手机测试。
  window.ontouchstart=null;
  const state={completed:[],rounds:[],attempts:{reaction:0}};
  const life=scope(),savedDelay=CONFIG.games.reaction.minDelay;
  CONFIG.games.reaction.minDelay=CONFIG.games.reaction.maxDelay;
  try{
    mountGame('reaction',root,state,()=>{},i=>state.completed.push(i),{burst(){}},{play(){}},life);
    let orb=root.querySelector('.hold-zone');
    touch(orb,'touchstart');touch(orb,'touchcancel');
    check(!orb.classList.contains('charging'),'真实触摸取消后没有停止');
    check(state.rounds.length===0,'真实取消被错误计为完成');
    for(let round=0;round<5;round++){
      orb=root.querySelector('.hold-zone');
      orb.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',pointerId:1,button:0,isPrimary:true}));
      check(touch(orb,'touchstart').defaultPrevented,'没有阻止系统长按默认行为');
      await delay(600);
      const context=new Event('contextmenu',{bubbles:true,cancelable:true});orb.dispatchEvent(context);
      check(context.defaultPrevented,'系统长按菜单未被拦截');
      orb.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerType:'touch',pointerId:1}));
      orb.dispatchEvent(new PointerEvent('lostpointercapture',{bubbles:true,pointerType:'touch',pointerId:1}));
      touch(orb,'touchmove');
      check(orb.classList.contains('charging'),'手机指针取消错误中断蓄力');
      await delay(CONFIG.games.reaction.maxDelay-600+100);
      check(orb.classList.contains('ready'),'长按没有达到最长要求时间');
      touch(orb,'touchend');
      check(state.rounds.length===round+1,'真实松手没有收光');
      check(root.textContent.includes(CONFIG.gameBlessings.reaction[round].title),'本轮祝福没有出现');
      result.textContent=`第 ${round+1} 轮通过：持续蓄力、松手收光、专属祝福。`;
      root.querySelector('#blessing-next').click();
    }
    check(state.completed.includes(2),'五轮后没有完成关卡');
    result.textContent='通过：真实取消可重试；五轮均持续超过最长蓄力时间，指针取消不打断；松手后五份祝福和最终通关正常。';
  }catch(error){result.textContent=`失败：${error.message}`}
  finally{life.stop();CONFIG.games.reaction.minDelay=savedDelay;run.disabled=false}
};
