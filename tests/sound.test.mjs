import test from 'node:test';
import assert from 'node:assert/strict';
import { createSound } from '../dist/sound.js';

function setup(){
  const param=()=>({value:0,cancelScheduledValues(){},setTargetAtTime(){},setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
  class Context{state='suspended';currentTime=0;destination={};resume(){this.state='running';return Promise.resolve()}createDynamicsCompressor(){return{threshold:param(),ratio:param(),connect(){}}}createGain(){return{gain:param(),connect(){}}}createMediaElementSource(){return{connect(){}}}}
  class Audio extends EventTarget{paused=true;currentTime=7;calls=0;setAttribute(){}play(){this.calls++;this.paused=false;return Promise.resolve()}pause(){this.paused=true}}
  const audio=new Audio(),doc=new EventTarget();doc.hidden=false;doc.createElement=()=>audio;doc.body={append(){}};
  const oldDocument=globalThis.document,oldWindow=globalThis.window;
  globalThis.document=doc;globalThis.window={AudioContext:Context};
  return {audio,sound:createSound(()=>{}),restore(){globalThis.document=oldDocument;globalThis.window=oldWindow}};
}
test('开场默认静音，吹蜡烛启动在原始点击中直接请求播放',async()=>{
  const t=setup();try{assert.equal(t.audio.calls,0);const pending=t.sound.startBirthday();assert.equal(t.audio.calls,1);assert.equal(t.audio.currentTime,0);await pending;assert.equal(t.sound.status().music,true)}finally{t.restore()}
});
test('吹蜡烛一定开始生日歌，已有播放不会被当成切换关闭',async()=>{
  const t=setup();try{await t.sound.toggle();t.audio.currentTime=12;await t.sound.startBirthday();assert.equal(t.audio.paused,false);assert.equal(t.audio.currentTime,0);await t.sound.toggle();assert.equal(t.audio.paused,true);await t.sound.startBirthday();assert.equal(t.audio.paused,false);assert.equal(t.sound.status().music,true)}finally{t.restore()}
});
