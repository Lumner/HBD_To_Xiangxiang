import test from 'node:test';
import assert from 'node:assert/strict';
import { bindGesture } from '../dist/input.js';

function setup(){
  const target=new EventTarget(),surface=new EventTarget(),controller=new AbortController(),log=[];
  target.setPointerCapture=()=>{throw Error('不应该捕获鼠标')};target.hasPointerCapture=()=>false;
  bindGesture(target,{signal:controller.signal,start:()=>log.push('start'),move:()=>log.push('move'),end:()=>log.push('end'),cancel:()=>log.push('cancel')},surface);
  function send(type,where=surface,extra={}){const e=new Event(type);Object.assign(e,{pointerId:1,pointerType:'mouse',button:0,buttons:1,isPrimary:true,...extra});where.dispatchEvent(e)}
  return{target,surface,controller,log,send};
}
test('在控件外松手也结束手势，不捕获鼠标，不重复结束',()=>{const t=setup();t.send('pointerdown',t.target);t.send('pointermove');t.send('pointerup');t.send('pointerup');assert.deepEqual(t.log,['start','move','end'])});
test('切换窗口与指针取消会清理长按状态',()=>{for(const kind of ['blur','pointercancel']){const t=setup();t.send('pointerdown',t.target);t.send(kind);t.send('pointerup');assert.deepEqual(t.log,['start','cancel'])}});
test('漏掉松手事件后，鼠标无按钮移动会自动恢复',()=>{const t=setup();t.send('pointerdown',t.target);t.send('pointermove',t.surface,{buttons:0});t.send('pointerdown',t.target);t.send('pointerup');assert.deepEqual(t.log,['start','cancel','start','end'])});
test('切换章节撤销监听，不会把后续点击困在旧控件上',()=>{const t=setup();t.send('pointerdown',t.target);t.controller.abort();t.send('pointerup');t.send('pointerdown',t.target);assert.deepEqual(t.log,['start'])});
test('第二根手指不能意外结束当前手势',()=>{const t=setup();t.send('pointerdown',t.target);t.send('pointerup',t.surface,{pointerId:2});assert.deepEqual(t.log,['start']);t.send('pointerup');assert.deepEqual(t.log,['start','end'])});
