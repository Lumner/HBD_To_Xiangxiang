// 本地伴奏和互动音效分轨：音效出现时，伴奏自动降低音量。
export function createSound(report, update=()=>{}) {
  let context, musicGain, effectGain, compressor, source, loading=false;
  let musicOn=false, effectsOn=false, everStarted=false;
  const music=document.createElement('audio');
  music.id='birthday-music';music.src='./birthday-music.wav';music.preload='none';music.loop=true;
  music.setAttribute('aria-hidden','true');document.body.append(music);
  const status=()=>({music:musicOn,effects:effectsOn,loading});
  const notify=()=>update(status());
  async function unlock(){
    if(!context){
      context=new(window.AudioContext||window.webkitAudioContext)();
      compressor=context.createDynamicsCompressor();compressor.threshold.value=-9;compressor.ratio.value=3;compressor.connect(context.destination);
      musicGain=context.createGain();musicGain.gain.value=.26;musicGain.connect(compressor);
      effectGain=context.createGain();effectGain.gain.value=.75;effectGain.connect(compressor);
      source=context.createMediaElementSource(music);source.connect(musicGain);
    }
    if(context.state!=='running')await context.resume();
    if(context.state!=='running')throw new Error('声音尚未唤醒');
  }
  function duck(){if(!musicGain||!musicOn)return;const now=context.currentTime;musicGain.gain.cancelScheduledValues(now);musicGain.gain.setTargetAtTime(.085,now,.025);musicGain.gain.setTargetAtTime(.26,now+.45,.25)}
  function play(frequency=523){if(!effectsOn||!context||document.hidden)return;try{duck();const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.setValueAtTime(0,context.currentTime);gain.gain.linearRampToValueAtTime(.16,context.currentTime+.015);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+.5);oscillator.connect(gain);gain.connect(effectGain);oscillator.start();oscillator.stop(context.currentTime+.55);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()}}catch{report('这个音符稍稍走了个神，旅程仍然继续。')}}
  async function startMusic({restart=false}={}){
    if(restart){try{music.currentTime=0}catch{}}
    if(loading)return musicOn;
    if(musicOn&&!music.paused)return true;
    loading=true;notify();let timeout;
    // 两种播放权限都在原始点击事件里申请，不等蜡烛动画结束再播放。
    try{const resumed=unlock();const started=music.play();await Promise.race([Promise.all([resumed,started]),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('音乐暂未准备好')),8000)})]);musicOn=true;if(!everStarted){effectsOn=true;everStarted=true}notify();return true}
    catch{musicOn=false;music.pause();report('音乐暂时没能响起，请再轻点一次音乐按钮。');return false}
    finally{clearTimeout(timeout);loading=false;notify()}
  }
  function toggleMusic(){if(loading)return Promise.resolve(musicOn);if(musicOn){musicOn=false;music.pause();notify();return Promise.resolve(false)}return startMusic()}
  async function toggleEffects(){try{await unlock();effectsOn=!effectsOn;notify();if(effectsOn)play(659);return effectsOn}catch{effectsOn=false;notify();report('音效暂时没能响起，可以稍后再试。');return false}}
  music.addEventListener('error',()=>{musicOn=false;loading=false;notify();report('这首小曲暂时没能打开，互动仍然可以继续。')});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){music.pause()}else if(musicOn){music.play().catch(()=>{musicOn=false;notify();report('回来啦，再点一下音乐按钮就能继续听。')})}});
  return {toggle:toggleMusic,startBirthday:()=>startMusic({restart:true}),toggleEffects,play,status,celebrate(){[523,659,784,1046].forEach((n,i)=>setTimeout(()=>play(n),i*170))}};
}
